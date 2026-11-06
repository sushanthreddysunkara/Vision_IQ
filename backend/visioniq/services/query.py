import json
import logging
import re
import urllib.error
import urllib.request

from django.conf import settings

from .vehicles import canonical_vehicle_type

logger = logging.getLogger(__name__)
PREFERRED_MODELS = (
    "qwen2.5:1.5b",
    "qwen2.5:0.5b",
    "llama3.2:1b",
    "llama3.2:3b",
    "qwen2.5:3b",
    "qwen3:8b",
)


def _ollama_json(path, payload=None, timeout=6):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{settings.OLLAMA_HOST}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="GET" if payload is None else "POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def ollama_status():
    try:
        result = _ollama_json("/api/tags", timeout=3)
        models = [item.get("name", "") for item in result.get("models", [])]
        selected = settings.OLLAMA_MODEL if settings.OLLAMA_MODEL in models else next(
            (model for model in PREFERRED_MODELS if model in models),
            models[0] if models else "qwen2.5:1.5b",
        )
        return {
            "connected": True,
            "host": settings.OLLAMA_HOST,
            "model": selected,
            "models": models,
            "installedModels": models,
            "message": "Ollama connected.",
        }
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
        logger.info("Ollama status check failed: %s", error)
        return {
            "connected": False,
            "host": settings.OLLAMA_HOST,
            "model": settings.OLLAMA_MODEL or "qwen2.5:1.5b",
            "models": [],
            "installedModels": [],
            "message": "Ollama is unavailable; rule-based query parsing remains available.",
        }


def _select_model(status):
    if settings.OLLAMA_MODEL and settings.OLLAMA_MODEL in status.get("models", []):
        return settings.OLLAMA_MODEL
    return status.get("model") or settings.OLLAMA_MODEL or "qwen2.5:1.5b"


def _speed_range(query):
    text = query.lower()
    match = re.search(r"\b(?:between|from)\s+(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)", text)
    if match:
        return float(match.group(1)), float(match.group(2))
    min_match = re.search(r"(?:above|over|greater than|more than|at least|minimum|min)\s*(\d+(?:\.\d+)?)", text)
    max_match = re.search(r"(?:below|under|less than|at most|maximum|max)\s*(\d+(?:\.\d+)?)", text)
    return (
        float(min_match.group(1)) if min_match else None,
        float(max_match.group(1)) if max_match else None,
    )


def rule_parse(query, facets=None):
    text = query.lower()
    facets = facets if isinstance(facets, dict) else {}
    overspeed_words = (
        "overspeed", "speeding", "violation", "violator", "fast", "over speed",
        "rash", "reckless", "dangerously", "challan", "over limit", "flying",
    )
    overspeed = any(word in text for word in overspeed_words)
    min_speed, max_speed = _speed_range(query)
    types = (
        "Car", "Bike", "Bus", "Truck", "Auto", "Tractor", "Jeep",
        "Pedestrian", "Van", "Ambulance", "Train",
    )
    selected_types = [
        value for value in types
        if re.search(rf"\b{re.escape(value.lower())}(?:s|es)?\b", text)
    ]
    if "heavy" in text:
        selected_types = list(dict.fromkeys((*selected_types, "Truck", "Bus")))
    if "commercial" in text:
        selected_types = list(dict.fromkeys((*selected_types, "Truck", "Bus", "Auto")))

    filters = {
        "overspeedOnly": overspeed,
        "minSpeed": min_speed,
        "maxSpeed": max_speed,
        "vehicleType": selected_types[0] if len(selected_types) == 1 else selected_types or None,
        "vehicleTypes": selected_types,
        "signal": next((x for x in ("Red", "Green", "Yellow") if x.lower() in text), None),
        "weather": next((x for x in ("Rainy", "Foggy", "Clear") if x.lower() in text), None),
        "camera": None,
        "location": None,
        "plate": None,
        "sortBy": (
            "speed-desc" if any(word in text for word in ("fastest", "highest speed", "speed descending"))
            else "speed-asc" if any(word in text for word in ("slowest", "lowest speed", "speed ascending"))
            else "confidence-desc" if "highest confidence" in text
            else "confidence-asc" if "lowest confidence" in text
            else "timestamp-asc" if any(word in text for word in ("oldest", "earliest"))
            else "timestamp-desc"
        ),
    }
    cameras = facets.get("cameras") if isinstance(facets.get("cameras"), list) else []
    locations = facets.get("locations") if isinstance(facets.get("locations"), list) else []
    camera = next((item for item in cameras if str(item).lower() in text), None)
    camera_match = re.search(r"\b(?:cam|camera)\s*[-#]?\s*(\d+)\b", query, re.I)
    filters["camera"] = camera or (camera_match.group(0) if camera_match else None)
    filters["location"] = next((item for item in locations if str(item).lower() in text), None)
    if filters["location"] is None:
        for word in ("Shadnagar", "Shamshabad", "Hyderabad", "Medchal", "Jadcherla"):
            if word.lower() in text:
                filters["location"] = word
                break
    plate_match = re.search(r"\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{1,4}\b", query.upper())
    if plate_match and any(character.isdigit() for character in plate_match.group(0)):
        filters["plate"] = re.sub(r"[\s-]", "", plate_match.group(0))
    explanation_parts = []
    if overspeed:
        explanation_parts.append("overspeed violations")
    if selected_types:
        explanation_parts.append("vehicle types: " + ", ".join(selected_types))
    if min_speed is not None or max_speed is not None:
        explanation_parts.append("speed range")
    explanation = (
        "Showing results for " + ", ".join(explanation_parts) + "."
        if explanation_parts else f"Parsed traffic query: {query.strip()}."
    )
    return filters, explanation


def ai_parse(query, facets=None):
    rule_filters, explanation = rule_parse(query, facets)
    status = ollama_status()
    if not status["connected"]:
        return {
            "success": True,
            "aiSource": "rule-fallback",
            "filters": rule_filters,
            "explanation": explanation,
            "rawQuery": query,
        }
    prompt = (
        "Parse this traffic camera query into one JSON object with keys "
        "overspeedOnly, minSpeed, maxSpeed, vehicleType, vehicleTypes, signal, "
        "weather, camera, location, plate, sortBy, explanation. Use null for "
        "unknown values. Do not add prose. Query: " + query
    )
    try:
        generated = _ollama_json(
            "/api/generate",
            {"model": _select_model(status), "prompt": prompt, "format": "json",
             "stream": False, "options": {"temperature": 0.1, "num_predict": 120}},
            timeout=15,
        )
        text = re.sub(r"<think>.*?</think>", "", generated.get("response", ""), flags=re.S).strip()
        text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.I | re.M).strip()
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            raise ValueError("Ollama returned a non-object query parse.")
        filters = {**rule_filters, **parsed}
        types = filters.get("vehicleTypes")
        if not isinstance(types, list):
            types = [filters.get("vehicleType")] if filters.get("vehicleType") else []
        filters["vehicleTypes"] = list(dict.fromkeys(canonical_vehicle_type(value) for value in types))
        if isinstance(filters.get("vehicleType"), str):
            filters["vehicleType"] = canonical_vehicle_type(filters["vehicleType"])
        if _number_or_none(filters.get("minSpeed")) is not None and float(filters["minSpeed"]) > 200:
            filters["minSpeed"] = rule_filters.get("minSpeed")
        if _number_or_none(filters.get("maxSpeed")) is not None and float(filters["maxSpeed"]) > 200:
            filters["maxSpeed"] = rule_filters.get("maxSpeed")
        if not filters["vehicleTypes"] and isinstance(filters.get("vehicleType"), str):
            filters["vehicleTypes"] = [filters["vehicleType"]]
        return {
            "success": True,
            "aiSource": "ollama",
            "filters": filters,
            "explanation": filters.get("explanation") or explanation,
            "rawQuery": query,
        }
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, KeyError) as error:
        logger.warning("Ollama query parsing failed; using rule parser: %s", error)
        return {
            "success": True,
            "aiSource": "rule-fallback",
            "filters": rule_filters,
            "explanation": explanation,
            "rawQuery": query,
            "fallbackReason": "Ollama parsing failed; deterministic parsing was used.",
        }


def _number_or_none(value):
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def rule_to_cypher(query):
    text = query.lower()
    if "camera" in text and any(word in text for word in ("location", "corridor", "place")):
        return "MATCH (c:Camera)-[:MONITORS]->(l:Location) RETURN c, l LIMIT 100"
    if "camera" in text:
        return "MATCH (c:Camera) RETURN c LIMIT 100"
    if any(word in text for word in ("location", "corridor", "place")):
        return "MATCH (l:Location) RETURN l LIMIT 100"
    if any(word in text for word in ("overspeed", "speeding", "violation")):
        return "MATCH (o:Observation) WHERE o.overSpeed = true RETURN o LIMIT 100"
    conditions = []
    min_speed, max_speed = _speed_range(query)
    if min_speed is not None:
        conditions.append(f"o.speed >= {min_speed:g}")
    if max_speed is not None:
        conditions.append(f"o.speed <= {max_speed:g}")
    type_match = next((kind for kind in ("Car", "Bike", "Bus", "Truck", "Van") if kind.lower() in text), None)
    if type_match:
        conditions.append(f"o.vehicleType = '{type_match}'")
    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    if re.search(r"\ball\b", text):
        return "MATCH (n) RETURN n LIMIT 100"
    return f"MATCH (o:Observation){where} RETURN o LIMIT 100"


def natural_to_cypher(query):
    if re.match(r"^\s*(MATCH|CREATE|MERGE|RETURN|CALL|SHOW|EXPLAIN|PROFILE|OPTIONAL\s+MATCH)\b", query, re.I):
        return {
            "success": True, "cypher": query, "source": "direct-cypher",
            "explanation": "Existing Cypher query passed through unchanged.",
        }
    fallback = rule_to_cypher(query)
    status = ollama_status()
    if not status["connected"]:
        return {
            "success": True, "cypher": fallback, "source": "rule-fallback",
            "explanation": "Generated with deterministic rules; Cypher is not executed by this service.",
            "rawQuery": query,
        }
    prompt = "Convert the request to a Cypher query. Return only Cypher, no markdown: " + query
    try:
        generated = _ollama_json(
            "/api/generate",
            {"model": _select_model(status), "prompt": prompt, "stream": False,
             "options": {"temperature": 0.1, "num_predict": 120}},
            timeout=6,
        )
        cypher = generated.get("response", "").strip().strip("`")
        if not re.match(r"^(MATCH|OPTIONAL|RETURN|WITH)\b", cypher, re.I):
            raise ValueError("Ollama output was not a Cypher query.")
        return {
            "success": True, "cypher": cypher, "source": "ollama",
            "explanation": "Generated by Ollama; Cypher is not executed by this service.",
            "rawQuery": query,
        }
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, KeyError) as error:
        logger.warning("Ollama Cypher generation failed; using rule parser: %s", error)
        return {
            "success": True, "cypher": fallback, "source": "rule-fallback",
            "explanation": "Generated with deterministic rules; Cypher is not executed by this service.",
            "rawQuery": query,
        }
