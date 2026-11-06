import hashlib
import io
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

from django.conf import settings
from django.test import SimpleTestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.client import Client

from .services.query import rule_parse, rule_to_cypher
from .services.inference import (
    InferenceService,
    InferenceUnavailable,
    VideoDetectionService,
    VideoValidationError,
    _VideoObjectTracker,
    _download_default_vehicle_model,
    _is_vehicle_label,
    _normalized_xyxy_to_xywh,
    _violation_for_label,
)
from .services.cloudinary_assets import asset_defaults, cloudinary_resource_pages
from .services.vehicles import canonical_vehicle_type, normalize_upload_row, to_client_record


class CloudinaryAssetServiceTests(SimpleTestCase):
    def test_asset_metadata_preserves_cloudinary_folder_and_secure_url(self):
        values = asset_defaults({
            "public_id": "Photos/highway",
            "secure_url": "https://res.cloudinary.com/example/image/upload/highway.jpg",
            "asset_folder": "Photos",
            "resource_type": "image",
            "format": "jpg",
            "width": 1920,
            "height": 1080,
            "bytes": 12345,
            "created_at": "2026-01-02T03:04:05Z",
        })
        self.assertEqual(values["asset_folder"], "Photos")
        self.assertEqual(values["secure_url"], "https://res.cloudinary.com/example/image/upload/highway.jpg")
        self.assertEqual(values["width"], 1920)
        self.assertEqual(values["file_size"], 12345)
        self.assertEqual(values["created_at"].isoformat(), "2026-01-02T03:04:05+00:00")

    def test_root_assets_keep_an_empty_asset_folder(self):
        values = asset_defaults({
            "public_id": "toll-plaza",
            "secure_url": "https://res.cloudinary.com/example/image/upload/toll-plaza.jpg",
        })
        self.assertEqual(values["asset_folder"], "")

    def test_asset_listing_follows_cursors_beyond_one_hundred_images(self):
        first_page = [{"public_id": f"image-{index}"} for index in range(100)]
        second_page = [{"public_id": f"image-{index}"} for index in range(100, 150)]
        api = type("CloudinaryApi", (), {})()
        api.resources = Mock(side_effect=[
            {"resources": first_page, "next_cursor": "page-2"},
            {"resources": second_page},
        ])
        with patch(
            "visioniq.services.cloudinary_assets._cloudinary",
            return_value=(api, object()),
        ):
            pages = list(cloudinary_resource_pages(page_size=100))

        self.assertEqual(sum(map(len, pages)), 150)
        self.assertEqual(api.resources.call_count, 2)
        self.assertEqual(api.resources.call_args_list[1].kwargs["next_cursor"], "page-2")


class VehicleServiceTests(SimpleTestCase):
    def test_vehicle_type_aliases_are_normalized(self):
        self.assertEqual(canonical_vehicle_type("lorry"), "Truck")
        self.assertEqual(canonical_vehicle_type("motorcycle"), "Bike")
        self.assertEqual(canonical_vehicle_type(""), "Car")

    def test_database_record_keeps_frontend_alias_fields(self):
        row = to_client_record({
            "id": 101,
            "csv_record_id": "OBS-101",
            "timestamp_ist": "2026-10-22 09:00:00",
            "vehicle_type": "lorry",
            "vehicle_number_plate": "TS09AB1234",
            "plate_confidence": 0.8,
            "speed": 72,
            "speed_limit": 60,
            "over_speed": "Yes",
            "latitude": 17.2,
            "longitude": 78.2,
            "vehicle_image_path": "evidence/101.jpg",
            "source_file": "traffic.csv",
        })
        self.assertEqual(row["vehicleType"], "Truck")
        self.assertEqual(row["type"], row["vehicleType"])
        self.assertEqual(row["observationId"], "OBS-101")
        self.assertEqual(row["numberPlate"], row["vehicleNumberPlate"])
        self.assertTrue(row["isOverSpeed"])
        self.assertEqual(row["vehicleImagePath"], "evidence/101.jpg")

    def test_upload_normalization_clamps_confidence_and_drops_data_urls(self):
        values = normalize_upload_row(
            {
                "id": "OBS-1",
                "type": "sedan",
                "plateConfidence": 2,
                "vehicleImagePath": "data:image/png;base64,private",
                "speed": 70,
                "speedLimit": 60,
            },
            "traffic.xlsx",
            0,
        )
        self.assertEqual(values[0], "OBS-1")
        self.assertEqual(values[2], "Car")
        self.assertEqual(values[4], 1.0)
        self.assertIsNone(values[12])
        self.assertEqual(values[8], "Yes")


class QueryServiceTests(SimpleTestCase):
    def test_rule_parser_extracts_overspeed_and_speed_range(self):
        filters, _ = rule_parse("show overspeed trucks between 70 and 90 km/h")
        self.assertTrue(filters["overspeedOnly"])
        self.assertEqual(filters["minSpeed"], 70)
        self.assertEqual(filters["maxSpeed"], 90)
        self.assertEqual(filters["vehicleType"], "Truck")

    def test_camera_number_does_not_become_a_plate(self):
        filters, _ = rule_parse("show incidents from camera 12")
        self.assertIsNone(filters["plate"])
        self.assertEqual(filters["camera"], "camera 12")

    def test_cypher_rule_uses_only_known_vehicle_type_values(self):
        result = rule_to_cypher("show truck observations over 80")
        self.assertIn("o.vehicleType = 'Truck'", result)
        self.assertIn("o.speed >= 80", result)


class InferenceServiceTests(SimpleTestCase):
    def test_frame_validation_rejects_empty_or_unsupported_content(self):
        with self.assertRaises(ValueError):
            InferenceService.validate_frame(b"", "image/jpeg")
        with self.assertRaises(ValueError):
            InferenceService.validate_frame(b"frame", "video/mp4")

    def test_ai_model_directory_points_to_project_model_files(self):
        self.assertTrue(settings.AI_MODEL_PATH.exists())
        self.assertTrue(any(settings.AI_MODEL_PATH.iterdir()))
        self.assertEqual(
            settings.AI_VEHICLE_MODEL_PATH,
            (settings.AI_MODEL_PATH / "nh5_yolov8n_960.pt").resolve(),
        )

    def test_nh5_boxes_are_normalized_to_ui_xywh_coordinates(self):
        left, top, width, height = _normalized_xyxy_to_xywh([0.1, 0.2, 0.7, 0.8])
        self.assertAlmostEqual(left, 0.1)
        self.assertAlmostEqual(top, 0.2)
        self.assertAlmostEqual(width, 0.6)
        self.assertAlmostEqual(height, 0.6)

    def test_plate_detections_are_associated_with_the_smallest_containing_vehicle(self):
        class Frame:
            shape = (100, 200, 3)

            def __getitem__(self, bounds):
                return bounds

        class Voter:
            def add(self, track_id, reading):
                self.last_reading = (track_id, reading)
                return reading

        vehicle_detections = [
            {
                "label": "car",
                "box": [0.05, 0.1, 0.9, 0.8],
                "trackId": "car-1",
            },
            {
                "label": "auto",
                "box": [0.1, 0.2, 0.5, 0.5],
                "trackId": "auto-1",
            },
        ]
        plate_detection = {
            "label": "license_plate",
            "box": [0.2, 0.5, 0.15, 0.08],
            "trackId": "plate-1",
        }
        ocr = {
            "reader": object(),
            "read": lambda reader, crop: ("TS07HA3898", 0.93),
            "voter": Voter(),
        }

        details = VideoDetectionService._plate_details(
            Frame(),
            plate_detection,
            [*vehicle_detections, plate_detection],
            "nh5_yolov8n_960.pt",
            "plate-1",
            ocr,
        )

        self.assertEqual(details["plateNumber"], "TS07HA3898")
        self.assertEqual(details["plateStatus"], "Confirmed")
        self.assertEqual(details["ocrConfidence"], 0.93)
        self.assertEqual(details["vehicleId"], "nh5_yolov8n_960.pt:auto-1")

    def test_vehicle_model_download_is_checksum_verified(self):
        content = b"verified model weights"
        expected_digest = hashlib.sha256(content).hexdigest()
        with tempfile.TemporaryDirectory() as directory:
            model_path = Path(directory) / "yolov8n.pt"
            with (
                patch("visioniq.services.inference.urlopen", return_value=io.BytesIO(content)),
                patch("visioniq.services.inference.DEFAULT_VEHICLE_MODEL_SHA256", expected_digest),
            ):
                _download_default_vehicle_model(model_path)
            self.assertEqual(model_path.read_bytes(), content)

    def test_video_models_include_a_compatible_configured_vehicle_detector(self):
        class VehicleModel:
            names = {0: "car"}

        with tempfile.TemporaryDirectory() as directory:
            model_path = Path(directory) / "vehicle.pt"
            service = VideoDetectionService(directory, model_path)
            with (
                patch("visioniq.services.inference._download_default_vehicle_model"),
                patch("visioniq.services.inference._load_yolo_model", return_value=VehicleModel()),
            ):
                models, warnings, vehicle_detection_available = service._models()
            self.assertEqual(models[0][0], model_path)
            self.assertTrue(vehicle_detection_available)

    def test_live_video_models_skip_large_auxiliary_models(self):
        class VehicleModel:
            names = {0: "car"}

        with tempfile.TemporaryDirectory() as directory:
            model_path = Path(directory) / "vehicle.pt"
            (Path(directory) / "yolov3-obj_2400.weights").write_bytes(b"unused helmet weights")
            service = VideoDetectionService(directory, model_path)
            with (
                patch("visioniq.services.inference._download_default_vehicle_model"),
                patch("visioniq.services.inference._load_yolo_model", return_value=VehicleModel()) as load_model,
                patch("visioniq.services.inference._load_darknet_model") as load_darknet,
            ):
                models, _, _ = service._models(include_auxiliary=False)
            self.assertEqual(len(models), 1)
            load_model.assert_called_once_with(model_path)
            load_darknet.assert_not_called()

    def test_missing_future_model_fails_explicitly_without_predictions(self):
        service = InferenceService(model_path="missing-model")
        with self.assertRaises(InferenceUnavailable):
            service.predict(b"\xff\xd8\xff frame", "image/jpeg")

    def test_video_labels_are_not_invented_as_violations_or_vehicle_types(self):
        self.assertEqual(_violation_for_label("no_helmet"), "Helmet violation")
        self.assertIsNone(_violation_for_label("helmet"))
        self.assertIsNone(_violation_for_label("car"))
        self.assertTrue(_is_vehicle_label("two_wheeler"))
        self.assertTrue(_is_vehicle_label("auto"))
        self.assertFalse(_is_vehicle_label("helmet"))

    def test_video_tracker_preserves_vehicle_identity_between_sampled_frames(self):
        tracker = _VideoObjectTracker()
        first_id = tracker.assign("yolov8n.pt", "motorcycle", [0.1, 0.2, 0.3, 0.4], 0)
        next_id = tracker.assign("yolov8n.pt", "motorcycle", [0.11, 0.2, 0.3, 0.4], 0.5)
        self.assertEqual(first_id, next_id)

    def test_video_analysis_rejects_a_missing_file_explicitly(self):
        service = VideoDetectionService(settings.AI_MODEL_PATH)
        with self.assertRaises((VideoValidationError, InferenceUnavailable)):
            service.analyze_video("missing-video.mp4")


class ApiValidationTests(SimpleTestCase):
    def setUp(self):
        self.client = Client(HTTP_HOST="localhost")

    def test_health_is_available_without_database_access(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

    def test_invalid_query_payloads_are_rejected(self):
        ai_response = self.client.post("/api/query/ai-parse", data={}, content_type="application/json")
        cypher_response = self.client.post("/api/query/natural-to-cypher", data={}, content_type="application/json")
        self.assertEqual(ai_response.status_code, 400)
        self.assertEqual(cypher_response.status_code, 400)

    def test_non_object_payloads_are_rejected(self):
        payload = self.client.post("/api/vehicles/upload", data="[]", content_type="application/json")
        self.assertEqual(payload.status_code, 400)

    def test_video_analysis_requires_an_uploaded_video(self):
        response = self.client.post("/api/live-feed/analyze-video")
        self.assertEqual(response.status_code, 400)

    def test_cloudinary_list_rejects_invalid_page_size_without_database_access(self):
        response = self.client.get("/api/cloudinary/images/?page_size=1000")
        self.assertEqual(response.status_code, 400)

    def test_cloudinary_upload_requires_a_bearer_token(self):
        response = self.client.post("/api/cloudinary/images/upload/")
        self.assertEqual(response.status_code, 401)

    def test_live_model_status_exposes_nh5_readiness(self):
        response = self.client.get("/api/live-feed/models")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["models"][0]["name"],
            "nh5_yolov8n_960.pt",
        )
        self.assertIn("plateOcr", response.json()["dependencies"])

    def test_image_analysis_requires_an_uploaded_image(self):
        response = self.client.post("/api/live-feed/analyze-image")
        self.assertEqual(response.status_code, 400)

    def test_video_analysis_rejects_unsupported_file_extensions(self):
        video = SimpleUploadedFile("notes.txt", b"not a video", content_type="video/mp4")
        response = self.client.post("/api/live-feed/analyze-video", {"video": video})
        self.assertEqual(response.status_code, 400)

    def test_live_frame_analysis_returns_incremental_video_results(self):
        session_id = "450f4c57-44c0-46b5-82a5-436b4078bb4c"
        expected_result = {
            "success": True,
            "frame": {"timeSeconds": 1.5, "detections": []},
            "video": {"sampledFrames": 2},
            "vehicles": [{"vehicleId": "yolov8n.pt:local-1", "type": "car"}],
            "objects": [],
            "violationEvents": [],
            "summary": {"vehicleCount": 1, "sampledFrames": 2},
        }
        with patch(
            "visioniq.views.VideoDetectionService.analyze_frame",
            return_value=expected_result,
        ) as analyze_frame:
            response = self.client.post(
                "/api/live-feed/analyze-frame",
                {
                    "sessionId": session_id,
                    "timeSeconds": "1.5",
                    "durationSeconds": "8",
                    "frame": SimpleUploadedFile(
                        "frame.jpg",
                        b"\xff\xd8\xfftest-frame",
                        content_type="image/jpeg",
                    ),
                },
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected_result)
        self.assertEqual(analyze_frame.call_args.args[2:], (session_id, 1.5, 8.0))

    def test_me_requires_a_token(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_me_rejects_invalid_tokens_with_unauthorized_status(self):
        response = self.client.get("/api/auth/me", HTTP_AUTHORIZATION="Bearer invalid-token")
        self.assertEqual(response.status_code, 401)
