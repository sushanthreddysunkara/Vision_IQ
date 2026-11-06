import asyncio
import os

import socketio
from django.conf import settings
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django_application = get_asgi_application()
socket_server = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.FRONTEND_ORIGINS,
)
socket_application = socketio.ASGIApp(
    socket_server,
    other_asgi_app=django_application,
    socketio_path="socket.io",
)

from visioniq.services.stream import configure_socket_server, latest_status, run_stream

configure_socket_server(socket_server)


@socket_server.event
async def connect(sid, environ, auth=None):
    status = latest_status()
    if status:
        await socket_server.emit("vehicleStreamStatus", status, to=sid)


class Application:
    def __init__(self, http_application):
        self.http_application = http_application
        self.stream_task = None

    async def __call__(self, scope, receive, send):
        if scope["type"] != "lifespan":
            await self.http_application(scope, receive, send)
            return
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                self.stream_task = asyncio.create_task(run_stream())
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                if self.stream_task:
                    self.stream_task.cancel()
                    try:
                        await self.stream_task
                    except asyncio.CancelledError:
                        pass
                await send({"type": "lifespan.shutdown.complete"})
                return


application = Application(socket_application)
