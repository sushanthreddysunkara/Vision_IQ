// 6 Optical ANPR & Telemetry Surveillance Cameras along National Highway 44 (NH-44 Corridor)
export const cameras = [
  {
    id: 'CAM-NH44-04-MEDCHAL',
    name: 'Medchal North Gateway',
    corridorKm: 'KM 36 (North)',
    location: 'NH-44 - Medchal Gateway',
    latitude: 17.6297,
    longitude: 78.4815,
    status: 'Active',
    speedLimit: 60,
  },
  {
    id: 'CAM-NH44-03-RINGROAD',
    name: 'Hyderabad Ring Corridor',
    corridorKm: 'ORR Junction',
    location: 'NH-44 - Ring Road Interchange',
    latitude: 17.5180,
    longitude: 78.4875,
    status: 'Active',
    speedLimit: 80,
  },
  {
    id: 'CAM-NH44-06-TOLLPLAZA',
    name: 'Aramghar Express Toll Plaza',
    corridorKm: 'Toll Plaza (City Exit)',
    location: 'NH-44 - Aramghar Interchange',
    latitude: 17.3210,
    longitude: 78.4415,
    status: 'Active',
    speedLimit: 60,
  },
  {
    id: 'CAM-NH44-01-SHAMSHABAD',
    name: 'Shamshabad Tollway',
    corridorKm: 'KM 18 (Airport Corridor)',
    location: 'NH-44 - Shamshabad Express',
    latitude: 17.2510,
    longitude: 78.4285,
    status: 'Active',
    speedLimit: 80,
  },
  {
    id: 'CAM-NH44-02-SHADNAGAR',
    name: 'Shadnagar Interchange',
    corridorKm: 'KM 52 (South Corridor)',
    location: 'NH-44 - Shadnagar Bypass',
    latitude: 17.0720,
    longitude: 78.2090,
    status: 'Active',
    speedLimit: 80,
  },
  {
    id: 'CAM-NH44-05-JADCHERLA',
    name: 'Jadcherla Express Point',
    corridorKm: 'KM 84 (Terminal Gateway)',
    location: 'NH-44 - Jadcherla Toll Plaza',
    latitude: 16.7650,
    longitude: 78.1400,
    status: 'Active',
    speedLimit: 80,
  },
]

// Highway road waypoints strictly following the National Highway 44 (NH-44) road geometry
// This ensures vehicle routes hug the main highway rather than cutting across city blocks.
export const NH44_HIGHWAY_WAYPOINTS = [
  // 1. CAM-NH44-04-MEDCHAL (North Gateway KM 36)
  { lat: 17.6297, lng: 78.4815, cameraId: 'CAM-NH44-04-MEDCHAL', name: 'Medchal North Gateway' },
  { lat: 17.6080, lng: 78.4835, name: 'Medchal South Checkpost' },
  { lat: 17.5850, lng: 78.4862, name: 'Kandlakoya ORR Junction' },
  { lat: 17.5620, lng: 78.4875, name: 'Gundlapochampally Stretch' },
  { lat: 17.5380, lng: 78.4880, name: 'Kompally Bypass' },
  // 2. CAM-NH44-03-RINGROAD (ORR / Suchitra / Kompally Junction)
  { lat: 17.5180, lng: 78.4875, cameraId: 'CAM-NH44-03-RINGROAD', name: 'Hyderabad Ring Corridor' },
  { lat: 17.4950, lng: 78.4880, name: 'Suchitra Junction' },
  { lat: 17.4720, lng: 78.4880, name: 'Bowenpally Crossroads' },
  { lat: 17.4530, lng: 78.4870, name: 'Tadbund Secunderabad Link' },
  { lat: 17.4250, lng: 78.4720, name: 'Begumpet Expressway Flyover' },
  { lat: 17.3950, lng: 78.4480, name: 'PVNR Expressway North' },
  { lat: 17.3580, lng: 78.4420, name: 'Attapur Elevated Link' },
  // 3. CAM-NH44-06-TOLLPLAZA (Aramghar Express Toll Plaza)
  { lat: 17.3210, lng: 78.4415, cameraId: 'CAM-NH44-06-TOLLPLAZA', name: 'Aramghar Express Toll Plaza' },
  { lat: 17.3000, lng: 78.4350, name: 'Shivarampally Stretch' },
  { lat: 17.2750, lng: 78.4310, name: 'Gaganpahad Corridor' },
  // 4. CAM-NH44-01-SHAMSHABAD (KM 18 Airport Tollway)
  { lat: 17.2510, lng: 78.4285, cameraId: 'CAM-NH44-01-SHAMSHABAD', name: 'Shamshabad Tollway' },
  { lat: 17.2280, lng: 78.3980, name: 'RGIA Airport Interchange' },
  { lat: 17.1850, lng: 78.3320, name: 'Thimmapur Flyover' },
  { lat: 17.1450, lng: 78.2880, name: 'Kothur Highway Section' },
  { lat: 17.1080, lng: 78.2500, name: 'Nandigama Checkpoint' },
  // 5. CAM-NH44-02-SHADNAGAR (KM 52 Interchange)
  { lat: 17.0720, lng: 78.2090, cameraId: 'CAM-NH44-02-SHADNAGAR', name: 'Shadnagar Interchange' },
  { lat: 17.0400, lng: 78.1950, name: 'Shadnagar South Bypass' },
  { lat: 17.0050, lng: 78.1880, name: 'Farooqnagar Flyover' },
  { lat: 16.9600, lng: 78.1820, name: 'Rajapur Section' },
  { lat: 16.9200, lng: 78.1750, name: 'Balanagar Corridor' },
  { lat: 16.8500, lng: 78.1580, name: 'Balanagar Tollway' },
  { lat: 16.8000, lng: 78.1480, name: 'Polepally Industrial Corridor' },
  // 6. CAM-NH44-05-JADCHERLA (KM 84 Terminal Gateway)
  { lat: 16.7650, lng: 78.1400, cameraId: 'CAM-NH44-05-JADCHERLA', name: 'Jadcherla Express Point' },
]

function findWaypointIndex(lat, lng, cameraId) {
  if (cameraId) {
    const idx = NH44_HIGHWAY_WAYPOINTS.findIndex((w) => w.cameraId === cameraId)
    if (idx !== -1) return idx
  }
  let bestIdx = 0
  let minDistance = Infinity
  for (let i = 0; i < NH44_HIGHWAY_WAYPOINTS.length; i++) {
    const w = NH44_HIGHWAY_WAYPOINTS[i]
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2
    if (d < minDistance) {
      minDistance = d
      bestIdx = i
    }
  }
  return bestIdx
}

export function sortObservationsChronologically(observations = []) {
  return observations
    .map((observation, index) => ({
      observation,
      index,
      timestamp: Date.parse(observation.timestamp || observation.timestampIst || ''),
    }))
    .sort((left, right) => {
      if (!Number.isFinite(left.timestamp) || !Number.isFinite(right.timestamp)) return left.index - right.index
      return left.timestamp - right.timestamp
    })
    .map(({ observation }) => observation)
}

/**
 * Construct an accurate polyline that hugs the main NH-44 highway between observations.
 */
export function getHighwayRouteForObservations(observations = []) {
  const validObs = sortObservationsChronologically(observations).filter(
    (obs) => Number.isFinite(Number(obs.latitude)) && Number.isFinite(Number(obs.longitude))
  )
  if (!validObs.length) return []
  if (validObs.length === 1) {
    const waypointIndex = findWaypointIndex(
      Number(validObs[0].latitude),
      Number(validObs[0].longitude),
      validObs[0].cameraId
    )
    const waypoint = NH44_HIGHWAY_WAYPOINTS[waypointIndex]
    return [[waypoint.lat, waypoint.lng]]
  }

  const highwayPoints = []

  for (let i = 0; i < validObs.length - 1; i++) {
    const fromObs = validObs[i]
    const toObs = validObs[i + 1]

    const fromIdx = findWaypointIndex(Number(fromObs.latitude), Number(fromObs.longitude), fromObs.cameraId)
    const toIdx = findWaypointIndex(Number(toObs.latitude), Number(toObs.longitude), toObs.cameraId)

    if (fromIdx !== -1 && toIdx !== -1) {
      if (fromIdx <= toIdx) {
        // Southbound movement along NH-44
        const segment = NH44_HIGHWAY_WAYPOINTS.slice(fromIdx, toIdx + 1).map((w) => [w.lat, w.lng])
        if (highwayPoints.length && segment.length) segment.shift()
        highwayPoints.push(...segment)
      } else {
        // Northbound movement along NH-44
        const segment = NH44_HIGHWAY_WAYPOINTS.slice(toIdx, fromIdx + 1)
          .reverse()
          .map((w) => [w.lat, w.lng])
        if (highwayPoints.length && segment.length) segment.shift()
        highwayPoints.push(...segment)
      }
    } else {
      highwayPoints.push([Number(fromObs.latitude), Number(fromObs.longitude)])
      highwayPoints.push([Number(toObs.latitude), Number(toObs.longitude)])
    }
  }

  return highwayPoints
}

// Tracked vehicles traveling along the 6 NH-44 cameras, including collision cases
export const vehicleIncidents = [
  {
    vehicleNumber: 'MP44AB1234',
    vehicleType: 'Car',
    incidentType: 'Collision',
    incidentTime: '2026-09-18T10:44:25',
    collisionCamera: 'CAM-NH44-01-SHAMSHABAD',
    status: 'Tracking',
    speed: 92,
    speedLimit: 80,
    summary: 'High-speed side impact collision recorded at Shamshabad Tollway on NH-44. Suspect car continued fleeing south towards Shadnagar.',
    observations: [
      {
        cameraId: 'CAM-NH44-04-MEDCHAL',
        timestamp: '2026-09-18T10:12:00',
        latitude: 17.6297,
        longitude: 78.4815,
        location: 'NH-44 - Medchal Gateway',
        detectionType: 'Vehicle Detected',
        speed: 68,
        speedLimit: 60,
        confidence: 0.98,
      },
      {
        cameraId: 'CAM-NH44-03-RINGROAD',
        timestamp: '2026-09-18T10:23:15',
        latitude: 17.5180,
        longitude: 78.4875,
        location: 'NH-44 - Ring Road Interchange',
        detectionType: 'Vehicle Detected',
        speed: 76,
        speedLimit: 80,
        confidence: 0.96,
      },
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T10:36:40',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 71,
        speedLimit: 60,
        confidence: 0.95,
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T10:44:25',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Collision',
        speed: 92,
        speedLimit: 80,
        confidence: 0.99,
        notes: 'High-speed impact with guardrail and rear bumper collision. Debris scattered in lane 2.',
      },
      {
        cameraId: 'CAM-NH44-02-SHADNAGAR',
        timestamp: '2026-09-18T10:59:10',
        latitude: 17.0720,
        longitude: 78.2090,
        location: 'NH-44 - Shadnagar Bypass',
        detectionType: 'Vehicle Detected',
        speed: 85,
        speedLimit: 80,
        confidence: 0.94,
        notes: 'Vehicle captured with front-left fender damage, heading south towards Jadcherla.',
      },
    ],
  },
  {
    vehicleNumber: 'TS09XY4567',
    vehicleType: 'Bike',
    incidentType: 'Collision',
    incidentTime: '2026-09-18T11:18:40',
    collisionCamera: 'CAM-NH44-06-TOLLPLAZA',
    status: 'Escaped',
    speed: 78,
    speedLimit: 60,
    summary: 'Two-wheeler barrier collision at Aramghar Express Toll Plaza. Rider recovered and fled south towards Shamshabad.',
    observations: [
      {
        cameraId: 'CAM-NH44-03-RINGROAD',
        timestamp: '2026-09-18T11:04:12',
        latitude: 17.5180,
        longitude: 78.4875,
        location: 'NH-44 - Ring Road Interchange',
        detectionType: 'Vehicle Detected',
        speed: 58,
        speedLimit: 80,
        confidence: 0.92,
      },
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T11:18:40',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Collision',
        speed: 78,
        speedLimit: 60,
        confidence: 0.97,
        notes: 'Skid mark detected. Toll lane divider collision.',
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T11:27:05',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 84,
        speedLimit: 80,
        confidence: 0.90,
      },
    ],
  },
  {
    vehicleNumber: 'AP28CD7890',
    vehicleType: 'Auto',
    incidentType: 'Accident',
    incidentTime: '2026-09-18T12:42:09',
    collisionCamera: 'CAM-NH44-02-SHADNAGAR',
    status: 'Detected',
    speed: 44,
    speedLimit: 80,
    summary: 'Three-wheeler rollover accident near Shadnagar Interchange on NH-44 shoulder. Vehicle halted.',
    observations: [
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T12:08:30',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 42,
        speedLimit: 60,
        confidence: 0.94,
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T12:22:15',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 46,
        speedLimit: 80,
        confidence: 0.92,
      },
      {
        cameraId: 'CAM-NH44-02-SHADNAGAR',
        timestamp: '2026-09-18T12:42:09',
        latitude: 17.0720,
        longitude: 78.2090,
        location: 'NH-44 - Shadnagar Bypass',
        detectionType: 'Accident',
        speed: 44,
        speedLimit: 80,
        confidence: 0.96,
        notes: 'Overturned on right highway shoulder. Traffic assistance alerted.',
      },
    ],
  },
  {
    vehicleNumber: 'TS08EF2468',
    vehicleType: 'Bus',
    incidentType: 'Overspeeding',
    incidentTime: '2026-09-18T13:12:45',
    collisionCamera: 'CAM-NH44-03-RINGROAD',
    status: 'Tracking',
    speed: 94,
    speedLimit: 80,
    summary: 'Intercity commercial bus recorded exceeding corridor speed limit at 94 km/h under Ring Road camera.',
    observations: [
      {
        cameraId: 'CAM-NH44-04-MEDCHAL',
        timestamp: '2026-09-18T13:01:10',
        latitude: 17.6297,
        longitude: 78.4815,
        location: 'NH-44 - Medchal Gateway',
        detectionType: 'Vehicle Detected',
        speed: 65,
        speedLimit: 60,
        confidence: 0.95,
      },
      {
        cameraId: 'CAM-NH44-03-RINGROAD',
        timestamp: '2026-09-18T13:12:45',
        latitude: 17.5180,
        longitude: 78.4875,
        location: 'NH-44 - Ring Road Interchange',
        detectionType: 'Overspeeding',
        speed: 94,
        speedLimit: 80,
        confidence: 0.98,
        notes: 'Overspeeding violation: +14 km/h over limit.',
      },
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T13:28:10',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 72,
        speedLimit: 60,
        confidence: 0.93,
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T13:39:20',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 78,
        speedLimit: 80,
        confidence: 0.94,
      },
    ],
  },
  {
    vehicleNumber: 'KA01GH9087',
    vehicleType: 'Truck',
    incidentType: 'Reckless Driving',
    incidentTime: '2026-09-18T13:26:18',
    collisionCamera: 'CAM-NH44-01-SHAMSHABAD',
    status: 'Tracking',
    speed: 88,
    speedLimit: 80,
    summary: 'Heavy multi-axle carrier recorded severe lane departure and near-collision with median.',
    observations: [
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T13:12:00',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 62,
        speedLimit: 60,
        confidence: 0.91,
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T13:26:18',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Reckless Driving',
        speed: 88,
        speedLimit: 80,
        confidence: 0.96,
        notes: 'Lane departure violation. Sudden braking caused trailing vehicle near-miss.',
      },
      {
        cameraId: 'CAM-NH44-02-SHADNAGAR',
        timestamp: '2026-09-18T13:48:30',
        latitude: 17.0720,
        longitude: 78.2090,
        location: 'NH-44 - Shadnagar Bypass',
        detectionType: 'Vehicle Detected',
        speed: 74,
        speedLimit: 80,
        confidence: 0.92,
      },
      {
        cameraId: 'CAM-NH44-05-JADCHERLA',
        timestamp: '2026-09-18T14:15:10',
        latitude: 16.7650,
        longitude: 78.1400,
        location: 'NH-44 - Jadcherla Toll Plaza',
        detectionType: 'Vehicle Detected',
        speed: 70,
        speedLimit: 80,
        confidence: 0.95,
      },
    ],
  },
  {
    vehicleNumber: 'TG07JK5312',
    vehicleType: 'Car',
    incidentType: 'Vehicle Detected',
    incidentTime: '2026-09-18T13:42:06',
    collisionCamera: 'CAM-NH44-04-MEDCHAL',
    status: 'Tracking',
    speed: 75,
    speedLimit: 60,
    summary: 'White sedan tracked moving smoothly across the northern half of the NH-44 highway corridor.',
    observations: [
      {
        cameraId: 'CAM-NH44-04-MEDCHAL',
        timestamp: '2026-09-18T13:30:00',
        latitude: 17.6297,
        longitude: 78.4815,
        location: 'NH-44 - Medchal Gateway',
        detectionType: 'Vehicle Detected',
        speed: 64,
        speedLimit: 60,
        confidence: 0.97,
      },
      {
        cameraId: 'CAM-NH44-03-RINGROAD',
        timestamp: '2026-09-18T13:42:06',
        latitude: 17.5180,
        longitude: 78.4875,
        location: 'NH-44 - Ring Road Interchange',
        detectionType: 'Vehicle Detected',
        speed: 75,
        speedLimit: 80,
        confidence: 0.95,
      },
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T13:58:15',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 62,
        speedLimit: 60,
        confidence: 0.94,
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T14:10:40',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 78,
        speedLimit: 80,
        confidence: 0.96,
      },
    ],
  },
  {
    vehicleNumber: 'KA04ME5521',
    vehicleType: 'Car',
    incidentType: 'Collision',
    incidentTime: '2026-09-18T08:32:00',
    collisionCamera: 'CAM-NH44-05-JADCHERLA',
    status: 'Under Response',
    speed: 86,
    speedLimit: 80,
    severity: 'High',
    summary: 'Multi-vehicle collision at Jadcherla Express Km 84.5 (Southbound). 2 lanes blocked with debris. Emergency patrol dispatched.',
    observations: [
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T07:55:10',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 76,
        speedLimit: 80,
        confidence: 0.97,
      },
      {
        cameraId: 'CAM-NH44-02-SHADNAGAR',
        timestamp: '2026-09-18T08:14:30',
        latitude: 17.0720,
        longitude: 78.2090,
        location: 'NH-44 - Shadnagar Bypass',
        detectionType: 'Vehicle Detected',
        speed: 82,
        speedLimit: 80,
        confidence: 0.95,
      },
      {
        cameraId: 'CAM-NH44-05-JADCHERLA',
        timestamp: '2026-09-18T08:32:00',
        latitude: 16.7650,
        longitude: 78.1400,
        location: 'NH-44 - Jadcherla Toll Plaza',
        detectionType: 'Collision',
        speed: 86,
        speedLimit: 80,
        confidence: 0.99,
        notes: 'Km 84.5 (SB): 2 lanes blocked. Multi-vehicle pileup. Ambulance and tow cranes on route.',
      },
    ],
  },
  {
    vehicleNumber: 'DL01TA9912',
    vehicleType: 'Truck',
    incidentType: 'Collision',
    incidentTime: '2026-09-18T06:45:12',
    collisionCamera: 'CAM-NH44-04-MEDCHAL',
    status: 'Under Response',
    speed: 72,
    speedLimit: 60,
    severity: 'Critical',
    summary: 'Heavy multi-axle freight truck jackknifed and struck concrete central divider at Medchal North Gateway. Major lane closure.',
    observations: [
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T05:48:20',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 74,
        speedLimit: 80,
        confidence: 0.96,
        notes: 'Commercial freight carrier entered corridor heading northbound.',
      },
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T06:05:40',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Overspeeding',
        speed: 78,
        speedLimit: 60,
        confidence: 0.94,
        notes: 'Overspeeding flag: +18 km/h over toll limit.',
      },
      {
        cameraId: 'CAM-NH44-03-RINGROAD',
        timestamp: '2026-09-18T06:24:15',
        latitude: 17.5180,
        longitude: 78.4875,
        location: 'NH-44 - Ring Road Interchange',
        detectionType: 'Vehicle Detected',
        speed: 82,
        speedLimit: 80,
        confidence: 0.97,
        notes: 'Approaching northern toll gateway section.',
      },
      {
        cameraId: 'CAM-NH44-04-MEDCHAL',
        timestamp: '2026-09-18T06:45:12',
        latitude: 17.6297,
        longitude: 78.4815,
        location: 'NH-44 - Medchal Gateway',
        detectionType: 'Collision',
        speed: 72,
        speedLimit: 60,
        confidence: 0.98,
        notes: 'Impact with central road divider. Jackknife event with fuel leak contained by highway crew.',
      },
    ],
  },
  {
    vehicleNumber: 'MH12PQ7788',
    vehicleType: 'Car',
    incidentType: 'Collision',
    incidentTime: '2026-09-18T07:15:33',
    collisionCamera: 'CAM-NH44-03-RINGROAD',
    status: 'Resolved',
    speed: 96,
    speedLimit: 80,
    severity: 'High',
    summary: 'High-speed wet road aquaplaning collision with metal guardrail at Ring Road interchange. Towed to emergency shoulder.',
    observations: [
      {
        cameraId: 'CAM-NH44-04-MEDCHAL',
        timestamp: '2026-09-18T07:02:10',
        latitude: 17.6297,
        longitude: 78.4815,
        location: 'NH-44 - Medchal Gateway',
        detectionType: 'Vehicle Detected',
        speed: 88,
        speedLimit: 60,
        confidence: 0.96,
        notes: 'Southbound vehicle entered Medchal stretch under heavy rain.',
      },
      {
        cameraId: 'CAM-NH44-03-RINGROAD',
        timestamp: '2026-09-18T07:15:33',
        latitude: 17.5180,
        longitude: 78.4875,
        location: 'NH-44 - Ring Road Interchange',
        detectionType: 'Collision',
        speed: 96,
        speedLimit: 80,
        confidence: 0.99,
        notes: 'Aquaplaning guardrail impact on ORR flyover curve. Lane 1 blocked.',
      },
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T07:34:00',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 52,
        speedLimit: 60,
        confidence: 0.92,
        notes: 'Highway response tow truck moving vehicle to emergency bay.',
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T07:49:15',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Vehicle Detected',
        speed: 48,
        speedLimit: 80,
        confidence: 0.93,
        notes: 'Cleared to regional impound station.',
      },
    ],
  },
  {
    vehicleNumber: 'HR26CR4321',
    vehicleType: 'Car',
    incidentType: 'Vehicle Fire',
    incidentTime: '2026-09-18T08:39:00',
    collisionCamera: 'CAM-NH44-05-JADCHERLA',
    status: 'Under Response',
    speed: 70,
    speedLimit: 80,
    severity: 'High',
    summary: 'Vehicle engine fire on highway shoulder at NH-44 Km 398. Open flame and thick smoke reported. Fire tender on site.',
    observations: [
      {
        cameraId: 'CAM-NH44-06-TOLLPLAZA',
        timestamp: '2026-09-18T07:38:15',
        latitude: 17.3210,
        longitude: 78.4415,
        location: 'NH-44 - Aramghar Interchange',
        detectionType: 'Vehicle Detected',
        speed: 72,
        speedLimit: 60,
        confidence: 0.95,
      },
      {
        cameraId: 'CAM-NH44-01-SHAMSHABAD',
        timestamp: '2026-09-18T07:56:40',
        latitude: 17.2510,
        longitude: 78.4285,
        location: 'NH-44 - Shamshabad Express',
        detectionType: 'Overspeeding',
        speed: 92,
        speedLimit: 80,
        confidence: 0.97,
        notes: 'Sudden acceleration before engine malfunction.',
      },
      {
        cameraId: 'CAM-NH44-02-SHADNAGAR',
        timestamp: '2026-09-18T08:18:22',
        latitude: 17.0720,
        longitude: 78.2090,
        location: 'NH-44 - Shadnagar Bypass',
        detectionType: 'Vehicle Detected',
        speed: 74,
        speedLimit: 80,
        confidence: 0.94,
        notes: 'White smoke trail observed from undercarriage.',
      },
      {
        cameraId: 'CAM-NH44-05-JADCHERLA',
        timestamp: '2026-09-18T08:39:00',
        latitude: 16.7650,
        longitude: 78.1400,
        location: 'NH-44 - Jadcherla Toll Plaza',
        detectionType: 'Vehicle Fire',
        speed: 70,
        speedLimit: 80,
        confidence: 0.98,
        notes: 'Car on shoulder. Open flame, thick smoke. Fire department engaged.',
      },
    ],
  },
]

// Real-time live incident feed matching highway dispatch operations
export const liveHighwayIncidents = [
  {
    id: 'inc-01',
    title: 'Vehicle Fire',
    location: 'NH-44, Km 398',
    detail: 'Car on shoulder · Open flame, thick smoke',
    time: '08:39 AM',
    severity: 'High',
    type: 'Vehicle Fire',
    iconType: 'fire',
    vehicleNumber: 'HR26CR4321',
    cameraId: 'CAM-NH44-05-JADCHERLA',
  },
  {
    id: 'inc-02',
    title: 'Accident / Collision',
    location: 'NH-44, Km 84.5',
    detail: '2 lanes blocked · Multiple vehicles involved',
    time: '08:32 AM',
    severity: 'High',
    type: 'Collision',
    iconType: 'accident',
    vehicleNumber: 'KA04ME5521',
    cameraId: 'CAM-NH44-05-JADCHERLA',
  },
  {
    id: 'inc-03',
    title: 'Stalled Vehicle',
    location: 'NH-44, Km 131.2',
    detail: 'Lane 2 blocked · Heavy truck',
    time: '08:28 AM',
    severity: 'Medium',
    type: 'Stalled Vehicle',
    iconType: 'truck',
    vehicleNumber: 'KA01GH9087',
    cameraId: 'CAM-NH44-02-SHADNAGAR',
  },
  {
    id: 'inc-04',
    title: 'Flooding / Waterlogging',
    location: 'NH-44, Km 441',
    detail: '1 lane affected · Water accumulation',
    time: '08:21 AM',
    severity: 'High',
    type: 'Weather / Flooding',
    iconType: 'water',
    cameraId: 'CAM-NH44-01-SHAMSHABAD',
  },
  {
    id: 'inc-05',
    title: 'Slow Traffic · Toll Plaza Queue',
    location: 'NH-44, Km 58',
    detail: '~12 min delay · Lane 3 queue above 10 minutes',
    time: '08:20 AM',
    severity: 'Medium',
    type: 'Slow Traffic',
    iconType: 'traffic',
    cameraId: 'CAM-NH44-06-TOLLPLAZA',
  },
  {
    id: 'inc-06',
    title: 'Stranded Heavy Vehicle',
    location: 'NH-44, Km 296',
    detail: 'Multi-axle trailer on gradient · Needs heavy recovery crane',
    time: '08:05 AM',
    severity: 'Medium',
    type: 'Stalled Vehicle',
    iconType: 'truck',
    cameraId: 'CAM-NH44-02-SHADNAGAR',
  },
  {
    id: 'inc-07',
    title: 'Roadworks · Lane Closure',
    location: 'NH-44, Km 260',
    detail: 'Lane closure · Scheduled maintenance',
    time: '07:55 AM',
    severity: 'Medium',
    type: 'Roadwork',
    iconType: 'roadwork',
    cameraId: 'CAM-NH44-03-RINGROAD',
  },
  {
    id: 'inc-08',
    title: 'Debris on Road · Fallen Load',
    location: 'NH-44, Km 176.3',
    detail: 'Right lane · Branches and fronds across the lane',
    time: '07:48 AM',
    severity: 'Low',
    type: 'Obstacle / Debris',
    iconType: 'debris',
    cameraId: 'CAM-NH44-04-MEDCHAL',
  },
]

