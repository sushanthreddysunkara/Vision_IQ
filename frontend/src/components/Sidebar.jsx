import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, FileSpreadsheet } from 'lucide-react'
import { navigation } from '../data/navigation'

export default function Sidebar({
  liveMode = false,
  onToggleLiveMode = null,
  sidebarOpen = false,
  setSidebarOpen = null,
  isSidebarPinned = false,
  isSidebarHovered = false,
  handleSidebarMouseEnter = null,
  handleSidebarMouseLeave = null,
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isLive = liveMode || pathname.startsWith('/live')

  const handleNavClick = () => {
    if (setSidebarOpen) {
      setSidebarOpen(false)
    }
    if (!isSidebarPinned && handleSidebarMouseLeave) {
      handleSidebarMouseLeave()
    }
  }

  const handleSwitchToLive = () => {
    handleNavClick()
    onToggleLiveMode?.(true)
    try {
      localStorage.setItem('visioniq-live-mode', 'true')
    } catch {}
    if (!pathname.startsWith('/live')) {
      const liveTarget = `/live${pathname === '/' ? '/home' : pathname}`
      navigate(liveTarget)
    } else {
      navigate('/live/home')
    }
  }

  const handleSwitchToExcel = () => {
    handleNavClick()
    onToggleLiveMode?.(false)
    try {
      localStorage.setItem('visioniq-live-mode', 'false')
    } catch {}
    if (pathname.startsWith('/live')) {
      const excelTarget = pathname.replace(/^\/live/, '') || '/home'
      navigate(excelTarget)
    } else {
      navigate('/home')
    }
  }

  const isExpanded = isSidebarPinned || isSidebarHovered || sidebarOpen

  return (
    <aside
      className={`viq-dark-sidebar ${isExpanded ? 'is-open' : 'is-closed'} ${isSidebarPinned ? 'is-pinned' : 'is-unpinned'
        }`}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      {/* ── Mode Subtitle / Live Indicator ── */}
      {isLive && (
        <div className="viq-sidebar-mode-indicator" title="Currently viewing Live Feed Interface">
          <span className="viq-sidebar-live-dot" />
          <span className="viq-sidebar-mode-text">LIVE FEED TELEMETRY</span>
        </div>
      )}

      {/* ── Primary Navigation List ── */}
      <nav aria-label="Primary navigation" className="viq-nav-list">
        {navigation.map(({ label, path, icon: Icon, exact }) => {
          // In live mode, route to /live${path}
          const targetPath = isLive ? `/live${path}` : path
          const isActive = isLive
            ? pathname === targetPath || (path !== '/home' && pathname.startsWith(targetPath))
            : pathname === path || (path !== '/home' && !pathname.startsWith('/live') && pathname.startsWith(path))

          return (
            <NavLink
              className={`viq-nav-item ${isActive ? 'active' : ''}`}
              end={exact}
              key={path}
              onClick={handleNavClick}
              title={`${label} (${isLive ? 'Live Feed' : 'Excel Data'})`}
              to={targetPath}
            >
              {Icon === 'rupee' ? (
                <span className="viq-nav-rupee-icon" aria-hidden="true">₹</span>
              ) : (
                <Icon className="viq-nav-icon" size={18} strokeWidth={2} />
              )}
              <span className="viq-nav-label">{label}</span>
              {isLive && label === 'Camera Network' && (
                <span className="viq-nav-live-subbadge">LIVE</span>
              )}
            </NavLink>
          )
        })}

        {/* ── Mode Switcher Button (Below Rules & Events) ── */}
        <div className="viq-sidebar-mode-section">
          {!isLive ? (
            /* In Excel mode: Show ONLY Live Data button */
            <button
              type="button"
              className="viq-sidebar-switch-btn switch-to-live"
              onClick={handleSwitchToLive}
              title="Switch to Real-time Live Telemetry Feed"
            >
              <div className="sidebar-switch-btn-left">
                <span className="viq-sidebar-live-radar">
                  <span className="radar-ring" />
                  <span className="radar-core" />
                </span>
                <div className="sidebar-switch-btn-copy">
                  <span className="switch-btn-title">Live Feed</span>
                  <span className="switch-btn-subtitle">Real-time Stream</span>
                </div>
              </div>
              <ChevronRight className="switch-btn-arrow" size={15} />
            </button>
          ) : (
            /* In Live mode: Show ONLY Excel Data button */
            <button
              type="button"
              className="viq-sidebar-switch-btn switch-to-excel"
              onClick={handleSwitchToExcel}
              title="Switch to Excel Data & Corridor Records"
            >
              <div className="sidebar-switch-btn-left">
                <span className="viq-sidebar-excel-icon-wrap">
                  <FileSpreadsheet size={16} strokeWidth={2.4} />
                </span>
                <div className="sidebar-switch-btn-copy">
                  <span className="switch-btn-title">Excel Data</span>
                  <span className="switch-btn-subtitle">Corridor Hub</span>
                </div>
              </div>
              <ChevronRight className="switch-btn-arrow" size={15} />
            </button>
          )}
        </div>
      </nav>

      {/* ── Bottom Highway Graphic with "Smarter Highways Brighter India" ── */}
      <div className="viq-sidebar-bottom-graphic">
        <img
          src="/images/sidebar_highway_bg.jpg"
          alt="Highway Corridor"
          className="viq-sidebar-highway-img"
        />
        <div className="viq-sidebar-highway-gradient" />
        <div className="viq-sidebar-quote">
          <span className="quote-word-1">Smarter</span>
          <span className="quote-word-2">Highways</span>
          <span className="quote-word-3">Brighter India</span>
        </div>
      </div>
    </aside>
  )
}
