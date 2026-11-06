from django.core.management.base import BaseCommand, CommandError

from visioniq.services.cloudinary_assets import sync_cloudinary_assets


class Command(BaseCommand):
    help = "Synchronize Cloudinary image metadata into the configured MySQL database."

    def add_arguments(self, parser):
        parser.add_argument("--page-size", type=int, default=500)

    def handle(self, *args, **options):
        page_size = options["page_size"]
        if not 1 <= page_size <= 500:
            raise CommandError("--page-size must be between 1 and 500.")
        try:
            result = sync_cloudinary_assets(page_size=page_size)
        except Exception as error:
            raise CommandError(
                f"Cloudinary image synchronization failed ({type(error).__name__})."
            ) from None
        self.stdout.write(
            self.style.SUCCESS(
                f"Synchronized {result['total']} images across {result['pages']} page(s): "
                f"{result['created']} created, {result['updated']} updated."
            )
        )
