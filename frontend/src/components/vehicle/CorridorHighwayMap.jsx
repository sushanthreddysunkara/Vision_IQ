import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  ChevronRight,
  CloudRain,
  Flame,
  Gauge,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  Radio,
  ShieldAlert,
  Truck,
  Video,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { CORRIDORS_LIST, getCorridorById } from '../../data/corridorsData'

// 1. Waypoint data with exact GPS coordinates along the NH-44 Hyderabad to Bengaluru corridor
const CORRIDOR_POINTS = [
  {
    id: 'HYD',
    name: 'Hyderabad (PVNR)',
    km: 0,
    lat: 17.3950,
    lng: 78.4480,
    isTerminal: true,
    terminalLabel: '← Hyderabad',
    speed: 85,
    speedStatus: 'free',
    hasCamera: true,
  },
  {
    id: 'ATTA',
    name: 'Attapur',
    km: 8,
    lat: 17.3580,
    lng: 78.4420,
    speed: 78,
    speedStatus: 'free',
    hasCamera: true,
  },
  {
    id: 'ARAM',
    name: 'Aramghar',
    km: 14,
    lat: 17.3210,
    lng: 78.4415,
    speed: 82,
    speedStatus: 'free',
    hasCamera: true,
  },
  {
    id: 'GAGAN',
    name: 'Gaganpahad',
    km: 20,
    lat: 17.2750,
    lng: 78.4310,
    speed: 82,
    speedStatus: 'free',
  },
  {
    id: 'SHAM',
    name: 'Shamshabad',
    km: 28,
    lat: 17.2510,
    lng: 78.4285,
    speed: 82,
    speedStatus: 'free',
    hasCamera: true,
    cameraId: 'CAM-NH44-01-SHAMSHABAD',
  },
  {
    id: 'THIM',
    name: 'Thimmapur',
    km: 42,
    lat: 17.1850,
    lng: 78.3320,
    speed: 78,
    speedStatus: 'moderate',
  },
  {
    id: 'SHAD',
    name: 'Shadnagar',
    km: 58,
    lat: 17.0720,
    lng: 78.2090,
    speed: 55,
    speedStatus: 'slow',
    cameraId: 'CAM-NH44-02-SHADNAGAR',
    hasIncident: true,
    incident: {
      id: 'inc-raikal',
      title: 'Slow Traffic · Toll Plaza Queue',
      shortTitle: 'Toll Queue',
      location: 'NH-44, Km 58 · Raikal Toll Plaza',
      shortLocation: 'Km 58 (Toll)',
      detail: '~12 min delay · Monitoring',
      shortDetail: '~12 min delay',
      time: '08:20 AM',
      severity: 'Medium',
      type: 'toll',
      color: '#d97706',
    },
  },
  {
    id: 'BALA',
    name: 'Balanagar',
    km: 72,
    lat: 16.9200,
    lng: 78.1750,
    speed: 48,
    speedStatus: 'slow',
  },
  {
    id: 'JADC',
    name: 'Jadcherla',
    km: 84.5,
    lat: 16.7650,
    lng: 78.1400,
    speed: 32,
    speedStatus: 'congested',
    hasIncident: true,
    incident: {
      id: 'inc-jadc',
      title: 'Accident / Collision',
      shortTitle: 'Accident',
      location: 'NH-44, Km 84.5 · Near Jadcherla',
      shortLocation: 'Km 84.5 (SB)',
      detail: '2 lanes blocked · Response in progress',
      shortDetail: '2 lanes blocked',
      time: '08:32 AM',
      severity: 'High',
      type: 'accident',
      color: '#dc2626',
    },
    cameraId: 'CAM-NH44-05-JADCHERLA',
  },
  {
    id: 'BHOO',
    name: 'Bhootpur',
    km: 104,
    lat: 16.5800,
    lng: 78.0200,
    speed: 78,
    speedStatus: 'moderate',
  },
  {
    id: 'KOTH',
    name: 'Kothakota',
    km: 131.2,
    lat: 16.3750,
    lng: 77.9400,
    speed: 78,
    speedStatus: 'moderate',
    hasIncident: true,
    incident: {
      id: 'inc-koth',
      title: 'Stalled Vehicle',
      shortTitle: 'Stalled Vehicle',
      location: 'NH-44, Km 131.2 · Near Kothakota',
      shortLocation: 'Km 131.2 (SB)',
      detail: 'Lane 2 blocked · Tow vehicle dispatched',
      shortDetail: 'Lane 2 blocked',
      time: '08:28 AM',
      severity: 'Medium',
      type: 'stalled',
      color: '#d97706',
    },
  },
  {
    id: 'PEBB',
    name: 'Pebbair',
    km: 168,
    lat: 16.2050,
    lng: 77.9950,
    speed: 86,
    speedStatus: 'free',
  },
  {
    id: 'KRIS',
    name: 'Krishna River',
    km: 192,
    lat: 16.0200,
    lng: 78.0100,
    speed: 82,
    speedStatus: 'free',
  },
  {
    id: 'KURN',
    name: 'Kurnool',
    km: 215,
    lat: 15.8281,
    lng: 78.0373,
    isMajorHub: true,
    speed: 84,
    speedStatus: 'free',
    hasCamera: true,
  },
  {
    id: 'VELD',
    name: 'Veldurthi',
    km: 242,
    lat: 15.6100,
    lng: 77.9500,
    speed: 80,
    speedStatus: 'free',
  },
  {
    id: 'DHON',
    name: 'Dhone',
    km: 268,
    lat: 15.4200,
    lng: 77.8750,
    speed: 82,
    speedStatus: 'free',
  },
  {
    id: 'GOOT_RS',
    name: 'Gooty Toll',
    km: 290,
    lat: 15.2500,
    lng: 77.7500,
    speed: 72,
    speedStatus: 'moderate',
  },
  {
    id: 'GOOT',
    name: 'Gooty',
    km: 312,
    lat: 15.1150,
    lng: 77.6350,
    speed: 72,
    speedStatus: 'moderate',
  },
  {
    id: 'PAMI',
    name: 'Pamidi',
    km: 355,
    lat: 14.8800,
    lng: 77.6100,
    speed: 85,
    speedStatus: 'free',
  },
  {
    id: 'ANAN',
    name: 'Anantapur',
    km: 398,
    lat: 14.6819,
    lng: 77.6006,
    isMajorHub: true,
    speed: 88,
    speedStatus: 'free',
    hasIncident: true,
    incident: {
      id: 'inc-anan',
      title: 'Vehicle Fire',
      shortTitle: 'Vehicle Fire',
      location: 'NH-44, Km 398 · Near Raptadu, Anantapur',
      shortLocation: 'Km 398 (NB)',
      detail: 'Car on shoulder · Fire tender requested',
      shortDetail: 'Fire tender on site',
      time: '08:39 AM',
      severity: 'High',
      type: 'fire',
      color: '#dc2626',
    },
  },
  {
    id: 'MARU',
    name: 'Marur',
    km: 420,
    lat: 14.4200,
    lng: 77.6000,
    speed: 76,
    speedStatus: 'moderate',
  },
  {
    id: 'PENU',
    name: 'Penukonda',
    km: 441,
    lat: 14.0833,
    lng: 77.5933,
    speed: 48,
    speedStatus: 'slow',
    hasIncident: true,
    incident: {
      id: 'inc-penu',
      title: 'Flooding / Waterlogging',
      shortTitle: 'Waterlogging',
      location: 'NH-44, Km 441 · Near Penukonda underpass',
      shortLocation: 'Km 441 (Both)',
      detail: '1 lane affected · Pump crew en route',
      shortDetail: '1 lane affected',
      time: '08:21 AM',
      severity: 'High',
      type: 'flooding',
      color: '#dc2626',
    },
  },
  {
    id: 'KODU',
    name: 'Kodur',
    km: 462,
    lat: 13.9200,
    lng: 77.6800,
    speed: 82,
    speedStatus: 'free',
  },
  {
    id: 'BAGE',
    name: 'Bagepalli',
    km: 485,
    lat: 13.7850,
    lng: 77.7920,
    speed: 84,
    speedStatus: 'free',
  },
  {
    id: 'CHIK',
    name: 'Chikkaballapur',
    km: 520,
    lat: 13.4325,
    lng: 77.7275,
    speed: 80,
    speedStatus: 'free',
  },
  {
    id: 'DEVA',
    name: 'Devanahalli',
    km: 545,
    lat: 13.2483,
    lng: 77.7125,
    speed: 68,
    speedStatus: 'moderate',
    hasCamera: true,
  },
  {
    id: 'HEBB',
    name: 'Hebbal',
    km: 560,
    lat: 13.1000,
    lng: 77.6300,
    speed: 72,
    speedStatus: 'moderate',
  },
  {
    id: 'BLR',
    name: 'Bengaluru',
    km: 570,
    lat: 12.9716,
    lng: 77.5946,
    isTerminal: true,
    terminalLabel: 'Bengaluru →',
    speed: 85,
    speedStatus: 'free',
    hasCamera: true,
  },
]

// 2. Incident List matching the user's screenshot
const RECENT_INCIDENTS = [
  {
    id: 'inc-anan',
    pointId: 'ANAN',
    title: 'Vehicle Fire',
    location: 'NH-44, Km 398 · Near Raptadu, Anantapur',
    detail: 'Car on shoulder · Fire tender requested',
    time: '08:39 AM',
    severity: 'High',
    type: 'fire',
    color: '#dc2626',
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
  },
  {
    id: 'inc-jadc',
    pointId: 'JADC',
    title: 'Accident / Collision',
    location: 'NH-44, Km 84.5 · Near Jadcherla',
    detail: '2 lanes blocked · Response in progress',
    time: '08:32 AM',
    severity: 'High',
    type: 'accident',
    color: '#dc2626',
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
  },
  {
    id: 'inc-koth',
    pointId: 'KOTH',
    title: 'Stalled Vehicle',
    location: 'NH-44, Km 131.2 · Near Kothakota',
    detail: 'Lane 2 blocked · Tow vehicle dispatched',
    time: '08:28 AM',
    severity: 'Medium',
    type: 'stalled',
    color: '#d97706',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
  },
  {
    id: 'inc-penu',
    pointId: 'PENU',
    title: 'Flooding / Waterlogging',
    location: 'NH-44, Km 441 · Near Penukonda underpass',
    detail: '1 lane affected · Pump crew en route',
    time: '08:21 AM',
    severity: 'High',
    type: 'flooding',
    color: '#dc2626',
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
  },
  {
    id: 'inc-raikal',
    pointId: 'SHAD',
    title: 'Slow Traffic · Toll Plaza Queue',
    location: 'NH-44, Km 58 · Raikal Toll Plaza',
    detail: '~12 min delay · Monitoring',
    time: '08:20 AM',
    severity: 'Medium',
    type: 'toll',
    color: '#d97706',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
  },
]

// Speed helper
function getSpeedColor(speed) {
  if (speed >= 80) return '#16a34a'
  if (speed >= 60) return '#eab308'
  if (speed >= 40) return '#f97316'
  return '#dc2626'
}

// Custom DivIcons for the Real Leaflet Map
const iconsCache = new Map()

function getIncidentDivIcon(type, color, isSelected) {
  const cacheKey = `incident-${type}-${color}-${isSelected}`
  if (iconsCache.has(cacheKey)) return iconsCache.get(cacheKey)

  let iconMarkup = ''
  if (type === 'fire') {
    iconMarkup = renderToStaticMarkup(<Flame size={15} strokeWidth={2.4} />)
  } else if (type === 'stalled') {
    iconMarkup = renderToStaticMarkup(<Truck size={14} strokeWidth={2.4} />)
  } else if (type === 'flooding') {
    iconMarkup = renderToStaticMarkup(<CloudRain size={14} strokeWidth={2.4} />)
  } else if (type === 'toll') {
    iconMarkup = renderToStaticMarkup(<Radio size={14} strokeWidth={2.4} />)
  } else {
    iconMarkup = renderToStaticMarkup(<AlertTriangle size={15} strokeWidth={2.4} />)
  }

  const icon = divIcon({
    className: 'corridor-leaflet-div-icon',
    html: `
      <div class="leaflet-incident-pin ${isSelected ? 'is-selected' : ''}" style="--pin-color: ${color}">
        <span class="incident-pulse-beacon"></span>
        <div class="incident-badge-circle" style="background: ${color}">
          ${iconMarkup}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })

  iconsCache.set(cacheKey, icon)
  return icon
}

function getCameraDivIcon() {
  const cacheKey = 'camera-pin'
  if (iconsCache.has(cacheKey)) return iconsCache.get(cacheKey)

  const markup = renderToStaticMarkup(<Camera size={13} strokeWidth={2.4} />)
  const icon = divIcon({
    className: 'corridor-leaflet-div-icon',
    html: `
      <div class="leaflet-camera-pin">
        <div class="camera-badge-circle">
          ${markup}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

  iconsCache.set(cacheKey, icon)
  return icon
}

function getTerminalDivIcon(label, isStart) {
  const cacheKey = `terminal-${label}-${isStart}`
  if (iconsCache.has(cacheKey)) return iconsCache.get(cacheKey)

  const icon = divIcon({
    className: 'corridor-leaflet-div-icon',
    html: `
      <div class="leaflet-terminal-pin ${isStart ? 'is-start' : 'is-end'}">
        <div class="terminal-ring"></div>
        <span class="terminal-name">${label}</span>
      </div>
    `,
    iconSize: [110, 32],
    iconAnchor: [isStart ? 10 : 90, 16],
  })

  iconsCache.set(cacheKey, icon)
  return icon
}

function getCityNodeDivIcon(name, speedColor, isMajorHub) {
  const cacheKey = `node-${name}-${speedColor}-${isMajorHub}`
  if (iconsCache.has(cacheKey)) return iconsCache.get(cacheKey)

  const icon = divIcon({
    className: 'corridor-leaflet-div-icon',
    html: `
      <div class="leaflet-city-pin ${isMajorHub ? 'is-hub' : ''}">
        <div class="city-dot" style="border-color: ${speedColor}"></div>
        <span class="city-label">${name}</span>
      </div>
    `,
    iconSize: [90, 24],
    iconAnchor: [8, 12],
  })

  iconsCache.set(cacheKey, icon)
  return icon
}

// Helper components for React-Leaflet
function MapViewportFly({ targetCoords, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, zoom || 11, { animate: true, duration: 1.1 })
    }
  }, [map, targetCoords, zoom])
  return null
}

function MapAutoBoundsFit({ allPositions, triggerFit, maxZoom = 11 }) {
  const map = useMap()
  useEffect(() => {
    if (allPositions && allPositions.length > 1) {
      map.fitBounds(allPositions, { padding: [35, 35], maxZoom: maxZoom || 11, animate: true })
    }
  }, [map, triggerFit, maxZoom])
  return null
}

function LeafletCustomControls({ onFitRoute, showSpeedLayers, onToggleLayers }) {
  const map = useMap()
  return (
    <div className="corridor-leaflet-controls-overlay">
      <button
        aria-label="Zoom in"
        className="corridor-control-btn"
        onClick={() => map.zoomIn()}
        title="Zoom in (+)"
        type="button"
      >
        <Plus size={16} />
      </button>
      <button
        aria-label="Zoom out"
        className="corridor-control-btn"
        onClick={() => map.zoomOut()}
        title="Zoom out (−)"
        type="button"
      >
        <Minus size={16} />
      </button>
      <button
        aria-label="Fit entire corridor"
        className="corridor-control-btn"
        onClick={onFitRoute}
        title="Fit entire NH-44 corridor"
        type="button"
      >
        <LocateFixed size={15} />
      </button>
      <button
        aria-label="Toggle traffic speed layers"
        className={`corridor-control-btn ${!showSpeedLayers ? 'active' : ''}`}
        onClick={onToggleLayers}
        title="Toggle speed telemetry layer"
        type="button"
      >
        <Layers size={15} />
      </button>
    </div>
  )
}

function renderIncidentIcon(inc) {
  const type = `${inc.type || ''} ${inc.incidentType || ''} ${inc.title || ''}`.toLowerCase()
  if (type.includes('fire')) return <Flame size={17} />
  if (type.includes('collision') || type.includes('accident') || type.includes('crash')) return <AlertTriangle size={17} />
  if (type.includes('stalled') || type.includes('breakdown') || type.includes('truck')) return <Truck size={17} />
  if (type.includes('flooding') || type.includes('rain') || type.includes('water')) return <CloudRain size={17} />
  if (type.includes('toll') || type.includes('gate') || type.includes('congestion')) return <Radio size={17} />
  if (type.includes('speed') || type.includes('radar') || type.includes('overspeed')) return <Gauge size={17} />
  if (type.includes('wrong') || type.includes('hazard') || type.includes('obstruction') || type.includes('debris') || type.includes('signal') || type.includes('pedestrian')) return <ShieldAlert size={17} />
  return <AlertTriangle size={17} />
}

export default function CorridorHighwayMap({
  onOpenLiveCamera = null,
  onSelectIncident = null,
  selectedCorridorId: controlledCorridorId = null,
  onSelectCorridor = null,
}) {
  const navigate = useNavigate()

  // Selected corridor state
  const [internalCorridor, setInternalCorridor] = useState('NH-44')
  const activeCorridorId = controlledCorridorId || internalCorridor
  const currentCorridorData = useMemo(() => getCorridorById(activeCorridorId), [activeCorridorId])

  // Active waypoints and incidents from the current corridor
  const activeWaypoints = useMemo(() => currentCorridorData.waypoints || CORRIDOR_POINTS, [currentCorridorData])
  const activeIncidents = useMemo(() => {
    if (currentCorridorData.incidents && currentCorridorData.incidents.length > 0) {
      return currentCorridorData.incidents
    }
    return RECENT_INCIDENTS
  }, [currentCorridorData])

  // Selected incident/waypoint: defaults to first incident of the corridor
  const [selectedIncidentId, setSelectedIncidentId] = useState('inc-jadc')
  const [flyTarget, setFlyTarget] = useState(null)
  const [fitTrigger, setFitTrigger] = useState(1)

  // Filters & Layer Toggles
  const [showSpeedLayers, setShowSpeedLayers] = useState(true)
  const [timeWindow, setTimeWindow] = useState('Last 2 Hours')
  const [incidentFilter, setIncidentFilter] = useState('All Incident Types')

  // When corridor changes, update default selected incident and fly target
  useEffect(() => {
    if (activeIncidents.length > 0) {
      setSelectedIncidentId(activeIncidents[0].id)
    }
    if (currentCorridorData.mapCenter) {
      setFlyTarget(currentCorridorData.mapCenter)
      setFitTrigger((prev) => prev + 1)
    }
  }, [activeCorridorId, activeIncidents, currentCorridorData])

  // Find active incident
  const activeIncident = useMemo(() => {
    return activeIncidents.find((inc) => inc.id === selectedIncidentId) || activeIncidents[0] || RECENT_INCIDENTS[0]
  }, [selectedIncidentId, activeIncidents])

  const activePoint = useMemo(() => {
    if (!activeIncident) return activeWaypoints[0] || CORRIDOR_POINTS[6]
    return (
      activeWaypoints.find((pt) => pt.id && activeIncident.pointId && pt.id === activeIncident.pointId) ||
      activeWaypoints.find((pt) => activeIncident.location && pt.name && activeIncident.location.includes(pt.name)) ||
      activeWaypoints[0]
    )
  }, [activeIncident, activeWaypoints])

  const isRing = Boolean(currentCorridorData.isRingRoad || activeCorridorId === 'ORR-HYD')

  // All corridor GPS positions for polyline and bounds
  const allPositions = useMemo(() => {
    if (currentCorridorData.pathCoordinates && currentCorridorData.pathCoordinates.length > 0) {
      return currentCorridorData.pathCoordinates
    }
    const pts = activeWaypoints.map((pt) => [pt.lat, pt.lng])
    if (isRing && pts.length > 2) {
      return [...pts, pts[0]]
    }
    return pts
  }, [currentCorridorData, activeWaypoints, isRing])

  // Filtered incidents list based on dropdown
  const filteredIncidents = useMemo(() => {
    if (incidentFilter === 'Accidents') {
      return activeIncidents.filter((inc) => (inc.type || inc.incidentType) === 'accident' || (inc.type || inc.incidentType) === 'collision')
    }
    if (incidentFilter === 'Vehicle Fire') {
      return activeIncidents.filter((inc) => (inc.type || inc.incidentType) === 'fire')
    }
    if (incidentFilter === 'Traffic & Toll') {
      return activeIncidents.filter((inc) => (inc.type || inc.incidentType) === 'toll' || (inc.type || inc.incidentType) === 'stalled')
    }
    return activeIncidents
  }, [incidentFilter, activeIncidents])

  // Select incident and fly to it
  const handleSelectIncident = useCallback((inc) => {
    setSelectedIncidentId(inc.id)
    const targetPt = activeWaypoints.find((pt) => pt.id === inc.pointId)
    if (targetPt) {
      setFlyTarget([targetPt.lat, targetPt.lng])
    }
    if (onSelectIncident) {
      onSelectIncident(inc)
    }
  }, [onSelectIncident, activeWaypoints])

  return (
    <div className="corridor-map-grid-container" id="corridor-highway-map-section">
      {/* ──────────────────────────────────────────────────────────────────────
          LEFT CARD: REAL LEAFLET LIVE HIGHWAY VIEW (MAP CONTAINER, ZOOM & PAN)
          ────────────────────────────────────────────────────────────────────── */}
      <div className="corridor-highway-card">
        {/* Header with Title and Dropdown Filters */}
        <div className="corridor-highway-header">
          <div className="corridor-title-wrap">
            <h2 className="corridor-highway-title">Live Highway View</h2>
          </div>

          <div className="corridor-filters-wrap">
            <label className="corridor-select-box" title="Select Corridor">
              <select
                aria-label="Select Corridor"
                className="corridor-select-native"
                onChange={(e) => {
                  setInternalCorridor(e.target.value)
                  if (onSelectCorridor) onSelectCorridor(e.target.value)
                }}
                value={activeCorridorId}
              >
                {CORRIDORS_LIST.map((corr) => (
                  <option key={corr.id} value={corr.id}>
                    {corr.code} · {corr.shortName} ({corr.lengthKm} km)
                  </option>
                ))}
              </select>
              <span>{currentCorridorData.code} · {currentCorridorData.shortName}</span>
              <ChevronDown size={14} />
            </label>

            <label className="corridor-select-box" title="Time Horizon">
              <select
                aria-label="Time Horizon"
                className="corridor-select-native"
                onChange={(e) => setTimeWindow(e.target.value)}
                value={timeWindow}
              >
                <option value="Last 2 Hours">Last 2 Hours</option>
                <option value="Last 6 Hours">Last 6 Hours</option>
                <option value="Today">Today</option>
                <option value="Last 24 Hours">Last 24 Hours</option>
              </select>
              <span>{timeWindow}</span>
              <ChevronDown size={14} />
            </label>

            <label className="corridor-select-box" title="Incident Filter">
              <select
                aria-label="Incident Filter"
                className="corridor-select-native"
                onChange={(e) => setIncidentFilter(e.target.value)}
                value={incidentFilter}
              >
                <option value="All Incident Types">All Incident Types</option>
                <option value="Accidents">Accidents Only</option>
                <option value="Vehicle Fire">Vehicle Fire</option>
                <option value="Traffic & Toll">Traffic & Tolls</option>
              </select>
              <span>{incidentFilter}</span>
              <ChevronDown size={14} />
            </label>
          </div>
        </div>

        {/* Real Leaflet Map Viewport */}
        <div className="corridor-real-map-viewport">
          <MapContainer
            center={currentCorridorData.mapCenter || (isRing ? [17.4062, 78.4665] : [15.2, 77.9])}
            className="corridor-real-leaflet-map"
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%', minHeight: '480px' }}
            zoom={currentCorridorData.defaultZoom || (isRing ? 10 : 7)}
            zoomControl={false}
          >
            {/* Tile Layer: OpenStreetMap Standard Tiles (same as Vehicle Info page) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto fit & fly handlers */}
            <MapAutoBoundsFit
              allPositions={allPositions}
              maxZoom={currentCorridorData.defaultZoom || (isRing ? 11 : 9)}
              triggerFit={fitTrigger}
            />
            {flyTarget && <MapViewportFly targetCoords={flyTarget} zoom={currentCorridorData.defaultZoom || 11} />}

            {/* Custom Control Buttons in Top-Right */}
            <LeafletCustomControls
              onFitRoute={() => setFitTrigger((prev) => prev + 1)}
              onToggleLayers={() => setShowSpeedLayers((prev) => !prev)}
              showSpeedLayers={showSpeedLayers}
            />

            {/* 1. Base Highway Road Polyline (White Border) */}
            <Polyline
              pathOptions={{
                color: '#ffffff',
                weight: 8,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              positions={allPositions}
            />

            {/* 1B. Inner Highway Road Line (Vibrant Highway Blue Accent) */}
            <Polyline
              pathOptions={{
                color: '#1d4ed8',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              positions={allPositions}
            />

            {/* 2. Speed Telemetry Polylines along the Selected Corridor */}
            {showSpeedLayers &&
              activeWaypoints.map((pt, index) => {
                const isLast = index === activeWaypoints.length - 1
                if (isLast && !isRing) return null
                const nextPt = isLast ? activeWaypoints[0] : activeWaypoints[index + 1]
                const segColor = getSpeedColor(pt.speed || 80)
                return (
                  <Polyline
                    key={`seg-line-${pt.id || pt.name}-${nextPt.id || nextPt.name}`}
                    pathOptions={{
                      color: segColor,
                      weight: 5,
                      opacity: 1,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                    positions={[
                      [pt.lat, pt.lng],
                      [nextPt.lat, nextPt.lng],
                    ]}
                  />
                )
              })}

            {/* 3. Markers for Waypoints, Incidents, Cameras & Terminals */}
            {activeWaypoints.map((pt, idx) => {
              const ptKey = pt.id || pt.name || `wp-${idx}`
              const isSelected = Boolean(
                activePoint &&
                  ((pt.id && activePoint.id === pt.id) ||
                    (pt.name && activePoint.name === pt.name))
              )
              const hasDirectIncident = Boolean(pt.hasIncident && pt.incident)
              const hasActiveIncidentMatch = Boolean(
                activeIncident &&
                  ((activeIncident.pointId && pt.id && activeIncident.pointId === pt.id) ||
                    (activeIncident.location && pt.name && (
                      activeIncident.location.toLowerCase().includes(pt.name.toLowerCase()) ||
                      pt.name.toLowerCase().includes(
                        (activeIncident.shortLocation || '').replace(/Km\s*[\d.]+\s*\(|\)/gi, '').trim().toLowerCase()
                      )
                    )))
              )
              const hasIncident = hasDirectIncident || hasActiveIncidentMatch
              const incObj = pt.incident || (hasIncident ? activeIncident : null)
              const isTerminal = pt.isTerminal && !isRing

              let pinIcon = null
              if (hasIncident && incObj) {
                pinIcon = getIncidentDivIcon(
                  incObj.type || incObj.incidentType || 'accident',
                  incObj.riskColor || incObj.color || '#dc2626',
                  isSelected
                )
              } else if (isTerminal) {
                pinIcon = getTerminalDivIcon(pt.terminalLabel || pt.name, pt.id === 'HYD' || pt.km === 0)
              } else if (pt.hasCamera) {
                pinIcon = getCameraDivIcon()
              } else {
                pinIcon = getCityNodeDivIcon(pt.shortName || pt.name, getSpeedColor(pt.speed || 75), pt.isMajorHub)
              }

              return (
                <Marker
                  eventHandlers={{
                    click: () => {
                      if (incObj && incObj.id) {
                        setSelectedIncidentId(incObj.id)
                      }
                      if (pt.cameraId && onOpenLiveCamera) {
                        onOpenLiveCamera({
                          id: pt.cameraId,
                          name: pt.name,
                          location: `${currentCorridorData.shortName || 'Highway'} · ${pt.name}`,
                        })
                      }
                    },
                  }}
                  icon={pinIcon}
                  key={`pt-marker-${ptKey}`}
                  position={[pt.lat, pt.lng]}
                >
                  {/* Tooltip on hover */}
                  <Tooltip direction="top" offset={[0, -14]} opacity={0.92}>
                    <div className="corridor-node-tooltip">
                      <strong>{pt.name}</strong> · {pt.km ? (String(pt.km).startsWith('Km') ? pt.km : `Km ${pt.km}`) : ''}
                      <small>Speed: {pt.speed || 75} km/h</small>
                    </div>
                  </Tooltip>

                  {/* Red Callout Popup matching the screenshot */}
                  {hasIncident && isSelected && incObj && (
                    <Popup
                      autoPan={false}
                      className="corridor-leaflet-callout"
                      closeButton={false}
                      offset={[0, -18]}
                      position={[pt.lat, pt.lng]}
                    >
                      <div className="corridor-callout-inner">
                        <div className="callout-arrow" />
                        <div className="callout-header">
                          <AlertTriangle size={15} strokeWidth={2.4} />
                          <span className="callout-title">
                            {incObj.shortTitle || incObj.title || 'Incident Hazard'}
                          </span>
                        </div>
                        <div className="callout-location">
                          {incObj.shortLocation || incObj.location || `Km ${pt.km}`}
                        </div>
                        <div className="callout-status">
                          {incObj.shortDetail || incObj.detail || incObj.description || 'Active traffic alert'}
                        </div>
                      </div>
                    </Popup>
                  )}
                </Marker>
              )
            })}
          </MapContainer>

          {/* Floating Traffic Speed Legend (Bottom-Left) */}
          <div className="corridor-speed-legend-overlay">
            <div className="corridor-legend-title">Traffic speed (km/h)</div>
            <div className="corridor-legend-items">
              <div className="corridor-legend-row">
                <span className="corridor-legend-bar" style={{ background: '#16a34a' }} />
                <span className="corridor-legend-text">&gt; 80 · Free flow</span>
              </div>
              <div className="corridor-legend-row">
                <span className="corridor-legend-bar" style={{ background: '#eab308' }} />
                <span className="corridor-legend-text">60 - 80 · Moderate</span>
              </div>
              <div className="corridor-legend-row">
                <span className="corridor-legend-bar" style={{ background: '#f97316' }} />
                <span className="corridor-legend-text">40 - 60 · Slow</span>
              </div>
              <div className="corridor-legend-row">
                <span className="corridor-legend-bar" style={{ background: '#dc2626' }} />
                <span className="corridor-legend-text">&lt; 40 · Congested</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────
          RIGHT CARD: RECENT INCIDENTS (MATCHING SCREENSHOT WITH REAL INTERACTIVITY)
          ────────────────────────────────────────────────────────────────────── */}
      <div className="corridor-incidents-card">
        {/* Header with Title and View All */}
        <div className="corridor-incidents-header">
          <h2 className="corridor-incidents-title">Recent Incidents</h2>
          <button
            className="corridor-incidents-view-all"
            onClick={() => navigate('/vehicle-information')}
            type="button"
          >
            View All
          </button>
        </div>

        {/* Incident List */}
        <div className="corridor-incidents-list">
          {filteredIncidents.map((inc) => {
            const isSelected = selectedIncidentId === inc.id

            return (
              <div
                className={`corridor-incident-item ${isSelected ? 'is-selected' : ''}`}
                key={inc.id}
                onClick={() => handleSelectIncident(inc)}
                role="button"
                tabIndex={0}
              >
                {/* Left Icon Badge */}
                <div
                  className="corridor-incident-icon"
                  style={{
                    background: inc.iconBg || (inc.severity === 'Critical' ? '#fee2e2' : '#fef3c7'),
                    color: inc.iconColor || inc.riskColor || (inc.severity === 'Critical' ? '#dc2626' : '#d97706'),
                  }}
                >
                  {renderIncidentIcon(inc)}
                </div>

                {/* Main Incident Details */}
                <div className="corridor-incident-body">
                  <div className="corridor-incident-row-top">
                    <strong className="corridor-incident-title">{inc.title}</strong>
                  </div>
                  <div className="corridor-incident-location">{inc.location}</div>
                  <div className="corridor-incident-detail">{inc.detail || inc.subtitle}</div>
                </div>

                {/* Right Meta: Time & Severity Tag */}
                <div className="corridor-incident-right">
                  <span className="corridor-incident-time">{inc.time}</span>
                  <span
                    className={`corridor-incident-badge ${(inc.severity || 'high').toLowerCase()}`}
                  >
                    {inc.severity}
                  </span>
                  <ChevronRight className="corridor-incident-arrow" size={14} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Summary */}
        <div className="corridor-incidents-footer">
          <span>{filteredIncidents.length} active incidents on {currentCorridorData.shortName || activeCorridorId}, {currentCorridorData.highRiskIncidents || 1} high severity with response moving.</span>
        </div>
      </div>
    </div>
  )
}
