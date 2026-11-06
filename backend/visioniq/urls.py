from django.urls import path, re_path

from . import views

urlpatterns = [
    path("api/health", views.health, name="health"),
    path("api/live-feed/analyze-video", views.analyze_video, name="live-feed-analyze-video"),
    path("api/live-feed/analyze-frame", views.analyze_video_frame, name="live-feed-analyze-frame"),
    path("api/live-feed/analyze-image", views.analyze_live_image, name="live-feed-analyze-image"),
    path("api/live-feed/models", views.live_model_status, name="live-feed-model-status"),
    path("api/vehicles/upload", views.upload_vehicles, name="vehicle-upload"),
    path("api/vehicles", views.list_vehicles, name="vehicle-list"),
    path("api/vehicles/search", views.search_vehicles, name="vehicle-search"),
    path("api/vehicles/random-batch", views.random_batch, name="vehicle-random-batch"),
    path("api/vehicles/stream-control", views.stream_control, name="vehicle-stream-control"),
    path("api/vehicles/stats", views.vehicle_stats, name="vehicle-stats"),
    path("api/vehicles/incidents", views.vehicle_incidents, name="vehicle-incidents"),
    path("api/corridors", views.corridors, name="corridors"),
    path("api/cameras", views.cameras, name="cameras"),
    path("api/cloudinary/images/", views.cloudinary_images, name="cloudinary-images"),
    path("api/cloudinary/images/upload/", views.upload_cloudinary_image, name="cloudinary-image-upload"),
    path("api/cloudinary/images/<path:public_id>/", views.cloudinary_image_detail, name="cloudinary-image-detail"),
    path("api/auth/login", views.login, name="login"),
    path("api/auth/me", views.current_user, name="current-user"),
    path("api/query/ollama-status", views.ollama_status, name="ollama-status"),
    path("api/query/ai-parse", views.ai_parse, name="ai-parse"),
    path("api/query/natural-to-cypher", views.natural_to_cypher, name="natural-to-cypher"),
    re_path(r"^evidence-tracking/?$", views.frontend_redirect, name="evidence-tracking-redirect"),
    re_path(r"^(?P<asset_type>evidence|images)/(?P<asset_path>.+)$", views.static_asset, name="static-asset"),
]
