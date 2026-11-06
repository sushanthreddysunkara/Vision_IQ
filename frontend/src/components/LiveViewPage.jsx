import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bike,
  Bus,
  Calendar,
  Camera,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudRain,
  CloudSun,
  Crosshair,
  Flame,
  Gauge,
  Layers,
  LayoutGrid,
  Leaf,
  Map,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Umbrella,
  Upload,
  Video,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cameraFeeds } from '../data/cameraFeeds'
import CorridorHighwayMap from './vehicle/CorridorHighwayMap'
import MediaPreviewModal from './MediaPreviewModal'
import CameraFeedModal from './CameraFeedModal'
import IncidentAnalyticsCards from './vehicle/IncidentAnalyticsCards'
import CollisionVehiclesTable from './vehicle/CollisionVehiclesTable'
import LocationIncidentImpactView from './vehicle/LocationIncidentImpactView'
import { CORRIDORS_LIST, getCorridorById } from '../data/corridorsData'
import { getVehicleIncidents } from '../services/vehicleService'

export default function LiveViewPage({
  rows = [],
  dbStats = null,
  fileName = '',
  latestBatchInfo = null,
  streamNotifications = [],
  streamPaused = false,
  onToggleStreamPause = null,
  onSwitchToExcelData = null,
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const videoRef = useRef(null)

  // State: Tab & active corridor with query param fallback
  const initialTab = searchParams.get('tab') === 'map' ? 'map' : 'grid'
  const [activeTab, setActiveTab] = useState(initialTab) // 'grid' | 'map'
  const [analyticsTab, setAnalyticsTab] = useState('all') // 'all' | 'incidents' | 'volume' | 'checkpoints'
  const [selectedHighway, setSelectedHighway] = useState(() => {
    try {
      const qCorridor = searchParams.get('corridor')
      if (qCorridor) return qCorridor
      return localStorage.getItem('visioniq-active-corridor') || 'CORRIDOR-01'
    } catch {
      return 'CORRIDOR-01'
    }
  })

  // Synchronize with external corridor changes and tab changes
  useEffect(() => {
    const handleCorridorEvent = (e) => {
      if (e.detail && typeof e.detail === 'string') {
        setSelectedHighway(e.detail)
      }
    }
    const handleTabEvent = (e) => {
      if (e.detail && (e.detail === 'map' || e.detail === 'grid')) {
        setActiveTab(e.detail)
      }
    }
    window.addEventListener('visioniq:set-corridor', handleCorridorEvent)
    window.addEventListener('visioniq:switch-tab', handleTabEvent)
    return () => {
      window.removeEventListener('visioniq:set-corridor', handleCorridorEvent)
      window.removeEventListener('visioniq:switch-tab', handleTabEvent)
    }
  }, [])

  // Synchronize when URL searchParams update
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'map' || tabParam === 'grid') {
      setActiveTab(tabParam)
    }
    const corridorParam = searchParams.get('corridor')
    if (corridorParam) {
      setSelectedHighway(corridorParam)
    }
  }, [searchParams])

  const handleCorridorSelect = (corridorId) => {
    setSelectedHighway(corridorId)
    try {
      localStorage.setItem('visioniq-active-corridor', corridorId)
      window.dispatchEvent(new CustomEvent('visioniq:set-corridor', { detail: corridorId }))
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('corridor', corridorId)
        return next
      })
    } catch {
      // ignore
    }
  }

  const [selectedRange, setSelectedRange] = useState('Km 0 – 570')
  const [selectedLanes, setSelectedLanes] = useState('All Lanes')
  const [selectedPreset, setSelectedPreset] = useState('Preset Views')
  const [now, setNow] = useState(() => new Date())
  const [ptzAction, setPtzAction] = useState('')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isMuted, setIsMuted] = useState(true)

  // Incident & Collision Data
  const [incidents, setIncidents] = useState([])
  const [selectedCollisionVehicle, setSelectedCollisionVehicle] = useState(null)
  const [selectedImpactLocationId, setSelectedImpactLocationId] = useState('jadcherla-84.5')

  const handleSelectImpactLocation = (locId, shouldScroll = true) => {
    setSelectedImpactLocationId(locId)
    if (analyticsTab !== 'all' && analyticsTab !== 'incidents') {
      setAnalyticsTab('incidents')
    }
    if (shouldScroll) {
      setTimeout(() => {
        const el = document.getElementById('corridor-impact-analysis')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }

  // Modals & Inspection
  const [previewModalRow, setPreviewModalRow] = useState(null)
  const [cameraFeedOpen, setCameraFeedOpen] = useState(false)
  const [selectedCameraFeed, setSelectedCameraFeed] = useState(null)
  const [timeFilter, setTimeFilter] = useState('Today')
  const [trendRange, setTrendRange] = useState('Last 24 Hours')
  const [liveSourceType, setLiveSourceType] = useState('camera')
  const [liveSourceUrl, setLiveSourceUrl] = useState('')
  const [liveStreamConnected, setLiveStreamConnected] = useState(false)
  const [liveStreamActive, setLiveStreamActive] = useState(false)
  const [liveUploadFile, setLiveUploadFile] = useState(null)
  const [liveUploadUrl, setLiveUploadUrl] = useState('')
  const [aiInferenceStatus, setAiInferenceStatus] = useState('Backend model adapter ready; direct RTSP playback requires server transcoding.')

  // Live timer for authentic clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load corridor incidents
  useEffect(() => {
    getVehicleIncidents().then((data) => {
      if (data && Array.isArray(data)) {
        setIncidents(data)
      }
    })
  }, [])

  const safeRows = Array.isArray(rows) ? rows : []
  const totalCount = dbStats?.totalEvents || (safeRows.length ? safeRows.length : 72540)
  const formattedTotal = Number(totalCount).toLocaleString()

  // Active corridor data from registry
  const activeCorridorData = useMemo(() => getCorridorById(selectedHighway), [selectedHighway])

  // Camera list for bottom strip based on current corridor
  const keyCameras = useMemo(() => {
    if (activeCorridorData.keyCameras && activeCorridorData.keyCameras.length > 0) {
      return activeCorridorData.keyCameras
    }
    return [
      { id: 'cam-def-1', km: 'Km 10', badge: null, img: '/images/image10.jpeg', location: `${activeCorridorData.shortName} Entrance` },
      { id: 'cam-def-2', km: 'Km 50', badge: 'Active Flow', badgeType: 'green', img: '/images/image20.jpeg', location: `${activeCorridorData.shortName} Plaza` },
    ]
  }, [activeCorridorData])

  const [selectedCam, setSelectedCam] = useState(keyCameras[0] || { id: 'cam-84.5', km: 'Km 84.5', img: '/images/image113.jpeg', location: 'Near Jadcherla' })

  // Synchronize camera selection when corridor changes
  useEffect(() => {
    if (keyCameras && keyCameras.length > 0) {
      setSelectedCam(keyCameras[0])
    }
  }, [selectedHighway, keyCameras])

  // Active detections dynamically populated from the active corridor's incident records
  const activeDetections = useMemo(() => {
    if (activeCorridorData.incidents && activeCorridorData.incidents.length > 0) {
      return activeCorridorData.incidents.map((inc, i) => {
        const IconC = inc.icon || AlertTriangle
        return {
          id: `det-${inc.id}`,
          title: inc.title,
          location: inc.fullLocation || `${activeCorridorData.code}, Km ${inc.kmMarker} · ${inc.location}`,
          impactLocationId: inc.id,
          detail: inc.subtitle || inc.summary?.slice(0, 45) || '1 lane affected',
          time: inc.time || '08:30 AM',
          severity: inc.severity || 'High',
          icon: IconC,
          iconBg: inc.iconBg || '#fee2e2',
          iconColor: inc.iconColor || '#dc2626',
          badgeClass: (inc.severity || 'high').toLowerCase() === 'critical' ? 'badge-high' : `badge-${(inc.severity || 'high').toLowerCase()}`,
          img: keyCameras[i % keyCameras.length]?.img || '/images/image113.jpeg',
        }
      })
    }
    return [
      {
        id: 'det-def',
        title: 'Smooth Corridor Flow',
        location: `${activeCorridorData.name}`,
        impactLocationId: 'jadcherla-84.5',
        detail: 'All lanes open',
        time: '08:30 AM',
        severity: 'Normal',
        icon: ShieldCheck,
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
        badgeClass: 'badge-low',
        img: '/images/image10.jpeg',
      },
    ]
  }, [activeCorridorData, keyCameras])

  // Checkpoint Flow & Speed intelligence along the active corridor
  const checkpointData = useMemo(() => {
    if (activeCorridorData.checkpoints && activeCorridorData.checkpoints.length > 0) {
      return activeCorridorData.checkpoints
    }
    return [
      { checkpoint: `${activeCorridorData.from} Gate`, km: 'Km 0', volume: 1840, avgSpeed: 78, speedLimit: activeCorridorData.speedLimit, overspeedRate: '4.2%', status: 'Normal', statusColor: 'green' },
      { checkpoint: `${activeCorridorData.to} Gate`, km: `Km ${activeCorridorData.lengthKm}`, volume: 1680, avgSpeed: 72, speedLimit: activeCorridorData.speedLimit, overspeedRate: '3.9%', status: 'Normal', statusColor: 'green' },
    ]
  }, [activeCorridorData])

  // Recent detections from data or realistic fallbacks
  const displayDetections = useMemo(() => {
    if (safeRows.length >= 4) {
      return safeRows.slice(0, 4).map((r, i) => ({
        plate: r.vehicleNumberPlate || r.numberPlate || 'TS09AB1234',
        type: r.type || r.vehicleType || 'Car',
        camera: r.camera || `HYD-00${i + 1}`,
        time: r.timestampIst ? r.timestampIst.slice(11, 16) : '10:24 AM',
        thumb: r.vehicle_image_url || r.image_url || `/images/image${(i * 12) + 1}.jpeg`,
      }))
    }
    return [
      { plate: 'TS09AB1234', type: 'Car', camera: 'HYD-001', time: '10:24 AM', thumb: '/images/image1.jpeg' },
      { plate: 'TS07XY5678', type: 'Truck', camera: 'HYD-003', time: '10:23 AM', thumb: '/images/image113.jpeg' },
      { plate: 'TS11CD4321', type: 'Bike', camera: 'HYD-002', time: '10:23 AM', thumb: '/images/image25.jpeg' },
      { plate: 'TS10EF9876', type: 'Bus', camera: 'HYD-001', time: '10:22 AM', thumb: '/images/image45.jpeg' },
    ]
  }, [safeRows])

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const formattedDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const handlePtz = (dir) => {
    setPtzAction(dir)
    setTimeout(() => setPtzAction(''), 400)
  }

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(1, prev + delta), 2.5))
  }

  const handleOpenLiveFeed = (camId) => {
    const feed = camId ? (cameraFeeds.find((c) => c.id === camId) || cameraFeeds[0]) : cameraFeeds[0]
    setSelectedCameraFeed(feed)
    setCameraFeedOpen(true)
  }

  return (
    <div className="viq-live-view-container" style={{ paddingBottom: '90px' }}>
      <div className="lv-mode-switch-banner" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(37, 99, 235, 0.18))',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: 14,
      }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#93c5fd' }}>Mode B · Live Feed / AI Detection</div>
          <strong style={{ display: 'block', marginTop: 4, fontSize: 20 }}>Traffic monitoring pipeline</strong>
        </div>
        <button
          type="button"
          className="lv-view-all-link"
          onClick={onSwitchToExcelData || (() => navigate('/home'))}
          style={{ background: 'rgba(15, 118, 110, 0.2)', borderColor: 'rgba(45, 212, 191, 0.4)' }}
        >
          <ArrowRight size={14} />
          Back to Excel Data
        </button>
      </div>

      <div className="viq-live-source-panel" style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 0.7fr',
        gap: 18,
        marginBottom: 20,
      }}>
        <div className="lv-panel-card" style={{ padding: 18 }}>
          <div className="lv-panel-header" style={{ marginBottom: 14 }}>
            <h2 className="lv-panel-title" style={{ fontSize: 18 }}>Video source</h2>
            <span className={`status-pill ${liveStreamConnected ? 'online' : 'offline'}`}>
              {liveStreamConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" className={`lv-tab-btn ${liveSourceType === 'camera' ? 'active' : ''}`} onClick={() => setLiveSourceType('camera')}>Live Camera / Stream</button>
            <button type="button" className={`lv-tab-btn ${liveSourceType === 'upload' ? 'active' : ''}`} onClick={() => setLiveSourceType('upload')}>Upload Video</button>
          </div>

          {liveSourceType === 'camera' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <input
                type="url"
                value={liveSourceUrl}
                onChange={(e) => setLiveSourceUrl(e.target.value)}
                placeholder="rtsp://camera.local/stream or https://example.com/stream.m3u8"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.6)', background: '#0f172a', color: '#e2e8f0' }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="lv-open-incident-btn" onClick={() => setLiveStreamConnected(true)}><Play size={14} /> Connect</button>
                <button type="button" className="lv-view-all-link" onClick={() => setLiveStreamActive((v) => !v)}>{liveStreamActive ? 'Stop' : 'Start'} Detection</button>
                <button type="button" className="lv-view-all-link" onClick={() => setLiveStreamConnected(false)}><RefreshCw size={14} /> Reconnect</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6, color: '#cbd5e1' }}>
                <span>Local video file</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={(event) => {
                    const file = event.target.files && event.target.files[0]
                    if (!file) return
                    if (file.size > 150 * 1024 * 1024) {
                      setAiInferenceStatus('Upload rejected: file exceeds 150 MB limit.')
                      return
                    }
                    setLiveUploadFile(file)
                    setLiveUploadUrl(URL.createObjectURL(file))
                    setAiInferenceStatus(`Uploaded ${file.name}. Detection is ready to run on the backend pipeline.`)
                  }}
                  style={{ width: '100%', color: '#e2e8f0' }}
                />
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="lv-open-incident-btn" onClick={() => setLiveStreamActive(true)}><Upload size={14} /> Start Detection</button>
                <button type="button" className="lv-view-all-link" onClick={() => setLiveStreamActive(false)}><Pause size={14} /> Stop Detection</button>
              </div>
            </div>
          )}
        </div>

        <div className="lv-panel-card" style={{ padding: 18 }}>
          <div className="lv-panel-header" style={{ marginBottom: 12 }}>
            <h2 className="lv-panel-title" style={{ fontSize: 18 }}>AI status</h2>
          </div>
          <div style={{ display: 'grid', gap: 10, color: '#cbd5e1' }}>
            <div className="info-pill">{aiInferenceStatus}</div>
            <div className="info-pill">Helmet, overspeed, and distraction models are loaded through the backend inference service.</div>
            <div className="info-pill">RTSP delivery is browser-limited; backend stream adapters are required for actual live RTSP playback.</div>
          </div>
        </div>
      </div>

      {/* ── Subheader: Page Title + Views + Filters ── */}
      <div className="lv-page-header">
        <div className="lv-title-group">
          <h1 className="lv-title">Live View</h1>
          <p className="lv-subtitle">
            Real-time visibility across the corridor · {activeCorridorData.name} ({activeCorridorData.lengthKm} km · {activeCorridorData.lanes})
          </p>
        </div>

        <div className="lv-controls-row">
          {/* View Mode Switcher */}
          <div className="lv-view-tabs">
            <button
              type="button"
              className={`lv-tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveTab('grid')}
            >
              Grid View
            </button>
            <button
              type="button"
              className={`lv-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              Map View
            </button>
          </div>

          {/* Filters on the right */}
          <div className="lv-filters-group">
            <div className="lv-select-wrap">
              <select
                value={selectedHighway}
                onChange={(e) => handleCorridorSelect(e.target.value)}
                className="lv-select"
              >
                <optgroup label="NH-44 Section Corridors (01 – 16)">
                  {CORRIDORS_LIST.filter((c) => c.corridorOrder >= 1 && c.corridorOrder <= 16).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.shortName}: {c.from} ➔ {c.to}
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
              <ChevronDown size={14} className="lv-select-chevron" />
            </div>

            <div className="lv-select-wrap">
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="lv-select"
              >
                <option value="Full Corridor">Full Corridor (0 – {activeCorridorData.lengthKm} km)</option>
                <option value="Start Sector">Km 0 – 100 ({activeCorridorData.from})</option>
                <option value="Mid Sector">Middle Highway Section</option>
                <option value="End Sector">Km {Math.max(0, activeCorridorData.lengthKm - 100)} – {activeCorridorData.lengthKm} ({activeCorridorData.to})</option>
              </select>
              <ChevronDown size={14} className="lv-select-chevron" />
            </div>

            <div className="lv-select-wrap">
              <select
                value={selectedLanes}
                onChange={(e) => setSelectedLanes(e.target.value)}
                className="lv-select"
              >
                <option value="All Lanes">All Lanes</option>
                <option value="Northbound (Hyderabad)">Northbound (Hyderabad)</option>
                <option value="Southbound (Bengaluru)">Southbound (Bengaluru)</option>
                <option value="Shoulder / Service Lanes">Shoulder / Service Lanes</option>
              </select>
              <ChevronDown size={14} className="lv-select-chevron" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. SIX CORRIDOR KPI STAT CARDS ── */}
      <div className="corridor-kpi-grid" style={{ marginBottom: '20px' }}>
        {/* Card 1: Active Incidents */}
        <div className="corridor-kpi-card" onClick={() => navigate('/vehicle-information')} style={{ cursor: 'pointer' }}>
          <div className="corridor-kpi-icon red">
            <AlertTriangle size={20} strokeWidth={2.4} />
          </div>
          <div className="corridor-kpi-body">
            <div className="corridor-kpi-number">12</div>
            <div className="corridor-kpi-label">Active Incidents</div>
            <div className="corridor-kpi-trend red">
              <span className="trend-arrow">↑</span> +3 vs. yesterday
            </div>
          </div>
        </div>

        {/* Card 2: Vehicles (last 1 hour) */}
        <div className="corridor-kpi-card" onClick={() => navigate('/dashboards/traffic')} style={{ cursor: 'pointer' }}>
          <div className="corridor-kpi-icon blue">
            <Car size={20} strokeWidth={2.4} />
          </div>
          <div className="corridor-kpi-body">
            <div className="corridor-kpi-number">{formattedTotal}</div>
            <div className="corridor-kpi-label">Vehicles (last 1 hour)</div>
            <div className="corridor-kpi-trend green">
              <span className="trend-arrow">↑</span> +8% vs. yesterday
            </div>
          </div>
        </div>

        {/* Card 3: Corridor Travel Time */}
        <div className="corridor-kpi-card">
          <div className="corridor-kpi-icon orange">
            <Clock size={20} strokeWidth={2.4} />
          </div>
          <div className="corridor-kpi-body">
            <div className="corridor-kpi-number">8 h 22 m</div>
            <div className="corridor-kpi-label">Corridor Travel Time</div>
            <div className="corridor-kpi-trend orange">
              <span className="trend-arrow">↑</span> +1 h 12 m vs normal
            </div>
          </div>
        </div>

        {/* Card 4: Toll Revenue (today) */}
        <div className="corridor-kpi-card" onClick={() => navigate('/toll-revenue')} style={{ cursor: 'pointer' }}>
          <div className="corridor-kpi-icon purple">
            <span className="rupee-icon" style={{ fontWeight: 800, fontSize: '18px' }}>₹</span>
          </div>
          <div className="corridor-kpi-body">
            <div className="corridor-kpi-number">₹ 1.28 Cr</div>
            <div className="corridor-kpi-label">Toll Revenue (today)</div>
            <div className="corridor-kpi-trend green">
              <span className="trend-arrow">↑</span> +4% vs. yesterday
            </div>
          </div>
        </div>

        {/* Card 5: Asset Alerts */}
        <div className="corridor-kpi-card" onClick={() => navigate('/assets-maintenance')} style={{ cursor: 'pointer' }}>
          <div className="corridor-kpi-icon amber">
            <Wrench size={20} strokeWidth={2.4} />
          </div>
          <div className="corridor-kpi-body">
            <div className="corridor-kpi-number">5</div>
            <div className="corridor-kpi-label">Asset Alerts</div>
            <div className="corridor-kpi-trend amber">
              <span className="trend-arrow">↑</span> 2 new today
            </div>
          </div>
        </div>

        {/* Card 6: Corridor Conditions */}
        <div className="corridor-kpi-card">
          <div className="corridor-kpi-icon green">
            <Leaf size={20} strokeWidth={2.4} />
          </div>
          <div className="corridor-kpi-body">
            <div className="corridor-kpi-number">
              {activeCorridorData.riskBand === 'Critical'
                ? 'High Alert'
                : activeCorridorData.riskBand === 'High'
                ? 'Caution'
                : 'Fair'}
            </div>
            <div className="corridor-kpi-label">Corridor Conditions</div>
            <div className="corridor-kpi-subtext" style={{ fontSize: '10px', color: '#64748b' }}>
              {activeCorridorData.shortName}: {activeCorridorData.routeTitle || `${activeCorridorData.from} ➔ ${activeCorridorData.to}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. IF MAP VIEW SELECTED: HERO FULL WIDTH MAP ── */}
      {activeTab === 'map' ? (
        <div className="corridor-map-section" style={{ marginBottom: '24px' }}>
          <CorridorHighwayMap
            selectedCorridorId={selectedHighway}
            onSelectCorridor={(cId) => handleCorridorSelect(cId)}
            onSelectIncident={(inc) => {
              handleSelectImpactLocation(inc.id)
            }}
            onOpenLiveCamera={handleOpenLiveFeed}
          />
        </div>
      ) : (
        /* ── 3. IF GRID VIEW: TARGET DESIGN 2-COLUMN LIVE STAGE ── */
        <div className="lv-main-grid" style={{ marginBottom: '24px' }}>
          {/* Left Column: Big Video + Key Camera Feed Strip */}
          <div className="lv-left-col">
            {/* Video Player Card */}
            <div className="lv-video-card">
              <div className="lv-video-viewport">
                {/* Actual Video */}
                {selectedCam.videoUrl ? (
                  <video
                    ref={videoRef}
                    className="lv-stream-video"
                    src={selectedCam.videoUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                ) : (
                  <div className="lv-video-offline">
                    <Camera size={36} />
                    <p>Camera Stream Offline</p>
                    <span>Reconnecting to {selectedCam.km} · {selectedCam.location}...</span>
                  </div>
                )}

                {/* Top Video Overlay Bar */}
                <div className="lv-video-top-overlay">
                  <div className="lv-badge-pill lv-badge-live">
                    <span className="lv-live-pulse-dot" />
                    <span>LIVE</span>
                  </div>

                  <div className="lv-badge-pill lv-badge-corridor">
                    <span>NH-44</span>
                    <span className="lv-pipe">|</span>
                    <span>{selectedCam.km}</span>
                    <span className="lv-pipe">|</span>
                    <span>Hyderabad → Bengaluru</span>
                  </div>

                  <div className="lv-badge-pill lv-badge-weather">
                    <span>☀ Clear • 28°C</span>
                  </div>

                  <div className="lv-badge-pill lv-badge-time">
                    <span>{formattedDate}</span>
                    <span className="lv-pipe">|</span>
                    <span>{formattedTime}</span>
                  </div>
                </div>

                {/* Red Accident Banner (Matching Screenshot exactly) */}
                {selectedCam.km === 'Km 84.5' && (
                  <div className="lv-alert-banner">
                    <AlertTriangle size={15} strokeWidth={2.4} />
                    <span>Accident / Collision • Multiple vehicles • 2 lanes blocked</span>
                  </div>
                )}

                {/* AI Detection Bounding Boxes (for Km 84.5) */}
                {selectedCam.km === 'Km 84.5' && (
                  <div className="lv-bounding-boxes-layer">
                    {/* Truck Box */}
                    <div className="lv-bbox lv-bbox-truck">
                      <span className="lv-bbox-tag">Truck</span>
                    </div>

                    {/* Car 1 Box */}
                    <div className="lv-bbox lv-bbox-car1">
                      <span className="lv-bbox-tag">Car 1</span>
                    </div>

                    {/* Car 2 Box */}
                    <div className="lv-bbox lv-bbox-car2">
                      <span className="lv-bbox-tag">Car 2</span>
                    </div>
                  </div>
                )}

                {/* Left Overlay Control Buttons */}
                <div className="lv-video-side-controls">
                  <button
                    type="button"
                    className="lv-side-btn"
                    title="Fullscreen"
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen()
                      }
                    }}
                  >
                    <Maximize2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="lv-side-btn"
                    title="Center AI Focus"
                    onClick={() => handlePtz('Center')}
                  >
                    <Target size={15} />
                  </button>
                  <button
                    type="button"
                    className="lv-side-btn"
                    title="Zoom In"
                    onClick={() => handleZoom(0.25)}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    className="lv-side-btn"
                    title="Zoom Out"
                    onClick={() => handleZoom(-0.25)}
                  >
                    <Minus size={16} />
                  </button>
                </div>

                {/* Bottom Video Bar */}
                <div className="lv-video-bottom-bar">
                  <div className="lv-camera-info">
                    <strong>CAM-0845</strong>
                    <span className="lv-dot-sep">•</span>
                    <span>Near Jadcherla</span>
                  </div>

                  <button
                    type="button"
                    className="lv-open-incident-btn"
                    onClick={() => navigate('/vehicle-information')}
                  >
                    <span>Open Incident INC-2040</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Key Cameras Carousel / Frame Strip */}
            <div className="lv-camera-strip-section">
              <div className="lv-strip-header">
                <span className="lv-strip-title">
                  <strong>Key cameras</strong> · 1-5 of 18 · select a frame to view it
                </span>
                <div className="lv-strip-arrows">
                  <button type="button" className="lv-arrow-btn" aria-label="Previous cameras">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" className="lv-arrow-btn" aria-label="Next cameras">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="lv-camera-cards-row">
                {keyCameras.map((cam) => {
                  const isSelected = selectedCam.id === cam.id
                  return (
                    <div
                      key={cam.id}
                      className={`lv-cam-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCam(cam)
                        if (cam.km === 'Km 84.5') handleSelectImpactLocation('jadcherla-84.5', false)
                        else if (cam.km === 'Km 131.2') handleSelectImpactLocation('kothakota-131.2', false)
                        else if (cam.km === 'Km 58' || cam.km === 'Km 31') handleSelectImpactLocation('shadnagar-58', false)
                      }}
                      title={`Select ${cam.km} - ${cam.location}`}
                    >
                      <div className="lv-cam-thumb-wrap">
                        <img src={cam.img} alt={cam.km} className="lv-cam-thumb-img" />
                        <div className="lv-cam-km-badge">{cam.km}</div>
                        {cam.badge && (
                          <div className={`lv-cam-status-pill ${cam.badgeType}`}>
                            <span className="pill-dot" />
                            <span>{cam.badge}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Detections + Camera PTZ Control */}
          <div className="lv-right-col">
            {/* Card 1: Active Detections (12) */}
            <div className="lv-panel-card lv-detections-card">
              <div className="lv-panel-header">
                <h2 className="lv-panel-title">Active Detections (12)</h2>
                <button
                  type="button"
                  className="lv-view-all-link"
                  onClick={() => navigate('/vehicle-information')}
                >
                  View All
                </button>
              </div>

              <div className="lv-detections-list">
                {activeDetections.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <div
                      key={item.id}
                      className="lv-detection-row"
                      onClick={() => handleSelectImpactLocation(item.impactLocationId || 'jadcherla-84.5')}
                      title={`Click to inspect incident & upstream/downstream impact at ${item.location}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Icon Column */}
                      <div
                        className="lv-detection-icon-wrap"
                        style={{ background: item.iconBg, color: item.iconColor }}
                      >
                        <IconComponent size={16} />
                      </div>

                      {/* Middle Info Column */}
                      <div className="lv-detection-info">
                        <div className="lv-detection-title-row">
                          <strong>{item.title}</strong>
                        </div>
                        <div className="lv-detection-loc">{item.location}</div>
                        <div className="lv-detection-sub">{item.detail}</div>
                      </div>

                      {/* Right Severity Column */}
                      <div className="lv-detection-meta">
                        <span className="lv-detection-time">{item.time}</span>
                        <span className={`lv-severity-pill ${item.badgeClass}`}>
                          {item.severity}
                        </span>
                      </div>

                      {/* Thumbnail */}
                      <div className="lv-detection-thumb">
                        <img src={item.img} alt={item.title} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Card 2: Camera PTZ Control */}
            <div className="lv-panel-card lv-ptz-card">
              <div className="lv-panel-header">
                <h2 className="lv-panel-title">Camera PTZ Control</h2>
                <div className="lv-select-wrap">
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="lv-select lv-select-preset"
                  >
                    <option value="Preset Views">Preset Views</option>
                    <option value="Toll Plaza Approach">Toll Plaza Approach</option>
                    <option value="Overhead Multi-Lane">Overhead Multi-Lane</option>
                    <option value="Interchange Merge">Interchange Merge</option>
                    <option value="Incident Focus (INC-2040)">Incident Focus (INC-2040)</option>
                  </select>
                  <ChevronDown size={14} className="lv-select-chevron" />
                </div>
              </div>

              <div className="lv-ptz-subtitle">
                Camera: NH-44 Km 84.5 • CAM-0845
              </div>

              <div className="lv-ptz-body">
                {/* Circular D-Pad Controller */}
                <div className="lv-ptz-dpad">
                  <button
                    type="button"
                    className={`ptz-btn ptz-up ${ptzAction === 'Up' ? 'active' : ''}`}
                    onClick={() => handlePtz('Up')}
                    title="Pan Up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={`ptz-btn ptz-left ${ptzAction === 'Left' ? 'active' : ''}`}
                    onClick={() => handlePtz('Left')}
                    title="Pan Left"
                  >
                    ◀
                  </button>
                  <div
                    className={`ptz-center-circle ${ptzAction ? 'active' : ''}`}
                    onClick={() => handlePtz('Center')}
                    title="Center View"
                  />
                  <button
                    type="button"
                    className={`ptz-btn ptz-right ${ptzAction === 'Right' ? 'active' : ''}`}
                    onClick={() => handlePtz('Right')}
                    title="Pan Right"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className={`ptz-btn ptz-down ${ptzAction === 'Down' ? 'active' : ''}`}
                    onClick={() => handlePtz('Down')}
                    title="Pan Down"
                  >
                    ▼
                  </button>
                </div>

                {/* Zoom & Focus Buttons Stack */}
                <div className="lv-ptz-actions-col">
                  <button
                    type="button"
                    className="lv-ptz-action-btn"
                    onClick={() => handleZoom(0.2)}
                  >
                    <span>+ Zoom +</span>
                  </button>
                  <button
                    type="button"
                    className="lv-ptz-action-btn"
                    onClick={() => handleZoom(-0.2)}
                  >
                    <span>– Zoom –</span>
                  </button>
                  <button
                    type="button"
                    className="lv-ptz-action-btn"
                    onClick={() => handlePtz('Focus In')}
                  >
                    <span>+ Focus +</span>
                  </button>
                  <button
                    type="button"
                    className="lv-ptz-action-btn"
                    onClick={() => handlePtz('Focus Out')}
                  >
                    <span>– Focus –</span>
                  </button>
                </div>
              </div>

              {/* Auto Track Button */}
              <button
                type="button"
                className="lv-auto-track-btn"
                onClick={() => handlePtz('Auto Track')}
              >
                <Target size={15} />
                <span>Auto Track</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. CORRIDOR HIGHWAY MAP SECTION (When in Grid View) ── */}
      {activeTab === 'grid' && (
        <div className="corridor-map-section" style={{ marginBottom: '28px' }}>
          <div className="lv-panel-header" style={{ marginBottom: '12px' }}>
            <h2 className="lv-panel-title" style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="#1976d2" />
              <span>Corridor Highway Map · NH-44 Hyderabad to Bengaluru (570 km)</span>
            </h2>
            <button
              type="button"
              className="lv-view-all-link"
              onClick={() => setActiveTab('map')}
            >
              Expand to Full View ↗
            </button>
          </div>
          <CorridorHighwayMap
            onOpenLiveCamera={handleOpenLiveFeed}
            selectedCorridorId={selectedHighway}
            onSelectCorridor={(cId) => setSelectedHighway(cId)}
            onSelectIncident={(inc) => {
              handleSelectImpactLocation(inc.id)
            }}
          />
        </div>
      )}

      {/* ── 5. CORRIDOR OPERATIONAL ANALYTICS SECTION ── */}
      <div className="corridor-analytics-section" style={{ marginTop: '30px' }}>
        {/* Top Header with Tab Switcher */}
        <div className="lv-analytics-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e2e8f0',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0d1e3a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#1976d2" />
              <span>Corridor Intelligence & Analytics Dashboards</span>
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#5f718a' }}>
              Cross-corridor benchmark, real-time vehicle classification mix, incident safety hazards, and speed flow
            </p>
          </div>

          {/* Sub-Dashboard Tabs Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`lv-dash-tab-btn ${analyticsTab === 'all' ? 'active' : ''}`}
              onClick={() => setAnalyticsTab('all')}
              style={{
                background: analyticsTab === 'all' ? '#1976d2' : 'transparent',
                color: analyticsTab === 'all' ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 13px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              All Dashboards
            </button>

            <button
              type="button"
              className={`lv-dash-tab-btn ${analyticsTab === 'incidents' ? 'active' : ''}`}
              onClick={() => setAnalyticsTab('incidents')}
              style={{
                background: analyticsTab === 'incidents' ? '#1976d2' : 'transparent',
                color: analyticsTab === 'incidents' ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 13px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Incident Hazards
            </button>
            <button
              type="button"
              className={`lv-dash-tab-btn ${analyticsTab === 'volume' ? 'active' : ''}`}
              onClick={() => setAnalyticsTab('volume')}
              style={{
                background: analyticsTab === 'volume' ? '#1976d2' : 'transparent',
                color: analyticsTab === 'volume' ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 13px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Volume & Mix
            </button>
            <button
              type="button"
              className={`lv-dash-tab-btn ${analyticsTab === 'checkpoints' ? 'active' : ''}`}
              onClick={() => setAnalyticsTab('checkpoints')}
              style={{
                background: analyticsTab === 'checkpoints' ? '#1976d2' : 'transparent',
                color: analyticsTab === 'checkpoints' ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 13px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Checkpoint Speed
            </button>
          </div>
        </div>



        {/* ── SUB-DASHBOARD A: INCIDENT HAZARD & SAFETY ANALYTICS ── */}
        {(analyticsTab === 'all' || analyticsTab === 'incidents') && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={18} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0d1e3a' }}>
                  Corridor Incident & Hazard Intelligence
                </h3>
              </div>
              <button
                type="button"
                className="lv-view-all-link"
                onClick={() => navigate('/vehicle-information')}
              >
                Inspect All Incidents →
              </button>
            </div>

            <IncidentAnalyticsCards vehicles={incidents.length ? incidents : safeRows} />

            {/* Location Incident & Blast Radius (Upstream & Downstream Impact) */}
            <div id="corridor-impact-analysis" style={{ marginTop: '20px' }}>
              <LocationIncidentImpactView
                selectedCorridorId={selectedHighway}
                selectedLocationId={selectedImpactLocationId}
                onSelectLocation={(locId) => setSelectedImpactLocationId(locId)}
              />
            </div>

            {/* Active Collision & Incident Target Table */}
            <div style={{ marginTop: '20px' }}>
              <CollisionVehiclesTable
                vehicles={incidents}
                selectedVehicle={selectedCollisionVehicle}
                onSelectVehicle={setSelectedCollisionVehicle}
              />
            </div>
          </div>
        )}

        {/* ── SUB-DASHBOARD B: VEHICLE CLASSIFICATION & VOLUME MIX ── */}
        {(analyticsTab === 'all' || analyticsTab === 'volume') && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} color="#1976d2" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0d1e3a' }}>
                  Vehicle Classification Mix & Traffic Volume Trends
                </h3>
              </div>
              <button
                type="button"
                className="lv-view-all-link"
                onClick={() => navigate('/dashboards/traffic')}
              >
                View Full Traffic Flow →
              </button>
            </div>

            <div className="viq-middle-grid viq-two-col-grid" style={{ marginBottom: '20px' }}>
              {/* Left: Vehicle Count by Type */}
              <div className="viq-card viq-bar-chart-card">
                <div className="viq-card-header">
                  <div className="viq-card-title-group">
                    <BarChart3 className="viq-card-icon" size={19} />
                    <h2>Vehicle Count by Type</h2>
                  </div>
                  <div className="viq-select-dropdown">
                    <Calendar size={13} />
                    <span>{timeFilter}</span>
                    <ChevronDown size={14} />
                  </div>
                </div>

                <div className="viq-bar-chart-canvas">
                  <div className="viq-chart-y-axis">
                    <span>4K</span>
                    <span>3K</span>
                    <span>2K</span>
                    <span>1K</span>
                    <span>0</span>
                  </div>

                  <div className="viq-chart-bars-wrap">
                    <div className="viq-chart-gridline" style={{ top: '0%' }} />
                    <div className="viq-chart-gridline" style={{ top: '25%' }} />
                    <div className="viq-chart-gridline" style={{ top: '50%' }} />
                    <div className="viq-chart-gridline" style={{ top: '75%' }} />
                    <div className="viq-chart-gridline" style={{ top: '100%' }} />

                    <div className="viq-chart-bars">
                      {/* Cars */}
                      <div className="viq-bar-col">
                        <span className="viq-bar-value">3,420</span>
                        <div className="viq-bar-fill green" style={{ height: '85.5%', background: '#1976d2' }} />
                        <div className="viq-bar-label">
                          <Car size={15} />
                          <span>Cars</span>
                        </div>
                      </div>

                      {/* Bikes */}
                      <div className="viq-bar-col">
                        <span className="viq-bar-value">2,890</span>
                        <div className="viq-bar-fill amber" style={{ height: '72.2%' }} />
                        <div className="viq-bar-label">
                          <Bike size={15} />
                          <span>Bikes</span>
                        </div>
                      </div>

                      {/* Trucks */}
                      <div className="viq-bar-col">
                        <span className="viq-bar-value">1,240</span>
                        <div className="viq-bar-fill terracotta" style={{ height: '31%' }} />
                        <div className="viq-bar-label">
                          <Truck size={15} />
                          <span>Trucks</span>
                        </div>
                      </div>

                      {/* Buses */}
                      <div className="viq-bar-col">
                        <span className="viq-bar-value">620</span>
                        <div className="viq-bar-fill blue" style={{ height: '15.5%' }} />
                        <div className="viq-bar-label">
                          <Bus size={15} />
                          <span>Buses</span>
                        </div>
                      </div>

                      {/* Auto */}
                      <div className="viq-bar-col">
                        <span className="viq-bar-value">950</span>
                        <div className="viq-bar-fill purple" style={{ height: '23.8%' }} />
                        <div className="viq-bar-label">
                          <Car size={15} />
                          <span>Auto</span>
                        </div>
                      </div>

                      {/* Other */}
                      <div className="viq-bar-col">
                        <span className="viq-bar-value">310</span>
                        <div className="viq-bar-fill slate" style={{ height: '7.8%' }} />
                        <div className="viq-bar-label">
                          <LayoutGrid size={15} />
                          <span>Other</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Vehicle Type Distribution (Donut Chart) */}
              <div className="viq-card viq-donut-card">
                <div className="viq-card-header">
                  <div className="viq-card-title-group">
                    <BarChart3 className="viq-card-icon" size={19} />
                    <h2>Vehicle Type Distribution</h2>
                  </div>
                </div>

                <div className="viq-donut-content">
                  <div className="viq-donut-graphic">
                    <svg viewBox="0 0 160 160" className="viq-donut-svg">
                      <circle cx="80" cy="80" r="54" fill="transparent" stroke="#1976d2" strokeWidth="22" strokeDasharray="159.5 179.5" strokeDashoffset="0" />
                      <circle cx="80" cy="80" r="54" fill="transparent" stroke="#d89f4b" strokeWidth="22" strokeDasharray="78 261" strokeDashoffset="-159.5" />
                      <circle cx="80" cy="80" r="54" fill="transparent" stroke="#cb5e48" strokeWidth="22" strokeDasharray="34 305" strokeDashoffset="-237.5" />
                      <circle cx="80" cy="80" r="54" fill="transparent" stroke="#0284c7" strokeWidth="22" strokeDasharray="17 322" strokeDashoffset="-271.5" />
                      <circle cx="80" cy="80" r="54" fill="transparent" stroke="#8d6ab0" strokeWidth="22" strokeDasharray="27 312" strokeDashoffset="-288.5" />
                      <circle cx="80" cy="80" r="54" fill="transparent" stroke="#83929b" strokeWidth="22" strokeDasharray="23.7 315" strokeDashoffset="-315.5" />
                    </svg>
                    <div className="viq-donut-center">
                      <strong className="viq-donut-total">{formattedTotal}</strong>
                      <span className="viq-donut-sub">Total</span>
                    </div>
                  </div>

                  <div className="viq-donut-legend">
                    <div className="viq-legend-row">
                      <span className="viq-legend-dot" style={{ background: '#1976d2' }} />
                      <span className="viq-legend-name">Cars</span>
                      <strong className="viq-legend-val">47%</strong>
                    </div>
                    <div className="viq-legend-row">
                      <span className="viq-legend-dot" style={{ background: '#d89f4b' }} />
                      <span className="viq-legend-name">Bikes</span>
                      <strong className="viq-legend-val">23%</strong>
                    </div>
                    <div className="viq-legend-row">
                      <span className="viq-legend-dot" style={{ background: '#cb5e48' }} />
                      <span className="viq-legend-name">Trucks</span>
                      <strong className="viq-legend-val">10%</strong>
                    </div>
                    <div className="viq-legend-row">
                      <span className="viq-legend-dot" style={{ background: '#0284c7' }} />
                      <span className="viq-legend-name">Buses</span>
                      <strong className="viq-legend-val">5%</strong>
                    </div>
                    <div className="viq-legend-row">
                      <span className="viq-legend-dot" style={{ background: '#8d6ab0' }} />
                      <span className="viq-legend-name">Auto</span>
                      <strong className="viq-legend-val">8%</strong>
                    </div>
                    <div className="viq-legend-row">
                      <span className="viq-legend-dot" style={{ background: '#83929b' }} />
                      <span className="viq-legend-name">Other</span>
                      <strong className="viq-legend-val">7%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Row: Traffic Volume Trend & Recent Detections List */}
            <div className="viq-bottom-grid viq-trend-detections-grid">
              {/* Traffic Trend Area Chart */}
              <div className="viq-card viq-trend-card">
                <div className="viq-card-header">
                  <div className="viq-card-title-group">
                    <TrendingUp className="viq-card-icon" size={19} />
                    <h2>Traffic Volume Trend</h2>
                  </div>
                  <div className="viq-select-dropdown">
                    <span>{trendRange}</span>
                    <ChevronDown size={14} />
                  </div>
                </div>

                <div className="viq-trend-canvas-wrap">
                  <div className="viq-chart-y-axis">
                    <span>4K</span>
                    <span>3K</span>
                    <span>2K</span>
                    <span>1K</span>
                    <span>0</span>
                  </div>

                  <div className="viq-trend-chart-area">
                    <div className="viq-chart-gridline" style={{ top: '0%' }} />
                    <div className="viq-chart-gridline" style={{ top: '25%' }} />
                    <div className="viq-chart-gridline" style={{ top: '50%' }} />
                    <div className="viq-chart-gridline" style={{ top: '75%' }} />
                    <div className="viq-chart-gridline" style={{ top: '100%' }} />

                    <svg viewBox="0 0 500 160" preserveAspectRatio="none" className="viq-trend-svg">
                      <defs>
                        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1976d2" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#1976d2" stopOpacity="0.03" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 140 Q 40 120, 80 130 T 160 125 T 240 100 T 320 70 T 380 40 T 440 85 T 500 130 L 500 160 L 0 160 Z"
                        fill="url(#trendGradient)"
                      />
                      <path
                        d="M0 140 Q 40 120, 80 130 T 160 125 T 240 100 T 320 70 T 380 40 T 440 85 T 500 130"
                        fill="none"
                        stroke="#1976d2"
                        strokeWidth="2.5"
                      />
                    </svg>

                    <div className="viq-trend-marker" style={{ left: '74%', top: '24%' }}>
                      <div className="viq-marker-pin" style={{ background: '#1976d2' }} />
                      <div className="viq-marker-line" />
                      <div className="viq-marker-tooltip">
                        <strong>2,340 vehicles</strong>
                        <span>06:00 PM (Peak)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="viq-trend-x-axis">
                  <span>00:00</span>
                  <span>04:00</span>
                  <span>08:00</span>
                  <span>12:00</span>
                  <span>16:00</span>
                  <span>20:00</span>
                  <span>24:00</span>
                </div>
              </div>

              {/* Recent ANPR Detections List */}
              <div className="viq-card viq-detections-card">
                <div className="viq-card-header">
                  <div className="viq-card-title-group">
                    <Camera className="viq-card-icon" size={19} />
                    <h2>Recent ANPR Detections</h2>
                  </div>
                  <button
                    className="viq-view-all-link"
                    onClick={() => navigate('/query')}
                    type="button"
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div className="viq-detections-list">
                  {displayDetections.map((item, idx) => (
                    <div
                      className="viq-detection-item"
                      key={idx}
                      onClick={() => {
                        if (safeRows[idx]) setPreviewModalRow(safeRows[idx])
                      }}
                      title="Click to inspect detection evidence"
                    >
                      <img
                        alt={item.plate}
                        className="viq-detection-thumb"
                        src={item.thumb}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/images/image1.jpeg'
                        }}
                      />
                      <div className="viq-detection-details">
                        <strong className="viq-detection-plate">{item.plate}</strong>
                        <span className="viq-detection-sub">
                          {item.type} • {item.camera}
                        </span>
                      </div>
                      <div className="viq-detection-time">
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-DASHBOARD C: HIGHWAY CHECKPOINT FLOW & SPEED INTELLIGENCE ── */}
        {(analyticsTab === 'all' || analyticsTab === 'checkpoints') && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0d1e3a' }}>
                  NH-44 Checkpoint Velocity & Pressure Index
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                8 Automated Optical Checkpoints · Shamshabad to Devanahalli
              </span>
            </div>

            <div className="viq-card" style={{ padding: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '8px 12px' }}>Checkpoint</th>
                    <th style={{ padding: '8px 12px' }}>Corridor Location</th>
                    <th style={{ padding: '8px 12px' }}>Traffic Density (1 hr)</th>
                    <th style={{ padding: '8px 12px' }}>Avg Speed vs Limit</th>
                    <th style={{ padding: '8px 12px' }}>Overspeed Rate</th>
                    <th style={{ padding: '8px 12px' }}>Corridor Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkpointData.map((cp, idx) => (
                    <tr
                      key={cp.checkpoint}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d1e3a' }}>
                        {cp.checkpoint}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#1976d2" />
                          {cp.km}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${(cp.volume / 2000) * 100}%`, height: '100%', background: '#1976d2', borderRadius: '3px' }} />
                          </div>
                          <strong>{cp.volume.toLocaleString()}</strong> veh/h
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <strong style={{ color: cp.avgSpeed < 50 ? '#dc2626' : cp.avgSpeed > cp.speedLimit ? '#f59e0b' : '#0d1e3a' }}>
                          {cp.avgSpeed} km/h
                        </strong>
                        <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>
                          / {cp.speedLimit} max
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: parseFloat(cp.overspeedRate) > 10 ? '#dc2626' : parseFloat(cp.overspeedRate) > 5 ? '#d97706' : '#16a34a'
                        }}>
                          {cp.overspeedRate}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: cp.statusColor === 'red' ? '#fee2e2' : cp.statusColor === 'amber' ? '#fef3c7' : cp.statusColor === 'blue' ? '#eff6ff' : '#dcfce7',
                          color: cp.statusColor === 'red' ? '#dc2626' : cp.statusColor === 'amber' ? '#b45309' : cp.statusColor === 'blue' ? '#1d4ed8' : '#15803d',
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                          {cp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Modal for Inspecting Any Incoming Vehicle */}
      {previewModalRow && (
        <MediaPreviewModal
          allRows={safeRows}
          isOpen={Boolean(previewModalRow)}
          onClose={() => setPreviewModalRow(null)}
          onSelectRow={setPreviewModalRow}
          row={previewModalRow}
        />
      )}

      {/* Camera Feed Modal for Live CCTV Streams */}
      {cameraFeedOpen && (
        <CameraFeedModal
          camera={selectedCameraFeed || cameraFeeds[0]}
          cameras={cameraFeeds}
          isOpen={cameraFeedOpen}
          onClose={() => setCameraFeedOpen(false)}
          onSelectCamera={setSelectedCameraFeed}
        />
      )}
    </div>
  )
}
