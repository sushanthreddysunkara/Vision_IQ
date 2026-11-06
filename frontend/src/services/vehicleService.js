import { cameras, vehicleIncidents } from '../data/vehicleTrackingData'

const apiBaseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

async function getJson(path, fallback) {
  if (!apiBaseUrl) return fallback
  try {
    const response = await fetch(`${apiBaseUrl}${path}`)
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

export async function getVehicleIncidents() {
  const result = await getJson('/api/vehicles/incidents', null)
  return Array.isArray(result?.incidents) && result.incidents.length > 0
    ? result.incidents
    : vehicleIncidents
}

export async function getCameras() {
  const result = await getJson('/api/cameras', null)
  return Array.isArray(result?.cameras) && result.cameras.length > 0
    ? result.cameras
    : cameras
}

function cleanPlate(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

/**
 * Build tracking structure if plate is searched from the 7,044 live records in MySQL
 */
function buildTrackedVehicleFromRecords(vehicleNumber, records = []) {
  if (!records.length) return null
  const sorted = [...records].sort((a, b) => (a.timestampIst || a.timestamp || '').localeCompare(b.timestampIst || b.timestamp || ''))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  const isCollisionRecord = (record) => /\b(collision|collided|crash|accident|impact|wreck|rollover|jackknife)\b/i.test(record.events || '')
  const collisionRecord = sorted.find(isCollisionRecord)
  const hasCollision = Boolean(collisionRecord)

  const observations = sorted.map((r) => {
    const targetCamera = cameras.find((camera) =>
      String(camera.id).toLowerCase() === String(r.camera || '').toLowerCase() ||
      String(camera.name).toLowerCase() === String(r.camera || '').toLowerCase(),
    )
    const isRecordCollision = isCollisionRecord(r)
    const speed = r.speed == null || r.speed === '' ? null : Number(r.speed)
    const speedLimit = r.speedLimit == null || r.speedLimit === '' ? null : Number(r.speedLimit)
    const confidence = r.plateConfidence == null || r.plateConfidence === '' ? null : Number(r.plateConfidence)
    const latitude = r.latitude == null || r.latitude === '' ? null : Number(r.latitude)
    const longitude = r.longitude == null || r.longitude === '' ? null : Number(r.longitude)
    return {
      cameraId: targetCamera?.id || r.camera || 'Camera',
      timestamp: r.timestampIst || r.timestamp || '',
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      location: r.location || r.roadName || targetCamera?.location || 'Location unavailable',
      detectionType: isRecordCollision
        ? r.events || 'Collision'
        : r.isOverSpeed || String(r.overSpeed).toLowerCase() === 'yes' ||
          (Number.isFinite(speed) && Number.isFinite(speedLimit) && speed > speedLimit)
          ? r.events || 'Overspeeding'
          : r.events || 'Vehicle Detected',
      speed: Number.isFinite(speed) ? speed : null,
      speedLimit: Number.isFinite(speedLimit) ? speedLimit : null,
      confidence: Number.isFinite(confidence) ? confidence : null,
      notes: r.events || '',
    }
  })

  return {
    vehicleNumber: first.vehicleNumberPlate || vehicleNumber,
    vehicleType: first.vehicleType || 'Car',
    incidentType: hasCollision ? (collisionRecord.isOverSpeed ? 'Overspeeding' : 'Collision') : 'Vehicle Detected',
    incidentTime: (collisionRecord || last).timestampIst || (collisionRecord || last).timestamp || new Date().toISOString(),
    collisionCamera: observations.find((observation) =>
      /\b(collision|collided|crash|accident|impact)\b/i.test(`${observation.detectionType} ${observation.notes}`),
    )?.cameraId || null,
    status: 'Tracking',
    speed: last.speed == null || last.speed === '' ? null : Number(last.speed),
    speedLimit: last.speedLimit == null || last.speedLimit === '' ? null : Number(last.speedLimit),
    summary: `Vehicle ${first.vehicleNumberPlate || vehicleNumber} (${first.vehicleType}) tracked across ${observations.length} observations on NH-44 corridor.`,
    observations,
  }
}

export async function getVehicleTracking(vehicleNumber) {
  if (!vehicleNumber) return null
  const normTarget = cleanPlate(vehicleNumber)

  // 1. Direct match in forensic vehicle incidents
  const match = vehicleIncidents.find((vehicle) => cleanPlate(vehicle.vehicleNumber) === normTarget)
  if (match) return match

  // 2. Query backend search endpoint for database records
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/vehicles/search?q=${encodeURIComponent(vehicleNumber)}&limit=15`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.vehicles) && data.vehicles.length) {
          return buildTrackedVehicleFromRecords(vehicleNumber, data.vehicles)
        }
      }
    } catch {
      // ignore network errors and fallback
    }
  }

  // 3. Substring match fallback
  return vehicleIncidents.find((vehicle) => cleanPlate(vehicle.vehicleNumber).includes(normTarget) || normTarget.includes(cleanPlate(vehicle.vehicleNumber))) || null
}
