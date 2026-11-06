import { useEffect, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Camera,
  CarFront,
  Clock3,
  LocateFixed,
  MapPinned,
  Maximize2,
  Minimize2,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import {
  getHighwayRouteForObservations,
  NH44_HIGHWAY_WAYPOINTS,
  sortObservationsChronologically,
} from '../../data/vehicleTrackingData'
import 'leaflet/dist/leaflet.css'

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
    let cleanStr = str.replace(/\s+IST\b/i, '').replace(/,/g, '');
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
  } catch {
    return String(value);
  }
}

function formatSafeDateTime(value) {
  const timestamp = parseSafeTimestamp(value);
  if (!Number.isFinite(timestamp)) return String(value);

  return new Date(timestamp).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const cameraPinIcon = divIcon({
  html: `<span class="vehicle-camera-pin">${renderToStaticMarkup(<Camera size={17} strokeWidth={2.4} />)}</span>`,
  className: 'vehicle-map-div-icon',
  iconSize: [34, 40],
  iconAnchor: [17, 37],
})

const incidentCameraPinIcon = divIcon({
  html: `<span class="vehicle-camera-pin is-incident">${renderToStaticMarkup(<Camera size={17} strokeWidth={2.4} />)}</span>`,
  className: 'vehicle-map-div-icon',
  iconSize: [34, 40],
  iconAnchor: [17, 37],
})

const pendingCameraPinIcon = divIcon({
  html: `<span class="vehicle-camera-pin is-pending">${renderToStaticMarkup(<Camera size={16} strokeWidth={2.4} />)}</span>`,
  className: 'vehicle-map-div-icon',
  iconSize: [34, 40],
  iconAnchor: [17, 37],
})

const carPinIcon = divIcon({
  html: `<span class="vehicle-car-pin">${renderToStaticMarkup(<CarFront size={21} strokeWidth={2.4} />)}</span>`,
  className: 'vehicle-map-div-icon',
  iconSize: [42, 46],
  iconAnchor: [21, 42],
})

function RouteViewport({ currentPoint, focusedPoint, focusObservationIndex, isFollowing, points, vehicleKey }) {
  const map = useMap()
  const fittedRouteKey = useRef('')
  const lastFocusKey = useRef('')
  const pointsRef = useRef(points)
  pointsRef.current = points
  const routeKey = `${vehicleKey}:${points.map((point) => point.join(',')).join(';')}`
  const focusKey = `${vehicleKey}:${focusObservationIndex ?? ''}`

  useEffect(() => {
    const currentPoints = pointsRef.current
    if (routeKey !== fittedRouteKey.current) {
      fittedRouteKey.current = routeKey
      lastFocusKey.current = focusKey
      if (currentPoints.length > 1) {
        map.fitBounds(currentPoints, { padding: [36, 36], maxZoom: 14, animate: true })
      } else if (currentPoints.length === 1) {
        map.setView(currentPoints[0], 15, { animate: true })
      }
      return
    }

    const focusChanged = focusKey !== lastFocusKey.current
    if (focusChanged) lastFocusKey.current = focusKey
    if (focusChanged && focusedPoint) {
      map.setView(focusedPoint, Math.max(map.getZoom(), 14), { animate: true })
    } else if (isFollowing && currentPoint) {
      map.setView(currentPoint, map.getZoom(), { animate: true })
    }
  }, [
    currentPoint?.[0],
    currentPoint?.[1],
    focusedPoint?.[0],
    focusedPoint?.[1],
    isFollowing,
    map,
    routeKey,
    focusKey,
  ])

  return null
}

function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    function refreshMapSize() {
      window.requestAnimationFrame(() => {
        try {
          map.invalidateSize()
        } catch {
          // ignore
        }
      })
    }

    refreshMapSize()
    const timer1 = setTimeout(refreshMapSize, 100)
    const timer2 = setTimeout(refreshMapSize, 400)
    const timer3 = setTimeout(refreshMapSize, 1000)

    window.addEventListener('resize', refreshMapSize)
    document.addEventListener('fullscreenchange', refreshMapSize)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener('resize', refreshMapSize)
      document.removeEventListener('fullscreenchange', refreshMapSize)
    }
  }, [map])

  return null
}

function MapControls({ points }) {
  const map = useMap()

  function focusRoute() {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [36, 36], maxZoom: 14, animate: true })
    } else if (points.length === 1) {
      map.setView(points[0], 15, { animate: true })
    }
  }

  return (
    <div className="vehicle-route-controls" aria-label="Map controls">
      <button type="button" onClick={() => map.zoomIn()} title="Zoom in" aria-label="Zoom in">+</button>
      <button type="button" onClick={() => map.zoomOut()} title="Zoom out" aria-label="Zoom out">−</button>
      <span />
      <button type="button" onClick={focusRoute} title="Fit full route" aria-label="Fit full route">
        <LocateFixed size={16} />
      </button>
    </div>
  )
}

export default function VehicleMap({
  vehicle,
  cameras = [],
  showCameraJourney = false,
  focusObservationIndex = null,
  useObservationCoordinates = false,
}) {
  const panelRef = useRef(null)
  const observations = Array.isArray(vehicle?.observations) ? vehicle.observations : []
  const validObservations = sortObservationsChronologically(observations.filter(
    (observation) => observation.latitude != null && observation.latitude !== '' &&
      observation.longitude != null && observation.longitude !== '' &&
      Number.isFinite(Number(observation.latitude)) && Number.isFinite(Number(observation.longitude)) &&
      Number(observation.latitude) >= -90 && Number(observation.latitude) <= 90 &&
      Number(observation.longitude) >= -180 && Number(observation.longitude) <= 180,
  ))
  const [activeObservationIndex, setActiveObservationIndex] = useState(() => Math.max(validObservations.length - 1, 0))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFollowing, setIsFollowing] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const route = useObservationCoordinates
    ? validObservations.map((observation) => [Number(observation.latitude), Number(observation.longitude)])
    : getHighwayRouteForObservations(validObservations)
  const routePoints = route.length ? route : validObservations.map((observation) => [
    Number(observation.latitude),
    Number(observation.longitude),
  ])
  const boundedObservationIndex = Math.min(activeObservationIndex, Math.max(validObservations.length - 1, 0))
  const activeObservation = validObservations[boundedObservationIndex]
  const currentPoint = activeObservation
    ? [Number(activeObservation.latitude), Number(activeObservation.longitude)]
    : null
  const focusedObservation = Number.isInteger(focusObservationIndex)
    ? validObservations[Math.min(focusObservationIndex, Math.max(validObservations.length - 1, 0))]
    : null
  const focusedPoint = focusedObservation
    ? [Number(focusedObservation.latitude), Number(focusedObservation.longitude)]
    : null
  const collisionObservation = validObservations.find((observation) =>
    /collision|accident/i.test(observation.detectionType || '') || observation.cameraId === vehicle?.collisionCamera
  )
  const collisionCameraId = vehicle?.collisionCamera || collisionObservation?.cameraId
  const cameraById = new Map(cameras.map((camera) => [camera.id, camera]))
  validObservations.forEach((observation) => {
    if (observation.cameraId && !cameraById.has(observation.cameraId)) {
      cameraById.set(observation.cameraId, {
        id: observation.cameraId,
        name: observation.location || observation.cameraId,
        location: observation.location,
        latitude: observation.latitude,
        longitude: observation.longitude,
      })
    }
  })
  const waypointOrder = new Map(
    NH44_HIGHWAY_WAYPOINTS.filter((waypoint) => waypoint.cameraId)
      .map((waypoint) => waypoint.cameraId)
      .filter((cameraId, index, cameraIds) => cameraIds.indexOf(cameraId) === index)
      .map((cameraId, index) => [cameraId, index])
  )
  const cameraStops = [...cameraById.values()].map((camera) => ({
    ...camera,
    observation: validObservations.find((observation) => observation.cameraId === camera.id),
  })).sort((left, right) => {
    if (left.observation && right.observation) {
      const leftTime = Date.parse(left.observation.timestamp || left.observation.timestampIst || '')
      const rightTime = Date.parse(right.observation.timestamp || right.observation.timestampIst || '')
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime
    }
    if (left.observation) return -1
    if (right.observation) return 1
    return (waypointOrder.get(left.id) ?? Infinity) - (waypointOrder.get(right.id) ?? Infinity)
  })

  useEffect(() => {
    setActiveObservationIndex(Math.max(validObservations.length - 1, 0))
    setIsPlaying(false)
    setIsFollowing(true)
  }, [vehicle?.vehicleNumber])

  useEffect(() => {
    if (Number.isInteger(focusObservationIndex)) {
      setActiveObservationIndex(Math.min(Math.max(focusObservationIndex, 0), Math.max(validObservations.length - 1, 0)))
      setIsPlaying(false)
    }
  }, [focusObservationIndex, validObservations.length])

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(document.fullscreenElement === panelRef.current)
    }
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  useEffect(() => {
    if (!isPlaying) return undefined
    if (boundedObservationIndex >= validObservations.length - 1) {
      setIsPlaying(false)
      return undefined
    }
    const timer = window.setTimeout(() => {
      setActiveObservationIndex((index) => Math.min(index + 1, validObservations.length - 1))
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [isPlaying, boundedObservationIndex, validObservations.length])

  async function toggleFullscreen() {
    if (!panelRef.current) return
    if (document.fullscreenElement === panelRef.current) {
      await document.exitFullscreen()
    } else {
      await panelRef.current.requestFullscreen()
    }
  }

  function togglePlayback() {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    if (boundedObservationIndex >= validObservations.length - 1) setActiveObservationIndex(0)
    setIsPlaying(validObservations.length > 1)
  }

  return (
    <section className="vehicle-panel vehicle-route-panel" ref={panelRef}>
      <header className="vehicle-route-header">
        <div>
          <p className="section-kicker">LIVE VEHICLE NAVIGATION</p>
          <h2><MapPinned size={18} /> NH-44 route</h2>
        </div>
        <div className="vehicle-route-header-actions">
          <span className="vehicle-route-plate"><Navigation size={13} /> {vehicle?.vehicleNumber || 'No vehicle selected'}</span>
          <button
            type="button"
            className="vehicle-map-action"
            onClick={() => setIsFollowing((following) => !following)}
            aria-pressed={isFollowing}
            title={isFollowing ? 'Stop following vehicle' : 'Follow vehicle during replay'}
          >
            <LocateFixed size={15} />
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            type="button"
            className="vehicle-map-icon-action"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>

      <div className="vehicle-route-playback">
        <div className="vehicle-playback-buttons">
          <button
            type="button"
            onClick={() => { setIsPlaying(false); setActiveObservationIndex(0) }}
            disabled={!validObservations.length || boundedObservationIndex === 0}
            aria-label="First sighting"
            title="First sighting"
          ><SkipBack size={15} /></button>
          <button
            type="button"
            className="vehicle-play-toggle"
            onClick={togglePlayback}
            disabled={validObservations.length < 2}
            aria-label={isPlaying ? 'Pause route replay' : 'Play route replay'}
            title={isPlaying ? 'Pause route replay' : 'Play route replay'}
          >{isPlaying ? <Pause size={15} /> : <Play size={15} />}</button>
          <button
            type="button"
            onClick={() => { setIsPlaying(false); setActiveObservationIndex((index) => Math.min(index + 1, validObservations.length - 1)) }}
            disabled={!validObservations.length || boundedObservationIndex >= validObservations.length - 1}
            aria-label="Next sighting"
            title="Next sighting"
          ><SkipForward size={15} /></button>
        </div>
        <div className="vehicle-playback-track">
          <div className="vehicle-playback-caption">
            <strong>{activeObservation?.location || activeObservation?.cameraId || 'No vehicle sightings'}</strong>
            <span>
              <Clock3 size={12} />
              {activeObservation?.timestamp ? formatSafeDateTime(activeObservation.timestamp) : 'No timestamp'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(validObservations.length - 1, 0)}
            value={boundedObservationIndex}
            onChange={(event) => { setIsPlaying(false); setActiveObservationIndex(Number(event.target.value)) }}
            disabled={validObservations.length < 2}
            aria-label="Select vehicle sighting"
          />
        </div>
        <span className="vehicle-playback-step">{validObservations.length ? boundedObservationIndex + 1 : 0} / {validObservations.length}</span>
      </div>

      <div className="vehicle-route-map-wrap" style={{ height: '520px', minHeight: '480px', width: '100%', position: 'relative' }}>
        {routePoints.length ? (
          <MapContainer
            center={currentPoint || [17.35, 78.45]}
            zoom={12}
            scrollWheelZoom
            className="vehicle-route-map"
            style={{ height: '100%', minHeight: '480px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RouteViewport
              currentPoint={currentPoint}
              focusedPoint={focusedPoint}
              focusObservationIndex={focusObservationIndex}
              isFollowing={isFollowing}
              points={routePoints}
              vehicleKey={vehicle?.vehicleNumber}
            />
            <MapResizeHandler />
            <MapControls points={routePoints} />
            {routePoints.length > 1 && (
              <>
                <Polyline positions={routePoints} pathOptions={{ color: '#00f5b8', weight: 12, opacity: 0.35 }} />
                <Polyline positions={routePoints} pathOptions={{ color: '#090a10', weight: 7, opacity: 0.95 }} />
                <Polyline positions={routePoints} pathOptions={{ color: '#00e5a3', weight: 4.5, opacity: 1 }} />
              </>
            )}
            {cameraStops.map((camera) => {
              const rawLatitude = camera.latitude ?? camera.observation?.latitude
              const rawLongitude = camera.longitude ?? camera.observation?.longitude
              if (rawLatitude == null || rawLatitude === '' || rawLongitude == null || rawLongitude === '') return null
              const latitude = Number(rawLatitude)
              const longitude = Number(rawLongitude)
              if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
                  latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
              const isCollision = camera.id === collisionCameraId || /collision|accident/i.test(camera.observation?.detectionType || '')
              return (
                <Marker
                  key={camera.id}
                  position={[latitude, longitude]}
                  icon={isCollision ? incidentCameraPinIcon : camera.observation ? cameraPinIcon : pendingCameraPinIcon}
                >
                  <Tooltip direction="top" offset={[0, -32]}>
                    {camera.name || camera.location || camera.id}
                  </Tooltip>
                  <Popup>
                    <strong>{camera.name || camera.id}</strong><br />
                    {camera.observation ? camera.observation.detectionType || 'Vehicle detected' : 'No sighting recorded'}<br />
                    {camera.observation?.timestamp && formatSafeDateTime(camera.observation.timestamp)}
                  </Popup>
                </Marker>
              )
            })}
            {currentPoint && (
              <Marker position={currentPoint} icon={carPinIcon} zIndexOffset={1000}>
                <Tooltip direction="top" offset={[0, -38]}>{vehicle?.vehicleNumber} · {boundedObservationIndex === validObservations.length - 1 ? 'Latest position' : 'Selected sighting'}</Tooltip>
                <Popup>
                  <strong>{vehicle?.vehicleNumber}</strong><br />
                  {activeObservation?.location || activeObservation?.cameraId || 'Selected vehicle'}<br />
                  {boundedObservationIndex === validObservations.length - 1 ? 'Latest position' : 'Recorded sighting'}
                </Popup>
              </Marker>
            )}
            {collisionObservation && (
              <CircleMarker
                center={[Number(collisionObservation.latitude), Number(collisionObservation.longitude)]}
                radius={13}
                pathOptions={{ color: '#d74b50', weight: 2, fillColor: '#d74b50', fillOpacity: 0.18 }}
              />
            )}
          </MapContainer>
        ) : (
          <div className="vehicle-route-empty">
            <MapPinned size={24} />
            <strong>No route coordinates available</strong>
            <span>Select a vehicle with recorded camera observations to view its navigation.</span>
          </div>
        )}
      </div>

      <footer className="vehicle-route-footer">
        <span><i className="route-legend-line" /> Vehicle route</span>
        <span><Camera size={14} /> Passed camera</span>
        <span><i className="route-legend-pending" /> No sighting</span>
        <span><CarFront size={15} /> Current vehicle</span>
        {collisionObservation && <span><i className="route-legend-incident" /> Incident location</span>}
        <span className="vehicle-route-count"><RotateCcw size={13} /> {validObservations.length} sightings</span>
      </footer>

      {showCameraJourney && (
        <section className="vehicle-camera-journey" aria-label="Vehicle camera journey">
          <div className="vehicle-camera-journey-heading">
            <div>
              <p className="section-kicker">NH-44 CHECKPOINTS</p>
              <h3>Camera journey</h3>
            </div>
            <span>{cameraStops.filter((camera) => camera.observation).length} of {cameraStops.length} passed</span>
          </div>
          <ol className="vehicle-camera-stop-list">
            {cameraStops.map((camera, index) => {
              const isCollision = camera.id === collisionCameraId || /collision|accident/i.test(camera.observation?.detectionType || '')
              return (
                <li className={`${camera.observation ? 'is-passed' : 'is-pending'} ${isCollision ? 'is-collision' : ''}`} key={camera.id}>
                  <span className="vehicle-camera-stop-index">{index + 1}</span>
                  <span className="vehicle-camera-stop-copy">
                    <strong>{camera.name || camera.location || camera.id}</strong>
                    <small>{camera.corridorKm || camera.id}</small>
                    {camera.observation && (
                      <small>{camera.observation.timestamp ? formatSafeDateTime(camera.observation.timestamp) : 'Vehicle detected'}
                        {camera.observation.speed ? ` · ${camera.observation.speed} km/h` : ''}
                      </small>
                    )}
                  </span>
                  <span className="vehicle-camera-stop-status">
                    {isCollision ? 'Collision' : camera.observation ? 'Passed' : 'No sighting'}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </section>
  )
}
