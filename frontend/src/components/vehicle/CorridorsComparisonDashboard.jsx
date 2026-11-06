// Multi-Corridor Analytics Dashboard Component
// Real-time comparative analytics, congestion pressure, incident risk, and health across all monitored highway corridors

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Gauge,
  Layers,
  MapPin,
  Navigation,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react'
import { CORRIDORS_LIST, getCorridorById } from '../../data/corridorsData'
import CorridorHighwayMap from './CorridorHighwayMap'

export default function CorridorsComparisonDashboard({
  selectedCorridorId = 'CORRIDOR-01',
  onSelectCorridor = null,
}) {
  const navigate = useNavigate()
  const [activeCorridorId, setActiveCorridorId] = useState(() => {
    try {
      return localStorage.getItem('visioniq-active-corridor') || selectedCorridorId || 'CORRIDOR-01'
    } catch {
      return selectedCorridorId || 'CORRIDOR-01'
    }
  })

  useEffect(() => {
    const handleCorridorChange = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        setActiveCorridorId(e.detail)
      }
    }
    window.addEventListener('visioniq:set-corridor', handleCorridorChange)
    return () => window.removeEventListener('visioniq:set-corridor', handleCorridorChange)
  }, [])

  const activeCorridorData = useMemo(() => getCorridorById(activeCorridorId), [activeCorridorId])

  const [sectorFilter, setSectorFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('RISK')

  const totalLength = useMemo(() => CORRIDORS_LIST.reduce((acc, c) => acc + (c.lengthKm || 0), 0), [])
  const totalIncidents = useMemo(() => CORRIDORS_LIST.reduce((acc, c) => acc + (c.activeIncidentsCount || 0), 0), [])
  const totalHighRisk = useMemo(() => CORRIDORS_LIST.reduce((acc, c) => acc + (c.highRiskIncidents || 0), 0), [])

  const filteredCorridors = useMemo(() => {
    let list = [...CORRIDORS_LIST]

    // Sector Filter
    if (sectorFilter === 'NH44_ALL') {
      list = list.filter((c) => c.corridorOrder >= 1 && c.corridorOrder <= 16)
    } else if (sectorFilter === 'TELANGANA') {
      list = list.filter((c) => c.corridorOrder >= 1 && c.corridorOrder <= 5)
    } else if (sectorFilter === 'AP') {
      list = list.filter((c) => c.corridorOrder >= 6 && c.corridorOrder <= 11)
    } else if (sectorFilter === 'KARNATAKA') {
      list = list.filter((c) => c.corridorOrder >= 12 && c.corridorOrder <= 16)
    } else if (sectorFilter === 'INTERSTATE') {
      list = list.filter((c) => c.corridorOrder === 0 || c.corridorOrder > 16)
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          c.sector?.toLowerCase().includes(q) ||
          c.from?.toLowerCase().includes(q) ||
          c.to?.toLowerCase().includes(q) ||
          c.keyLocations?.toLowerCase().includes(q)
      )
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'RISK') {
        const riskOrder = { Critical: 4, High: 3, Moderate: 2, Medium: 2, Low: 1 }
        const rA = riskOrder[a.riskBand] || 0
        const rB = riskOrder[b.riskBand] || 0
        if (rB !== rA) return rB - rA
        return (b.activeIncidentsCount || 0) - (a.activeIncidentsCount || 0)
      }
      if (sortBy === 'INCIDENTS') {
        return (b.activeIncidentsCount || 0) - (a.activeIncidentsCount || 0)
      }
      if (sortBy === 'OVERSPEED') {
        const oA = parseFloat(a.overspeedRate) || 0
        const oB = parseFloat(b.overspeedRate) || 0
        return oB - oA
      }
      if (sortBy === 'VOLUME') {
        const vA = parseInt(String(a.dailyVolume).replace(/,/g, ''), 10) || 0
        const vB = parseInt(String(b.dailyVolume).replace(/,/g, ''), 10) || 0
        return vB - vA
      }
      return (a.corridorOrder || 0) - (b.corridorOrder || 0)
    })

    return list
  }, [sectorFilter, searchQuery, sortBy])

  const handleSelect = (corridorId, shouldNavigate = false) => {
    setActiveCorridorId(corridorId)
    if (onSelectCorridor) onSelectCorridor(corridorId)
    try {
      localStorage.setItem('visioniq-active-corridor', corridorId)
      window.dispatchEvent(new CustomEvent('visioniq:set-corridor', { detail: corridorId }))
    } catch {
      // ignore
    }
    if (shouldNavigate) {
      navigate(`/vehicle-information?corridor=${corridorId}`)
    } else {
      const mapEl = document.getElementById('active-corridor-map-section')
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }

  return (
    <div className="corridors-comparison-dashboard" style={{ marginTop: '12px' }}>
      {/* ── 1. CROSS-CORRIDOR EXECUTIVE KPI STATS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* KPI 1 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monitored Corridors
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#dbeafe', color: '#1976d2', display: 'grid', placeItems: 'center' }}>
              <Navigation size={15} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0d1e3a', lineHeight: 1.1 }}>
            {CORRIDORS_LIST.length} Corridors
          </div>
          <div style={{ fontSize: '11px', color: '#5f718a', marginTop: '4px' }}>
            16 NH-44 Highway Sections + Interstate Expressways
          </div>
        </div>

        {/* KPI 2 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Highway Network Span
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center' }}>
              <Activity size={15} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0d1e3a', lineHeight: 1.1 }}>
            {totalLength.toLocaleString()} km
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            70 Optical ANPR & Telemetry Checkpoints
          </div>
        </div>

        {/* KPI 3 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Incidents
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
              <ShieldAlert size={15} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
            {totalIncidents} Total
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
            {totalHighRisk} high/critical priority bottlenecks
          </div>
        </div>

        {/* KPI 4 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Network Overspeed Rate
            </span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', display: 'grid', placeItems: 'center' }}>
              <Zap size={15} />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>
            64.8%
          </div>
          <div style={{ fontSize: '11px', color: '#5f718a', marginTop: '4px' }}>
            Average across 5,000+ monitored vehicles
          </div>
        </div>
      </div>

      {/* ── 2. SECTOR FILTER TABS & SEARCH BAR ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '18px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Sector Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All Corridors (${CORRIDORS_LIST.length})` },
              { id: 'NH44_ALL', label: 'NH-44 Full Chain (16 Corridors)' },
              { id: 'TELANGANA', label: 'Telangana North (01–05)' },
              { id: 'AP', label: 'AP Rayalaseema (06–11)' },
              { id: 'KARNATAKA', label: 'Karnataka Border (12–16)' },
              { id: 'INTERSTATE', label: 'Interstate Expressways' },
            ].map((tab) => {
              const active = sectorFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSectorFilter(tab.id)}
                  style={{
                    background: active ? '#1976d2' : '#f8fafc',
                    color: active ? '#ffffff' : '#334155',
                    border: active ? '1px solid #1976d2' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search + Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 10px',
              }}
            >
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search corridor, town, or road..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '12px',
                  color: '#0f172a',
                  width: '180px',
                }}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="RISK">Sort by Risk Band</option>
              <option value="INCIDENTS">Sort by Incident Count</option>
              <option value="OVERSPEED">Sort by Overspeed Rate</option>
              <option value="VOLUME">Sort by Traffic Volume</option>
              <option value="SEQUENCE">Sort by Sequence</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. MULTI-CORRIDOR INTERACTIVE COMPARISON GRID ── */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0d1e3a' }}>
              Monitored Highway Corridors ({filteredCorridors.length} Matching)
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#5f718a' }}>
              Select any corridor below to switch the active video feeds, live map, checkpoints, and incident blast radius
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {filteredCorridors.map((corridor) => {
            const isSelected =
              activeCorridorId === corridor.id ||
              activeCorridorId === corridor.code ||
              activeCorridorId === corridor.dbId
            const speedRatio = Math.round((corridor.avgSpeed / corridor.speedLimit) * 100)

            return (
              <div
                key={corridor.id}
                onClick={() => handleSelect(corridor.id, false)}
                style={{
                  background: isSelected ? '#ffffff' : '#f8fafc',
                  border: isSelected ? '2px solid #1976d2' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 16px rgba(25, 118, 210, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* Active Indicator Top Tag */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: '#1976d2',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    CURRENTLY ACTIVE
                  </div>
                )}

                <div>
                  {/* Header Row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            background: isSelected ? '#1976d2' : '#0d1e3a',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {corridor.code}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#0d1e3a' }}>{corridor.shortName}</strong>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#5f718a', marginTop: '3px' }}>
                        {corridor.routeTitle || `${corridor.from} ➔ ${corridor.to}`}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#1976d2', fontWeight: 600, marginTop: '2px' }}>
                        {corridor.sector}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background:
                          corridor.riskBand === 'Critical' || corridor.statusType === 'critical'
                            ? '#fee2e2'
                            : corridor.riskBand === 'High' || corridor.statusType === 'warning'
                            ? '#fff7ed'
                            : '#dcfce7',
                        color:
                          corridor.riskBand === 'Critical' || corridor.statusType === 'critical'
                            ? '#dc2626'
                            : corridor.riskBand === 'High' || corridor.statusType === 'warning'
                            ? '#ea580c'
                            : '#16a34a',
                      }}
                    >
                      {corridor.riskBand || 'Active'} Risk
                    </span>
                  </div>

                  {/* Core Metrics Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      margin: '10px 0',
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Daily Traffic Volume</span>
                      <strong style={{ color: '#0d1e3a', fontSize: '13px' }}>{corridor.dailyVolume}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Overspeed Rate</span>
                      <strong
                        style={{
                          color: parseFloat(corridor.overspeedRate) > 50 ? '#dc2626' : '#d97706',
                          fontSize: '13px',
                        }}
                      >
                        {corridor.overspeedRate}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Length & Lanes</span>
                      <strong style={{ color: '#0d1e3a' }}>{corridor.lengthKm} km · {corridor.camerasCount} Cams</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '10.5px', display: 'block' }}>Active Incidents</span>
                      <strong style={{ color: corridor.activeIncidentsCount > 0 ? '#dc2626' : '#16a34a' }}>
                        {corridor.activeIncidentsCount} Hazards
                      </strong>
                    </div>
                  </div>

                  {/* Speed Bar */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Average Speed vs Limit</span>
                      <strong style={{ color: '#0d1e3a' }}>
                        {corridor.avgSpeed} / {corridor.speedLimit} km/h ({speedRatio}%)
                      </strong>
                    </div>
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, speedRatio)}%`,
                          background: speedRatio > 85 ? '#dc2626' : speedRatio > 65 ? '#d97706' : '#16a34a',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Active Incident Callout if present */}
                  {corridor.incidents && corridor.incidents.length > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(corridor.id, true)
                      }}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11px',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      title="Click to view full incident details and highway map"
                    >
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        <strong>{corridor.incidents[0]?.shortTitle || corridor.incidents[0]?.title || 'Incident'}:</strong>{' '}
                        {corridor.incidents[0]?.location || 'Corridor stretch'}
                      </span>
                      <ArrowRight size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Key: {corridor.towns ? corridor.towns.slice(0, 2).join(' ➔ ') : corridor.from}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(corridor.id, true)
                    }}
                    style={{
                      background: isSelected ? '#1976d2' : '#0d1e3a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 13px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 2px 8px rgba(25, 118, 210, 0.25)' : 'none',
                    }}
                    title={`View ${corridor.shortName} live incidents, blast radius, and map`}
                  >
                    <span>{isSelected ? 'View Incidents & Map' : 'Select Corridor'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 3B. SELECTED CORRIDOR LIVE INCIDENT MAP & TELEMETRY SECTION ── */}
      <div
        id="active-corridor-map-section"
        style={{
          background: '#ffffff',
          border: '2px solid #1976d2',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#1976d2',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {activeCorridorData.code}
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0d1e3a' }}>
                {activeCorridorData.name} — Live Incident Map & Telemetry
              </h3>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: activeCorridorData.riskBand === 'Critical' ? '#fee2e2' : '#fff7ed',
                  color: activeCorridorData.riskBand === 'Critical' ? '#dc2626' : '#ea580c',
                }}
              >
                {activeCorridorData.riskBand} Risk
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#5f718a' }}>
              {activeCorridorData.routeTitle} · {activeCorridorData.lengthKm} km · {activeCorridorData.camerasCount} ANPR Cams · {activeCorridorData.activeIncidentsCount} Active Hazards
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const mapEl = document.getElementById('active-corridor-map-section')
                if (mapEl) {
                  mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
              title="Scroll to corridor highway map and camera telemetry"
            >
              <span>Corridor Highway Map</span>
              <span style={{ fontSize: '13px' }}>↓</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect(activeCorridorId, true)}
              style={{
                background: '#0d1e3a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
            >
              <span>Open Incident Deep Dive Console</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Embedded Interactive Corridor Map */}
        <div style={{ height: '420px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <CorridorHighwayMap selectedCorridorId={activeCorridorId} />
        </div>
      </div>

      {/* ── 4. COMPLETE BENCHMARK COMPARISON TABLE ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '18px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0d1e3a' }}>
              Multi-Corridor Benchmark Matrix
            </h4>
            <span style={{ fontSize: '11.5px', color: '#5f718a' }}>
              Comparative cross-corridor metrics, compliance rates, risk categories, and bottleneck hotspots
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Showing {filteredCorridors.length} of {CORRIDORS_LIST.length} Corridors
          </span>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Corridor Code</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Route Title & Sector</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Length & Cams</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Daily Traffic</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Overspeed Rate</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Active Incidents</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Risk Band</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Primary Hotspot</th>
                <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCorridors.map((c) => {
                const isSelected =
                  activeCorridorId === c.id ||
                  activeCorridorId === c.code ||
                  activeCorridorId === c.dbId
                const topIncident = c.incidents && c.incidents[0]

                return (
                  <tr
                    key={c.id}
                    onClick={() => handleSelect(c.id, false)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          background: isSelected ? '#1976d2' : '#0d1e3a',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {c.code}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#0d1e3a', display: 'block' }}>{c.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{c.sector}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      {c.lengthKm} km · {c.camerasCount} Cams
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d1e3a' }}>
                      {c.dailyVolume}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: parseFloat(c.overspeedRate) > 50 ? '#dc2626' : '#d97706',
                      }}
                    >
                      {c.overspeedRate}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: c.activeIncidentsCount > 0 ? '#fee2e2' : '#dcfce7',
                          color: c.activeIncidentsCount > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {c.activeIncidentsCount} Incidents
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '11px',
                          color:
                            c.riskBand === 'Critical'
                              ? '#dc2626'
                              : c.riskBand === 'High'
                              ? '#ea580c'
                              : '#16a34a',
                        }}
                      >
                        {c.riskBand || 'Moderate'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '11.5px', color: '#475569' }}>
                      {topIncident ? (
                        <span>
                          <strong>{topIncident.shortTitle || topIncident.title || 'Incident'}:</strong> {topIncident.location}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>Unimpeded flow</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect(c.id, true)
                        }}
                        style={{
                          background: isSelected ? '#1976d2' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#1976d2',
                          border: '1px solid #1976d2',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title={`Open ${c.shortName} incidents console and map`}
                      >
                        {isSelected ? 'Incidents ↗' : 'Select'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
