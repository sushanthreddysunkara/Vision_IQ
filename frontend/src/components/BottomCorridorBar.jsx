import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Map,
  Navigation,
  Radio,
  ShieldAlert,
} from 'lucide-react'
import { CORRIDORS_LIST, getCorridorById } from '../data/corridorsData'

export default function BottomCorridorBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const stripRef = useRef(null)
  const activeChipRef = useRef(null)

  const [activeCorridorId, setActiveCorridorId] = useState(() => {
    try {
      return localStorage.getItem('visioniq-active-corridor') || 'CORRIDOR-01'
    } catch {
      return 'CORRIDOR-01'
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

  // Automatically scroll active corridor chip into center view so it never hides under the arrow
  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [activeCorridorId])

  const currentCorridor = getCorridorById(activeCorridorId)
  const currentIndex = CORRIDORS_LIST.findIndex(
    (c) => c.id === currentCorridor.id || c.code === currentCorridor.code
  )
  const safeIndex = currentIndex >= 0 ? currentIndex : 0

  const handleSelectCorridor = (corridorId) => {
    setActiveCorridorId(corridorId)
    try {
      localStorage.setItem('visioniq-active-corridor', corridorId)
      window.dispatchEvent(new CustomEvent('visioniq:set-corridor', { detail: corridorId }))
      if (pathname === '/live-view') {
        window.dispatchEvent(new CustomEvent('visioniq:switch-tab', { detail: 'map' }))
      }
    } catch {
      // ignore
    }

    // Open respective map and output view without navigating away from the page
    if (pathname === '/live-view') {
      window.dispatchEvent(new CustomEvent('visioniq:switch-tab', { detail: 'map' }))
      setTimeout(() => {
        const el = document.querySelector('.corridor-map-section') || document.querySelector('.viq-live-view-container')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    } else if (pathname === '/vehicle-information') {
      window.dispatchEvent(new CustomEvent('visioniq:set-map-mode', { detail: 'corridor' }))
      setTimeout(() => {
        const el = document.getElementById('corridor-map-container') || document.querySelector('.vi-corridor-overview-banner')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    } else {
      // Stay on the Excel dashboard (/home, /dashboards, etc.) and scroll to the respective corridor map & incidents
      setTimeout(() => {
        const el = document.getElementById('corridor-highway-map-section')
          || document.querySelector('.corridor-map-grid-container')
          || document.querySelector('.corridor-highway-card')
          || document.querySelector('.vi-corridor-overview-banner')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  // Global 'M' shortcut to quickly scroll to active corridor map without leaving current page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
      ) {
        return
      }
      if (e.key === 'm' || e.key === 'M') {
        if (pathname === '/live-view') {
          window.dispatchEvent(new CustomEvent('visioniq:switch-tab', { detail: 'map' }))
          const el = document.querySelector('.corridor-map-section')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          const el = document.getElementById('corridor-highway-map-section')
            || document.querySelector('.corridor-map-grid-container')
            || document.querySelector('.corridor-highway-card')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pathname, activeCorridorId])

  const handlePrev = () => {
    const prevIdx = (safeIndex - 1 + CORRIDORS_LIST.length) % CORRIDORS_LIST.length
    handleSelectCorridor(CORRIDORS_LIST[prevIdx].id)
  }

  const handleNext = () => {
    const nextIdx = (safeIndex + 1) % CORRIDORS_LIST.length
    handleSelectCorridor(CORRIDORS_LIST[nextIdx].id)
  }

  return (
    <footer className="viq-bottom-corridor-bar">
      {/* Left: Active Corridor Title & Prev/Next */}
      <div className="bottom-corridor-indicator">
        <div className="bottom-corridor-icon-badge">
          <Navigation size={13} />
        </div>
        <div className="bottom-corridor-text">
          <div className="bottom-corridor-code-row">
            <span className="bottom-corridor-code">{currentCorridor.code}</span>
            <span className="bottom-corridor-name">{currentCorridor.shortName}</span>
            <span
              className={`bottom-corridor-risk-pill ${
                currentCorridor.riskBand === 'Critical'
                  ? 'risk-critical'
                  : currentCorridor.riskBand === 'High'
                  ? 'risk-high'
                  : 'risk-normal'
              }`}
            >
              {currentCorridor.riskBand || 'Active'}
            </span>
          </div>
          <span className="bottom-corridor-towns">
            {currentCorridor.routeTitle || `${currentCorridor.from} ➔ ${currentCorridor.to}`}
          </span>
        </div>
      </div>

      {/* Center: Scrollable Corridor Quick Pills */}
      <div className="bottom-bar-steps-scroll">
        <button
          type="button"
          className="bottom-nav-arrow-btn"
          onClick={handlePrev}
          title="Previous Corridor"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="bottom-steps-strip" ref={stripRef}>
          {CORRIDORS_LIST.map((c, idx) => {
            const isSelected =
              activeCorridorId === c.id ||
              activeCorridorId === c.code ||
              activeCorridorId === c.dbId
            return (
              <button
                key={c.id}
                ref={isSelected ? activeChipRef : null}
                type="button"
                className={`bottom-corridor-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectCorridor(c.id)}
                title={`${c.name} (${c.lengthKm} km · ${c.activeIncidentsCount} hazards)`}
              >
                <span
                  className="bottom-corridor-chip-dot"
                  style={{
                    background:
                      c.riskBand === 'Critical'
                        ? '#dc2626'
                        : c.riskBand === 'High'
                        ? '#ea580c'
                        : '#16a34a',
                  }}
                />
                <span className="bottom-chip-code">{c.code}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="bottom-nav-arrow-btn"
          onClick={handleNext}
          title="Next Corridor"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Right Page Controls & Slider */}
      <div className="bottom-bar-controls">
        <span className="bottom-page-counter bottom-desktop-only">
          Corridor {safeIndex + 1} / {CORRIDORS_LIST.length}
        </span>

        {/* Mini progress slider */}
        <div className="bottom-slider-track bottom-desktop-only">
          <div
            className="bottom-slider-fill"
            style={{ width: `${Math.round(((safeIndex + 1) / CORRIDORS_LIST.length) * 100)}%` }}
          />
        </div>

        {/* Live View quick jump */}
        <button
          type="button"
          className={`bottom-nav-btn bottom-desktop-only ${pathname === '/live-view' ? 'bottom-nav-btn-primary' : ''}`}
          onClick={() => navigate('/live-view')}
          title="Switch to Live View"
        >
          <span>Live View</span>
        </button>

        {/* Incidents quick jump */}
        <button
          type="button"
          className="bottom-nav-btn bottom-desktop-only"
          onClick={() => navigate('/vehicle-information')}
          title="Corridor Incident Deep Dive"
        >
          <span>Incidents</span>
        </button>

        {/* Map toggle */}
        <button
          type="button"
          className="bottom-map-toggle-btn"
          onClick={() => {
            if (pathname === '/live-view') {
              window.dispatchEvent(new CustomEvent('visioniq:switch-tab', { detail: 'map' }))
              const el = document.querySelector('.corridor-map-section')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
              const el = document.getElementById('corridor-highway-map-section')
                || document.querySelector('.corridor-map-grid-container')
                || document.querySelector('.corridor-highway-card')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          title="Scroll to active corridor map (Shortcut M)"
        >
          <Map size={13} />
          <span>Map</span>
          <span className="kbd-shortcut">M</span>
        </button>
      </div>
    </footer>
  )
}
