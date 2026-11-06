import asyncio
import logging
import threading
from datetime import datetime, timezone

from django.conf import settings
from django.db import close_old_connections

from ..database import DatabaseUnavailable
from .vehicles import ACTIVE_FILE_NAME, random_batch

logger = logging.getLogger(__name__)
_lock = threading.Lock()
_paused = False
_offset = 0
_latest_status = None
_active_file = ACTIVE_FILE_NAME
_event_loop = None
_socket_server = None


def configure_socket_server(server):
    global _socket_server
    _socket_server = server


def set_event_loop(loop):
    global _event_loop
    _event_loop = loop


def is_paused():
    with _lock:
        return _paused


def latest_status():
    with _lock:
        return dict(_latest_status) if _latest_status else None


def _send(event, payload):
    if _socket_server is None or _event_loop is None or _event_loop.is_closed():
        logger.warning("Socket.IO event %s was not emitted because ASGI streaming is not running.", event)
        return False
    try:
        try:
            active_loop = asyncio.get_running_loop()
        except RuntimeError:
            active_loop = None
        if active_loop is _event_loop:
            active_loop.create_task(_socket_server.emit(event, payload))
            return True
        future = asyncio.run_coroutine_threadsafe(_socket_server.emit(event, payload), _event_loop)
        future.result(timeout=5)
        return True
    except (RuntimeError, TimeoutError) as error:
        logger.exception("Failed to emit Socket.IO event %s: %s", event, error)
        return False


def emit_event(event, payload):
    return _send(event, payload)


def emit_batch(records, *, file_name=None, total_pool=0, offset=0, manual=False, event_type="batch"):
    global _latest_status
    now = datetime.now(timezone.utc).isoformat()
    status = {
        "type": event_type,
        "fileName": file_name or _active_file,
        "batchCount": len(records),
        "timestamp": now,
        "overspeeding": sum(1 for row in records if row.get("isOverSpeed")),
    }
    if event_type == "dataset_switched":
        status["totalRows"] = total_pool
    else:
        status["totalPool"] = total_pool
        status["streamOffset"] = offset
        status["isPaused"] = is_paused()
    if manual:
        status["manualTrigger"] = True
    with _lock:
        _latest_status = status
    if records:
        _send("newVehicleBatch", records)
    _send("vehicleStreamStatus", status)
    return status


def get_batch(count=None, file_name=None):
    global _offset
    with _lock:
        offset = _offset
        active_file = file_name or _active_file
    close_old_connections()
    try:
        rows, total, next_offset = random_batch(count=count, file_name=active_file, offset=offset)
    finally:
        close_old_connections()
    with _lock:
        _offset = next_offset
    return rows, total, next_offset


def stream_control(action):
    global _paused
    normalized = str(action or "").strip().lower()
    if normalized in {"pause", "stop"}:
        with _lock:
            _paused = True
        return {"success": True, "isPaused": True, "message": "Vehicle stream paused."}
    if normalized in {"resume", "start"}:
        with _lock:
            _paused = False
        return {"success": True, "isPaused": False, "message": "Vehicle stream resumed."}
    if normalized in {"trigger", "next"}:
        records, total, offset = get_batch()
        status = emit_batch(records, total_pool=total, offset=offset, manual=True)
        return {"success": True, "count": len(records), "vehicles": records, "status": status}
    return None


async def run_stream():
    set_event_loop(asyncio.get_running_loop())
    try:
        while True:
            if not is_paused():
                try:
                    records, total, offset = await asyncio.to_thread(get_batch)
                    if records:
                        emit_batch(records, total_pool=total, offset=offset)
                except DatabaseUnavailable as error:
                    logger.warning("Vehicle stream database query failed; retrying: %s", error)
                except Exception:
                    logger.exception("Vehicle stream batch failed; the stream will retry.")
            await asyncio.sleep(settings.STREAM_INTERVAL)
    except asyncio.CancelledError:
        raise
    finally:
        set_event_loop(None)
