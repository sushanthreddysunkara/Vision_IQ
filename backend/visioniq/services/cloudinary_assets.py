import hashlib
import io
from datetime import datetime

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from visioniq.models import CloudinaryAsset


class CloudinaryNotConfigured(RuntimeError):
    pass


def _cloudinary():
    if not settings.CLOUDINARY_CONFIGURED:
        raise CloudinaryNotConfigured("Cloudinary credentials are not configured.")

    import cloudinary
    import cloudinary.api
    import cloudinary.uploader

    return cloudinary.api, cloudinary.uploader


def asset_defaults(resource):
    public_id = resource.get("public_id")
    secure_url = resource.get("secure_url")
    if not public_id or not secure_url:
        raise ValueError("Cloudinary returned an image without its public ID or secure URL.")

    asset_folder = resource.get("asset_folder") or resource.get("folder") or ""
    if not asset_folder and "/" in public_id:
        asset_folder = public_id.rsplit("/", 1)[0]
    created_at = resource.get("created_at")
    if isinstance(created_at, str):
        created_at = parse_datetime(created_at)
    if not isinstance(created_at, datetime):
        created_at = timezone.now()
    elif timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, timezone.get_current_timezone())

    return {
        "secure_url": secure_url,
        "asset_folder": asset_folder.strip("/"),
        "resource_type": resource.get("resource_type") or "image",
        "format": resource.get("format") or "",
        "width": resource.get("width"),
        "height": resource.get("height"),
        "file_size": resource.get("bytes"),
        "created_at": created_at,
    }


def cloudinary_resource_pages(page_size=500):
    cloudinary_api, _ = _cloudinary()
    cursor = None
    seen_cursors = set()

    while True:
        options = {
            "resource_type": "image",
            "type": "upload",
            "max_results": page_size,
        }
        if cursor:
            options["next_cursor"] = cursor
        response = cloudinary_api.resources(**options)
        yield response.get("resources", [])

        next_cursor = response.get("next_cursor")
        if not next_cursor:
            break
        if next_cursor in seen_cursors:
            raise RuntimeError("Cloudinary returned a repeated pagination cursor.")
        seen_cursors.add(next_cursor)
        cursor = next_cursor


def sync_cloudinary_assets(page_size=500):
    page_count = 0
    created_count = 0
    updated_count = 0

    for resources in cloudinary_resource_pages(page_size):
        with transaction.atomic():
            for resource in resources:
                _, created = CloudinaryAsset.objects.update_or_create(
                    public_id=resource["public_id"],
                    defaults=asset_defaults(resource),
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        page_count += 1

    return {
        "pages": page_count,
        "created": created_count,
        "updated": updated_count,
        "total": created_count + updated_count,
    }


def upload_image(content, category="", source_id=""):
    cloudinary_api, uploader = _cloudinary()
    digest = hashlib.sha256(content).hexdigest()
    existing = CloudinaryAsset.objects.filter(content_sha256=digest).first()
    if existing is not None:
        return existing, False

    public_id = f"visioniq/evidence/{digest}"
    try:
        response = uploader.upload(
            io.BytesIO(content),
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            unique_filename=False,
            use_filename=False,
        )
    except Exception:
        # A previous upload may have succeeded before its database write failed.
        response = cloudinary_api.resource(public_id, resource_type="image", type="upload")

    defaults = asset_defaults(response)
    defaults.update(
        category=category,
        source_id=source_id,
        content_sha256=digest,
    )
    asset, created = CloudinaryAsset.objects.update_or_create(
        public_id=response["public_id"],
        defaults=defaults,
    )
    return asset, created


def serialize_asset(asset):
    return {
        "id": asset.id,
        "public_id": asset.public_id,
        "secure_url": asset.secure_url,
        "asset_folder": asset.asset_folder,
        "resource_type": asset.resource_type,
        "format": asset.format,
        "width": asset.width,
        "height": asset.height,
        "file_size": asset.file_size,
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
        "category": asset.category,
        "source_id": asset.source_id,
    }
