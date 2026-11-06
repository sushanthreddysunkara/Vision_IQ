import math
import random
import re
from datetime import datetime, timezone
from pathlib import Path

from django.db import transaction

from ..database import fetch_all, fetch_one

VEHICLE_LOCATIONS = (
    "NH-44 - Shamshabad Tollway (KM 18)",
    "NH-44 - Shadnagar Interchange (KM 52)",
    "NH-44 - Hyderabad Ring Corridor",
    "NH-44 - Medchal North Gateway (KM 36)",
    "NH-44 - Jadcherla Express Point (KM 84)",
)
CAMERA_IDS = (
    "CAM-NH44-01-SHAMSHABAD",
    "CAM-NH44-02-SHADNAGAR",
    "CAM-NH44-03-RINGROAD",
    "CAM-NH44-04-MEDCHAL",
    "CAM-NH44-05-JADCHERLA",
    "CAM-NH44-06-TOLLPLAZA",
)
ACTIVE_FILE_NAME = "All Database Records (7,044 Live Archive)"


def canonical_vehicle_type(value):
    text = str(value or "Car").strip()
    lower = text.lower()
    for needles, result in (
        (("truck", "lorry", "trailer"), "Truck"),
        (("bus",), "Bus"),
        (("auto", "rickshaw"), "Auto"),
        (("bike", "motorcycle", "scooter", "two wheeler"), "Bike"),
        (("van",), "Van"),
        (("suv", "jeep"), "SUV"),
        (("tractor",), "Tractor"),
        (("pedestrian",), "Pedestrian"),
        (("train",), "Train"),
        (("car", "sedan", "hatchback"), "Car"),
    ):
        if any(needle in lower for needle in needles):
            return result
    return text.title() if text else "Car"


def _number(value, fallback):
    try:
        number = float(value)
        return number if math.isfinite(number) else fallback
    except (TypeError, ValueError):
        return fallback


def _stable_index(row, modulus):
    raw_id = str(row.get("id") or row.get("csv_record_id") or "0")
    digits = re.sub(r"\D", "", raw_id)
    return int(digits or "0") % modulus


def _location(row, latitude, longitude):
    if latitude and longitude:
        if latitude < 17.25:
            return "NH-44 - Shadnagar Interchange (KM 52)"
        if latitude < 17.40:
            return "NH-44 - Shamshabad Tollway (KM 18)"
        if latitude < 17.50:
            return "NH-44 - Hyderabad Ring Corridor"
        return "NH-44 - Medchal North Gateway (KM 36)"
    return VEHICLE_LOCATIONS[_stable_index(row, len(VEHICLE_LOCATIONS))]


def to_client_record(row):
    plate = row.get("vehicle_number_plate")
    confidence = _number(row.get("plate_confidence"), 0.95) or 0.95
    speed = _number(row.get("speed"), 0) or 0
    speed_limit = _number(row.get("speed_limit"), 60) or 60
    latitude = _number(row.get("latitude"), None) if row.get("latitude") else None
    longitude = _number(row.get("longitude"), None) if row.get("longitude") else None
    record_id = row.get("csv_record_id")
    timestamp = row.get("timestamp_ist")
    vehicle_type = canonical_vehicle_type(row.get("vehicle_type"))
    over_speed = row.get("over_speed")
    image_path = row.get("vehicle_image_path") or row.get("vehicle_image")
    return {
        "id": row.get("id"),
        "csvRecordId": record_id,
        "observationId": record_id,
        "timestampIst": timestamp,
        "timestamp": timestamp,
        "vehicleType": vehicle_type,
        "type": vehicle_type,
        "vehicleNumberPlate": plate,
        "numberPlate": plate,
        "plateConfidence": confidence,
        "confidence": confidence,
        "vehicleImage": row.get("vehicle_image"),
        "speed": speed,
        "speedLimit": speed_limit,
        "overSpeed": over_speed,
        "isOverSpeed": str(over_speed).lower() == "yes",
        "latitude": latitude,
        "longitude": longitude,
        "location": _location(row, latitude, longitude),
        "camera": CAMERA_IDS[_stable_index(row, len(CAMERA_IDS))],
        "videoClipPath": row.get("video_clip_path"),
        "vehicleImagePath": image_path,
        "plateImagePath": row.get("plate_image_path"),
        "events": row.get("events"),
        "sourceFile": row.get("source_file"),
    }


def _file_filter(file_name):
    normalized = str(file_name or "").strip().lower()
    if not normalized or normalized in {"all", "all files"} or normalized.startswith("all database records"):
        return "", []
    return " AND (source_file = %s OR source_file LIKE %s)", [file_name, f"%{file_name}%"]


def list_vehicles(limit=20, file_name=None):
    suffix, params = _file_filter(file_name)
    rows = fetch_all(
        f"SELECT * FROM vehicle_events WHERE 1=1{suffix} ORDER BY id DESC LIMIT %s",
        [*params, limit],
    )
    return [to_client_record(row) for row in rows]


def search_vehicles(query, limit=50):
    term = str(query or "").strip()
    if not term:
        return []
    wildcard = f"%{term}%"
    rows = fetch_all(
        """
        SELECT * FROM vehicle_events
        WHERE vehicle_number_plate LIKE %s
           OR csv_record_id LIKE %s
           OR vehicle_type LIKE %s
           OR events LIKE %s
        ORDER BY CASE
            WHEN UPPER(REPLACE(vehicle_number_plate, ' ', '')) = UPPER(REPLACE(%s, ' ', '')) THEN 0
            WHEN UPPER(vehicle_number_plate) LIKE UPPER(%s) THEN 1
            ELSE 2
        END, id DESC
        LIMIT %s
        """,
        [wildcard, wildcard, wildcard, wildcard, term, wildcard, limit],
    )
    return [to_client_record(row) for row in rows]


def random_batch(count=None, file_name=None, offset=0):
    suffix, params = _file_filter(file_name)
    pool = fetch_one(f"SELECT COUNT(*) AS total FROM vehicle_events WHERE 1=1{suffix}", params) or {}
    total = int(pool.get("total") or 0)
    batch_size = max(1, min(int(count or random.randint(1, 20)), 50))
    if total == 0:
        return [], 0, 0
    start = max(0, int(offset)) % total
    if start + batch_size > total:
        rows = fetch_all(
            f"SELECT * FROM vehicle_events WHERE 1=1{suffix} ORDER BY id ASC LIMIT %s OFFSET %s",
            [*params, batch_size, start],
        )
        remaining = batch_size - len(rows)
        if remaining:
            rows.extend(fetch_all(
                f"SELECT * FROM vehicle_events WHERE 1=1{suffix} ORDER BY id ASC LIMIT %s",
                [*params, remaining],
            ))
    else:
        rows = fetch_all(
            f"SELECT * FROM vehicle_events WHERE 1=1{suffix} ORDER BY id ASC LIMIT %s OFFSET %s",
            [*params, batch_size, start],
        )
    records = [to_client_record(row) for row in rows]
    at = datetime.now(timezone.utc).isoformat()
    for index, record in enumerate(records):
        record["_streamSeq"] = start + index + 1
        record["_streamBatchTime"] = at
    return records, total, (start + len(records)) % total


def stats(file_name=None):
    suffix, params = _file_filter(file_name)
    aggregate = fetch_one(
        f"""
        SELECT COUNT(*) AS totalRecords,
          AVG(speed) AS averageSpeed,
          SUM(CASE WHEN LOWER(over_speed) = 'yes' THEN 1 ELSE 0 END) AS overspeedTotal
        FROM vehicle_events WHERE 1=1{suffix}
        """,
        params,
    ) or {}
    types = fetch_all(
        f"SELECT vehicle_type, COUNT(*) AS count FROM vehicle_events WHERE 1=1{suffix} GROUP BY vehicle_type",
        params,
    )
    average = round(_number(aggregate.get("averageSpeed"), 0) or 68)
    total = int(aggregate.get("totalRecords") or 0)
    overspeed = int(aggregate.get("overspeedTotal") or 0)
    return {
        "totalPool": total,
        "totalRecords": total,
        "averageSpeed": average,
        "avgSpeed": average,
        "overspeedTotal": overspeed,
        "overspeedRate": f"{round(overspeed / total * 100) if total else 0}%",
        "vehicleTypes": {row["vehicle_type"]: row["count"] for row in types},
        "fileName": file_name or ACTIVE_FILE_NAME,
        "cameras": 6,
        "activeCorridor": "NH-44 Hyderabad Express Corridor",
    }


def incidents(limit=50):
    rows = fetch_all(
        """
        SELECT * FROM vehicle_events
        WHERE LOWER(COALESCE(over_speed, '')) = 'yes'
           OR LOWER(COALESCE(events, '')) REGEXP 'violation|speed|collision'
        ORDER BY id DESC LIMIT %s
        """,
        [limit],
    )
    result = []
    for raw in rows:
        row = to_client_record(raw)
        is_overspeed = row["isOverSpeed"]
        detection_type = "Collision" if is_overspeed else "Incident"
        result.append({
            "vehicleNumber": row["vehicleNumberPlate"],
            "vehicleType": row["vehicleType"],
            "incidentType": "Collision" if is_overspeed else row["events"] or "Accident",
            "incidentTime": row["timestampIst"],
            "collisionCamera": row["camera"],
            "status": "Tracking" if is_overspeed else "Detected",
            "observations": [{
                "cameraId": row["camera"],
                "timestamp": row["timestampIst"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "location": row["location"],
                "detectionType": detection_type,
                "confidence": row["confidence"],
                "imageUrl": row["vehicleImagePath"],
                "speed": row["speed"],
                "speedLimit": row["speedLimit"],
            }],
        })
    return result


def normalize_upload_row(row, file_name, row_index):
    stem = Path(file_name).stem or "UPLOAD"
    record_id = row.get("id") or row.get("csvRecordId") or row.get("observationId")
    if not record_id:
        record_id = f"{stem}-{row_index + 1:06d}"
    timestamp = row.get("timestampIst") or row.get("timestamp") or row.get("time")
    if not timestamp:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    vehicle_type = canonical_vehicle_type(row.get("vehicleType") or row.get("type") or "car")
    plate = row.get("vehicleNumberPlate") or row.get("numberPlate") or row.get("plate")
    confidence = min(1.0, max(0.0, _number(row.get("plateConfidence", row.get("confidence")), 0.95)))
    speed = _number(row.get("speed"), random.randint(45, 84))
    speed_limit = _number(row.get("speedLimit"), 60)
    overspeed = bool(row.get("isOverSpeed")) or str(row.get("overSpeed") or "").lower() == "yes" or speed > speed_limit
    latitude = _number(row.get("latitude"), 17.385044)
    longitude = _number(row.get("longitude"), 78.486671)
    def safe_path(*keys):
        value = next((row.get(key) for key in keys if row.get(key)), None)
        value = str(value) if value and not str(value).startswith("data:") else None
        return value[:1000] if value else None

    return (
        str(record_id)[:120],
        str(timestamp)[:80],
        vehicle_type,
        str(plate)[:80] if plate else None,
        confidence,
        None,
        speed,
        speed_limit,
        "Yes" if overspeed else "No",
        latitude,
        longitude,
        safe_path("videoClipPath"),
        safe_path("vehicleImagePath", "vehicleImage"),
        safe_path("plateImagePath"),
        str(row.get("events") or ("Overspeeding" if overspeed else "Standard detection"))[:255],
        str(file_name)[:255],
    )


def upload_vehicles(file_name, rows):
    values = [normalize_upload_row(row, file_name, index) for index, row in enumerate(rows)]
    sql = """
        INSERT INTO vehicle_events (
          csv_record_id, timestamp_ist, vehicle_type, vehicle_number_plate,
          plate_confidence, vehicle_image, speed, speed_limit, over_speed,
          latitude, longitude, video_clip_path, vehicle_image_path,
          plate_image_path, events, source_file
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          speed = VALUES(speed), speed_limit = VALUES(speed_limit),
          over_speed = VALUES(over_speed), timestamp_ist = VALUES(timestamp_ist),
          vehicle_type = VALUES(vehicle_type), vehicle_number_plate = VALUES(vehicle_number_plate),
          plate_confidence = VALUES(plate_confidence), events = VALUES(events),
          latitude = VALUES(latitude), longitude = VALUES(longitude)
    """
    with transaction.atomic():
        with transaction.get_connection().cursor() as cursor:
            for start in range(0, len(values), 250):
                cursor.executemany(sql, values[start : start + 250])
        total = fetch_one("SELECT COUNT(*) AS total FROM vehicle_events") or {}
    return {
        "success": True,
        "totalStored": int(total.get("total") or 0),
        "chunkStored": len(values),
        "fileName": ACTIVE_FILE_NAME,
        "initialBatch": [],
    }
