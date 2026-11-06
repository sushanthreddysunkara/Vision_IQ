import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Play,
  Search,
  Settings2,
  Square,
  UserCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

export default function Topbar({
  searchOpen,
  setSearchOpen,
  streamNotifications = [],
  notificationSoundEnabled,
  setNotificationSoundEnabled,
  streamPaused = false,
  onToggleStreamPause = null,
  liveMode = false,
  onToggleLiveMode = null,
  sidebarOpen = false,
  setSidebarOpen = null,
  isSidebarPinned = false,
  toggleSidebarPin = null,
  handleSidebarMouseEnter = null,
  handleSidebarMouseLeave = null,
  setIsSidebarHovered = null,
}) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const seenNotificationIds = useRef(new Set())
  const notificationWrapRef = useRef(null)
  const accountWrapRef = useRef(null)

  useEffect(() => {
    const newNotificationCount = streamNotifications.reduce((count, notification) => {
      if (seenNotificationIds.current.has(notification.id)) return count
      seenNotificationIds.current.add(notification.id)
      return count + 1
    }, 0)
    if (newNotificationCount) setUnreadCount((count) => count + newNotificationCount)
  }, [streamNotifications])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationWrapRef.current && !notificationWrapRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
      if (accountWrapRef.current && !accountWrapRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  // Keyboard shortcut '/' to focus search bar
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === '/' && document.activeElement !== searchInputRef.current) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/query?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Format date: e.g. "Tue, 16 Sep 2026"
  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Format time: e.g. "08:45 AM"
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const rawUserName = user?.username || user?.displayName || user?.name || user?.email || 'User'
  const userInitial = rawUserName.trim().charAt(0).toUpperCase() || 'U'
  const displayName = user?.displayName || user?.name || user?.username || 'Operator'

  return (
    <header className="viq-global-topbar">
      {/* 1. Brand Logo + Single 3-Bar Toggle Button */}
      <div
        className="topbar-brand-section"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <button
          type="button"
          className={`topbar-menu-toggle-btn ${isSidebarPinned ? 'is-pinned' : ''} ${sidebarOpen ? 'is-active' : ''}`}
          onClick={toggleSidebarPin}
          aria-label={
            isSidebarPinned
              ? 'Sidebar is Fixed (Click to unpin and close)'
              : sidebarOpen
                ? 'Close sidebar'
                : 'Toggle or Fix sidebar'
          }
          title={
            isSidebarPinned
              ? 'Sidebar is Fixed (Click to unpin & close)'
              : 'Hover to preview · Click to Fix/Pin sidebar'
          }
        >
          <Menu size={20} strokeWidth={2.5} />
          {isSidebarPinned && <span className="pin-active-dot" />}
        </button>

        <div
          className="topbar-brand-lockup"
          onClick={() => navigate(liveMode ? '/live/home' : '/home')}
          style={{ cursor: 'pointer' }}
        >
          <div className="topbar-logo-text">
            <span className="logo-vizi">VIZION</span>
            <span className="logo-iq">IQ</span>
            <span className="logo-dot" />
          </div>
          <span className="topbar-logo-subtitle">Highway Intelligence Platform</span>
        </div>

        {/* 3-Line Mission Slogan */}
        <div className="topbar-mission-slogan">
          <span>See More.</span>
          <span>Know Sooner.</span>
          <span>Act Smarter.</span>
        </div>
      </div>

      <div className="topbar-mode-switcher" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className={`topbar-mode-btn ${!liveMode ? 'active' : ''}`}
          onClick={() => {
            onToggleLiveMode?.(false)
            if (pathname.startsWith('/live')) {
              const excelTarget = pathname.replace(/^\/live/, '') || '/home'
              navigate(excelTarget)
            } else {
              navigate('/home')
            }
          }}
          type="button"
          title="Switch to Excel Data Interface"
        >
          Excel Data
        </button>
        <button
          className={`topbar-mode-btn ${liveMode ? 'active' : ''}`}
          onClick={() => {
            onToggleLiveMode?.(true)
            if (!pathname.startsWith('/live')) {
              const liveTarget = `/live${pathname === '/' ? '/home' : pathname}`
              navigate(liveTarget)
            } else {
              navigate('/live/home')
            }
          }}
          type="button"
          title="Switch to Live Feed Interface"
        >
          <span className="viq-topbar-live-dot" />
          Live Feed
        </button>
      </div>

      {/* 2. Center Pill Search Bar */}
      {!liveMode && (
        <form className="topbar-center-search-form" onSubmit={handleSearchSubmit}>
          <Search className="topbar-search-icon" size={16} strokeWidth={2.2} />
          <input
            aria-label="Search location, camera, incident or asset..."
            className="topbar-search-input"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location, camera, incident or asset..."
            ref={searchInputRef}
            type="text"
            value={searchQuery}
          />
          <span className="topbar-search-kbd" title="Press / to search">/</span>
        </form>
      )}

      {/* 3. Right Status Actions */}
      <div className="topbar-right-meta">
        {/* Slogan + Indian Flag */}
        <div className="topbar-national-motto">
          <span>For a Safer, Smarter, Stronger India.</span>
          <span className="topbar-flag" title="India">
            <svg width="22" height="15" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FF9933" d="M0 0h900v200H0z" />
              <path fill="#FFFFFF" d="M0 200h900v200H0z" />
              <path fill="#128807" d="M0 400h900v200H0z" />
              <circle fill="#000088" cx="450" cy="300" r="80" />
              <circle fill="#FFFFFF" cx="450" cy="300" r="68" />
              <circle fill="#000088" cx="450" cy="300" r="16" />
            </svg>
          </span>
        </div>

        {/* Date & Time */}
        <div className="topbar-datetime-block">
          <span>{formattedDate}</span>
          <span className="topbar-pipe">|</span>
          <strong>{formattedTime}</strong>
        </div>

        {!liveMode && <span className="topbar-divider-pipe">|</span>}

        {/* Stream pause toggle (optional discrete icon) */}
        {!liveMode && onToggleStreamPause && (
          <button
            type="button"
            className={`topbar-mini-stream-btn ${streamPaused ? 'paused' : 'live'}`}
            onClick={onToggleStreamPause}
            title={streamPaused ? 'Resume Live Stream' : 'Pause Live Stream'}
          >
            {streamPaused ? <Play size={13} fill="currentColor" /> : <Square size={11} fill="currentColor" />}
          </button>
        )}

        {/* Notification Bell with Badge */}
        {!liveMode && <div className="notification-wrap" ref={notificationWrapRef}>
          <button
            aria-expanded={notificationsOpen}
            aria-haspopup="menu"
            aria-label="Notifications"
            className="topbar-bell-btn"
            onClick={() => {
              setNotificationsOpen((current) => !current)
              setUnreadCount(0)
            }}
            type="button"
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="topbar-bell-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-menu" role="menu">
              <div className="notification-menu-heading">
                <div>
                  <strong>Live Telemetry Stream</strong>
                  <span>Corridor Detections & Incidents</span>
                </div>
                <span>{streamNotifications.length || 3}</span>
              </div>
              <div className="notification-setting">
                <span>Alert chime</span>
                <button
                  aria-label="Toggle notification sound"
                  className={`sound-toggle ${notificationSoundEnabled ? 'is-on' : ''}`}
                  onClick={() => setNotificationSoundEnabled((current) => !current)}
                  type="button"
                >
                  <span />
                </button>
              </div>
              <button
                className="notification-item"
                onClick={() => {
                  setNotificationsOpen(false)
                  navigate('/live-view')
                }}
                role="menuitem"
                type="button"
              >
                <span className="notification-item-dot" style={{ background: '#dc2626' }} />
                <div>
                  <strong>Accident / Collision Detected</strong>
                  <span>NH-44 · Km 84.5 Near Jadcherla</span>
                  <small>Multiple vehicles · 2 lanes blocked</small>
                </div>
              </button>
              <button
                className="notification-item"
                onClick={() => {
                  setNotificationsOpen(false)
                  navigate('/vehicle-information')
                }}
                role="menuitem"
                type="button"
              >
                <span className="notification-item-dot" style={{ background: '#dc2626' }} />
                <div>
                  <strong>Vehicle Fire Alert</strong>
                  <span>NH-44 · Km 398 Near Raptadu</span>
                  <small>Car on shoulder · High severity</small>
                </div>
              </button>
              <button
                className="notification-item"
                onClick={() => {
                  setNotificationsOpen(false)
                  navigate('/dashboards/traffic')
                }}
                role="menuitem"
                type="button"
              >
                <span className="notification-item-dot" style={{ background: '#d97706' }} />
                <div>
                  <strong>Stalled Vehicle Alert</strong>
                  <span>NH-44 · Km 131.2 Near Kothakota</span>
                  <small>Lane 2 blocked · Medium severity</small>
                </div>
              </button>
            </div>
          )}
        </div>}

        {/* User Avatar Circle */}
        <div className="topbar-user-wrap" ref={accountWrapRef}>
          <button
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            className="topbar-avatar-btn"
            onClick={() => setAccountOpen((val) => !val)}
            type="button"
            title={displayName}
          >
            <span>{userInitial}</span>
          </button>

          {accountOpen && (
            <div className="topbar-account-menu" role="menu">
              <div className="account-menu-header">
                <strong>{displayName}</strong>
                <span>Command Center Operator</span>
              </div>
              <NavLink onClick={() => setAccountOpen(false)} role="menuitem" to="/profile">
                <UserCircle size={15} /> Operator Profile
              </NavLink>
              <NavLink onClick={() => setAccountOpen(false)} role="menuitem" to="/settings">
                <Settings2 size={15} /> Settings
              </NavLink>
              <button onClick={logout} role="menuitem" type="button">
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
