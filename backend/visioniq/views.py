import asyncio
import logging
import math
import mimetypes
import re
import tempfile
import uuid
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from django.conf import settings
from django.db import DatabaseError
from django.http import JsonResponse, StreamingHttpResponse, HttpResponseRedirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .database import DatabaseUnavailable, fetch_all, fetch_one
from .models import CloudinaryAsset
from .permissions import HasLegacyBearerToken
from .services.cloudinary_assets import (
    CloudinaryNotConfigured,
    serialize_asset,
    upload_image,
)
from .services import query as query_service
from .services import stream
from .services.inference import (
    InferenceUnavailable,
    VideoDetectionService,
    VideoValidationError,
    model_readiness,
)
from .services.vehicles import (
    incidents as get_incidents,
    list_vehicles as get_vehicles,
    search_vehicles as search_vehicle_rows,
    stats as get_stats,
    upload_vehicles as save_vehicle_rows,
)

logger = logging.getLogger(__name__)


def _database_error(endpoint):
    logger.error("MySQL operation failed while handling %s.", endpoint)
    return Response(
        {"success": False, "error": "The configured MySQL database is unavailable or its required tables are missing."},
        status=503,
    )


def _bounded_int(value, default, minimum, maximum):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, number))


def _user_payload(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "role": row.get("role") or "admin",
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"success": True, "message": "VisionIQ Django API is running."})


@api_view(["POST"])
def analyze_video(request):
    uploaded_video = request.FILES.get("video")
    if uploaded_video is None:
        return Response(
            {"success": False, "message": "Attach the video file using the 'video' form field."},
            status=400,
        )
    allowed_extensions = {".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"}
    if Path(uploaded_video.name).suffix.lower() not in allowed_extensions:
        return Response(
            {"success": False, "message": "Supported video types are MP4, WebM, MOV, M4V, AVI, and MKV."},
            status=400,
        )
    if uploaded_video.size <= 0:
        return Response({"success": False, "message": "The uploaded video is empty."}, status=400)
    if uploaded_video.size > 150 * 1024 * 1024:
        return Response({"success": False, "message": "Video exceeds the 150 MB upload limit."}, status=413)
    if uploaded_video.content_type and not uploaded_video.content_type.startswith("video/"):
        return Response({"success": False, "message": "The uploaded file must be a video."}, status=400)

    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            suffix=Path(uploaded_video.name).suffix.lower(),
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            for chunk in uploaded_video.chunks():
                temporary_file.write(chunk)

        result = VideoDetectionService(
            settings.AI_MODEL_PATH,
            settings.AI_VEHICLE_MODEL_PATH,
        ).analyze_video(temporary_path, source_id=Path(uploaded_video.name).name)
        return Response({"success": True, **result})
    except VideoValidationError as error:
        return Response({"success": False, "message": str(error)}, status=400)
    except InferenceUnavailable as error:
        logger.error("Video analysis unavailable: %s", error)
        return Response({"success": False, "message": str(error)}, status=503)
    except Exception:
        logger.exception("Video analysis failed for uploaded file %s.", uploaded_video.name)
        return Response(
            {"success": False, "message": "Video analysis failed. Check the backend logs for details."},
            status=500,
        )
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


@api_view(["POST"])
def analyze_video_frame(request):
    uploaded_frame = request.FILES.get("frame")
    if uploaded_frame is None:
        return Response(
            {"success": False, "message": "Attach a JPEG, PNG, or WebP frame using the 'frame' form field."},
            status=400,
        )
    raw_session_id = str(request.data.get("sessionId") or "").strip()
    try:
        session_id = str(uuid.UUID(raw_session_id))
    except (ValueError, TypeError, AttributeError):
        session_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, raw_session_id)) if raw_session_id else str(uuid.uuid4())
    try:
        timestamp = float(request.data.get("timeSeconds", 0))
        duration = max(0.0, float(request.data.get("durationSeconds", 0)))
    except (TypeError, ValueError):
        return Response({"success": False, "message": "Video time and duration must be valid numbers."}, status=400)
    if not math.isfinite(timestamp) or not math.isfinite(duration) or timestamp < 0:
        return Response({"success": False, "message": "Video time and duration must be finite non-negative numbers."}, status=400)
    if uploaded_frame.size <= 0 or uploaded_frame.size > 20 * 1024 * 1024:
        return Response({"success": False, "message": "Frame size must be between 1 byte and 20 MB."}, status=413)

    try:
        result = VideoDetectionService(
            settings.AI_MODEL_PATH,
            settings.AI_VEHICLE_MODEL_PATH,
        ).analyze_frame(
            uploaded_frame.read(),
            uploaded_frame.content_type,
            session_id,
            timestamp,
            duration,
            source_id=str(request.data.get("sourceId") or session_id)[:200],
        )
        return Response(result)
    except (ValueError, VideoValidationError) as error:
        return Response({"success": False, "message": str(error)}, status=400)
    except InferenceUnavailable as error:
        logger.error("Live frame analysis unavailable: %s", error)
        return Response({"success": False, "message": str(error)}, status=503)
    except Exception:
        logger.exception("Live frame analysis failed for session %s.", session_id)
        return Response(
            {"success": False, "message": "Live frame analysis failed. Check the backend logs for details."},
            status=500,
        )


@api_view(["POST"])
def analyze_live_image(request):
    uploaded_image = request.FILES.get("image")
    if uploaded_image is None:
        return Response(
            {"success": False, "message": "Attach an image using the 'image' form field."},
            status=400,
        )
    if uploaded_image.size <= 0 or uploaded_image.size > 20 * 1024 * 1024:
        return Response({"success": False, "message": "Image size must be between 1 byte and 20 MB."}, status=413)
    session_id = str(uuid.uuid4())
    try:
        result = VideoDetectionService(
            settings.AI_MODEL_PATH,
            settings.AI_VEHICLE_MODEL_PATH,
        ).analyze_frame(
            uploaded_image.read(),
            uploaded_image.content_type,
            session_id,
            0,
            0,
            source_id=str(request.data.get("sourceId") or Path(uploaded_image.name).name)[:200],
        )
        return Response(result)
    except (ValueError, VideoValidationError) as error:
        return Response({"success": False, "message": str(error)}, status=400)
    except InferenceUnavailable as error:
        logger.error("Image analysis unavailable: %s", error)
        return Response({"success": False, "message": str(error)}, status=503)
    except Exception:
        logger.exception("Live image analysis failed for source %s.", uploaded_image.name)
        return Response(
            {"success": False, "message": "Image analysis failed. Check the backend logs for details."},
            status=500,
        )


@api_view(["GET"])
def live_model_status(request):
    return Response({
        "success": True,
        **model_readiness(settings.AI_MODEL_PATH, settings.AI_VEHICLE_MODEL_PATH),
    })


@api_view(["GET"])
def list_vehicles(request):
    limit = _bounded_int(request.query_params.get("limit"), 20, 1, 100)
    file_name = request.query_params.get("fileName")
    try:
        vehicles = get_vehicles(limit, file_name)
    except DatabaseUnavailable:
        return _database_error("GET /api/vehicles")
    return Response({"success": True, "count": len(vehicles), "vehicles": vehicles})


@api_view(["GET"])
def search_vehicles(request):
    query = request.query_params.get("q") or request.query_params.get("query") or request.query_params.get("plate") or ""
    limit = _bounded_int(request.query_params.get("limit"), 50, 1, 200)
    try:
        vehicles = search_vehicle_rows(query, limit)
    except DatabaseUnavailable:
        return _database_error("GET /api/vehicles/search")
    normalized_query = str(query).strip()
    looks_like_plate = bool(
        re.fullmatch(r"[A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{1,4}", normalized_query, re.I)
        and len(re.sub(r"[^A-Z0-9]", "", normalized_query, flags=re.I)) >= 5
        and not normalized_query.lower().startswith("cam")
    )
    looks_like_record = bool(
        re.search(r"\b(?:nh44|obs|record|telemetry)\s*[-#]?\s*\d+", normalized_query, re.I)
    )
    dossier = None
    if vehicles and (looks_like_plate or looks_like_record):
        first = vehicles[0]
        confidence = float(first.get("plateConfidence") or 0)
        dossier = {
            "primaryPlate": first.get("vehicleNumberPlate"),
            "vehicleType": first.get("vehicleType"),
            "detectionCount": len(vehicles),
            "lastLocation": first.get("location"),
            "camera": first.get("camera"),
            "speed": first.get("speed"),
            "speedLimit": first.get("speedLimit"),
            "isOverSpeed": first.get("isOverSpeed"),
            "timestampIst": first.get("timestampIst"),
            "plateConfidence": confidence * 100 if confidence <= 1 else confidence,
            "image": first.get("vehicleImagePath") or first.get("vehicleImage"),
            "summary": (
                f"{first.get('vehicleType') or 'Vehicle'} {first.get('vehicleNumberPlate') or ''} "
                f"was detected {len(vehicles)} time(s); plate confidence {round(confidence * 100)}%."
            ).strip(),
        }
    return Response({
        "success": True,
        "query": query,
        "count": len(vehicles),
        "dossier": dossier,
        "vehicles": vehicles,
    })


@api_view(["POST"])
def upload_vehicles(request):
    data = request.data
    if not isinstance(data, Mapping):
        return Response({"success": False, "message": "A JSON object is required."}, status=400)
    file_name = data.get("fileName")
    rows = data.get("rows")
    if not isinstance(file_name, str) or not file_name.strip() or not isinstance(rows, list) or not rows:
        return Response(
            {"success": False, "message": "fileName and rows array required for upload."},
            status=400,
        )
    if any(not isinstance(row, dict) for row in rows):
        return Response({"success": False, "message": "Every uploaded row must be a JSON object."}, status=400)
    try:
        result = save_vehicle_rows(str(file_name), rows)
        if data.get("isLastChunk") is True:
            batch, total, offset = stream.get_batch()
            result["initialBatch"] = batch
            stream.emit_batch(
                batch,
                file_name=str(file_name),
                total_pool=total,
                offset=offset,
                event_type="dataset_switched",
            )
            stream.emit_event("vehicleStreamComplete", {
                "fileName": str(file_name),
                "totalRows": data.get("totalRecords") or len(rows),
            })
    except DatabaseUnavailable:
        return _database_error("POST /api/vehicles/upload")
    return Response(result)


@api_view(["GET"])
def random_batch(request):
    count = request.query_params.get("count")
    count = _bounded_int(count, None, 1, 50) if count is not None else None
    if stream.is_paused() and request.query_params.get("force", "").lower() != "true":
        return Response({"success": True, "count": 0, "batchSize": 0, "vehicles": []})
    try:
        records, total, offset = stream.get_batch(count, request.query_params.get("fileName"))
    except DatabaseUnavailable:
        return _database_error("GET /api/vehicles/random-batch")
    if request.query_params.get("broadcast", "").lower() == "true":
        stream.emit_batch(records, file_name=request.query_params.get("fileName"), total_pool=total, offset=offset)
    return Response({
        "success": True,
        "count": len(records),
        "batchSize": len(records),
        "vehicles": records,
    })


@api_view(["GET", "POST"])
def stream_control(request):
    if request.method == "GET":
        return Response({"success": True, "isPaused": stream.is_paused()})
    if not isinstance(request.data, Mapping):
        return Response({"success": False, "message": "A JSON object is required."}, status=400)
    try:
        result = stream.stream_control(request.data.get("action"))
    except DatabaseUnavailable:
        return _database_error("POST /api/vehicles/stream-control")
    if result is None:
        return Response({"success": False, "message": "Invalid stream action."}, status=400)
    if request.data.get("action") in {"trigger", "next"}:
        result.pop("status", None)
    return Response(result)


@api_view(["GET"])
def vehicle_stats(request):
    try:
        result = get_stats(request.query_params.get("fileName"))
    except DatabaseUnavailable:
        return _database_error("GET /api/vehicles/stats")
    return Response({"success": True, "stats": result})


@api_view(["GET"])
def vehicle_incidents(request):
    limit = _bounded_int(request.query_params.get("limit"), 50, 1, 200)
    try:
        incidents = get_incidents(limit)
    except DatabaseUnavailable:
        return _database_error("GET /api/vehicles/incidents")
    return Response({"success": True, "count": len(incidents), "incidents": incidents})


@api_view(["GET"])
def corridors(request):
    try:
        result = _corridor_rows()
    except DatabaseUnavailable:
        return _database_error("GET /api/corridors")
    return Response({"success": True, "count": len(result), "corridors": result})


def _corridor_rows():
    corridors = fetch_all(
        """
        SELECT c.*,
          k.vehicle_detections, k.unique_vehicles, k.overspeed_events,
          k.incident_count, k.high_critical_incidents, k.overspeed_rate_pct,
          k.incident_rate_per_1000_vehicles, k.demo_risk_band
        FROM network_corridors c
        LEFT JOIN network_corridor_kpis k ON c.corridor_id = k.corridor_id
        ORDER BY c.corridor_order ASC
        """
    )
    cameras = fetch_all("SELECT * FROM network_cameras")
    incidents = fetch_all(
        """
        SELECT i.*,
          p.risk_score_0_100, p.risk_category, p.recommended_action,
          m.estimated_delay_min, m.max_queue_km, m.traffic_flow_reduction_pct,
          m.affected_lanes, m.diversion_recommended
        FROM network_incidents i
        LEFT JOIN network_risk_profiles p ON i.incident_id = p.incident_id
        LEFT JOIN network_impact_analysis m ON i.incident_id = m.incident_id
        """
    )
    by_corridor = {}
    for incident in incidents:
        by_corridor.setdefault(incident.get("corridor_id"), []).append(incident)
    for corridor in corridors:
        corridor_id = str(corridor.get("corridor_id") or "").upper().replace(" ", "-")
        corridor["cameras"] = [
            camera for camera in cameras
            if corridor_id and corridor_id in str(camera.get("zone_id") or "").upper()
        ]
        corridor["incidents"] = by_corridor.get(corridor.get("corridor_id"), [])
    return corridors


@api_view(["GET"])
def cameras(request):
    camera_list = [
        {"id": "CAM-NH44-01-SHAMSHABAD", "name": "Shamshabad Tollway (KM 18)", "latitude": 17.385044, "longitude": 78.486671, "status": "Active"},
        {"id": "CAM-NH44-02-SHADNAGAR", "name": "Shadnagar Interchange (KM 52)", "latitude": 17.215, "longitude": 78.204, "status": "Active"},
        {"id": "CAM-NH44-03-RINGROAD", "name": "Hyderabad Ring Corridor", "latitude": 17.4431, "longitude": 78.3812, "status": "Active"},
        {"id": "CAM-NH44-04-MEDCHAL", "name": "Medchal North Gateway (KM 36)", "latitude": 17.629, "longitude": 78.481, "status": "Active"},
        {"id": "CAM-NH44-05-JADCHERLA", "name": "Jadcherla Express Point (KM 84)", "latitude": 16.764, "longitude": 78.136, "status": "Active"},
        {"id": "CAM-NH44-06-TOLLPLAZA", "name": "Raikal Toll Plaza", "latitude": 17.062, "longitude": 78.243, "status": "Active"},
    ]
    return Response({"success": True, "count": len(camera_list), "cameras": camera_list})


@api_view(["GET"])
@permission_classes([AllowAny])
def cloudinary_images(request):
    raw_page_size = request.query_params.get("page_size", "50")
    raw_cursor = request.query_params.get("cursor")
    try:
        page_size = int(raw_page_size)
        cursor = int(raw_cursor) if raw_cursor is not None else None
    except ValueError:
        return Response(
            {"success": False, "message": "page_size and cursor must be integers."},
            status=400,
        )
    if not 1 <= page_size <= 100 or (cursor is not None and cursor < 0):
        return Response(
            {"success": False, "message": "page_size must be 1-100 and cursor must be non-negative."},
            status=400,
        )

    assets = CloudinaryAsset.objects.all()
    if raw_cursor is not None:
        assets = assets.filter(id__gt=cursor)
    if "folder" in request.query_params:
        folder = request.query_params["folder"].strip().strip("/")
        if folder.casefold() == "root":
            folder = ""
        assets = assets.filter(asset_folder__iexact=folder)
    if "category" in request.query_params:
        assets = assets.filter(category__iexact=request.query_params["category"].strip())
    try:
        page = list(assets.order_by("id")[:page_size + 1])
    except DatabaseError:
        logger.exception("MySQL failed while listing synchronized Cloudinary images.")
        return _database_error("GET /api/cloudinary/images/")

    has_more = len(page) > page_size
    page = page[:page_size]
    return Response({
        "success": True,
        "count": len(page),
        "images": [serialize_asset(asset) for asset in page],
        "next_cursor": str(page[-1].id) if has_more and page else None,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def cloudinary_image_detail(request, public_id):
    try:
        asset = CloudinaryAsset.objects.get(public_id=public_id)
    except CloudinaryAsset.DoesNotExist:
        return Response({"success": False, "message": "Image not found."}, status=404)
    except DatabaseError:
        logger.exception("MySQL failed while retrieving a synchronized Cloudinary image.")
        return _database_error("GET /api/cloudinary/images/<public_id>/")
    return Response({"success": True, "image": serialize_asset(asset)})


@api_view(["POST"])
@permission_classes([HasLegacyBearerToken])
def upload_cloudinary_image(request):
    uploaded_image = request.FILES.get("image")
    if uploaded_image is None:
        return Response(
            {"success": False, "message": "Attach an image using the 'image' form field."},
            status=400,
        )
    if uploaded_image.size <= 0 or uploaded_image.size > 20 * 1024 * 1024:
        return Response({"success": False, "message": "Image size must be between 1 byte and 20 MB."}, status=413)
    header = uploaded_image.read(12)
    signatures = {
        "image/jpeg": header.startswith(b"\xff\xd8\xff"),
        "image/png": header.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": header[:4] == b"RIFF" and header[8:12] == b"WEBP",
    }
    if not signatures.get(uploaded_image.content_type, False):
        return Response(
            {"success": False, "message": "Image content must be a valid JPEG, PNG, or WebP file."},
            status=400,
        )

    category = request.data.get("category", "")
    source_id = request.data.get("source_id", "")
    if not isinstance(category, str) or not isinstance(source_id, str):
        return Response({"success": False, "message": "category and source_id must be strings."}, status=400)
    if len(category) > 80 or len(source_id) > 255:
        return Response({"success": False, "message": "category or source_id exceeds its maximum length."}, status=400)

    uploaded_image.seek(0)
    try:
        asset, created = upload_image(
            uploaded_image.read(),
            category=category.strip(),
            source_id=source_id.strip(),
        )
    except CloudinaryNotConfigured:
        return Response(
            {"success": False, "message": "Cloudinary credentials are not configured on the backend."},
            status=503,
        )
    except DatabaseError:
        logger.exception("MySQL failed while saving Cloudinary image metadata.")
        return _database_error("POST /api/cloudinary/images/upload/")
    except Exception as error:
        logger.error("Cloudinary image upload failed (%s).", type(error).__name__)
        return Response({"success": False, "message": "Cloudinary image upload failed."}, status=502)
    return Response(
        {"success": True, "created": created, "image": serialize_asset(asset)},
        status=201 if created else 200,
    )


@api_view(["POST"])
def login(request):
    data = request.data
    if not isinstance(data, Mapping):
        return Response({"success": False, "message": "A JSON object is required."}, status=400)
    identifier = data.get("identifier") or data.get("email") or data.get("username")
    password = str(data.get("password") or "").strip()
    if not identifier or not password:
        return Response({"success": False, "message": "Identifier and password are required."}, status=400)
    try:
        row = fetch_one(
            "SELECT id, username, email, password, role FROM users WHERE LOWER(email) = LOWER(%s) OR LOWER(username) = LOWER(%s) LIMIT 1",
            [str(identifier).strip(), str(identifier).strip()],
        )
    except DatabaseUnavailable:
        return _database_error("POST /api/auth/login")
    if not row or not _verify_password(password, str(row.get("password") or "")):
        return Response({"success": False, "message": "Invalid credentials."}, status=401)
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {"id": row["id"], "iat": now, "exp": now + timedelta(days=1)},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return Response({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": _user_payload(row),
    })


def _verify_password(password, encoded):
    if encoded.startswith(("pbkdf2_", "argon2$", "bcrypt_sha256$")):
        from django.contrib.auth.hashers import check_password

        return check_password(password, encoded)
    try:
        return bcrypt.checkpw(password.encode("utf-8"), encoded.encode("utf-8"))
    except (ValueError, TypeError):
        return False


@api_view(["GET"])
def current_user(request):
    if request.auth is None:
        return Response({"success": False, "message": "Authentication required."}, status=401)
    try:
        row = fetch_one(
            "SELECT id, username, email, role FROM users WHERE id = %s LIMIT 1",
            [request.user["id"]],
        )
    except DatabaseUnavailable:
        return _database_error("GET /api/auth/me")
    if not row:
        return Response({"success": False, "message": "User not found."}, status=404)
    return Response({"success": True, "user": _user_payload(row)})


@api_view(["GET"])
def ollama_status(request):
    return Response(query_service.ollama_status())


@api_view(["POST"])
def ai_parse(request):
    if not isinstance(request.data, Mapping):
        return Response({"success": False, "message": "A JSON object is required."}, status=400)
    query = request.data.get("query")
    if not isinstance(query, str) or not query.strip():
        return Response({"success": False, "message": "query must be a non-empty string."}, status=400)
    facets = request.data.get("facets")
    return Response(query_service.ai_parse(query, facets))


@api_view(["POST"])
def natural_to_cypher(request):
    if not isinstance(request.data, Mapping):
        return Response({"success": False, "message": "A JSON object is required."}, status=400)
    query = request.data.get("query")
    if not isinstance(query, str) or not query.strip():
        return Response({"success": False, "message": "query must be a non-empty string."}, status=400)
    return Response(query_service.natural_to_cypher(query.strip()))


async def static_asset(request, asset_type, asset_path):
    relative = Path(asset_path)
    if relative.is_absolute() or any(part in {"..", "."} for part in relative.parts):
        return JsonResponse({"success": False, "message": "Invalid asset path."}, status=400)
    root = Path(__file__).resolve().parents[2]
    candidates = [
        (settings.DATA_DIRECTORY / relative).resolve(),
        (root / "backend" / "data" / relative).resolve(),
        (root / "frontend" / "public" / asset_type / relative).resolve(),
        (root / "frontend" / "public" / relative).resolve(),
    ]
    allowed_roots = [
        settings.DATA_DIRECTORY.resolve(),
        (root / "backend" / "data").resolve(),
        (root / "frontend" / "public").resolve(),
    ]
    asset = next(
        (
            candidate for candidate in candidates
            if candidate.is_file() and any(candidate.is_relative_to(base) for base in allowed_roots)
        ),
        None,
    )
    if asset is None:
        return JsonResponse({"success": False, "message": "Asset not found."}, status=404)
    content_type = mimetypes.guess_type(asset.name)[0] or "application/octet-stream"
    if request.method == "HEAD":
        response = StreamingHttpResponse(content_type=content_type)
        response["Content-Length"] = asset.stat().st_size
        return response

    async def chunks():
        with asset.open("rb") as file_handle:
            while True:
                chunk = await asyncio.to_thread(file_handle.read, 64 * 1024)
                if not chunk:
                    break
                yield chunk

    response = StreamingHttpResponse(chunks(), content_type=content_type)
    response["Content-Length"] = asset.stat().st_size
    return response


def frontend_redirect(request):
    frontend_url = settings.FRONTEND_ORIGINS[0] if getattr(settings, "FRONTEND_ORIGINS", None) else "http://localhost:5173"
    target = f"{frontend_url.rstrip('/')}{request.path}"
    query = request.META.get("QUERY_STRING")
    if query:
        target = f"{target}?{query}"
    return HttpResponseRedirect(target)
