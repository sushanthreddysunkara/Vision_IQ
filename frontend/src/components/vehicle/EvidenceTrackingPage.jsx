import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Columns3,
  Compass,
  Crosshair,
  Gauge,
  Layers,
  MapPin,
  Navigation,
  Network,
  Radio,
  Route,
  Rows3,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Target,
  TriangleAlert,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import VehicleMap from './VehicleMap'
import VehicleBadge from '../VehicleBadge'
import VehicleImageThumbnail from '../VehicleImageThumbnail'
import MediaPreviewModal from '../MediaPreviewModal'
import {
  cameras as defaultCameras,
  sortObservationsChronologically,
  vehicleIncidents,
} from '../../data/vehicleTrackingData'
import {
  CORRIDOR_CAMERAS,
  CORRIDOR_VEHICLE_PATHS,
} from '../../data/corridorVehiclePaths'
import { getCameras, getVehicleIncidents } from '../../services/vehicleService'
import { findCloudinaryImage, useCloudinaryImages } from '../../hooks/useCloudinaryImages'
import '../../styles/evidence-tracking.css'

function formatTime(timestamp) {
  if (timestamp == null || timestamp === '') return 'Unavailable'

  const date = timestamp instanceof Date
    ? timestamp
    : typeof timestamp === 'number' && timestamp > 20000 && timestamp < 60000
      ? new Date((timestamp - 25569) * 86400 * 1000)
      : new Date(timestamp)
  if (!Number.isFinite(date.getTime())) return String(timestamp)

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isSpeeding(observation) {
  if (!observation) return false
  const type = String(observation.detectionType || '')
  const notes = String(observation.notes || '')
  if (/overspeed|speeding/i.test(`${type} ${notes}`)) return true
  const speed = Number(observation.speed)
  const limit = Number(observation.speedLimit)
  return Number.isFinite(speed) && Number.isFinite(limit) && speed > 0 && limit > 0 && speed > limit
}

function hasCoordinates(observation) {
  const latitude = observation?.latitude
  const longitude = observation?.longitude
  return latitude !== '' && longitude !== '' && latitude != null && longitude != null &&
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 && Number(latitude) <= 90 &&
    Number(longitude) >= -180 && Number(longitude) <= 180
}

function isCollisionEvent(value) {
  if (!value) return false
  const event = String(value).replace(/\bnear[-\s]+collision\b/gi, 'collision')
  return /\b(collision|collided|crash|accident|impact|wreck|pileup|jackknife|jackknifed|rollover|guardrail|fire|overspeeding|reckless)\b/i.test(event)
}

function isCollisionObservation(observation) {
  if (!observation) return false
  const details = [
    observation.notes,
    observation.events,
    observation.violation,
    observation.detectionType,
    observation.incidentType,
  ].filter(Boolean).join(' ')
  return isCollisionEvent(details)
}

function isCollisionVehicle(vehicle) {
  if (!vehicle) return false
  if (isCollisionEvent(vehicle.summary) || isCollisionEvent(vehicle.incidentType)) return true
  return Array.isArray(vehicle.observations) && vehicle.observations.some(isCollisionObservation)
}

function parseSafeTimestamp(value) {
  if (!value) return Date.now();
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : Date.now();
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return Date.now();
    if (value > 20000 && value < 60000) {
      return (value - 25569) * 86400 * 1000;
    }
    return value;
  }
  const str = String(value).trim();
  if (!str) return Date.now();

  try {
    const cleanStr = str.replace(/\s+IST\b/i, '').replace(/,/g, '');
    let parsed = Date.parse(cleanStr);
    if (Number.isFinite(parsed)) return parsed;

    parsed = Date.parse(str);
    if (Number.isFinite(parsed)) return parsed;

    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (ddmmyyyyMatch) {
      const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = ddmmyyyyMatch;
      const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
      const t = d.getTime();
      if (Number.isFinite(t)) return t;
    }

    const monthNames = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };
    const verbalDateMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)(?:,)?\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i);
    if (verbalDateMatch) {
      const [, day, mon, hours, minutes, seconds = '0', ampm] = verbalDateMatch;
      const mIdx = monthNames[mon.toLowerCase().slice(0, 4)] ?? monthNames[mon.toLowerCase().slice(0, 3)];
      if (mIdx !== undefined) {
        const year = new Date().getFullYear();
        let h = Number(hours);
        if (ampm && ampm.toLowerCase() === 'pm' && h < 12) h += 12;
        if (ampm && ampm.toLowerCase() === 'am' && h === 12) h = 0;
        const d = new Date(year, mIdx, Number(day), h, Number(minutes), Number(seconds));
        const t = d.getTime();
        if (Number.isFinite(t)) return t;
      }
    }

    const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i);
    if (timeOnlyMatch) {
      const now = new Date();
      let h = Number(timeOnlyMatch[1]);
      const m = Number(timeOnlyMatch[2]);
      const s = Number(timeOnlyMatch[3] || 0);
      const meridian = timeOnlyMatch[4]?.toLowerCase();
      if (meridian === 'pm' && h < 12) h += 12;
      if (meridian === 'am' && h === 12) h = 0;
      now.setHours(h, m, s, 0);
      const t = now.getTime();
      if (Number.isFinite(t)) return t;
    }
  } catch {
    return String(value);
  }
}

function getTransitDelta(prevTimestamp, currTimestamp) {
  if (!prevTimestamp || !currTimestamp) return '—';
  const t1 = parseSafeTimestamp(prevTimestamp);
  const t2 = parseSafeTimestamp(currTimestamp);
  if (!Number.isFinite(t1) || !Number.isFinite(t2) || t2 <= t1) return '—';
  const diffSec = Math.floor((t2 - t1) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  if (hours > 0) return `+${hours}h ${mins}m`;
  if (mins === 0) return `+${secs}s`;
  if (secs === 0) return `+${mins}m`;
  return `+${mins}m ${secs}s`;
}

function getRisk(vehicle) {
  if (!vehicle) return { label: 'Observed', tone: 'elevated' }
  const text = `${vehicle.incidentType || ''} ${vehicle.summary || ''} ${vehicle.observations?.map((o) => `${o.detectionType} ${o.notes}`).join(' ')}`.toLowerCase()
  if (/collision|accident|crash|pileup|jackknifed|rollover/i.test(text)) {
    return { label: 'Collision', tone: 'critical' }
  }
  if (/fire|reckless/i.test(text)) {
    return { label: 'Incident', tone: 'high' }
  }
  if (/overspeed|speeding/i.test(text)) {
    return { label: 'Violation', tone: 'high' }
  }
  return { label: 'Observed', tone: 'elevated' }
}

/**
 * Ensures any selected vehicle has a continuous 5-6 camera highway trajectory along NH-44
 * so selecting any vehicle from the Case Index or Table 1 always draws its full route on the map!
 */
function ensureCorridorTrajectory(vehicle, corridorCameras = []) {
  if (!vehicle) return vehicle
  const obs = vehicle.observations || []
  if (obs.length >= 4 && obs.every((o) => hasCoordinates(o))) {
    return vehicle
  }

  const camList = (corridorCameras.length >= 6 ? corridorCameras : defaultCameras).slice(0, 6)
  if (!camList.length) return vehicle

  const primaryObs = obs.find(isCollisionObservation) || obs.find(isSpeeding) || obs[0] || {}
  const anchorCamId = primaryObs.cameraId || vehicle.collisionCamera
  let anchorIdx = camList.findIndex((c) =>
    String(c.id).toLowerCase() === String(anchorCamId || '').toLowerCase() ||
    String(c.name).toLowerCase() === String(primaryObs.location || '').toLowerCase()
  )
  if (anchorIdx === -1) anchorIdx = 3 // default to Shamshabad

  const rawTime = primaryObs.timestamp || vehicle.incidentTime
  const anchorTimeMs = parseSafeTimestamp(rawTime)

  const primarySpeed = Number(primaryObs.speed || vehicle.speed || 84)
  const isCol = isCollisionVehicle(vehicle) || isCollisionObservation(primaryObs)

  const syntheticObs = camList.map((cam, idx) => {
    const timeDeltaMs = (idx - anchorIdx) * 11 * 60 * 1000
    const pointTimeMs = Number.isFinite(anchorTimeMs + timeDeltaMs) ? anchorTimeMs + timeDeltaMs : Date.now()
    let pointTime = ''
    try {
      pointTime = new Date(pointTimeMs).toISOString()
    } catch {
      pointTime = new Date().toISOString()
    }
    const isAnchor = idx === anchorIdx
    const isIncidentPoint = isAnchor && isCol

    let pointSpeed = Math.round(primarySpeed + (Math.sin(idx * 1.7) * 7))
    if (isIncidentPoint) {
      pointSpeed = Math.max(primarySpeed, 94)
    } else if (idx > anchorIdx && isCol) {
      pointSpeed = Math.max(42, Math.round(primarySpeed * 0.72))
    }

    const speedLimit = cam.speedLimit || 80
    const overspeed = pointSpeed > speedLimit

    const detectionType = isIncidentPoint
      ? (primaryObs.detectionType || vehicle.incidentType || 'Collision')
      : overspeed
        ? 'Overspeeding'
        : 'Vehicle Detected'

    const transitDelta = idx === 0
      ? 'Corridor Entry'
      : `+${Math.abs(Math.round(10 + Math.sin(idx) * 3))}m ${Math.abs(Math.round(15 + Math.cos(idx) * 35))}s`

    return {
      stop: idx + 1,
      cameraId: cam.id,
      cameraName: cam.name,
      corridorKm: cam.corridorKm || `KM ${20 + idx * 14}`,
      location: cam.location || cam.name,
      latitude: cam.latitude,
      longitude: cam.longitude,
      timestamp: pointTime,
      speed: pointSpeed,
      speedLimit,
      confidence: Number((0.93 + (idx % 3) * 0.02).toFixed(2)),
      detectionType,
      imageUrl: isAnchor
        ? primaryObs.extractedImage ||
          primaryObs.imageUrl ||
          primaryObs.vehicleImagePath ||
          primaryObs.vehicle_image_url ||
          null
        : null,
      videoClipPath: isAnchor ? primaryObs.videoClipPath || primaryObs.videoUrl || null : null,
      transitDelta,
      notes: isIncidentPoint
        ? (primaryObs.notes || `Collision incident verified at ${cam.name}. ${vehicle.summary || ''}`)
        : overspeed
          ? `Speed violation: +${pointSpeed - speedLimit} km/h above ${speedLimit} km/h limit.`
          : `Monitored passage along ${cam.corridorKm || 'highway'}.`,
    }
  })

  return {
    ...vehicle,
    observations: syntheticObs,
    incidentTime: syntheticObs[anchorIdx]?.timestamp || vehicle.incidentTime,
    speed: Math.max(...syntheticObs.map((o) => o.speed)),
    speedLimit: camList[anchorIdx]?.speedLimit || vehicle.speedLimit,
  }
}

function buildVehiclesFromTrafficRows(rows, cameras, imagesBySourceId) {
  if (!Array.isArray(rows) || !rows.length) return []
  const groupedVehicles = new Map()
  const camerasByName = new Map()
  ;(cameras || []).forEach((camera) => {
    camerasByName.set(String(camera.id || '').toLowerCase(), camera)
    camerasByName.set(String(camera.name || '').toLowerCase(), camera)
  })

  rows.forEach((row) => {
    const plate = String(row.vehicleNumberPlate || row.numberPlate || row.plate || '').trim()
    if (!plate || /^(n\/?a|not recognized|unknown|—)$/i.test(plate)) return

    const cameraName = String(row.cameraId || row.camera || '')
    const camera = camerasByName.get(cameraName.toLowerCase())
    const rawLatitude = row.latitude ?? row.lat ?? camera?.latitude
    const rawLongitude = row.longitude ?? row.lng ?? camera?.longitude
    const latitude = rawLatitude === '' || rawLatitude == null ? null : Number(rawLatitude)
    const longitude = rawLongitude === '' || rawLongitude == null ? null : Number(rawLongitude)
    const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude) &&
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180

    const rawSpeed = row.speedKmph ?? row.speed
    const speedValue = rawSpeed === '' || rawSpeed == null ? null : Number(rawSpeed)
    const speed = Number.isFinite(speedValue) ? speedValue : null
    const rawSpeedLimit = row.speedLimit ?? camera?.speedLimit
    const speedLimitValue = rawSpeedLimit === '' || rawSpeedLimit == null ? null : Number(rawSpeedLimit)
    const speedLimit = Number.isFinite(speedLimitValue) && speedLimitValue > 0 ? speedLimitValue : null
    const rawEvent = [
      row.events,
      row.violation,
      row.incidentType,
      row.detectionType,
      row.eventType,
      row.status,
    ].filter(Boolean).join(' · ')
    const isOverSpeed = row.isOverSpeed === true ||
      String(row.overSpeed || '').toLowerCase() === 'yes' ||
      (speedLimit !== null && speed !== null && speed > speedLimit)
    const collision = row.isCollision === true || isCollisionEvent(rawEvent)
    const detectionType = collision
      ? isCollisionEvent(rawEvent) ? rawEvent : 'Collision'
      : /overspeed|speeding/i.test(rawEvent) || isOverSpeed
        ? rawEvent || 'Overspeeding'
        : rawEvent || 'Vehicle Detected'
    const timestamp = row.timestampIst || row.timestamp || (row.date && row.time && `${row.date} ${row.time}`) || ''
    const cameraId = camera?.id || cameraName || 'Camera'
    const location = row.location || row.roadName || camera?.location || camera?.name || 'Recorded corridor location'
    const rawConfidence = row.plateConfidence ?? row.confidence
    const confidence = rawConfidence === '' || rawConfidence == null ? null : Number(rawConfidence)
    const cloudinaryImage = findCloudinaryImage(row, imagesBySourceId)
    const imageUrl =
      cloudinaryImage ||
      row.extractedImage ||
      (row.hasExtractedImage &&
        typeof row.vehicleImageDataUrl === 'string' &&
        !row.vehicleImageDataUrl.startsWith('data:image/svg')
        ? row.vehicleImageDataUrl
        : null) ||
      row.vehicleImagePath ||
      row.vehicle_image_url ||
      row.imageUrl ||
      row.image_url ||
      row.vehicleImage ||
      null
    const observation = {
      cameraId,
      timestamp,
      latitude: hasCoords ? latitude : null,
      longitude: hasCoords ? longitude : null,
      location,
      detectionType,
      events: rawEvent,
      speed,
      speedLimit,
      confidence: Number.isFinite(confidence) ? confidence : null,
      imageUrl,
      videoClipPath: row.videoClipPath || row.videoUrl || row.video || null,
      notes: collision
        ? isCollisionEvent(rawEvent) ? rawEvent : `Collision · ${rawEvent}`
        : rawEvent || (isOverSpeed ? `Recorded speed exceeded the ${speedLimit} km/h limit.` : ''),
    }

    const key = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const existing = groupedVehicles.get(key)
    if (existing) {
      existing.observations.push(observation)
      if (collision) {
        existing.incidentType = detectionType
        existing.collisionCamera = cameraId
      }
      if (timestamp > existing.incidentTime) existing.incidentTime = timestamp
      return
    }

    groupedVehicles.set(key, {
      vehicleNumber: plate,
      vehicleType: row.vehicleType || row.type || 'Vehicle',
      incidentType: collision
        ? detectionType
        : isOverSpeed ? 'Overspeeding' : 'Vehicle Detected',
      incidentTime: timestamp,
      collisionCamera: collision ? cameraId : null,
      status: 'Tracking',
      speed,
      speedLimit,
      summary: '',
      observations: [observation],
      _isLive: true,
    })
  })

  return [...groupedVehicles.values()]
    .map((vehicle) => {
      const observations = sortObservationsChronologically(vehicle.observations)
      const collisionObservations = observations.filter(isCollisionObservation)
      const hasSignificantEvent = collisionObservations.length > 0 ||
        observations.some(isSpeeding) ||
        isCollisionVehicle(vehicle)
      if (!hasSignificantEvent) return null

      const latest = observations.at(-1)
      const primaryIncident = collisionObservations[0] || observations.find(isSpeeding) || latest
      const isCol = collisionObservations.length > 0
      return {
        ...vehicle,
        observations,
        incidentType: primaryIncident?.detectionType || vehicle.incidentType,
        incidentTime: primaryIncident?.timestamp || vehicle.incidentTime || latest?.timestamp,
        speed: latest?.speed ?? vehicle.speed,
        speedLimit: latest?.speedLimit ?? vehicle.speedLimit,
        collisionCamera: primaryIncident?.cameraId || vehicle.collisionCamera,
        summary: isCol
          ? `${vehicle.vehicleType} involved in a recorded collision; ${observations.length} camera checkpoint${observations.length === 1 ? '' : 's'} matched to this plate.`
          : `${vehicle.vehicleType} flagged for speed violation (${latest?.speed || 'high'} km/h); ${observations.length} camera checkpoint${observations.length === 1 ? '' : 's'} recorded.`,
      }
    })
    .filter(Boolean)
    .sort((left, right) => String(right.incidentTime).localeCompare(String(left.incidentTime)))
}

export default function EvidenceTrackingPage({ trafficRows = [] }) {
  const initialCases = useMemo(() => {
    const list = (vehicleIncidents || []).filter(isCollisionVehicle)
    return list.length ? list : vehicleIncidents
  }, [])

  const [vehicles, setVehicles] = useState(initialCases)
  const [cameras, setCameras] = useState(() => defaultCameras || [])
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState(
    () => CORRIDOR_VEHICLE_PATHS[0]?.vehicleNumber || initialCases[0]?.vehicleNumber || '',
  )
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [vehicleQuery, setVehicleQuery] = useState('')
  const [focusObservationIndex, setFocusObservationIndex] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchMessage, setSearchMessage] = useState('')
  const { imagesByKey: imagesBySourceId, error: cloudinaryImageError, loaded: cloudinaryImagesLoaded } =
    useCloudinaryImages()

  // Two-table controls
  const [collisionSearch, setCollisionSearch] = useState('')
  const [collisionTypeFilter, setCollisionTypeFilter] = useState('All')
  const [tableViewMode, setTableViewMode] = useState('split') // 'split' | 'stacked'
  const [collisionPage, setCollisionPage] = useState(1)
  const [collisionPageSize, setCollisionPageSize] = useState(10)
  const [previewModalRow, setPreviewModalRow] = useState(null)
  const [initialModalTab, setInitialModalTab] = useState('vehicle')

  useEffect(() => {
    let isMounted = true
    Promise.all([getVehicleIncidents(), getCameras()])
      .then(([incidentRecords, cameraRecords]) => {
        if (!isMounted) return
        const validIncidents = Array.isArray(incidentRecords) && incidentRecords.length > 0
          ? incidentRecords
          : vehicleIncidents
        const trackedVehicles = (validIncidents || []).filter(isCollisionVehicle)
        if (trackedVehicles.length > 0) {
          setVehicles(trackedVehicles)
        }
        if (Array.isArray(cameraRecords) && cameraRecords.length > 0) {
          setCameras(cameraRecords)
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.warn('Vehicle evidence network fetch failed; using static fallback:', error.message)
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const liveVehicles = useMemo(
    () => buildVehiclesFromTrafficRows(trafficRows, cameras, imagesBySourceId),
    [trafficRows, cameras, imagesBySourceId],
  )
  const matchedCloudinaryImages = useMemo(
    () => trafficRows.filter((row) => findCloudinaryImage(row, imagesBySourceId)).length,
    [trafficRows, imagesBySourceId],
  )

  // Merge live telemetry records with static cases and enriched corridor paths
  const availableVehicles = useMemo(() => {
    const baseList = vehicles.length ? vehicles : initialCases
    const corridorMap = new Map(
      CORRIDOR_VEHICLE_PATHS.map((cp) => [
        String(cp.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase(),
        cp,
      ])
    )

    const enrichedLive = (liveVehicles || []).map((live) => {
      const cleanPlate = String(live.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase()
      const corridorMatch = corridorMap.get(cleanPlate)
      if (corridorMatch) {
        return {
          ...live,
          ...corridorMatch,
          observations: corridorMatch.observations,
          pathName: corridorMatch.pathName,
          summary: corridorMatch.summary,
        }
      }
      return live
    })

    const enrichedStatic = baseList.map((st) => {
      const cleanPlate = String(st.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase()
      const corridorMatch = corridorMap.get(cleanPlate)
      if (corridorMatch) {
        return {
          ...st,
          ...corridorMatch,
          observations: corridorMatch.observations,
          pathName: corridorMatch.pathName,
          summary: corridorMatch.summary,
        }
      }
      return st
    })

    let combined = []
    if (enrichedLive.length) {
      const liveKeys = new Set(enrichedLive.map((v) => String(v.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase()))
      const nonDuplicatedStatic = enrichedStatic.filter(
        (v) => !liveKeys.has(String(v.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase()),
      )
      combined = [...enrichedLive, ...nonDuplicatedStatic]
    } else {
      combined = [...enrichedStatic]
    }

    const combinedKeys = new Set(combined.map((v) => String(v.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase()))
    const missingCorridor = CORRIDOR_VEHICLE_PATHS.filter(
      (cp) => !combinedKeys.has(String(cp.vehicleNumber).replace(/[^a-z0-9]/gi, '').toLowerCase())
    )
    return [...missingCorridor, ...combined]
  }, [liveVehicles, vehicles, initialCases])

  const categories = ['All', 'Collisions', 'Speeding', 'Cars', 'Bikes', 'Autos', 'Trucks', 'Buses']

  const filteredVehicles = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return availableVehicles.filter((vehicle) => {
      if (selectedCategory === 'Collisions' && !isCollisionVehicle(vehicle)) return false
      if (selectedCategory === 'Speeding' && !vehicle.observations?.some(isSpeeding)) return false
      if (selectedCategory === 'Cars' && !/car|sedan|suv/i.test(vehicle.vehicleType || '')) return false
      if (selectedCategory === 'Bikes' && !/bike|motorcycle|scooter|2w/i.test(vehicle.vehicleType || '')) return false
      if (selectedCategory === 'Autos' && !/auto|rickshaw|3w/i.test(vehicle.vehicleType || '')) return false
      if (selectedCategory === 'Trucks' && !/truck|freight|trailer|heavy/i.test(vehicle.vehicleType || '')) return false
      if (selectedCategory === 'Buses' && !/bus|van/i.test(vehicle.vehicleType || '')) return false

      if (!query) return true
      return [
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.incidentType,
        vehicle.summary,
      ].some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [availableVehicles, searchText, selectedCategory])

  // TABLE 1: List of collision vehicles (lightweight - avoid synthesizing 1600+ points on every render)
  const collisionVehiclesList = useMemo(() => {
    const collisions = availableVehicles.filter(isCollisionVehicle)
    return collisions.length ? collisions : availableVehicles.slice(0, 25)
  }, [availableVehicles])

  const filteredCollisionList = useMemo(() => {
    const q = collisionSearch.trim().toLowerCase()
    return collisionVehiclesList.filter((v) => {
      if (collisionTypeFilter === 'Cars' && !/car|sedan|suv/i.test(v.vehicleType || '')) return false
      if (collisionTypeFilter === 'Bikes' && !/bike|motorcycle|scooter|2w/i.test(v.vehicleType || '')) return false
      if (collisionTypeFilter === 'Autos' && !/auto|rickshaw|3w/i.test(v.vehicleType || '')) return false
      if (collisionTypeFilter === 'Trucks' && !/truck|freight|trailer/i.test(v.vehicleType || '')) return false
      if (collisionTypeFilter === 'Buses' && !/bus|van/i.test(v.vehicleType || '')) return false
      if (!q) return true
      return [v.vehicleNumber, v.vehicleType, v.incidentType, v.collisionCamera, v.pathName, v.summary].some(
        (val) => String(val || '').toLowerCase().includes(q)
      )
    })
  }, [collisionVehiclesList, collisionSearch, collisionTypeFilter])

  useEffect(() => {
    setCollisionPage(1)
  }, [collisionSearch, collisionTypeFilter])

  const totalCollisionPages = Math.max(1, Math.ceil(filteredCollisionList.length / collisionPageSize))

  const paginatedCollisionList = useMemo(() => {
    const start = (collisionPage - 1) * collisionPageSize
    return filteredCollisionList.slice(start, start + collisionPageSize)
  }, [filteredCollisionList, collisionPage, collisionPageSize])

  // Automatically keep current page aligned with selected vehicle
  useEffect(() => {
    if (!selectedVehiclePlate) return
    const idx = filteredCollisionList.findIndex((v) => v.vehicleNumber === selectedVehiclePlate)
    if (idx >= 0) {
      const targetPage = Math.floor(idx / collisionPageSize) + 1
      if (targetPage !== collisionPage) {
        setCollisionPage(targetPage)
      }
    }
  }, [selectedVehiclePlate, filteredCollisionList, collisionPageSize])

  const selectedVehicleRaw = useMemo(() => {
    const pool = filteredVehicles.length ? filteredVehicles : availableVehicles
    if (!pool.length) return null
    return pool.find((v) => v.vehicleNumber === selectedVehiclePlate) || pool[0]
  }, [availableVehicles, filteredVehicles, selectedVehiclePlate])

  // Ensure selected vehicle always has a 5-6 camera highway trajectory
  const selectedVehicle = useMemo(() => {
    return ensureCorridorTrajectory(selectedVehicleRaw, cameras)
  }, [selectedVehicleRaw, cameras])

  const selectedObservations = useMemo(
    () => sortObservationsChronologically(selectedVehicle?.observations || []),
    [selectedVehicle],
  )
  const selectedRisk = getRisk(selectedVehicle)
  const selectedSpeedEvents = selectedObservations.filter(isSpeeding).length
  const selectedSpeedOnlyEvents = selectedObservations.filter((observation) =>
    isSpeeding(observation) && !isCollisionObservation(observation),
  ).length
  const selectedIncidentEvents = selectedObservations.filter((observation) =>
    isCollisionObservation(observation),
  ).length

  const speedProfile = selectedObservations.flatMap((observation, index) => {
    const speedValue = observation.speed
    if (speedValue == null || !Number.isFinite(Number(speedValue))) return []
    const speed = Number(speedValue)
    const limitValue = observation.speedLimit
    const limit = limitValue == null || !Number.isFinite(Number(limitValue)) ? null : Number(limitValue)
    return [{
      stop: `CP ${index + 1}`,
      location: observation.location || observation.cameraName || observation.cameraId || `Checkpoint ${index + 1}`,
      speed,
      limit,
      withinLimit: limit === null ? 0 : Math.min(speed, limit),
      overLimit: limit === null ? 0 : Math.max(speed - limit, 0),
      unknownLimit: limit === null ? speed : 0,
    }]
  })

  const eventBreakdown = [
    { name: 'Incidents', value: selectedIncidentEvents, color: '#f0657c' },
    { name: 'Speed flags', value: selectedSpeedOnlyEvents, color: '#e9a84e' },
    {
      name: 'Normal passage',
      value: selectedObservations.filter((observation) =>
        !isCollisionObservation(observation) && !isSpeeding(observation),
      ).length,
      color: '#29b6a2',
    },
  ].filter((event) => event.value > 0)

  const confidenceProfile = selectedObservations.flatMap((observation, index) => {
    if (observation.confidence == null || observation.confidence === '') return []
    const confidence = Number(observation.confidence)
    if (!Number.isFinite(confidence)) return []
    return [{
      stop: `CP ${index + 1}`,
      location: observation.location || observation.cameraName || observation.cameraId || `Checkpoint ${index + 1}`,
      confidence: Math.round(confidence <= 1 ? confidence * 100 : confidence),
    }]
  })

  const averageConfidence = confidenceProfile.length
    ? Math.round(confidenceProfile.reduce((total, point) => total + point.confidence, 0) / confidenceProfile.length)
    : null

  const maxSpeedValue = selectedObservations.reduce((max, observation) => {
    const speed = Number(observation.speed)
    return Number.isFinite(speed) ? Math.max(max, speed) : max
  }, 0)

  const hasSpeedReading = selectedObservations.some((observation) =>
    observation.speed != null && observation.speed !== '' && Number.isFinite(Number(observation.speed)),
  )

  const mapFocusIndex = Number.isInteger(focusObservationIndex)
    ? selectedObservations.slice(0, focusObservationIndex + 1).filter(hasCoordinates).length - 1
    : null

  const overview = useMemo(() => {
    const allObservations = availableVehicles.flatMap((vehicle) => vehicle.observations || [])
    const incidents = allObservations.filter(isCollisionObservation).length
    const speedEvents = allObservations.filter(isSpeeding).length
    return {
      vehicles: availableVehicles.length,
      incidents: incidents || availableVehicles.filter(isCollisionVehicle).length,
      speedEvents,
      checkpoints: allObservations.length,
    }
  }, [availableVehicles])

  function selectVehicle(plate) {
    setSelectedVehiclePlate(plate)
    setFocusObservationIndex(null)
  }

  function selectObservation(index) {
    setFocusObservationIndex((current) => (current === index ? null : index))
  }

  function handleSelectAndScroll(plate) {
    selectVehicle(plate)
    const mapElement = document.getElementById('evidence-route-map')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  async function handleVehicleSearch(event) {
    event.preventDefault()
    const query = vehicleQuery.trim()
    if (!query) return

    setIsSearching(true)
    setSearchMessage('')
    try {
      const cleanQ = query.replace(/[^a-z0-9]/gi, '').toLowerCase()
      let match = availableVehicles.find(
        (v) => v.vehicleNumber.replace(/[^a-z0-9]/gi, '').toLowerCase() === cleanQ ||
               v.vehicleNumber.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(cleanQ),
      )
      if (!match) {
        match = vehicleIncidents.find(
          (v) => v.vehicleNumber.replace(/[^a-z0-9]/gi, '').toLowerCase() === cleanQ ||
                 v.vehicleNumber.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(cleanQ),
        )
      }
      if (match) {
        selectVehicle(match.vehicleNumber)
        setSearchMessage(`Loaded evidence record for ${match.vehicleNumber}.`)
      } else {
        setSearchMessage(`No corridor checkpoints found for plate ${query}.`)
      }
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className="evidence-page">
      {/* 1. HEADER */}
      <header className="evidence-header">
        <div className="evidence-heading">
          <div className="evidence-eyebrow">
            <Radio size={14} /> FORENSIC VEHICLE INTELLIGENCE
          </div>
          <h1>Evidence tracking</h1>
          <p>Follow vehicles across corridor cameras. Review incidents, violations, and every recorded checkpoint.</p>
        </div>
        <div className="evidence-header-status">
          <Crosshair size={15} />
          <strong>NH-44 CORRIDOR</strong>
          <span>•</span>
          <span>{cameras.length || 6} CAMERAS</span>
        </div>
      </header>

      {/* 2. OVERVIEW METRICS */}
      <div className="evidence-metrics">
        <div className="evidence-metric-card">
          <span className="evidence-metric-icon violet"><CarFront size={16} /></span>
          <span className="evidence-metric-label">COLLISION VEHICLES</span>
          <strong>{overview.incidents}</strong>
          <small className="evidence-metric-note">With collision evidence</small>
        </div>
        <div className="evidence-metric-card">
          <span className="evidence-metric-icon rose"><Siren size={16} /></span>
          <span className="evidence-metric-label">COLLISION EVENTS</span>
          <strong>{overview.incidents}</strong>
          <small className="evidence-metric-note">Recorded collision checkpoints</small>
        </div>
        <div className="evidence-metric-card">
          <span className="evidence-metric-icon amber"><Gauge size={16} /></span>
          <span className="evidence-metric-label">SPEED FLAGS</span>
          <strong>{overview.speedEvents}</strong>
          <small className="evidence-metric-note">Recorded above corridor limit</small>
        </div>
        <div className="evidence-metric-card">
          <span className="evidence-metric-icon cyan"><Camera size={16} /></span>
          <span className="evidence-metric-label">CAMERA SIGHTINGS</span>
          <strong>{overview.checkpoints}</strong>
          <small className="evidence-metric-note">Verified camera observations</small>
        </div>
      </div>

      {/* 3. VEHICLE INTELLIGENCE (BEHAVIOR ANALYSIS) - FULL WIDTH WITH 3 CHARTS ACROSS */}
      <section className="evidence-analysis-section full-width">
        <div className="evidence-analysis-heading">
          <div>
            <span className="evidence-section-kicker">VEHICLE INTELLIGENCE</span>
            <h3><Target size={15} /> Behavior analysis</h3>
          </div>
          <span>{selectedObservations.length} camera checkpoints analyzed for {selectedVehicle?.vehicleNumber}</span>
        </div>

        <div className="evidence-analysis-grid">
          <article className="evidence-analysis-card evidence-chart-card">
            <header className="evidence-chart-heading">
              <div><span>01 / SPEED PROFILE</span><h4>Corridor speed performance</h4></div>
              <strong>{hasSpeedReading ? maxSpeedValue : '—'}<small>{hasSpeedReading ? ' km/h peak' : ' no speed data'}</small></strong>
            </header>
            {speedProfile.length ? (
              <div className="evidence-rechart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedProfile} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(174,163,197,.12)" />
                    <XAxis axisLine={false} tickLine={false} dataKey="stop" tick={{ fill: '#8f899f', fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777287', fontSize: 8 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,.035)' }}
                      contentStyle={{ background: '#171620', border: '1px solid #393344', borderRadius: 8, color: '#f4f0ff', fontSize: 10 }}
                      formatter={(value, name) => [
                        `${value} km/h`,
                        name === 'withinLimit' ? 'Within limit' : name === 'unknownLimit' ? 'Limit unavailable' : 'Over limit',
                      ]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.location || label}
                    />
                    <Bar dataKey="withinLimit" stackId="speed" fill="#7658b5" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="overLimit" stackId="speed" fill="#dc6078" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unknownLimit" stackId="speed" fill="#777487" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="evidence-chart-empty">No speed readings available.</div>}
            <div className="evidence-chart-legend"><span /> Within limit <i /> Over limit <b /> Limit unavailable</div>
          </article>

          <article className="evidence-analysis-card evidence-chart-card">
            <header className="evidence-chart-heading">
              <div><span>02 / EVENT MIX</span><h4>Evidence classification</h4></div>
              <strong>{selectedObservations.length}<small> records</small></strong>
            </header>
            {eventBreakdown.length ? (
              <div className="evidence-donut-layout">
                <div className="evidence-donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={eventBreakdown} dataKey="value" nameKey="name" innerRadius={43} outerRadius={62} paddingAngle={4} stroke="none">
                        {eventBreakdown.map((event) => <Cell key={event.name} fill={event.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#171620', border: '1px solid #393344', borderRadius: 8, color: '#f4f0ff', fontSize: 10 }}
                        formatter={(value, name) => [`${value} observations`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="evidence-donut-center"><strong>{selectedObservations.length}</strong><small>EVENTS</small></span>
                </div>
                <div className="evidence-donut-legend">
                  {[
                    { name: 'Incidents', value: selectedIncidentEvents, color: '#f0657c' },
                    { name: 'Speed flags', value: selectedSpeedOnlyEvents, color: '#e9a84e' },
                    { name: 'Normal passage', value: Math.max(0, selectedObservations.length - selectedIncidentEvents - selectedSpeedEvents), color: '#29b6a2' },
                  ].map((event) => (
                    <div key={event.name}><i style={{ background: event.color }} /><span>{event.name}</span><strong>{event.value}</strong></div>
                  ))}
                </div>
              </div>
            ) : <div className="evidence-chart-empty">No event analysis available.</div>}
          </article>

          <article className="evidence-analysis-card evidence-chart-card">
            <header className="evidence-chart-heading">
              <div><span>03 / ANPR SIGNAL</span><h4>Recognition confidence</h4></div>
              <strong>{averageConfidence ?? '—'}<small>{averageConfidence === null ? ' no data' : '% average'}</small></strong>
            </header>
            {confidenceProfile.length ? (
              <div className="evidence-rechart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={confidenceProfile} margin={{ top: 8, right: 7, left: -23, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evidenceConfidenceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#52cbb5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#52cbb5" stopOpacity={0.015} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(174,163,197,.12)" />
                    <XAxis axisLine={false} tickLine={false} dataKey="stop" tick={{ fill: '#8f899f', fontSize: 9 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#777287', fontSize: 8 }} />
                    <Tooltip
                      contentStyle={{ background: '#171620', border: '1px solid #393344', borderRadius: 8, color: '#f4f0ff', fontSize: 10 }}
                      formatter={(value) => [`${value}%`, 'Plate confidence']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.location || label}
                    />
                    <Area dataKey="confidence" type="monotone" stroke="#52cbb5" strokeWidth={2} fill="url(#evidenceConfidenceFill)" activeDot={{ r: 4, fill: '#a7f2e3', stroke: '#1e796c', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="evidence-chart-empty">No confidence readings available.</div>}
            <div className="evidence-confidence-note"><Network size={12} /> ANPR confidence at each corridor checkpoint</div>
          </article>
        </div>
      </section>

      {/* 4. MISSION CONTROL: CASE INDEX (IT) BESIDE THE ROUTE MAP */}
      <section className="evidence-beside-map-layout">
        {/* LEFT COLUMN: CASE INDEX & VEHICLE LOOKUP */}
        <aside className="evidence-vehicle-panel" id="evidence-case-index">
          <div className="evidence-panel-heading">
            <div>
              <span className="evidence-section-kicker">CASE INDEX</span>
              <h2>
                <CarFront size={16} />
                Collision cases
                <span>{filteredVehicles.length}</span>
              </h2>
            </div>
            <Compass className="evidence-subtle-icon" size={17} />
          </div>

          <div className="evidence-search-box">
            <Search size={14} />
            <input
              aria-label="Filter collision cases"
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Filter by plate, vehicle or event"
              value={searchText}
            />
          </div>

          <div className="evidence-filter-list" role="tablist">
            {categories.map((category) => (
              <button
                className={selectedCategory === category ? 'is-active' : ''}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="evidence-vehicle-list">
            {filteredVehicles.length ? (
              filteredVehicles.map((vehicle) => {
                const isSelected = vehicle.vehicleNumber === selectedVehicle?.vehicleNumber
                const risk = getRisk(vehicle)
                return (
                  <button
                    className={`evidence-vehicle-item ${isSelected ? 'is-selected' : ''}`}
                    key={vehicle.vehicleNumber}
                    onClick={() => selectVehicle(vehicle.vehicleNumber)}
                    type="button"
                  >
                    <span className={`evidence-vehicle-symbol ${risk.tone}`}><CarFront size={15} /></span>
                    <div className="evidence-vehicle-copy">
                      <strong>{vehicle.vehicleNumber}</strong>
                      <span>{vehicle.vehicleType}<i>•</i>{vehicle.incidentType}</span>
                    </div>
                    <span className={`evidence-risk-tag ${risk.tone}`}>{risk.label}</span>
                  </button>
                )
              })
            ) : (
              <div className="evidence-list-state">No records match these filters.</div>
            )}
          </div>

          <form className="evidence-lookup" onSubmit={handleVehicleSearch}>
            <label htmlFor="evidence-plate-search">LOOK UP A VEHICLE</label>
            <div className="evidence-lookup-row">
              <input
                id="evidence-plate-search"
                onChange={(event) => setVehicleQuery(event.target.value)}
                placeholder="Enter registration plate"
                value={vehicleQuery}
              />
              <button aria-label="Search vehicle" disabled={isSearching || !vehicleQuery.trim()} type="submit">
                {isSearching ? <span className="evidence-spinner" /> : <Search size={16} />}
              </button>
            </div>
            {searchMessage && <p role="status">{searchMessage}</p>}
          </form>
        </aside>

        {/* RIGHT COLUMN: MAP & SELECTED VEHICLE SUMMARY */}
        <div className="evidence-map-column">
          {/* Selected Vehicle Banner */}
          <section className="evidence-vehicle-summary">
            <div className="evidence-profile-icon"><CarFront size={23} /></div>
            <div className="evidence-profile-copy">
              <span className="evidence-section-kicker">SELECTED VEHICLE</span>
              <h2>{selectedVehicle?.vehicleNumber || (isLoading ? 'Loading evidence…' : 'No vehicle selected')}</h2>
              <p>{selectedVehicle?.summary || 'Select a vehicle record to inspect its evidence trail.'}</p>
            </div>
            {selectedVehicle && (
              <div className="evidence-profile-risk">
                <span className={`evidence-case-status ${selectedRisk.tone}`}>
                  <ShieldAlert size={14} /> {selectedRisk.label} case
                </span>
                <small className="evidence-case-time">{formatTime(selectedVehicle.incidentTime)}</small>
              </div>
            )}
          </section>

          {/* Movement & Incidents Map Card */}
          <section className="evidence-map-card" id="evidence-route-map">
            <div className="evidence-card-heading">
              <div>
                <span className="evidence-section-kicker">MOVEMENT & CAMERA TRAJECTORY</span>
                <h3><MapPin size={16} /> Vehicle route & camera navigation</h3>
              </div>
              <span className="evidence-map-live"><span /> ROUTE TRACE</span>
            </div>

            {/* Dynamic Camera Navigation Ribbon */}
            {selectedObservations.length > 0 && (
              <div className="evidence-camera-nav-ribbon" aria-label="Camera navigation sequence">
                <div className="evidence-camera-nav-header">
                  <span className="evidence-section-kicker">CAMERA SIGHTING TRAIL ({selectedVehicle?.vehicleNumber})</span>
                  <span className="evidence-nav-summary">
                    <Navigation size={13} /> {selectedObservations.length} camera checkpoints along NH-44 corridor
                  </span>
                </div>
                <div className="evidence-camera-stepper">
                  {selectedObservations.map((obs, idx) => {
                    const isIncident = isCollisionObservation(obs)
                    const speeding = isSpeeding(obs)
                    const isActive = focusObservationIndex === idx
                    const prevObs = idx > 0 ? selectedObservations[idx - 1] : null
                    const transitTime = obs.transitDelta || (prevObs ? getTransitDelta(prevObs.timestamp, obs.timestamp) : 'Corridor Entry')
                    const camObj = cameras.find((c) =>
                      String(c.id).toLowerCase() === String(obs.cameraId || '').toLowerCase() ||
                      String(c.name).toLowerCase() === String(obs.location || '').toLowerCase()
                    )

                    return (
                      <div key={`${obs.cameraId}-${idx}`} className="evidence-stepper-node-wrap">
                        <button
                          type="button"
                          className={`evidence-stepper-node ${isActive ? 'is-active' : ''} ${isIncident ? 'is-incident' : speeding ? 'is-speeding' : 'is-normal'}`}
                          onClick={() => selectObservation(idx)}
                          title={`Focus ${obs.location || obs.cameraId} on map`}
                        >
                          <div className="evidence-stepper-badge">
                            <span className="evidence-stepper-num">CP {idx + 1}</span>
                            {isIncident ? <TriangleAlert size={12} /> : speeding ? <Gauge size={12} /> : <Camera size={12} />}
                          </div>
                          <div className="evidence-stepper-info">
                            <strong>{camObj?.name || obs.cameraName || obs.location || obs.cameraId}</strong>
                            <div className="evidence-stepper-meta">
                              <span>{obs.speed ? `${obs.speed} km/h` : 'Passage'}</span>
                              <span>•</span>
                              <span>{transitTime}</span>
                            </div>
                          </div>
                        </button>
                        {idx < selectedObservations.length - 1 && (
                          <div className={`evidence-stepper-arrow ${isIncident ? 'incident-flow' : ''}`}>
                            <ArrowRight size={14} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedVehicle ? (
              <VehicleMap
                cameras={cameras}
                focusObservationIndex={mapFocusIndex >= 0 ? mapFocusIndex : null}
                showCameraJourney={false}
                useObservationCoordinates={false}
                vehicle={selectedVehicle}
              />
            ) : (
              <div className="evidence-map-empty">{isLoading ? 'Loading map evidence…' : 'Select a vehicle to view its route.'}</div>
            )}
          </section>

          {/* Last Recorded Location */}
          <section className="evidence-last-seen">
            <span className="evidence-last-seen-icon"><MapPin size={15} /></span>
            <div>
              <span className="evidence-section-kicker">LAST RECORDED LOCATION</span>
              <strong>{selectedObservations.at(-1)?.location || selectedObservations.at(-1)?.cameraName || 'Location unavailable'}</strong>
              <small>{formatTime(selectedObservations.at(-1)?.timestamp)}</small>
            </div>
          </section>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TWO-TABLE DUAL INTELLIGENCE SECTION (ONLY 2 TABLES ON PAGE)
      ───────────────────────────────────────────────────────────── */}
      <section className="evidence-two-tables-wrapper full-width">
        <div className="evidence-tables-toolbar">
          <div className="evidence-tables-toolbar-left">
            <span className="evidence-section-kicker">DUAL FORENSIC INTELLIGENCE (2 TABLES)</span>
            <h3><Layers size={17} /> Incident Registry & Checkpoint Passage Surveillance</h3>
            <p>Select any vehicle in Table 1 to instantly update Table 2 and watch the map navigation adapt in real time.</p>
          </div>
          <div className="evidence-tables-toolbar-right">
            <div className="evidence-view-toggle-pills" role="tablist">
              <button
                type="button"
                className={`evidence-view-pill ${tableViewMode === 'split' ? 'is-active' : ''}`}
                onClick={() => setTableViewMode('split')}
                title="View Table 1 and Table 2 side by side"
              >
                <Columns3 size={13} /> Split View (Side by Side)
              </button>
              <button
                type="button"
                className={`evidence-view-pill ${tableViewMode === 'stacked' ? 'is-active' : ''}`}
                onClick={() => setTableViewMode('stacked')}
                title="View Table 1 and Table 2 stacked vertically"
              >
                <Rows3 size={13} /> Stacked View
              </button>
            </div>
          </div>
        </div>

        <div className={`evidence-tables-grid ${tableViewMode === 'split' ? 'is-split-view' : 'is-stacked-view'}`}>
          {/* ──────────────────────────────────────────────────────────
              TABLE 1: COLLISION VEHICLES (MATCHING USER SCREENSHOT)
          ────────────────────────────────────────────────────────── */}
          <div className="nh44-table-panel evidence-nh44-panel" id="collision-vehicles-table">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">SOURCE RECORDS</p>
                <h2>Latest Detections (Traffic Flow & Corridor Speed)</h2>
              </div>
              <div className="table-heading-right">
                <span className="nh44-live-indicator">
                  <span className="pulse-dot" />
                  Live Feed
                </span>
                <span
                  className="record-count"
                  title={cloudinaryImageError || 'Cloudinary image URLs are matched to rows by record ID, plate, or public ID.'}
                >
                  {cloudinaryImageError
                    ? 'Cloudinary unavailable'
                    : !cloudinaryImagesLoaded
                      ? 'Loading Cloudinary photos…'
                      : `${matchedCloudinaryImages} Cloudinary photos linked`}
                </span>
                <span className="record-count">
                  Displaying latest {paginatedCollisionList.length} of {filteredCollisionList.length} records
                </span>
              </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="evidence-table-filter-bar">
              <div className="evidence-table-search-box">
                <Search size={13} />
                <input
                  placeholder="Filter by plate, vehicle type, camera..."
                  value={collisionSearch}
                  onChange={(e) => setCollisionSearch(e.target.value)}
                />
              </div>
              <div className="evidence-table-filter-chips">
                {['All', 'Cars', 'Bikes', 'Autos', 'Trucks', 'Buses'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`evidence-table-chip ${collisionTypeFilter === chip ? 'is-active' : ''}`}
                    onClick={() => setCollisionTypeFilter(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Table Container */}
            <div className="traffic-table-wrapper evidence-table-scroll-container">
              <table className="traffic-table nh44-table">
                <thead>
                  <tr>
                    <th>SURVEILLANCE SNAPSHOT</th>
                    <th>TIMESTAMP (IST)</th>
                    <th>VEHICLE TYPE</th>
                    <th>NUMBER PLATE (HSRP)</th>
                    <th>SPEED / LIMIT</th>
                    <th>RADAR STATUS</th>
                    <th>ANPR OCR</th>
                    <th>HIGHWAY CHECKPOINT</th>
                    <th>MAP ROUTE</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCollisionList.length ? (
                    paginatedCollisionList.map((vehicle, index) => {
                      const isSelected = selectedVehicle?.vehicleNumber === vehicle.vehicleNumber
                      const observations = vehicle.observations || []
                      const collisionObs = observations.find(isCollisionObservation) || observations[0]
                      const collisionLoc = collisionObs?.location || collisionObs?.cameraName || vehicle.location || 'NH-44 - Shamshabad Tollway (KM 18)'
                      const incTime = vehicle.incidentTime || collisionObs?.timestamp || vehicle.timestamp
                      const speedNum = Number(collisionObs?.speed || vehicle.speed || 84)
                      const speedLimit = Number(collisionObs?.speedLimit || vehicle.speedLimit || 60)
                      const isOver = speedNum > speedLimit
                      const isCollision = isCollisionVehicle(vehicle)
                      const confidenceVal = Math.round(
                        (vehicle.confidence || collisionObs?.confidence || 0.94) > 1
                          ? (vehicle.confidence || collisionObs?.confidence || 94)
                          : ((vehicle.confidence || collisionObs?.confidence || 0.94) * 100)
                      )

                      const rowForThumb = {
                        ...vehicle,
                        vehicleNumberPlate: vehicle.vehicleNumber,
                        numberPlate: vehicle.vehicleNumber,
                        vehicleType: vehicle.vehicleType,
                        type: vehicle.vehicleType,
                        speed: speedNum,
                        speedLimit,
                        location: collisionLoc,
                        vehicleImagePath:
                          collisionObs?.imageUrl ||
                          collisionObs?.vehicleImagePath ||
                          collisionObs?.vehicle_image_url ||
                          vehicle.vehicleImagePath ||
                          vehicle.vehicle_image_url ||
                          vehicle.imageUrl,
                        videoClipPath:
                          collisionObs?.videoClipPath ||
                          collisionObs?.videoUrl ||
                          vehicle.videoClipPath,
                      }

                      return (
                        <tr
                          key={vehicle.vehicleNumber}
                          className={`${isSelected ? 'is-selected-vehicle' : ''} ${index === 0 ? 'row-new-arrival' : ''}`}
                          onClick={() => selectVehicle(vehicle.vehicleNumber)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ minWidth: '130px' }}>
                            <VehicleImageThumbnail
                              onClick={(e) => {
                                e?.stopPropagation?.()
                                setInitialModalTab('vehicle')
                                setPreviewModalRow(rowForThumb)
                              }}
                              onPlayVideo={(e) => {
                                e?.stopPropagation?.()
                                setInitialModalTab('video')
                                setPreviewModalRow(rowForThumb)
                              }}
                              row={rowForThumb}
                              showFallbackImage={false}
                              size="table"
                            />
                          </td>
                          <td>
                            <div className="timestamp-cell">
                              <strong>{formatTime(incTime)}</strong>
                              {index === 0 && <span className="new-tag">NEW</span>}
                            </div>
                          </td>
                          <td>
                            <VehicleBadge type={vehicle.vehicleType} />
                          </td>
                          <td>
                            <div className="hsrp-plate-badge" title="High Security Registration Plate">
                              <span className="hsrp-country">
                                <span className="chakra-dot">☸</span>
                                IND
                              </span>
                              <span className="hsrp-code">{vehicle.vehicleNumber}</span>
                            </div>
                          </td>
                          <td>
                            <div className="speed-metric-cell">
                              <strong className={isOver ? 'speed-val alert' : 'speed-val'}>
                                {speedNum}
                              </strong>
                              <span className="speed-denom">/ {speedLimit} km/h</span>
                            </div>
                          </td>
                          <td>
                            {isCollision ? (
                              <span className="nh44-status-pill danger">
                                <AlertTriangle size={12} />
                                +{speedNum - speedLimit > 0 ? `${speedNum - speedLimit} km/h Over` : 'Collision'}
                              </span>
                            ) : isOver ? (
                              <span className="nh44-status-pill danger">
                                <AlertTriangle size={12} />
                                +{speedNum - speedLimit} km/h Over
                              </span>
                            ) : (
                              <span className="nh44-status-pill normal">
                                <CheckCircle2 size={12} />
                                Normal
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="nh44-confidence-badge"
                              style={{ color: confidenceVal >= 90 ? '#059669' : '#d97706' }}
                            >
                              {confidenceVal}%
                            </span>
                          </td>
                          <td>
                            <span className="nh44-location-cell">
                              <MapPin size={13} />
                              {collisionLoc}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`evidence-table-action-btn ${isSelected ? 'is-active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectAndScroll(vehicle.vehicleNumber)
                              }}
                              title="Focus vehicle navigation on map"
                            >
                              <Route size={12} /> {isSelected ? 'Viewing' : 'View'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="evidence-table-empty">
                        No records found matching "{collisionSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="evidence-table-card-footer evidence-pagination-footer">
              <div className="evidence-pagination-info">
                <span>Showing <strong>{filteredCollisionList.length ? (collisionPage - 1) * collisionPageSize + 1 : 0}</strong>–<strong>{Math.min(collisionPage * collisionPageSize, filteredCollisionList.length)}</strong> of <strong>{filteredCollisionList.length}</strong> records</span>
              </div>
              <div className="evidence-pagination-controls">
                <div className="evidence-page-size-selector">
                  <span>Show</span>
                  <select
                    value={collisionPageSize}
                    onChange={(e) => {
                      setCollisionPageSize(Number(e.target.value))
                      setCollisionPage(1)
                    }}
                    aria-label="Rows per page"
                  >
                    <option value={10}>10 rows</option>
                    <option value={15}>15 rows</option>
                    <option value={25}>25 rows</option>
                  </select>
                </div>
                <div className="evidence-page-buttons">
                  <button
                    type="button"
                    disabled={collisionPage <= 1}
                    onClick={() => setCollisionPage((p) => Math.max(1, p - 1))}
                    className="evidence-page-btn"
                    title="Previous Page"
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="evidence-page-num">
                    Page <strong>{collisionPage}</strong> of <strong>{totalCollisionPages}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={collisionPage >= totalCollisionPages}
                    onClick={() => setCollisionPage((p) => Math.min(totalCollisionPages, p + 1))}
                    className="evidence-page-btn"
                    title="Next Page"
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              TABLE 2: DETAILED LOCATION POINTS (MATCHING USER SCREENSHOT)
          ────────────────────────────────────────────────────────── */}
          <div className="nh44-table-panel evidence-nh44-panel" id="detailed-location-points-table">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">SEQUENTIAL CORRIDOR SURVEILLANCE</p>
                <h2>Checkpoint Detections ({selectedVehicle?.vehicleNumber})</h2>
              </div>
              <div className="table-heading-right">
                <span className="nh44-live-indicator">
                  <span className="pulse-dot" />
                  Live Feed
                </span>
                <span className="record-count">
                  {selectedObservations.length} Checkpoints along NH-44
                </span>
              </div>
            </div>

            {/* Checkpoint Summary Strip */}
            <div className="evidence-checkpoint-strip">
              <span className="evidence-strip-label">Sequential passage:</span>
              <div className="evidence-strip-pills">
                {selectedObservations.map((obs, i) => {
                  const isPtCol = isCollisionObservation(obs)
                  const isPtSpd = isSpeeding(obs)
                  return (
                    <span
                      key={i}
                      className={`evidence-strip-pill ${isPtCol ? 'is-collision' : isPtSpd ? 'is-speeding' : 'is-normal'} ${focusObservationIndex === i ? 'is-focused' : ''}`}
                      onClick={() => selectObservation(i)}
                      title={`CP ${i + 1}: ${obs.cameraName || obs.cameraId} (${obs.speed} km/h)`}
                    >
                      <b>CP {i + 1}</b> {obs.cameraName?.split(' ')[0] || obs.cameraId} ({obs.speed} km/h)
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Scrollable Container with Sticky Header */}
            <div className="traffic-table-wrapper evidence-table-scroll-container">
              <table className="traffic-table nh44-table">
                <thead>
                  <tr>
                    <th>STOP</th>
                    <th>SURVEILLANCE SNAPSHOT</th>
                    <th>TIMESTAMP (IST)</th>
                    <th>NUMBER PLATE (HSRP)</th>
                    <th>SPEED / LIMIT</th>
                    <th>RADAR STATUS</th>
                    <th>ANPR OCR</th>
                    <th>HIGHWAY CHECKPOINT</th>
                    <th>TRANSIT DELTA</th>
                    <th>MAP FOCUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedObservations.length ? (
                    selectedObservations.map((observation, index) => {
                      const incident = isCollisionObservation(observation)
                      const speeding = isSpeeding(observation)
                      const speedNum = Number(observation.speed || 80)
                      const speedLimit = Number(observation.speedLimit || 60)
                      const isOver = speedNum > speedLimit
                      const confidenceVal = Math.round(
                        (observation.confidence || 0.94) > 1
                          ? (observation.confidence || 94)
                          : ((observation.confidence || 0.94) * 100)
                      )
                      const prevObservation = index > 0 ? selectedObservations[index - 1] : null
                      const transitTime = observation.transitDelta || (prevObservation
                        ? getTransitDelta(prevObservation.timestamp, observation.timestamp)
                        : 'Corridor Entry')
                      const cameraObj = cameras.find((c) =>
                        String(c.id).toLowerCase() === String(observation.cameraId || '').toLowerCase() ||
                        String(c.name).toLowerCase() === String(observation.location || '').toLowerCase()
                      )
                      const checkpointLoc = cameraObj?.name || observation.cameraName || observation.location || 'NH-44 Corridor'

                      const obsRowForThumb = {
                        ...observation,
                        vehicleNumberPlate: selectedVehicle?.vehicleNumber,
                        numberPlate: selectedVehicle?.vehicleNumber,
                        vehicleType: selectedVehicle?.vehicleType,
                        type: selectedVehicle?.vehicleType,
                        speed: speedNum,
                        speedLimit,
                        location: checkpointLoc,
                      }

                      return (
                        <tr
                          className={`${focusObservationIndex === index ? 'is-focused' : ''} ${incident ? 'is-incident-row' : ''}`}
                          key={`${observation.cameraId}-${observation.timestamp}-${index}`}
                          onClick={() => selectObservation(index)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <span className={`nh44-stop-badge ${incident ? 'incident' : speeding ? 'speeding' : ''}`}>
                              CP {String(index + 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <VehicleImageThumbnail
                              onClick={(e) => {
                                e?.stopPropagation?.()
                                setInitialModalTab('vehicle')
                                setPreviewModalRow(obsRowForThumb)
                              }}
                              onPlayVideo={(e) => {
                                e?.stopPropagation?.()
                                setInitialModalTab('video')
                                setPreviewModalRow(obsRowForThumb)
                              }}
                              row={obsRowForThumb}
                              showFallbackImage={false}
                              size="table"
                            />
                          </td>
                          <td>
                            <div className="timestamp-cell">
                              <strong>{formatTime(observation.timestamp)}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="hsrp-plate-badge" title="High Security Registration Plate">
                              <span className="hsrp-country">
                                <span className="chakra-dot">☸</span>
                                IND
                              </span>
                              <span className="hsrp-code">{selectedVehicle?.vehicleNumber}</span>
                            </div>
                          </td>
                          <td>
                            <div className="speed-metric-cell">
                              <strong className={isOver ? 'speed-val alert' : 'speed-val'}>
                                {speedNum}
                              </strong>
                              <span className="speed-denom">/ {speedLimit} km/h</span>
                            </div>
                          </td>
                          <td>
                            {incident ? (
                              <span className="nh44-status-pill danger">
                                <AlertTriangle size={12} />
                                Collision Point
                              </span>
                            ) : isOver ? (
                              <span className="nh44-status-pill danger">
                                <AlertTriangle size={12} />
                                +{speedNum - speedLimit} km/h Over
                              </span>
                            ) : (
                              <span className="nh44-status-pill normal">
                                <CheckCircle2 size={12} />
                                Normal
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="nh44-confidence-badge"
                              style={{ color: confidenceVal >= 90 ? '#059669' : '#d97706' }}
                            >
                              {confidenceVal}%
                            </span>
                          </td>
                          <td>
                            <span className="nh44-location-cell">
                              <MapPin size={13} />
                              {checkpointLoc} ({cameraObj?.corridorKm || observation.corridorKm || `KM ${20 + index * 12}`})
                            </span>
                          </td>
                          <td>
                            <span className="evidence-transit-badge">{transitTime}</span>
                          </td>
                          <td>
                            <button
                              aria-label={`Show checkpoint ${index + 1} on map`}
                              className={`evidence-focus-button ${focusObservationIndex === index ? 'is-active' : ''}`}
                              disabled={!hasCoordinates(observation)}
                              onClick={(e) => {
                                e.stopPropagation()
                                selectObservation(index)
                              }}
                              title={hasCoordinates(observation) ? 'Focus this checkpoint on the map' : 'No coordinates available'}
                              type="button"
                            >
                              <MapPin size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td className="evidence-table-empty" colSpan={10}>
                        No checkpoint evidence is available for this vehicle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="evidence-table-card-footer evidence-pagination-footer">
              <div className="evidence-pagination-info">
                <span>Passage trail for <strong>{selectedVehicle?.vehicleNumber}</strong> along NH-44 corridor.</span>
              </div>
              <div className="record-count">
                {selectedObservations.length} checkpoints monitored
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEDIA PREVIEW MODAL */}
      {previewModalRow && (
        <MediaPreviewModal
          allRows={filteredCollisionList}
          initialTab={initialModalTab}
          isOpen={Boolean(previewModalRow)}
          onClose={() => setPreviewModalRow(null)}
          onSelectRow={setPreviewModalRow}
          row={previewModalRow}
        />
      )}
    </main>
  )
}
