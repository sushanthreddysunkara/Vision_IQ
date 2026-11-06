import hashlib
import importlib.util
import logging
import re
import sys
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

try:
    import cv2
except ImportError:  # pragma: no cover - optional runtime dependency
    cv2 = None

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - optional runtime dependency
    YOLO = None


logger = logging.getLogger(__name__)
MAX_VIDEO_FRAMES = 1200
FRAME_SAMPLE_SECONDS = 0.5
MAX_FRAME_BYTES = 20 * 1024 * 1024
ALLOWED_FRAME_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MODEL_CACHE = {}
_MODEL_CACHE_LOCK = threading.Lock()
_PLATE_OCR_CACHE = {}
_VIDEO_MODEL_INFERENCE_LOCK = threading.Lock()
_LIVE_FRAME_SESSIONS = {}
_LIVE_FRAME_SESSIONS_LOCK = threading.Lock()
LIVE_FRAME_SESSION_TTL_SECONDS = 3600
MAX_LIVE_FRAME_SESSIONS = 32
DEFAULT_VEHICLE_MODEL_URL = (
    "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt"
)
DEFAULT_VEHICLE_MODEL_SHA256 = "f59b3d833e2ff32e194b5bb8e08d211dc7c5bdf144b90d2c8412c47ccfc83b36"
MAX_MODEL_DOWNLOAD_BYTES = 20 * 1024 * 1024
VEHICLE_LABELS = {
    "bicycle",
    "bike",
    "bus",
    "car",
    "motorbike",
    "motorcycle",
    "truck",
    "van",
    "vehicle",
    "auto",
}
PLATE_LABELS = {"license plate", "license_plate", "number plate", "number_plate"}
VIOLATION_LABELS = {
    "helmet": ("Helmet violation", ("no helmet", "without helmet", "helmetless")),
    "helmet_detected": ("Helmet detected", ("with helmet",)),
    "overspeed": ("Overspeed", ("overspeed", "over speed", "speeding")),
    "distraction": ("Driver distraction", ("distract", "phone", "drows")),
    "accident": ("Accident / Collision", ("accident", "accident_scene", "crash", "collision")),
    "fire": ("Fire Incident", ("fire", "fire_accident", "flame")),
    "pothole": ("Road Hazard (Pothole)", ("pothole", "hazard")),
    "construction": ("Road Construction", ("construction", "road_construction", "road work")),
}


class InferenceUnavailable(RuntimeError):
    pass


class VideoValidationError(ValueError):
    pass


@dataclass(frozen=True)
class ValidatedFrame:
    content: bytes
    content_type: str


class InferenceService:
    def __init__(self, model_path, engine=None):
        self.model_path = Path(model_path)
        self.engine = engine

    @staticmethod
    def validate_frame(content, content_type):
        if not isinstance(content, bytes) or not content:
            raise ValueError("A non-empty image frame is required.")
        if content_type not in ALLOWED_FRAME_TYPES:
            raise ValueError("Frame content type must be JPEG, PNG, or WebP.")
        if len(content) > MAX_FRAME_BYTES:
            raise ValueError("Image frame exceeds the 20 MB limit.")
        signatures = {
            "image/jpeg": content.startswith(b"\xff\xd8\xff"),
            "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
            "image/webp": content.startswith(b"RIFF") and content[8:12] == b"WEBP",
        }
        if not signatures[content_type]:
            raise ValueError("Image frame bytes do not match the declared content type.")
        return ValidatedFrame(content, content_type)

    def predict(self, content, content_type):
        frame = self.validate_frame(content, content_type)
        if self.engine is not None:
            return self.engine.predict(frame.content, content_type=frame.content_type)
        if not self.model_path.is_file():
            raise InferenceUnavailable("No AI model is configured; inference is unavailable.")
        if self.model_path.suffix.lower() not in {".pt", ".pth"}:
            raise InferenceUnavailable("Unsupported model format for image inference.")
        if cv2 is None or YOLO is None:
            raise InferenceUnavailable(
                "Install the backend AI dependencies (ultralytics and OpenCV 4.x) to run image inference."
            )
        import numpy

        image = cv2.imdecode(numpy.frombuffer(frame.content, dtype=numpy.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Image frame could not be decoded.")
        model = _load_yolo_model(self.model_path)
        return model.predict(source=image, verbose=False)


def _load_yolo_model(model_path):
    if YOLO is None:
        raise InferenceUnavailable(
            "Install the backend AI dependencies (ultralytics and OpenCV 4.x) to run video inference."
        )
    model_path = Path(model_path)
    if not model_path.is_file():
        raise InferenceUnavailable(f"AI model weights are missing: {model_path.resolve()}")
    key = str(model_path.resolve())
    with _MODEL_CACHE_LOCK:
        model = _MODEL_CACHE.get(key)
        if model is None:
            model = YOLO(key)
            _MODEL_CACHE[key] = model
    return model


def _load_plate_ocr(model_directory):
    model_directory = Path(model_directory).resolve()
    package_path = model_directory / "plate_ocr" / "__init__.py"
    if not package_path.is_file():
        raise InferenceUnavailable(f"The supplied plate OCR package is missing: {package_path}")
    key = str(package_path)
    with _MODEL_CACHE_LOCK:
        if key in _PLATE_OCR_CACHE:
            return _PLATE_OCR_CACHE[key]

        package_name = "visioniq_nh5_plate_ocr"
        spec = importlib.util.spec_from_file_location(
            package_name,
            package_path,
            submodule_search_locations=[str(package_path.parent)],
        )
        if spec is None or spec.loader is None:
            raise InferenceUnavailable("The supplied plate OCR package could not be loaded.")
        package = importlib.util.module_from_spec(spec)
        sys.modules[package_name] = package
        try:
            spec.loader.exec_module(package)
            reader = package.RapidOCRReader()
        except ImportError as error:
            sys.modules.pop(package_name, None)
            raise InferenceUnavailable(
                "Plate OCR dependencies are missing. Install rapidocr and onnxruntime to read plates."
            ) from error
        except Exception:
            sys.modules.pop(package_name, None)
            raise
        read_fn = getattr(package, "read_plate_crop_with_confidence", getattr(package, "read_plate_crop", None))
        ocr = (reader, read_fn, package.PlateVoter)
        _PLATE_OCR_CACHE[key] = ocr
        return ocr


def _is_plate_label(label):
    return re.sub(r"[_-]+", " ", label.lower()).strip() in {
        re.sub(r"[_-]+", " ", item) for item in PLATE_LABELS
    }


def _normalized_xyxy_to_xywh(box):
    left, top, right, bottom = map(float, box)
    return [left, top, max(0.0, right - left), max(0.0, bottom - top)]


def _plate_ocr_context(models, model_directory, model_warnings):
    has_plate_detector = any(
        _is_plate_label(str(label))
        for _, model in models
        if not isinstance(model, tuple)
        for label in (
            getattr(model, "names", {}).values()
            if isinstance(getattr(model, "names", {}), dict)
            else getattr(model, "names", {})
        )
    )
    if not has_plate_detector:
        return None
    try:
        reader, read_plate_crop, voter_type = _load_plate_ocr(model_directory)
        return {"reader": reader, "read": read_plate_crop, "voter": voter_type()}
    except InferenceUnavailable as error:
        model_warnings.append(str(error))
        logger.warning("NH5 plate OCR is unavailable: %s", error)
        return None
    except Exception as error:
        logger.exception("Unable to initialize the supplied plate OCR implementation.")
        model_warnings.append(f"Plate OCR could not initialize: {error}")
        return None


def model_readiness(model_directory, vehicle_model_path):
    model_directory = Path(model_directory).resolve()
    vehicle_model_path = Path(vehicle_model_path).resolve()
    cache_key = str(vehicle_model_path)
    rapidocr_available = importlib.util.find_spec("rapidocr") is not None
    onnxruntime_available = importlib.util.find_spec("onnxruntime") is not None
    ocr_package_available = (model_directory / "plate_ocr" / "__init__.py").is_file()
    missing_requirements = []
    if not vehicle_model_path.is_file():
        missing_requirements.append(f"AI model weights are missing: {vehicle_model_path.name}")
    if YOLO is None:
        missing_requirements.append("Ultralytics is not installed.")
    if cv2 is None:
        missing_requirements.append("OpenCV is not installed.")
    return {
        "ready": not missing_requirements,
        "message": "NH5 model is ready." if not missing_requirements else " ".join(missing_requirements),
        "models": [{
            "name": vehicle_model_path.name,
            "available": vehicle_model_path.is_file(),
            "loaded": cache_key in _MODEL_CACHE,
        }],
        "dependencies": {
            "ultralytics": YOLO is not None,
            "opencv": cv2 is not None,
            "rapidocr": rapidocr_available,
            "onnxruntime": onnxruntime_available,
            "plateOcr": rapidocr_available and onnxruntime_available and ocr_package_available,
        },
    }


def _load_darknet_model(weights_path, config_path, names_path):
    if cv2 is None:
        raise InferenceUnavailable("OpenCV is required to load the supplied Darknet helmet detector.")
    if not config_path.is_file() or not names_path.is_file():
        raise InferenceUnavailable("The Darknet configuration or object class labels are missing.")
    key = str(weights_path.resolve())
    with _MODEL_CACHE_LOCK:
        model = _MODEL_CACHE.get(key)
        if model is None:
            try:
                model = cv2.dnn_DetectionModel(str(weights_path), str(config_path))
                model.setInputParams(size=(416, 416), scale=1 / 255, swapRB=True)
                _MODEL_CACHE[key] = model
            except Exception as error:
                raise InferenceUnavailable(
                    "Darknet .weights importer is not supported in OpenCV 5.x; YOLOv8 model will handle highway traffic detection."
                ) from error
    with names_path.open(encoding="utf-8") as labels_file:
        labels = [line.strip() for line in labels_file if line.strip()]
    if not labels:
        raise InferenceUnavailable("The Darknet object class label file is empty.")
    return model, labels


def _download_default_vehicle_model(model_path):
    model_path = Path(model_path)
    temporary_path = None
    try:
        model_path.parent.mkdir(parents=True, exist_ok=True)
        with _MODEL_CACHE_LOCK:
            if model_path.is_file():
                return
            with tempfile.NamedTemporaryFile(
                mode="wb",
                dir=model_path.parent,
                prefix=f".{model_path.name}.",
                suffix=".download",
                delete=False,
            ) as temporary_file:
                temporary_path = Path(temporary_file.name)
                digest = hashlib.sha256()
                downloaded_bytes = 0
                with urlopen(DEFAULT_VEHICLE_MODEL_URL, timeout=60) as response:
                    while chunk := response.read(1024 * 1024):
                        downloaded_bytes += len(chunk)
                        if downloaded_bytes > MAX_MODEL_DOWNLOAD_BYTES:
                            raise InferenceUnavailable(
                                "The official vehicle detector download exceeded the 20 MB safety limit."
                            )
                        digest.update(chunk)
                        temporary_file.write(chunk)
            if digest.hexdigest() != DEFAULT_VEHICLE_MODEL_SHA256:
                raise InferenceUnavailable(
                    "The downloaded vehicle detector failed its SHA-256 integrity check."
                )
            temporary_path.replace(model_path)
    except (OSError, URLError) as error:
        raise InferenceUnavailable(
            "The COCO vehicle detector is missing and could not be downloaded. "
            "Check backend internet access or set AI_VEHICLE_MODEL_PATH to a compatible local YOLO model."
        ) from error
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def _violation_for_label(label):
    normalized = re.sub(r"[_-]+", " ", label.lower()).strip()
    for violation_type, terms in VIOLATION_LABELS.values():
        if any(term in normalized for term in terms):
            return violation_type
    return None


def _is_vehicle_label(label):
    normalized = re.sub(r"[_-]+", " ", label.lower()).strip()
    return normalized in VEHICLE_LABELS or any(
        vehicle_word in normalized
        for vehicle_word in (
            "vehicle",
            "motorcycle",
            "motorbike",
            "two wheeler",
            "three wheeler",
            "rickshaw",
            "scooter",
            "ambulance",
            "tractor",
        )
    )


class _VideoObjectTracker:
    def __init__(self):
        self._tracks = {}
        self._next_id = 1

    def assign(self, model_name, label, box, timestamp):
        candidates = []
        for track_id, track in self._tracks.items():
            elapsed = timestamp - track["timestamp"]
            if (
                track["model"] != model_name
                or track["label"] != label
                or elapsed < -0.5
                or elapsed > 4.0
            ):
                continue
            previous_box = track["box"]
            left = max(box[0], previous_box[0])
            top = max(box[1], previous_box[1])
            right = min(box[0] + box[2], previous_box[0] + previous_box[2])
            bottom = min(box[1] + box[3], previous_box[1] + previous_box[3])
            intersection = max(0, right - left) * max(0, bottom - top)
            union = box[2] * box[3] + previous_box[2] * previous_box[3] - intersection
            overlap = intersection / union if union > 0 else 0
            center_distance = (
                (box[0] + box[2] / 2 - previous_box[0] - previous_box[2] / 2) ** 2
                + (box[1] + box[3] / 2 - previous_box[1] - previous_box[3] / 2) ** 2
            ) ** 0.5
            if overlap >= 0.08 or center_distance <= 0.20:
                candidates.append((overlap, -center_distance, track_id))

        if candidates:
            _, _, track_id = max(candidates)
        else:
            track_id = f"local-{self._next_id}"
            self._next_id += 1
        self._tracks[track_id] = {
            "model": model_name,
            "label": label,
            "box": box,
            "timestamp": timestamp,
        }
        return track_id


def _filter_and_nms_detections(detections, iou_threshold=0.45, min_confidence=0.35):
    if not detections:
        return []
    filtered = [
        d for d in detections
        if d["confidence"] >= min_confidence or _is_plate_label(d["label"])
    ]
    if not filtered:
        return []
    sorted_dets = sorted(filtered, key=lambda d: d["confidence"], reverse=True)
    kept = []
    for det in sorted_dets:
        box_a = det["box"]
        suppressed = False
        for k in kept:
            if _is_plate_label(det["label"]) != _is_plate_label(k["label"]):
                continue
            box_b = k["box"]
            xA = max(box_a[0], box_b[0])
            yA = max(box_a[1], box_b[1])
            xB = min(box_a[0] + box_a[2], box_b[0] + box_b[2])
            yB = min(box_a[1] + box_a[3], box_b[1] + box_b[3])
            interArea = max(0, xB - xA) * max(0, yB - yA)
            boxAArea = max(box_a[2] * box_a[3], 1e-6)
            boxBArea = max(box_b[2] * box_b[3], 1e-6)
            unionArea = boxAArea + boxBArea - interArea
            iou = interArea / unionArea if unionArea > 0 else 0
            overlap_ratio = interArea / min(boxAArea, boxBArea)
            if iou > iou_threshold or overlap_ratio > 0.65:
                suppressed = True
                break
        if not suppressed:
            kept.append(det)
    return kept


class VideoDetectionService:
    def __init__(self, model_directory, vehicle_model_path=None):
        self.model_directory = Path(model_directory)
        self.vehicle_model_path = Path(
            vehicle_model_path or self.model_directory / "nh5_yolov8n_960.pt"
        )

    def _models(self, include_auxiliary=True):
        if not self.model_directory.is_dir():
            raise InferenceUnavailable(f"AI model directory does not exist: {self.model_directory}")

        if self.vehicle_model_path.name == "yolov8n.pt" and not self.vehicle_model_path.is_file():
            _download_default_vehicle_model(self.vehicle_model_path)
        model_paths = [self.vehicle_model_path]
        traffic_model = self.model_directory / "best_traffic_med_yolo_v8.pt"
        helmet_model = self.model_directory / "best (7).pt"
        if include_auxiliary and traffic_model.is_file() and traffic_model not in model_paths:
            model_paths.append(traffic_model)
        if include_auxiliary and helmet_model.is_file() and helmet_model not in model_paths:
            model_paths.append(helmet_model)
        loaded_models = []
        model_warnings = []
        vehicle_detection_available = False
        for path in model_paths:
            try:
                model = _load_yolo_model(path)
                names = getattr(model, "names", {})
                labels = list(names.values()) if isinstance(names, dict) else list(names)
                if any(_is_vehicle_label(str(label)) or _violation_for_label(str(label)) for label in labels):
                    loaded_models.append((path, model))
                    vehicle_detection_available = vehicle_detection_available or any(
                        _is_vehicle_label(str(label)) for label in labels
                    )
                else:
                    model_warnings.append(
                        f"{path.name} has classes {', '.join(map(str, labels))}; it is not a vehicle or violation detector and was not used."
                    )
            except Exception as error:
                logger.exception("Unable to initialize AI model %s.", path.name)
                model_warnings.append(f"{path.name}: {error}")

        weights_path = self.model_directory / "yolov3-obj_2400.weights"
        config_path = self.model_directory / "yolov3-obj.cfg"
        labels_path = self.model_directory / "obj.names"
        if include_auxiliary and weights_path.is_file():
            try:
                darknet_model, labels = _load_darknet_model(weights_path, config_path, labels_path)
                loaded_models.append((weights_path, (darknet_model, labels)))
                vehicle_detection_available = vehicle_detection_available or any(
                    _is_vehicle_label(label) for label in labels
                )
            except Exception as error:
                logger.info("Optional Darknet model %s not loaded: %s", weights_path.name, error)
                if not loaded_models:
                    model_warnings.append(f"{weights_path.name}: {error}")

        if not loaded_models:
            details = "; ".join(model_warnings) or "No supported local vehicle or helmet model was found."
            raise InferenceUnavailable(f"No applicable video model could be loaded. {details}")
        if not vehicle_detection_available:
            details = "; ".join(model_warnings) or "No model classes identify a vehicle."
            raise InferenceUnavailable(
                f"No compatible vehicle detector could be loaded. {details}"
            )
        return loaded_models, model_warnings, vehicle_detection_available

    def _live_frame_session(self, session_id):
        now = time.monotonic()
        with _LIVE_FRAME_SESSIONS_LOCK:
            expired_sessions = [
                key
                for key, session in _LIVE_FRAME_SESSIONS.items()
                if now - session["lastActivity"] > LIVE_FRAME_SESSION_TTL_SECONDS
            ]
            for key in expired_sessions:
                del _LIVE_FRAME_SESSIONS[key]

            session = _LIVE_FRAME_SESSIONS.get(session_id)
            if session is None:
                if len(_LIVE_FRAME_SESSIONS) >= MAX_LIVE_FRAME_SESSIONS:
                    oldest_session_id = min(
                        _LIVE_FRAME_SESSIONS,
                        key=lambda key: _LIVE_FRAME_SESSIONS[key]["lastActivity"],
                    )
                    del _LIVE_FRAME_SESSIONS[oldest_session_id]
                models, model_warnings, vehicle_detection_available = self._models(
                    include_auxiliary=False,
                )
                session = {
                    "models": models,
                    "modelWarnings": model_warnings,
                    "vehicleDetectionAvailable": vehicle_detection_available,
                    "tracker": _VideoObjectTracker(),
                    "plateOcr": _plate_ocr_context(
                        models,
                        self.model_directory,
                        model_warnings,
                    ),
                    "vehicles": {},
                    "objects": {},
                    "violationEvents": [],
                    "lastActivity": now,
                    "lock": threading.Lock(),
                }
                _LIVE_FRAME_SESSIONS[session_id] = session
            session["lastActivity"] = now
            return session

    def analyze_frame(self, content, content_type, session_id, timestamp, duration=0, source_id=None):
        if cv2 is None:
            raise InferenceUnavailable("OpenCV is required to analyze video frames.")

        frame = InferenceService.validate_frame(content, content_type)
        import numpy

        image = cv2.imdecode(numpy.frombuffer(frame.content, dtype=numpy.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise VideoValidationError("The video frame could not be decoded.")

        session = self._live_frame_session(session_id)
        last_ts = session.get("last_timestamp", 0)
        if timestamp < last_ts - 1.0:
            session["tracker"]._tracks.clear()
            session["tracker"]._next_id = 1
        session["last_timestamp"] = timestamp
        height, width = image.shape[:2]
        detections = []
        all_raw_detections = []
        with session["lock"], _VIDEO_MODEL_INFERENCE_LOCK:
            session["lastActivity"] = time.monotonic()
            for model_path, model in session["models"]:
                if isinstance(model, tuple):
                    darknet_model, labels = model
                    class_ids, confidences, boxes = darknet_model.detect(
                        image,
                        confThreshold=0.35,
                        nmsThreshold=0.45,
                    )
                    if class_ids is None:
                        continue
                    for class_id, confidence, box in zip(class_ids, confidences, boxes):
                        all_raw_detections.append({
                            "label": labels[int(class_id)] if int(class_id) < len(labels) else str(int(class_id)),
                            "confidence": float(confidence),
                            "box": [
                                float(box[0]) / max(width, 1),
                                float(box[1]) / max(height, 1),
                                float(box[2]) / max(width, 1),
                                float(box[3]) / max(height, 1),
                            ],
                            "model_path": model_path,
                        })
                else:
                    predict_options = {
                        "source": image,
                        "conf": 0.35,
                        "iou": 0.45,
                        "verbose": False,
                    }
                    if model_path.resolve() == self.vehicle_model_path.resolve():
                        predict_options["imgsz"] = 960
                    result_batch = model.predict(**predict_options)
                    if not result_batch or result_batch[0].boxes is None:
                        continue
                    result = result_batch[0]
                    names = getattr(result, "names", None) or getattr(model, "names", {})
                    boxes = result.boxes
                    for box, confidence, class_id in zip(
                        boxes.xyxyn.cpu().tolist(),
                        boxes.conf.cpu().tolist(),
                        boxes.cls.cpu().tolist(),
                    ):
                        class_index = int(class_id)
                        label = str(
                            names.get(class_index, class_index)
                            if isinstance(names, dict)
                            else class_index
                        )
                        all_raw_detections.append({
                            "label": label,
                            "confidence": float(confidence),
                            "box": _normalized_xyxy_to_xywh(box),
                            "model_path": model_path,
                        })

            model_detections = _filter_and_nms_detections(all_raw_detections, iou_threshold=0.45, min_confidence=0.35)

            for model_detection in model_detections:
                mpath = model_detection["model_path"]
                model_detection["trackId"] = session["tracker"].assign(
                    mpath.name,
                    model_detection["label"],
                    model_detection["box"],
                    timestamp,
                )

            for model_detection in model_detections:
                mpath = model_detection["model_path"]
                label = model_detection["label"]
                track_id = model_detection["trackId"]
                violation_type = _violation_for_label(label)
                detection = {
                    "label": label,
                    "confidence": round(model_detection["confidence"], 4),
                    "box": [round(value, 6) for value in model_detection["box"]],
                    "trackId": track_id,
                    "model": mpath.name,
                    "sourceId": source_id or session_id,
                    "violationType": violation_type,
                }
                if _is_plate_label(label):
                    detection.update(self._plate_details(
                        image,
                        model_detection,
                        model_detections,
                        mpath.name,
                        track_id,
                        session["plateOcr"],
                    ))
                detections.append(detection)
                object_identifier = f"{mpath.name}:{track_id}"
                detected_object = session["objects"].setdefault(object_identifier, {
                    "objectId": object_identifier,
                    "label": label,
                    "isVehicle": _is_vehicle_label(label),
                    "trackingAvailable": True,
                    "firstSeenSeconds": timestamp,
                    "lastSeenSeconds": timestamp,
                    "confidence": detection["confidence"],
                    "violationTypes": [],
                    "violation": False,
                    "model": mpath.name,
                    "sourceId": source_id or session_id,
                })
                for key in ("plateNumber", "plateStatus", "vehicleId"):
                    if key in detection:
                        detected_object[key] = detection[key]
                if detection.get("ocrConfidence") is not None:
                    detected_object["ocrConfidence"] = max(
                        detected_object.get("ocrConfidence") or 0,
                        detection["ocrConfidence"],
                    )
                detected_object["lastSeenSeconds"] = timestamp
                detected_object["confidence"] = max(
                    detected_object["confidence"], detection["confidence"]
                )
                if violation_type and violation_type not in detected_object["violationTypes"]:
                    detected_object["violationTypes"].append(violation_type)
                    detected_object["violation"] = True
                    session["violationEvents"].append({
                        "timeSeconds": round(timestamp, 3),
                        "type": violation_type,
                        "object": label,
                        "trackId": track_id,
                        "confidence": detection["confidence"],
                        "model": mpath.name,
                    })

                if _is_vehicle_label(label):
                    vehicle = session["vehicles"].setdefault(object_identifier, {
                        "vehicleId": object_identifier,
                        "type": label,
                        "trackingAvailable": True,
                        "firstSeenSeconds": timestamp,
                        "lastSeenSeconds": timestamp,
                        "confidence": detection["confidence"],
                        "violationTypes": [],
                        "violation": False,
                    })
                    vehicle["lastSeenSeconds"] = timestamp
                    vehicle["confidence"] = max(vehicle["confidence"], detection["confidence"])
                    if violation_type and violation_type not in vehicle["violationTypes"]:
                        vehicle["violationTypes"].append(violation_type)
                        vehicle["violation"] = True

            session["sampledFrames"] = session.get("sampledFrames", 0) + 1
            categories = {}
            for item in session["violationEvents"]:
                categories[item["type"]] = categories.get(item["type"], 0) + 1
            video = {
                "width": width,
                "height": height,
                "durationSeconds": duration,
                "sampleIntervalSeconds": FRAME_SAMPLE_SECONDS,
                "sampledFrames": session["sampledFrames"],
                "frameLimitReached": False,
            }
            return {
                "success": True,
                "sourceId": source_id or session_id,
                "frame": {"timeSeconds": round(timestamp, 3), "detections": detections},
                "video": video,
                "models": [path.name for path, _ in session["models"]],
                "modelWarnings": session["modelWarnings"],
                "vehicleDetectionAvailable": session["vehicleDetectionAvailable"],
                "vehicles": list(session["vehicles"].values()),
                "objects": list(session["objects"].values()),
                "violationEvents": list(session["violationEvents"]),
                "summary": {
                    "vehicleCount": len(session["vehicles"]),
                    "objectCount": len(session["objects"]),
                    "violationCount": len(session["violationEvents"]),
                    "noViolationCount": sum(
                        not item["violation"] for item in session["objects"].values()
                    ),
                    "sampledFrames": session["sampledFrames"],
                    "violationCategories": [
                        {"name": name, "count": count}
                        for name, count in sorted(categories.items())
                    ],
                    "vehicleCategories": [
                        {"name": name, "count": count}
                        for name, count in sorted(
                            _count_categories(session["vehicles"].values(), type_key="type").items()
                        )
                    ],
                    "objectCategories": [
                        {"name": name, "count": count}
                        for name, count in sorted(
                            _count_categories(session["objects"].values(), type_key="label").items()
                        )
                    ],
                },
                "speedEstimation": {
                    "available": False,
                    "reason": "The supplied models and uploaded video do not include calibrated real-world speed measurement.",
                },
            }

    @staticmethod
    def _plate_details(image, plate_detection, model_detections, model_name, track_id, ocr):
        plate_box = plate_detection["box"]
        center_x = plate_box[0] + plate_box[2] / 2
        center_y = plate_box[1] + plate_box[3] / 2
        containing_vehicles = [
            candidate
            for candidate in model_detections
            if _is_vehicle_label(candidate["label"])
            and candidate["box"][0] <= center_x <= candidate["box"][0] + candidate["box"][2]
            and candidate["box"][1] <= center_y <= candidate["box"][1] + candidate["box"][3]
        ]
        vehicle = min(
            containing_vehicles,
            key=lambda candidate: candidate["box"][2] * candidate["box"][3],
            default=None,
        )
        vehicle_id = (
            f"{model_name}:{vehicle['trackId']}"
            if vehicle is not None and vehicle.get("trackId") is not None
            else None
        )
        details = {
            "plateNumber": None,
            "plateStatus": "Pending verification" if ocr is None else "Unreadable",
            "ocrConfidence": None,
            "vehicleId": vehicle_id,
        }
        if ocr is None:
            return details

        height, width = image.shape[:2]
        x, y, box_width, box_height = plate_box
        left = max(0, min(width, int(x * width)))
        top = max(0, min(height, int(y * height)))
        right = max(left, min(width, int((x + box_width) * width)))
        bottom = max(top, min(height, int((y + box_height) * height)))
        try:
            read_res = ocr["read"](ocr["reader"], crop)
            if isinstance(read_res, tuple) and len(read_res) >= 2:
                reading, confidence = read_res[0], read_res[1]
            else:
                reading = read_res if isinstance(read_res, str) else (read_res[0] if read_res else "")
                confidence = 0.90 if reading else None
        except Exception:
            reading = ""
            confidence = None
        details["ocrConfidence"] = round(float(confidence), 4) if confidence is not None else None
        confirmed = ocr["voter"].add(f"{model_name}:{track_id}", reading)
        if confirmed:
            details["plateNumber"] = confirmed
            details["plateStatus"] = "Confirmed"
        elif reading:
            details["plateStatus"] = "Pending verification"
        return details

    def analyze_video(self, video_path, source_id=None):
        video_path = Path(video_path)
        if not video_path.is_file():
            raise VideoValidationError("The uploaded video could not be read.")
        if cv2 is None:
            raise InferenceUnavailable(
                "Install OpenCV 4.x in the backend environment to decode uploaded videos."
            )

        models, model_warnings, vehicle_detection_available = self._models()
        plate_ocr = _plate_ocr_context(models, self.model_directory, model_warnings)
        capture = cv2.VideoCapture(str(video_path))
        if not capture.isOpened():
            capture.release()
            raise VideoValidationError(
                "The uploaded video could not be decoded. Try MP4 (H.264), WebM, or another OpenCV-supported format."
            )

        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        if fps <= 0:
            capture.release()
            raise VideoValidationError("The video does not report a valid frame rate.")
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = frame_count / fps if frame_count > 0 else 0
        sample_step = max(1, round(fps * FRAME_SAMPLE_SECONDS))
        sampled_frames = 0
        frames = []
        vehicles = {}
        objects = {}
        categories = {}
        violation_events = []
        violation_count = 0
        frame_index = 0
        object_tracker = _VideoObjectTracker()

        try:
            while sampled_frames < MAX_VIDEO_FRAMES:
                success, image = capture.read()
                if not success:
                    break
                if frame_index % sample_step:
                    frame_index += 1
                    continue

                timestamp = frame_index / fps
                frame_detections = []
                for model_path, model in models:
                    if isinstance(model, tuple):
                        darknet_model, labels = model
                        class_ids, confidences, boxes = darknet_model.detect(
                            image,
                            confThreshold=0.25,
                            nmsThreshold=0.45,
                        )
                        if class_ids is None:
                            continue
                        detections = []
                        for class_id, confidence, box in zip(class_ids, confidences, boxes):
                            x, y, box_width, box_height = map(float, box)
                            detections.append({
                                "label": labels[int(class_id)] if int(class_id) < len(labels) else str(int(class_id)),
                                "confidence": float(confidence),
                                "box": [
                                    x / max(width, 1),
                                    y / max(height, 1),
                                    box_width / max(width, 1),
                                    box_height / max(height, 1),
                                ],
                                "trackId": None,
                            })
                    else:
                        predict_options = {
                            "source": image,
                            "conf": 0.35,
                            "iou": 0.45,
                            "verbose": False,
                        }
                        if model_path.resolve() == self.vehicle_model_path.resolve():
                            predict_options["imgsz"] = 960
                        result_batch = model.predict(**predict_options)
                        if not result_batch:
                            continue
                        result = result_batch[0]
                        boxes = getattr(result, "boxes", None)
                        if boxes is None:
                            continue
                        names = getattr(result, "names", None) or getattr(model, "names", {})
                        xyxyn = getattr(boxes, "xyxyn", None)
                        confidences = getattr(boxes, "conf", None)
                        class_ids = getattr(boxes, "cls", None)
                        track_ids = getattr(boxes, "id", None)
                        if xyxyn is None or confidences is None or class_ids is None:
                            continue
                        normalized_boxes = xyxyn.cpu().tolist()
                        confidence_values = confidences.cpu().tolist()
                        class_values = class_ids.cpu().tolist()
                        track_values = track_ids.cpu().tolist() if track_ids is not None else []
                        detections = []
                        for index, box in enumerate(normalized_boxes):
                            class_id = int(class_values[index])
                            label = str(names.get(class_id, class_id) if isinstance(names, dict) else class_id)
                            detections.append({
                                "label": label,
                                "confidence": float(confidence_values[index]),
                                "box": _normalized_xyxy_to_xywh(box),
                                "trackId": (
                                    str(int(track_values[index]))
                                    if index < len(track_values)
                                    else None
                                ),
                            })

                    for model_detection in detections:
                        if model_detection["trackId"] is None:
                            model_detection["trackId"] = object_tracker.assign(
                                model_path.name,
                                model_detection["label"],
                                model_detection["box"],
                                timestamp,
                            )

                    for index, model_detection in enumerate(detections):
                        label = model_detection["label"]
                        violation_type = _violation_for_label(label)
                        track_id = model_detection["trackId"]
                        detection = {
                            "label": label,
                            "confidence": round(model_detection["confidence"], 4),
                            "box": [round(float(value), 6) for value in model_detection["box"]],
                            "trackId": track_id,
                            "model": model_path.name,
                            "sourceId": source_id or video_path.name,
                            "violationType": violation_type,
                        }
                        if _is_plate_label(label):
                            detection.update(self._plate_details(
                                image,
                                model_detection,
                                detections,
                                model_path.name,
                                track_id,
                                plate_ocr,
                            ))
                        frame_detections.append(detection)
                        object_identifier = (
                            f"{model_path.name}:{track_id}"
                            if track_id is not None
                            else f"{model_path.name}:frame-{frame_index}-object-{index}"
                        )
                        detected_object = objects.setdefault(object_identifier, {
                            "objectId": object_identifier,
                            "label": label,
                            "isVehicle": _is_vehicle_label(label),
                            "trackingAvailable": track_id is not None,
                            "firstSeenSeconds": timestamp,
                            "lastSeenSeconds": timestamp,
                            "confidence": detection["confidence"],
                            "violationTypes": [],
                            "violation": False,
                            "model": model_path.name,
                            "sourceId": source_id or video_path.name,
                        })
                        detected_object["lastSeenSeconds"] = timestamp
                        detected_object["confidence"] = max(
                            detected_object["confidence"], detection["confidence"]
                        )
                        for key in ("plateNumber", "plateStatus", "vehicleId"):
                            if key in detection:
                                detected_object[key] = detection[key]
                        if detection.get("ocrConfidence") is not None:
                            detected_object["ocrConfidence"] = max(
                                detected_object.get("ocrConfidence") or 0,
                                detection["ocrConfidence"],
                            )
                        if violation_type and violation_type not in detected_object["violationTypes"]:
                            detected_object["violationTypes"].append(violation_type)
                            detected_object["violation"] = True

                        if _is_vehicle_label(label):
                            vehicle = vehicles.setdefault(object_identifier, {
                                "vehicleId": object_identifier,
                                "type": label,
                                "trackingAvailable": track_id is not None,
                                "firstSeenSeconds": timestamp,
                                "lastSeenSeconds": timestamp,
                                "confidence": detection["confidence"],
                                "violationTypes": [],
                                "violation": False,
                            })
                            vehicle["lastSeenSeconds"] = timestamp
                            vehicle["confidence"] = max(vehicle["confidence"], detection["confidence"])
                            if violation_type and violation_type not in vehicle["violationTypes"]:
                                vehicle["violationTypes"].append(violation_type)
                                vehicle["violation"] = True

                        if violation_type:
                            violation_count += 1
                            categories[violation_type] = categories.get(violation_type, 0) + 1
                            violation_events.append({
                                "timeSeconds": round(timestamp, 3),
                                "type": violation_type,
                                "object": label,
                                "trackId": track_id,
                                "confidence": detection["confidence"],
                                "model": model_path.name,
                            })

                frames.append({
                    "timeSeconds": round(timestamp, 3),
                    "detections": frame_detections,
                })
                sampled_frames += 1
                frame_index += 1
        finally:
            capture.release()

        if sampled_frames == 0:
            raise VideoValidationError("No video frames could be read from the uploaded file.")
        if frame_count <= 0:
            duration = frame_index / fps

        return {
            "sourceId": source_id or video_path.name,
            "video": {
                "width": width,
                "height": height,
                "fps": round(fps, 3),
                "durationSeconds": round(duration, 3),
                "sampleIntervalSeconds": round(sample_step / fps, 3),
                "sampledFrames": sampled_frames,
                "frameLimitReached": sampled_frames >= MAX_VIDEO_FRAMES,
            },
            "models": [path.name for path, _ in models],
            "modelWarnings": model_warnings,
            "vehicleDetectionAvailable": vehicle_detection_available,
            "vehicles": list(vehicles.values()),
            "objects": list(objects.values()),
            "frames": frames,
            "violationEvents": violation_events,
            "summary": {
                "vehicleCount": len(vehicles),
                "objectCount": len(objects),
                "violationCount": violation_count,
                "noViolationCount": sum(not item["violation"] for item in objects.values()),
                "violationCategories": [
                    {"name": name, "count": count}
                    for name, count in sorted(categories.items())
                ],
                "vehicleCategories": [
                    {"name": name, "count": count}
                    for name, count in sorted(
                        _count_categories(vehicles.values(), type_key="type").items()
                    )
                ],
                "objectCategories": [
                    {"name": name, "count": count}
                    for name, count in sorted(
                        _count_categories(objects.values(), type_key="label").items()
                    )
                ],
            },
            "speedEstimation": {
                "available": False,
                "reason": "The supplied models and uploaded video do not include calibrated real-world speed measurement.",
            },
        }


def _count_categories(vehicles, type_key):
    counts = {}
    for vehicle in vehicles:
        label = vehicle[type_key]
        counts[label] = counts.get(label, 0) + 1
    return counts
