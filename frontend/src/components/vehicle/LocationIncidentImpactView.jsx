import React, { useMemo, useState } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Car,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Flame,
  Gauge,
  MapPin,
  Navigation,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Truck,
  Umbrella,
  Zap,
} from 'lucide-react'
import { ALL_CORRIDOR_INCIDENTS, CORRIDORS_LIST } from '../../data/corridorsData'

export { ALL_CORRIDOR_INCIDENTS }

export const CORRIDOR_INCIDENT_LOCATIONS = ALL_CORRIDOR_INCIDENTS

export default function LocationIncidentImpactView({
  selectedLocationId: controlledSelectedId = null,
  selectedCorridorId: controlledCorridorId = null,
  onSelectLocation = null,
}) {
  const [internalCorridorFilter, setInternalCorridorFilter] = useState('All')
  const [internalSelectedId, setInternalSelectedId] = useState(null)

  const activeCorridorFilter = controlledCorridorId || internalCorridorFilter

  // Filter available incidents based on selected corridor
  const availableIncidents = useMemo(() => {
    if (!activeCorridorFilter || activeCorridorFilter === 'All') {
      return ALL_CORRIDOR_INCIDENTS
    }
    const clean = String(activeCorridorFilter).toUpperCase().trim()
    return ALL_CORRIDOR_INCIDENTS.filter(
      (inc) =>
        inc.corridorId.toUpperCase() === clean ||
        inc.corridorCode.toUpperCase() === clean ||
        inc.corridorId.replace(/\s+/g, '-').toUpperCase() === clean ||
        inc.corridorName.toUpperCase().includes(clean)
    )
  }, [activeCorridorFilter])

  // Active incident selection
  const currentIncident = useMemo(() => {
    const targetId = controlledSelectedId || internalSelectedId
    if (targetId) {
      const match =
        availableIncidents.find((inc) => inc.id === targetId) ||
        availableIncidents.find((inc) => String(inc.kmMarker) === String(targetId)) ||
        ALL_CORRIDOR_INCIDENTS.find((inc) => inc.id === targetId)
      if (match) return match
    }
    return availableIncidents[0] || ALL_CORRIDOR_INCIDENTS[0] || {}
  }, [controlledSelectedId, internalSelectedId, availableIncidents])

  const handleLocationClick = (loc) => {
    setInternalSelectedId(loc.id)
    if (onSelectLocation) onSelectLocation(loc.id, loc)
  }

  const handleCorridorChange = (corridorId) => {
    setInternalCorridorFilter(corridorId)
    const match = ALL_CORRIDOR_INCIDENTS.find(
      (inc) => corridorId === 'All' || inc.corridorId === corridorId || inc.corridorCode === corridorId
    )
    if (match) {
      setInternalSelectedId(match.id)
      if (onSelectLocation) onSelectLocation(match.id, match)
    }
  }

  return (
    <div
      className="location-impact-card"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(13, 30, 58, 0.04)',
        marginTop: '20px',
      }}
    >
      {/* ── CARD HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0d1e3a' }}>
              Multi-Corridor Incident & Traffic Blast Radius (Upstream & Downstream Impact)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5f718a' }}>
            Select any corridor or incident location to inspect the epicenter, affected places before & after, traffic slowdown, and risk level
          </p>
        </div>

        {/* Corridor Selector Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>Filter Corridor:</span>
          <select
            value={activeCorridorFilter}
            onChange={(e) => handleCorridorChange(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0d1e3a',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="All">All Corridors ({ALL_CORRIDOR_INCIDENTS.length} Incidents)</option>
            <optgroup label="NH-44 Section Corridors (01 - 16)">
              {CORRIDORS_LIST.filter((c) => c.corridorOrder >= 1 && c.corridorOrder <= 16).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.shortName}: {c.from} ➔ {c.to} ({c.activeIncidentsCount} Incidents)
                </option>
              ))}
            </optgroup>
            <optgroup label="Interstate Highway Expressways">
              {CORRIDORS_LIST.filter((c) => c.corridorOrder === 0 || c.corridorOrder > 16).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.shortName}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Hotspots Switcher for Active Corridor */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
            Active Incident Locations ({availableIncidents.length}):
          </span>
          <span style={{ fontSize: '10.5px', color: '#1976d2' }}>
            (Click any location button below to load its upstream and downstream blast radius)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
          {availableIncidents.map((loc) => {
            const isSelected = loc.id === currentIncident.id
            const riskColor =
              loc.riskLevel === 'Critical' ? '#dc2626' : loc.riskLevel === 'High' ? '#ea580c' : '#d97706'

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleLocationClick(loc)}
                style={{
                  background: isSelected ? '#1976d2' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  border: isSelected ? '1px solid #1976d2' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    background: isSelected ? '#ffffff' : '#e2e8f0',
                    color: isSelected ? '#1976d2' : '#475569',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                  }}
                >
                  {loc.corridorCode}
                </span>
                <span>{loc.shortLocation || `Km ${loc.kmMarker}`}</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isSelected ? '#ffffff' : riskColor,
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* ── EPICENTER INCIDENT OVERVIEW BANNER ── */}
      <div
        className="location-epicenter-overview"
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Left: Icon */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: currentIncident.riskBg || '#fee2e2',
            color: currentIncident.riskColor || '#dc2626',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <AlertTriangle size={24} strokeWidth={2.4} />
        </div>

        {/* Center: Details */}
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '15px', color: '#0d1e3a' }}>{currentIncident.title}</strong>
            <span
              style={{
                background: currentIncident.riskBg || '#fee2e2',
                color: currentIncident.riskColor || '#dc2626',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                border: `1px solid ${currentIncident.riskColor || '#dc2626'}40`,
              }}
            >
              RISK LEVEL: {(currentIncident.riskLevel || 'High').toUpperCase()} ({currentIncident.riskScore || 75}/100)
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Reported: {currentIncident.time || '08:45 AM'} · Status: <strong>{currentIncident.status || 'Responding'}</strong>
            </span>
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>
            <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#1976d2' }} />
            {currentIncident.location}
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#5f718a' }}>
            {currentIncident.description || currentIncident.detail}
          </p>
        </div>

        {/* Right: Key Impact Badges */}
        <div className="location-impact-stats">
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Incident Delay: <strong style={{ color: '#dc2626', fontSize: '13px' }}>+{currentIncident.delayMinutes || 25} mins</strong>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Queue Length: <strong style={{ color: '#0d1e3a' }}>{currentIncident.queueLengthKm || 2.1} km</strong>
          </div>
          <div style={{ fontSize: '10.5px', color: '#475569', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
            Crawl Speed: {currentIncident.crawlSpeed || 15} km/h (Lanes Blocked: {currentIncident.lanesBlocked || 1})
          </div>
        </div>
      </div>

      {/* ── VISUAL IMPACT CHAIN: BEFORE -> INCIDENT AT LOCATION -> AFTER ── */}
      <div style={{ marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#0d1e3a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Navigation size={14} color="#1976d2" />
          <span>Corridor Flow Impact Chain: Places Before (Approaching) & After (Clearing)</span>
        </h4>

        <div className="location-impact-chain-grid">
          {/* 1. UPSTREAM: AFFECTED PLACES BEFORE THE INCIDENT */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '6px',
              }}
            >
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ArrowUp size={13} color="#dc2626" />
                <span>Places Before (Upstream Slowdown)</span>
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Approaching Traffic</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentIncident.upstreamImpact || []).map((step, idx) => (
                <div
                  key={`${step.place}-${idx}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <strong style={{ color: '#0f172a', fontSize: '12px' }}>{step.place}</strong>
                    <span
                      style={{
                        background: step.riskBg || '#fee2e2',
                        color: step.riskColor || '#dc2626',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '8px',
                      }}
                    >
                      Risk: {step.riskLevel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '10.5px', marginBottom: '3px' }}>
                    <span>📍 {step.distanceFromIncident}</span>
                    <span>⏱ Delay: <strong style={{ color: '#dc2626' }}>{step.delay}</strong></span>
                    <span>🚗 Queue: {step.queue}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px' }}>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      Traffic Speed: {step.speed} km/h (Normal: {step.normalSpeed} km/h)
                    </span>
                    <span style={{ color: '#64748b' }}>{step.hazardNotice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. CENTER: INCIDENT EPICENTER */}
          <div
            style={{
              background: '#fff1f2',
              border: '2px dashed #fda4af',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Incident Epicenter
              </span>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#9f1239', margin: '4px 0 2px' }}>
                {currentIncident.shortLocation || `Km ${currentIncident.kmMarker}`}
              </div>
              <div style={{ fontSize: '11px', color: '#881337', marginBottom: '8px' }}>
                {currentIncident.title}
              </div>

              <div style={{ background: '#ffffff', borderRadius: '6px', padding: '8px', margin: '6px 0', border: '1px solid #fecdd3' }}>
                <div style={{ fontSize: '11px', color: '#475569' }}>Crawl Speed at Point</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                  {currentIncident.crawlSpeed || 15} km/h
                </div>
                <div style={{ fontSize: '10px', color: '#991b1b', marginTop: '2px' }}>
                  {currentIncident.lanesBlocked || 1} of 3 Lanes Blocked
                </div>
              </div>
            </div>

            <div style={{ fontSize: '10.5px', color: '#9f1239', background: '#ffe4e6', padding: '6px', borderRadius: '4px' }}>
              <strong>Diversion:</strong> {currentIncident.diversionRecommended === 'Yes' ? 'Active Diversion Recommended' : 'Single-file Crawl'}
            </div>
          </div>

          {/* 3. DOWNSTREAM: AFFECTED PLACES AFTER THE INCIDENT */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '6px',
              }}
            >
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ArrowDown size={13} color="#16a34a" />
                <span>Places After (Downstream Recovery)</span>
              </span>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Clearing Traffic</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentIncident.downstreamImpact || []).map((step, idx) => (
                <div
                  key={`${step.place}-${idx}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <strong style={{ color: '#0f172a', fontSize: '12px' }}>{step.place}</strong>
                    <span
                      style={{
                        background: step.riskBg || '#dcfce7',
                        color: step.riskColor || '#16a34a',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '8px',
                      }}
                    >
                      Risk: {step.riskLevel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '10.5px', marginBottom: '3px' }}>
                    <span>📍 {step.distanceFromIncident}</span>
                    <span>⏱ Delay: <strong>{step.delay}</strong></span>
                    <span>🚗 Flow: {step.queue}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      Traffic Speed: {step.speed} km/h (Normal: {step.normalSpeed} km/h)
                    </span>
                    <span style={{ color: '#64748b' }}>{step.hazardNotice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Emergency / Patrol Dispatch Actions */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '11.5px',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={15} color="#1d4ed8" />
          <span>
            <strong>Command Center Recommended Action:</strong>{' '}
            {currentIncident.responseUnits || 'Corridor Patrol S-3 & Heavy Recovery Crane dispatched.'}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 700 }}>
          Live Telemetry Updated: Just now
        </span>
      </div>
    </div>
  )
}
