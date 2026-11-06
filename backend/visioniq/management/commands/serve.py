import os

import uvicorn
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run VisionIQ's Django ASGI application with Socket.IO support."

    def add_arguments(self, parser):
        parser.add_argument("--host", default=os.getenv("HOST", "127.0.0.1"))
        parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8000")))

    def handle(self, *args, **options):
        uvicorn.run(
            "config.asgi:application",
            host=options["host"],
            port=options["port"],
            log_level="info",
        )
