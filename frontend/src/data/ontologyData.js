// src/data/ontologyData.js

export const ontologyCategories = [
  {
    name: 'Entity',
    color: '#d89b7f',
  },
  {
    name: 'DataProperty',
    color: '#ffab6b',
  },
  {
    name: 'Datatype',
    color: '#f3a9dc',
  },
  {
    name: 'ObjectProperty',
    color: '#ff8415',
  },
  {
    name: 'OntologyClass',
    color: '#a878d4',
  },
  {
    name: 'Ontology',
    color: '#53b9d7',
  },
  {
    name: 'OperationalStatus',
    color: '#83b65e',
  },
]

export const ontologyNodes = [
  // Main entities
  {
    id: 'vehicle',
    label: 'Vehicle',
    category: 'Entity',
    description: 'Represents a vehicle detected by the VisionIQ system.',
  },
  {
    id: 'camera',
    label: 'Camera',
    category: 'Entity',
    description: 'Represents a traffic monitoring camera.',
  },
  {
    id: 'road',
    label: 'Road',
    category: 'Entity',
    description: 'Represents a road monitored by VisionIQ.',
  },
  {
    id: 'junction',
    label: 'Junction',
    category: 'Entity',
    description: 'Represents a road junction or intersection.',
  },
  {
    id: 'location',
    label: 'Location',
    category: 'Entity',
    description: 'Represents a geographical location.',
  },
  {
    id: 'violation',
    label: 'Violation',
    category: 'Entity',
    description: 'Represents a traffic rule violation.',
  },
  {
    id: 'rule',
    label: 'Rule',
    category: 'Entity',
    description: 'Represents a traffic rule.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    category: 'Entity',
    description: 'Represents image or video evidence.',
  },

  // Vehicle related
  {
    id: 'car',
    label: 'Car',
    category: 'OntologyClass',
    description: 'A passenger vehicle.',
  },
  {
    id: 'bus',
    label: 'Bus',
    category: 'OntologyClass',
    description: 'A public or private bus.',
  },
  {
    id: 'truck',
    label: 'Truck',
    category: 'OntologyClass',
    description: 'A commercial truck.',
  },
  {
    id: 'motorcycle',
    label: 'Motorcycle',
    category: 'OntologyClass',
    description: 'A two-wheeled motor vehicle.',
  },

  // Data properties
  {
    id: 'vehicle-id',
    label: 'vehicleId',
    category: 'DataProperty',
    description: 'Unique identifier of a vehicle.',
  },
  {
    id: 'number-plate',
    label: 'numberPlate',
    category: 'DataProperty',
    description: 'Registration number of a vehicle.',
  },
  {
    id: 'vehicle-type',
    label: 'vehicleType',
    category: 'DataProperty',
    description: 'Type of detected vehicle.',
  },
  {
    id: 'speed',
    label: 'speed',
    category: 'DataProperty',
    description: 'Detected speed of the vehicle.',
  },
  {
    id: 'timestamp',
    label: 'timestamp',
    category: 'DataProperty',
    description: 'Time at which an event occurred.',
  },
  {
    id: 'camera-id',
    label: 'cameraId',
    category: 'DataProperty',
    description: 'Unique identifier of a camera.',
  },

  // Datatypes
  {
    id: 'string',
    label: 'String',
    category: 'Datatype',
    description: 'Text-based datatype.',
  },
  {
    id: 'integer',
    label: 'Integer',
    category: 'Datatype',
    description: 'Integer datatype.',
  },
  {
    id: 'datetime',
    label: 'DateTime',
    category: 'Datatype',
    description: 'Date and time datatype.',
  },

  // Object properties
  {
    id: 'detects',
    label: 'detects',
    category: 'ObjectProperty',
    description: 'Connects a camera to an entity it detects.',
  },
  {
    id: 'located-at',
    label: 'locatedAt',
    category: 'ObjectProperty',
    description: 'Connects an entity to its location.',
  },
  {
    id: 'violates',
    label: 'violates',
    category: 'ObjectProperty',
    description: 'Connects a vehicle or event to a violated rule.',
  },
  {
    id: 'has-evidence',
    label: 'hasEvidence',
    category: 'ObjectProperty',
    description: 'Connects a violation to its evidence.',
  },
  {
    id: 'has-rule',
    label: 'hasRule',
    category: 'ObjectProperty',
    description: 'Connects a violation to the applicable rule.',
  },
  {
    id: 'has-vehicle-type',
    label: 'hasVehicleType',
    category: 'ObjectProperty',
    description: 'Connects a vehicle with its classification.',
  },

  // Ontology / status
  {
    id: 'traffic-ontology',
    label: 'TrafficOntology',
    category: 'Ontology',
    description: 'Root ontology for the VisionIQ traffic domain.',
  },
  {
    id: 'active',
    label: 'Active',
    category: 'OperationalStatus',
    description: 'Indicates an active operational state.',
  },
]

export const ontologyRelationships = [
  {
    id: 'r1',
    source: 'camera',
    target: 'vehicle',
    label: 'detects',
  },
  {
    id: 'r2',
    source: 'camera',
    target: 'evidence',
    label: 'generates',
  },
  {
    id: 'r3',
    source: 'vehicle',
    target: 'violation',
    label: 'hasViolation',
  },
  {
    id: 'r4',
    source: 'violation',
    target: 'rule',
    label: 'violates',
  },
  {
    id: 'r5',
    source: 'violation',
    target: 'evidence',
    label: 'hasEvidence',
  },
  {
    id: 'r6',
    source: 'camera',
    target: 'location',
    label: 'locatedAt',
  },
  {
    id: 'r7',
    source: 'road',
    target: 'location',
    label: 'locatedAt',
  },
  {
    id: 'r8',
    source: 'junction',
    target: 'road',
    label: 'connectedTo',
  },
  {
    id: 'r9',
    source: 'vehicle',
    target: 'car',
    label: 'hasType',
  },
  {
    id: 'r10',
    source: 'vehicle',
    target: 'bus',
    label: 'hasType',
  },
  {
    id: 'r11',
    source: 'vehicle',
    target: 'truck',
    label: 'hasType',
  },
  {
    id: 'r12',
    source: 'vehicle',
    target: 'motorcycle',
    label: 'hasType',
  },
  {
    id: 'r13',
    source: 'vehicle',
    target: 'vehicle-id',
    label: 'hasDataProperty',
  },
  {
    id: 'r14',
    source: 'vehicle',
    target: 'number-plate',
    label: 'hasDataProperty',
  },
  {
    id: 'r15',
    source: 'vehicle',
    target: 'vehicle-type',
    label: 'hasDataProperty',
  },
  {
    id: 'r16',
    source: 'vehicle',
    target: 'speed',
    label: 'hasDataProperty',
  },
  {
    id: 'r17',
    source: 'violation',
    target: 'timestamp',
    label: 'hasDataProperty',
  },
  {
    id: 'r18',
    source: 'camera',
    target: 'camera-id',
    label: 'hasDataProperty',
  },
  {
    id: 'r19',
    source: 'vehicle-id',
    target: 'string',
    label: 'hasDatatype',
  },
  {
    id: 'r20',
    source: 'number-plate',
    target: 'string',
    label: 'hasDatatype',
  },
  {
    id: 'r21',
    source: 'speed',
    target: 'integer',
    label: 'hasDatatype',
  },
  {
    id: 'r22',
    source: 'timestamp',
    target: 'datetime',
    label: 'hasDatatype',
  },
  {
    id: 'r23',
    source: 'traffic-ontology',
    target: 'vehicle',
    label: 'hasClass',
  },
  {
    id: 'r24',
    source: 'traffic-ontology',
    target: 'camera',
    label: 'hasClass',
  },
  {
    id: 'r25',
    source: 'traffic-ontology',
    target: 'violation',
    label: 'hasClass',
  },
  {
    id: 'r26',
    source: 'traffic-ontology',
    target: 'rule',
    label: 'hasClass',
  },
  {
    id: 'r27',
    source: 'camera',
    target: 'active',
    label: 'hasStatus',
  },
]

export function generateOntologyFromRows(rows) {
  if (!rows || !rows.length) {
    return { nodes: ontologyNodes, relationships: ontologyRelationships }
  }

  const vehicleTypes = Array.from(
    new Set(rows.map((r) => r.vehicleType || r.type).filter(Boolean))
  )
  const overspeedCount = rows.filter((r) => r.overSpeed === 'Yes' || r.isOverSpeed).length

  const dynamicNodes = [
    // Root Ontology Class
    {
      id: 'traffic-ontology',
      label: 'TrafficOntology',
      category: 'Ontology',
      description: `Active ontology model constructed from ${rows.length} CSV records.`,
    },

    // Core Domain Entities
    {
      id: 'vehicle',
      label: 'Vehicle',
      category: 'Entity',
      description: `Vehicle entity representing ${vehicleTypes.length} detected vehicle categories.`,
    },
    {
      id: 'observation',
      label: 'TelemetryObservation',
      category: 'Entity',
      description: `Telemetry observation entity capturing ${rows.length} geo-spatial timestamped events.`,
    },
    {
      id: 'speed-violation',
      label: 'SpeedViolation',
      category: 'Entity',
      description: `Speed enforcement entity tracking speed limit breaches (${overspeedCount} active alerts).`,
    },
    {
      id: 'evidence',
      label: 'MediaEvidence',
      category: 'Entity',
      description: 'Media evidence entity associating vehicle captures, plate crops, and video clips.',
    },

    // Vehicle Subclasses from CSV
    ...vehicleTypes.map((type) => {
      const count = rows.filter((r) => (r.vehicleType || r.type) === type).length
      const slug = type.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return {
        id: `type-${slug}`,
        label: type,
        category: 'OntologyClass',
        description: `Class instance '${type}' (${count} observations in active dataset).`,
      }
    }),

    // The 14 CSV Data Properties
    {
      id: 'prop-id',
      label: 'ID',
      category: 'DataProperty',
      description: 'Unique telemetry observation identifier (e.g. OBS-0001).',
    },
    {
      id: 'prop-timestamp',
      label: 'Timestamp (IST)',
      category: 'DataProperty',
      description: 'Temporal timestamp in Indian Standard Time (IST).',
    },
    {
      id: 'prop-vehicle-type',
      label: 'Vehicle Type',
      category: 'DataProperty',
      description: 'Categorical type of detected vehicle.',
    },
    {
      id: 'prop-plate',
      label: 'Vehicle Number Plate',
      category: 'DataProperty',
      description: 'Vehicle registration number plate identifier.',
    },
    {
      id: 'prop-plate-confidence',
      label: 'Plate Confidence',
      category: 'DataProperty',
      description: 'OCR detection confidence score (0.0 to 1.0).',
    },
    {
      id: 'prop-vehicle-image',
      label: 'Vehicle Image',
      category: 'DataProperty',
      description: 'Vehicle image filename or bounding capture identifier.',
    },
    {
      id: 'prop-speed',
      label: 'Speed (km/h)',
      category: 'DataProperty',
      description: 'Detected instantaneous ground velocity measured in km/h.',
    },
    {
      id: 'prop-speed-limit',
      label: 'Speed Limit (km/h)',
      category: 'DataProperty',
      description: 'Statutory speed limit ceiling for the monitored corridor.',
    },
    {
      id: 'prop-over-speed',
      label: 'Over Speed',
      category: 'DataProperty',
      description: 'Speed compliance indicator flag (Yes / No).',
    },
    {
      id: 'prop-latitude',
      label: 'Latitude',
      category: 'DataProperty',
      description: 'Geographical GPS latitude coordinate.',
    },
    {
      id: 'prop-longitude',
      label: 'Longitude',
      category: 'DataProperty',
      description: 'Geographical GPS longitude coordinate.',
    },
    {
      id: 'prop-video-clip-path',
      label: 'Video Clip Path',
      category: 'DataProperty',
      description: 'Evidentiary recorded video footage path or URI.',
    },
    {
      id: 'prop-vehicle-image-path',
      label: 'Vehicle Image Path',
      category: 'DataProperty',
      description: 'Full resolution vehicle capture image file path.',
    },
    {
      id: 'prop-plate-image-path',
      label: 'Plate Image Path',
      category: 'DataProperty',
      description: 'High-resolution cropped license plate snapshot file path.',
    },

    // Datatypes
    {
      id: 'dt-string',
      label: 'String',
      category: 'Datatype',
      description: 'Textual string representation.',
    },
    {
      id: 'dt-float',
      label: 'Float',
      category: 'Datatype',
      description: 'Floating point numerical value.',
    },
    {
      id: 'dt-integer',
      label: 'Integer',
      category: 'Datatype',
      description: 'Whole numerical count / velocity measurement.',
    },
    {
      id: 'dt-datetime',
      label: 'DateTime',
      category: 'Datatype',
      description: 'Temporal timestamp string or date object.',
    },
    {
      id: 'dt-uri',
      label: 'FilePath / URI',
      category: 'Datatype',
      description: 'Local file system path or network media locator URI.',
    },
    {
      id: 'dt-boolean',
      label: 'Boolean',
      category: 'Datatype',
      description: 'Binary boolean flag (Yes/No or true/false).',
    },
  ]

  let relId = 1
  const dynamicRelationships = [
    // Model has classes
    { id: `r-${relId++}`, source: 'traffic-ontology', target: 'vehicle', label: 'hasClass' },
    { id: `r-${relId++}`, source: 'traffic-ontology', target: 'observation', label: 'hasClass' },
    { id: `r-${relId++}`, source: 'traffic-ontology', target: 'speed-violation', label: 'hasClass' },
    { id: `r-${relId++}`, source: 'traffic-ontology', target: 'evidence', label: 'hasClass' },

    // Vehicle types inherit from Vehicle
    ...vehicleTypes.map((type) => {
      const slug = type.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return {
        id: `r-${relId++}`,
        source: `type-${slug}`,
        target: 'vehicle',
        label: 'subClassOf',
      }
    }),

    // Entity to Entity connections
    { id: `r-${relId++}`, source: 'observation', target: 'vehicle', label: 'records' },
    { id: `r-${relId++}`, source: 'vehicle', target: 'speed-violation', label: 'triggers' },
    { id: `r-${relId++}`, source: 'observation', target: 'evidence', label: 'hasEvidence' },
    { id: `r-${relId++}`, source: 'speed-violation', target: 'evidence', label: 'hasEvidence' },

    // Vehicle Properties (from CSV)
    { id: `r-${relId++}`, source: 'vehicle', target: 'prop-vehicle-type', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'vehicle', target: 'prop-plate', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'vehicle', target: 'prop-plate-confidence', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'vehicle', target: 'prop-speed', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'vehicle', target: 'prop-speed-limit', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'vehicle', target: 'prop-over-speed', label: 'hasDataProperty' },

    // Observation Properties (from CSV)
    { id: `r-${relId++}`, source: 'observation', target: 'prop-id', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'observation', target: 'prop-timestamp', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'observation', target: 'prop-latitude', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'observation', target: 'prop-longitude', label: 'hasDataProperty' },

    // Evidence Properties (from CSV)
    { id: `r-${relId++}`, source: 'evidence', target: 'prop-vehicle-image', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'evidence', target: 'prop-video-clip-path', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'evidence', target: 'prop-vehicle-image-path', label: 'hasDataProperty' },
    { id: `r-${relId++}`, source: 'evidence', target: 'prop-plate-image-path', label: 'hasDataProperty' },

    // Datatype Links
    { id: `r-${relId++}`, source: 'prop-id', target: 'dt-string', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-timestamp', target: 'dt-datetime', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-vehicle-type', target: 'dt-string', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-plate', target: 'dt-string', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-plate-confidence', target: 'dt-float', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-vehicle-image', target: 'dt-string', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-speed', target: 'dt-float', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-speed-limit', target: 'dt-integer', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-over-speed', target: 'dt-boolean', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-latitude', target: 'dt-float', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-longitude', target: 'dt-float', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-video-clip-path', target: 'dt-uri', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-vehicle-image-path', target: 'dt-uri', label: 'hasDatatype' },
    { id: `r-${relId++}`, source: 'prop-plate-image-path', target: 'dt-uri', label: 'hasDatatype' },
  ]

  return { nodes: dynamicNodes, relationships: dynamicRelationships }
}