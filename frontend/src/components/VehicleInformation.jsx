import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CarFront,
  Layers,
  MapPin,
  Navigation,
  Radio,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

import IncidentAnalyticsCards from './vehicle/IncidentAnalyticsCards'
import LocationIncidentImpactView from './vehicle/LocationIncidentImpactView'
import CollisionVehiclesTable from './vehicle/CollisionVehiclesTable'
import VehiclePathTable from './vehicle/VehiclePathTable'
import VehicleMap from './vehicle/VehicleMap'
import CorridorHighwayMap from './vehicle/CorridorHighwayMap'
import { CORRIDORS_LIST, getCorridorById } from '../data/corridorsData'
import {
  getCameras,
  getVehicleIncidents,
  getVehicleTracking,
} from '../services/vehicleService'

const STORAGE_KEY_RECORDS = 'vision-iq-collision-records'
const STORAGE_KEY_INDEX = 'vision-iq-collision-queue-index'
const STORAGE_KEY_SELECTED = 'vision-iq-selected-vehicle-plate'

function readStoredCollisions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore parse error
  }
  return null
}

function readStoredIndex() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_INDEX)
    if (stored) {
      const val = parseInt(stored, 10)
      if (!isNaN(val)) return val
    }
  } catch {
    // ignore parse error
  }
  return 3
}

function readStoredSelectedPlate() {
  try {
    return localStorage.getItem(STORAGE_KEY_SELECTED) || null
  } catch {
    return null
  }
}

export default function VehicleInformation() {
  const [searchParams, setSearchParams] = useSearchParams()
  const corridorParam = searchParams.get('corridor')

  const [activeCorridorId, setActiveCorridorId] = useState(() => {
    if (corridorParam) return corridorParam
    try {
      return localStorage.getItem('visioniq-active-corridor') || 'CORRIDOR-01'
    } catch {
      return 'CORRIDOR-01'
    }
  })

  useEffect(() => {
    if (corridorParam && corridorParam !== activeCorridorId) {
      setActiveCorridorId(corridorParam)
      try {
        localStorage.setItem('visioniq-active-corridor', corridorParam)
      } catch { }
    }
  }, [corridorParam])

  useEffect(() => {
    const handleCorridorChange = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        setActiveCorridorId(e.detail)
      }
    }
    const handleMapModeChange = (e) => {
      if (e.detail && (e.detail === 'corridor' || e.detail === 'vehicle')) {
        setMapMode(e.detail)
      }
    }
    window.addEventListener('visioniq:set-corridor', handleCorridorChange)
    window.addEventListener('visioniq:set-map-mode', handleMapModeChange)
    return () => {
      window.removeEventListener('visioniq:set-corridor', handleCorridorChange)
      window.removeEventListener('visioniq:set-map-mode', handleMapModeChange)
    }
  }, [])

  const currentCorridor = useMemo(() => getCorridorById(activeCorridorId), [activeCorridorId])

  const handleCorridorSelect = (corridorId) => {
    setActiveCorridorId(corridorId)
    setSearchParams({ corridor: corridorId })
    try {
      localStorage.setItem('visioniq-active-corridor', corridorId)
      window.dispatchEvent(new CustomEvent('visioniq:set-corridor', { detail: corridorId }))
    } catch { }
  }

  const [mapMode, setMapMode] = useState('corridor') // 'corridor' | 'vehicle'
  const [cameras, setCameras] = useState([])
  const [allCollisions, setAllCollisions] = useState([])
  const [displayedCollisions, setDisplayedCollisions] = useState(() => readStoredCollisions() || [])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [newlyAddedPlate, setNewlyAddedPlate] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  const nextQueueIndexRef = useRef(readStoredIndex())

  useEffect(() => {
    Promise.all([getVehicleIncidents(), getCameras()]).then(
      ([incidentData, cameraData]) => {
        const loadedVehicles = incidentData || []
        setCameras(cameraData || [])

        // Filter all collision / accident / fire vehicles
        const collisions = loadedVehicles.filter((v) =>
          /collision|accident|fire/i.test(v.incidentType || '') ||
          /collision|accident/i.test(v.summary || '') ||
          v.observations?.some((o) => /collision|accident/i.test(o.detectionType || ''))
        )

        setAllCollisions(collisions)

        // If records were already stored in localStorage, preserve them!
        const existingStored = readStoredCollisions()
        let activeList = existingStored

        if (!activeList || activeList.length === 0) {
          // Initialize with first 3 records on very first load
          activeList = collisions.slice(0, 3)
          setDisplayedCollisions(activeList)
          try {
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(activeList))
            localStorage.setItem(STORAGE_KEY_INDEX, '3')
          } catch { }
          nextQueueIndexRef.current = 3
        } else {
          setDisplayedCollisions(activeList)
        }

        // Restore selected vehicle if previously saved, otherwise pick first
        const savedPlate = readStoredSelectedPlate()
        const matchedSaved = activeList.find((v) => v.vehicleNumber === savedPlate)
        setSelectedVehicle(matchedSaved || activeList[0] || collisions[0] || null)
      }
    )
  }, [])

  // Periodically add 1 new record after some time (every 25 seconds) without lag
  // And persist to localStorage so data is NEVER lost when switching pages or refreshing!
  useEffect(() => {
    if (!allCollisions.length) return undefined

    const intervalTimer = setInterval(() => {
      const nextIdx = nextQueueIndexRef.current
      if (nextIdx < allCollisions.length) {
        const newVehicle = allCollisions[nextIdx]
        const updatedIdx = nextIdx + 1
        nextQueueIndexRef.current = updatedIdx

        setDisplayedCollisions((prev) => {
          if (prev.some((v) => v.vehicleNumber === newVehicle.vehicleNumber)) {
            return prev
          }
          const updated = [newVehicle, ...prev].slice(0, 8)
          try {
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated))
            localStorage.setItem(STORAGE_KEY_INDEX, String(updatedIdx))
          } catch { }
          return updated
        })

        // Flash NEW ALERT badge for 5 seconds
        setNewlyAddedPlate(newVehicle.vehicleNumber)
        setTimeout(() => {
          setNewlyAddedPlate(null)
        }, 5000)
      }
    }, 25000)

    return () => clearInterval(intervalTimer)
  }, [allCollisions])

  async function handleSearch(e) {
    if (e?.preventDefault) e.preventDefault()
    const query = searchValue.trim()
    if (!query) return

    setSearchLoading(true)
    try {
      const match = await getVehicleTracking(query)
      if (match) {
        handleVehicleSelect(match)
        setDisplayedCollisions((prev) => {
          if (prev.some((v) => v.vehicleNumber === match.vehicleNumber)) return prev
          const updated = [match, ...prev]
          try {
            localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated))
          } catch { }
          return updated
        })
      }
    } finally {
      setSearchLoading(false)
    }
  }

  function handleVehicleSelect(vehicle) {
    setSelectedVehicle(vehicle)
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, vehicle.vehicleNumber)
    } catch { }
  }

  function handleResetStoredData() {
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS)
      localStorage.removeItem(STORAGE_KEY_INDEX)
      localStorage.removeItem(STORAGE_KEY_SELECTED)
    } catch { }
    const initialFew = allCollisions.slice(0, 3)
    setDisplayedCollisions(initialFew)
    setSelectedVehicle(initialFew[0] || null)
    nextQueueIndexRef.current = 3
  }

  // Filter or populate collisions for the active corridor
  const effectiveCollisions = useMemo(() => {
    if (!currentCorridor) return displayedCollisions

    const cleanCode = (currentCorridor.code || '').replace(/\s+/g, '').toUpperCase()
    const towns = (currentCorridor.towns || []).map((t) => t.toLowerCase())
    const matched = (displayedCollisions || []).filter((v) => {
      const summary = (v.summary || '').toLowerCase()
      const loc = (v.collisionLocation || v.location || '').toLowerCase()
      return (
        (v.corridorId && v.corridorId.toUpperCase() === currentCorridor.id) ||
        towns.some((t) => summary.includes(t) || loc.includes(t))
      )
    })

    if (matched.length > 0) return matched

    if (currentCorridor.incidents && currentCorridor.incidents.length > 0) {
      return currentCorridor.incidents.map((inc, i) => ({
        vehicleNumber: `TS09${cleanCode}${200 + i}`,
        vehicleType: inc.title.includes('Truck') ? 'Heavy Truck' : inc.title.includes('Bus') ? 'Passenger Bus' : 'Car',
        incidentType: inc.title || 'Hazard / Collision',
        incidentTime: new Date(Date.now() - (i + 1) * 22 * 60000).toISOString().replace('T', ' ').slice(0, 19),
        collisionCamera: currentCorridor.keyCameras?.[i % (currentCorridor.keyCameras?.length || 1)]?.name || inc.shortLocation || 'NH-44 Checkpoint',
        collisionLocation: inc.location,
        status: 'Active Incident',
        speed: currentCorridor.avgSpeed ? currentCorridor.avgSpeed + i * 5 : 75,
        speedLimit: currentCorridor.speedLimit || 80,
        summary: `${inc.title} on ${currentCorridor.shortName} (${inc.location}). ${inc.detail}`,
        corridorId: currentCorridor.id,
        observations: [
          {
            cameraId: currentCorridor.keyCameras?.[0]?.id || 'CAM-01',
            timestamp: new Date().toISOString(),
            latitude: inc.lat || currentCorridor.mapCenter?.[0] || 17.323,
            longitude: inc.lng || currentCorridor.mapCenter?.[1] || 78.441,
            location: inc.location,
            detectionType: inc.title,
            speed: currentCorridor.avgSpeed || 75,
            speedLimit: currentCorridor.speedLimit || 80,
            confidence: 0.95,
            notes: inc.detail,
          },
        ],
      }))
    }

    return displayedCollisions
  }, [displayedCollisions, currentCorridor])

  const activeSelectedVehicle = useMemo(() => {
    if (selectedVehicle && effectiveCollisions.some((v) => v.vehicleNumber === selectedVehicle.vehicleNumber)) {
      return selectedVehicle
    }
    return effectiveCollisions[0] || null
  }, [selectedVehicle, effectiveCollisions])

  return (
    <main className="vehicle-clean-page">
      {/* 1. HEADER */}
      <header className="vehicle-clean-header">
        <div className="clean-header-title">
          <div className="clean-kicker">
            <span>VISION IQ</span> <i>/</i> <span>NH-44 HIGHWAY CORRIDOR</span> <i>/</i> <span>SURVEILLANCE</span>
          </div>
          <h1>Vehicle Journey & Incident Intelligence</h1>
          <p>
            Real-time radar detections, collision tracking, and highway ANPR checkpoint trajectory.
          </p>
        </div>

        <div className="clean-header-actions">
          <div className="live-radar-badge">
            <span className="live-pulse-green" />
            <span>NH-44 RADAR ACTIVE</span>
          </div>

          <form onSubmit={handleSearch} className="clean-search-form">
            <Search size={14} className="clean-search-icon" />
            <input
              type="text"
              placeholder="Search vehicle plate (e.g. MP44, TS09)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <button
                type="button"
                className="clean-search-clear"
                onClick={() => setSearchValue('')}
              >
                ×
              </button>
            )}
            <button type="submit" className="clean-search-submit" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          <button
            type="button"
            className="clean-reset-btn"
            onClick={handleResetStoredData}
            title="Reset collision stream cache"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </header>

      {/* 1B. ACTIVE CORRIDOR CONTEXT BANNER */}
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            {currentCorridor.code}
          </span>
          <div>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>
              {currentCorridor.name}
            </strong>
            <span style={{ fontSize: '12px', color: '#475569', marginLeft: '8px' }}>
              ({currentCorridor.routeTitle} · {currentCorridor.activeIncidentsCount} Hazards Reported)
            </span>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '10px',
              background: currentCorridor.riskBand === 'Critical' ? '#fee2e2' : '#fff7ed',
              color: currentCorridor.riskBand === 'Critical' ? '#dc2626' : '#ea580c',
            }}
          >
            {currentCorridor.riskBand} Risk
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 700 }}>Active Corridor:</span>
          <select
            value={activeCorridorId}
            onChange={(e) => handleCorridorSelect(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #86efac',
              background: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            {CORRIDORS_LIST.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.shortName} ({c.activeIncidentsCount} hazards)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. AT TOP: ANALYTICS GRAPH PART (UPDATES DYNAMICALLY WITH VEHICLE DATA) */}
      <section className="clean-analytics-section" aria-label="Incident Analytics">
        <IncidentAnalyticsCards vehicles={effectiveCollisions} />
      </section>

      {/* 2B. CORRIDOR INCIDENT BLAST RADIUS & AFFECTED PLACES BEFORE & AFTER */}
      <section className="clean-incident-impact-section" aria-label="Incident Impact Radius" style={{ marginBottom: '24px' }}>
        <LocationIncidentImpactView
          selectedCorridorId={activeCorridorId}
          onSelectLocation={() => { }}
        />
      </section>

      {/* 3. THEN: TABLE OF VEHICLE (COLLISION VEHICLES TABLE) */}
      <section className="clean-collision-section" aria-label="Collision Vehicles Registry">
        <CollisionVehiclesTable
          vehicles={effectiveCollisions}
          selectedVehicle={activeSelectedVehicle}
          onSelectVehicle={handleVehicleSelect}
          newlyAddedPlate={newlyAddedPlate}
        />
      </section>

      {/* 4. BELOW THIS: VEHICLE TRACK IN LEFT AND MAP IN RIGHT */}
      <section className="clean-track-and-map-grid" aria-label="Vehicle Traversal and Highway Map">
        {/* LEFT COLUMN: VEHICLE TRACK (PATH FOLLOWED BY SELECTED VEHICLE) */}
        <div className="track-grid-left">
          <VehiclePathTable
            vehicle={activeSelectedVehicle}
            onSelectCheckpoint={() => { }}
          />
        </div>

        {/* RIGHT COLUMN: THE MAP (WITHOUT THE PART BELOW THE MAP) */}
        <div className="track-grid-right">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d1e3a' }}>
              {mapMode === 'corridor' ? `Corridor Highway Map (${currentCorridor.shortName})` : 'Vehicle Trajectory Route'}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setMapMode('corridor')}
                style={{
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: mapMode === 'corridor' ? '#1976d2' : '#ffffff',
                  color: mapMode === 'corridor' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                Corridor Highway Map
              </button>
              <button
                type="button"
                onClick={() => setMapMode('vehicle')}
                style={{
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: mapMode === 'vehicle' ? '#1976d2' : '#ffffff',
                  color: mapMode === 'vehicle' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                Vehicle Track
              </button>
            </div>
          </div>

          {mapMode === 'corridor' ? (
            <div
              id="corridor-map-container"
              style={{ height: '380px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}
            >
              <CorridorHighwayMap selectedCorridorId={activeCorridorId} />
            </div>
          ) : (
            <VehicleMap
              cameras={cameras}
              vehicle={activeSelectedVehicle}
              showCameraJourney={false}
            />
          )}
        </div>
      </section>
    </main>
  )
}
