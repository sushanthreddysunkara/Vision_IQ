from django.db import models
from django.utils import timezone


class NetworkCorridors(models.Model):
    corridor_id = models.CharField(max_length=64, primary_key=True)
    corridor_name = models.CharField(max_length=180)
    route = models.CharField(max_length=180, blank=True, null=True)
    length_km = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=40)
    corridor_order = models.IntegerField(blank=True, null=True)
    highway = models.CharField(max_length=40, blank=True, null=True)
    start_location = models.CharField(max_length=180, blank=True, null=True)
    end_location = models.CharField(max_length=180, blank=True, null=True)
    key_locations = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_corridors"


class NetworkZones(models.Model):
    zone_id = models.CharField(max_length=64, primary_key=True)
    corridor = models.ForeignKey(NetworkCorridors, models.DO_NOTHING, db_column="corridor_id")
    zone_name = models.CharField(max_length=180)
    km_marker = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_zones"


class NetworkRoadSegments(models.Model):
    road_segment_id = models.CharField(max_length=64, primary_key=True)
    zone = models.ForeignKey(NetworkZones, models.DO_NOTHING, db_column="zone_id")
    segment_name = models.CharField(max_length=180)
    km_start = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    km_end = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    lanes = models.PositiveIntegerField(blank=True, null=True)
    speed_limit_kmh = models.PositiveSmallIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_road_segments"


class NetworkCameras(models.Model):
    camera_id = models.CharField(max_length=80, primary_key=True)
    zone = models.ForeignKey(NetworkZones, models.DO_NOTHING, db_column="zone_id")
    camera_name = models.CharField(max_length=180)
    latitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    status = models.CharField(max_length=40)

    class Meta:
        managed = False
        db_table = "network_cameras"


class NetworkCorridorKpis(models.Model):
    corridor = models.OneToOneField(NetworkCorridors, models.DO_NOTHING, db_column="corridor_id", primary_key=True)
    start_location = models.CharField(max_length=180, blank=True, null=True)
    end_location = models.CharField(max_length=180, blank=True, null=True)
    corridor_name = models.CharField(max_length=180)
    corridor_order = models.IntegerField()
    route = models.CharField(max_length=180, blank=True, null=True)
    vehicle_detections = models.PositiveIntegerField()
    unique_vehicles = models.PositiveIntegerField()
    overspeed_events = models.PositiveIntegerField()
    incident_count = models.PositiveIntegerField()
    high_critical_incidents = models.PositiveIntegerField()
    overspeed_rate_pct = models.DecimalField(max_digits=7, decimal_places=3, blank=True, null=True)
    incident_rate_per_1000_vehicles = models.DecimalField(max_digits=10, decimal_places=3, blank=True, null=True)
    demo_risk_band = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_corridor_kpis"


class NetworkIncidents(models.Model):
    incident_id = models.CharField(max_length=64, primary_key=True)
    incident_type = models.CharField(max_length=160)
    occurred_at_ist = models.DateTimeField(db_index=True)
    corridor = models.ForeignKey(NetworkCorridors, models.DO_NOTHING, db_column="corridor_id")
    zone = models.ForeignKey(NetworkZones, models.DO_NOTHING, db_column="zone_id")
    road_segment = models.ForeignKey(NetworkRoadSegments, models.DO_NOTHING, db_column="road_segment_id")
    camera = models.ForeignKey(NetworkCameras, models.DO_NOTHING, db_column="camera_id")
    latitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    severity = models.CharField(max_length=24, db_index=True)
    status = models.CharField(max_length=40)
    lanes_blocked = models.PositiveIntegerField()
    description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_incidents"


class NetworkRiskProfiles(models.Model):
    risk_profile_id = models.CharField(max_length=64, primary_key=True)
    incident = models.OneToOneField(NetworkIncidents, models.DO_NOTHING, db_column="incident_id")
    road_segment = models.ForeignKey(NetworkRoadSegments, models.DO_NOTHING, db_column="road_segment_id")
    risk_score_0_100 = models.PositiveIntegerField()
    risk_category = models.CharField(max_length=24)
    contributing_factors = models.TextField(blank=True, null=True)
    recommended_action = models.TextField(blank=True, null=True)
    assessed_at_ist = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_risk_profiles"


class NetworkImpactAnalysis(models.Model):
    impact_id = models.CharField(max_length=64, primary_key=True)
    incident = models.OneToOneField(NetworkIncidents, models.DO_NOTHING, db_column="incident_id")
    road_segment = models.ForeignKey(NetworkRoadSegments, models.DO_NOTHING, db_column="road_segment_id")
    estimated_delay_min = models.PositiveSmallIntegerField(blank=True, null=True)
    max_queue_km = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    traffic_flow_reduction_pct = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    affected_lanes = models.PositiveIntegerField(blank=True, null=True)
    estimated_clearance_min = models.PositiveSmallIntegerField(blank=True, null=True)
    diversion_recommended = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_impact_analysis"


class NetworkIncidentVehicles(models.Model):
    pk = models.CompositePrimaryKey("incident_id", "vehicle_id")
    incident = models.ForeignKey(NetworkIncidents, models.DO_NOTHING, db_column="incident_id")
    vehicle = models.ForeignKey("NetworkVehicles", models.DO_NOTHING, db_column="vehicle_id")
    plate_number = models.CharField(max_length=80, db_index=True)
    vehicle_type = models.CharField(max_length=80, blank=True, null=True)
    involvement_role = models.CharField(max_length=100, blank=True, null=True)
    plate_confidence = models.DecimalField(max_digits=6, decimal_places=4, blank=True, null=True)
    detected_at_ist = models.DateTimeField(blank=True, null=True)
    evidence_reference = models.CharField(max_length=180, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_incident_vehicles"


class NetworkVehicles(models.Model):
    vehicle_id = models.CharField(max_length=64, primary_key=True)
    plate_number = models.CharField(max_length=80, unique=True)
    plate_is_synthetic = models.CharField(max_length=10)
    vehicle_type = models.CharField(max_length=80, blank=True, null=True)
    vehicle_color = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_vehicles"


class NetworkKnowledgeGraphEdges(models.Model):
    graph_edge_id = models.CharField(max_length=64, primary_key=True)
    source_type = models.CharField(max_length=40, db_index=True)
    source_id = models.CharField(max_length=100)
    relationship = models.CharField(max_length=60)
    target_type = models.CharField(max_length=40, db_index=True)
    target_id = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = "network_knowledge_graph_edges"


class NetworkTrafficFlow(models.Model):
    observation_id = models.CharField(max_length=64, primary_key=True)
    observed_at_ist = models.DateTimeField(db_index=True)
    road_segment = models.ForeignKey(NetworkRoadSegments, models.DO_NOTHING, db_column="road_segment_id")
    camera = models.ForeignKey(NetworkCameras, models.DO_NOTHING, db_column="camera_id")
    vehicles_per_5_min = models.PositiveSmallIntegerField(blank=True, null=True)
    average_speed_kmh = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    occupancy_pct = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    flow_state = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_traffic_flow"


class NetworkVehicleDetections(models.Model):
    detection_id = models.CharField(max_length=64, primary_key=True)
    corridor_id = models.CharField(max_length=64, db_index=True)
    corridor_name = models.CharField(max_length=180, blank=True, null=True)
    corridor_order = models.IntegerField(blank=True, null=True)
    corridor_start = models.CharField(max_length=180, blank=True, null=True)
    corridor_end = models.CharField(max_length=180, blank=True, null=True)
    corridor_route = models.CharField(max_length=180, blank=True, null=True)
    corridor_stop = models.CharField(max_length=180, blank=True, null=True)
    source_id = models.BigIntegerField(blank=True, null=True)
    timestamp_ist = models.CharField(max_length=80, blank=True, null=True)
    vehicle_type = models.CharField(max_length=80, blank=True, null=True)
    plate_number = models.CharField(max_length=80, blank=True, null=True, db_index=True)
    plate_confidence = models.DecimalField(max_digits=6, decimal_places=4, blank=True, null=True)
    speed_kmh = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    speed_limit_kmh = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    overspeed = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    vehicle_image_path = models.TextField(blank=True, null=True)
    event = models.CharField(max_length=255, blank=True, null=True)
    plate_image_path = models.TextField(blank=True, null=True)
    zone_id = models.CharField(max_length=64, blank=True, null=True)
    camera_id = models.CharField(max_length=80, blank=True, null=True)
    road_segment_id = models.CharField(max_length=100, blank=True, null=True)
    overspeed_margin_kmh = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    data_source = models.CharField(max_length=120, blank=True, null=True)
    linked_incident_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    incident_severity = models.CharField(max_length=24, blank=True, null=True)
    incident_type = models.CharField(max_length=160, blank=True, null=True)
    risk_score = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    flow_state_at_detection = models.CharField(max_length=80, blank=True, null=True)
    road_segment = models.CharField(max_length=120, blank=True, null=True)
    direction = models.CharField(max_length=120, blank=True, null=True)
    corridor_km_marker = models.DecimalField(max_digits=10, decimal_places=3, blank=True, null=True)
    source_camera_id = models.CharField(max_length=80, blank=True, null=True)
    source_zone_id = models.CharField(max_length=64, blank=True, null=True)
    source_road_segment_id = models.CharField(max_length=100, blank=True, null=True)
    vehicle_id = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "network_vehicle_detections"


class TollRates(models.Model):
    id = models.AutoField(primary_key=True)
    vehicle_class = models.CharField(max_length=80, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "toll_rates"


class LegacyUser(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100, unique=True)
    email = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=30)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "users"


class VehicleEvent(models.Model):
    id = models.BigAutoField(primary_key=True)
    csv_record_id = models.CharField(max_length=120, db_index=True)
    timestamp_ist = models.CharField(max_length=80, blank=True, null=True)
    vehicle_type = models.CharField(max_length=80, blank=True, null=True)
    vehicle_number_plate = models.CharField(max_length=80, blank=True, null=True, db_index=True)
    plate_confidence = models.DecimalField(max_digits=6, decimal_places=4, blank=True, null=True)
    vehicle_image = models.TextField(blank=True, null=True)
    speed = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    speed_limit = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    over_speed = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=7, blank=True, null=True)
    video_clip_path = models.TextField(blank=True, null=True)
    vehicle_image_path = models.TextField(blank=True, null=True)
    plate_image_path = models.TextField(blank=True, null=True)
    events = models.CharField(max_length=255, blank=True, null=True)
    source_file = models.CharField(max_length=255)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "vehicle_events"


class CloudinaryAsset(models.Model):
    public_id = models.CharField(max_length=255, unique=True)
    secure_url = models.URLField(max_length=2048)
    asset_folder = models.CharField(max_length=255, blank=True, default="", db_index=True)
    resource_type = models.CharField(max_length=32, default="image")
    format = models.CharField(max_length=24, blank=True, default="")
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    file_size = models.PositiveBigIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=80, blank=True, default="", db_index=True)
    source_id = models.CharField(max_length=255, blank=True, default="", db_index=True)
    content_sha256 = models.CharField(max_length=64, blank=True, null=True, unique=True)

    class Meta:
        db_table = "cloudinary_assets"
        ordering = ("id",)
