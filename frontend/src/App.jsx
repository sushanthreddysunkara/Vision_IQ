import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import DashboardDetail from './components/DashboardDetail'
import DashboardHub from './components/DashboardHub'
import OntologyPage from './components/ontology/OntologyPage'
import KnowledgeGraphPage from './components/knowledgeGraph/KnowledgeGraphPage'
import QueryPage from './components/QueryPage'
import DocumentIntelligence from './components/DocumentIntelligence'
import ProjectConnectionRequired from './components/ProjectConnectionRequired'
import ProjectComingSoon from './components/ProjectComingSoon'
import DataImportRequired from './components/DataImportRequired'
import RulesEventsPage from './components/RulesEventsPage'
import ProfilePage from './components/ProfilePage'
import SettingsPage from './components/SettingsPage'
import VehicleInformation from './components/VehicleInformation'
import EvidenceTrackingPage from './components/vehicle/EvidenceTrackingPage'
import ModelsPage from './components/models/ModelsPage'
import AssetsMaintenancePage from './components/AssetsMaintenancePage'
import TollRevenuePage from './components/tollRevenue/TollRevenuePage'
import PlaceholderPage from './components/PlaceholderPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import ProjectsPage from './components/projects/ProjectsPage'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import LiveViewPage from './components/LiveViewPage'
import LiveDetectionDashboard from './components/LiveDetectionDashboard'
import LiveInterface from './interfaces/live/LiveInterface'
import BottomCorridorBar from './components/BottomCorridorBar'
import LoginPage from './components/auth/LoginPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'

import {
  normalizeTrafficData,
  parseTrafficCsv,
  sampleTrafficData,
} from './data/dashboardData'
import { routePaths } from './data/navigation'
import { projects } from './data/projects'

const storedProjectsKey = 'vision-iq-created-projects'
const storedCamerasKey = 'vision-iq-added-cameras'
const storedRemovedCamerasKey = 'vision-iq-removed-cameras'
const storedNotificationsKey = 'vision-iq-stream-notifications'
const apiBaseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

function rowKey(row) {
  return `${row.sourceFile || row.fileName || 'db'}::${row.csvRecordId || row.observationId || row.id || `${row.timestamp}-${row.vehicleNumberPlate}`}`
}

function prependStreamRows(previousRows, incomingRows, maxCapacity = 7044) {
  if (!incomingRows || !incomingRows.length) return previousRows
  const incomingKeys = new Set(incomingRows.map(rowKey))
  // Filter out any older instance of these records so looped records refresh at top of stream
  const olderRows = previousRows.filter((row) => !incomingKeys.has(rowKey(row)))
  const updated = [...incomingRows, ...olderRows]
  return updated.slice(0, maxCapacity)
}

function prependUniqueRows(previousRows, incomingRows) {
  return prependStreamRows(previousRows, incomingRows)
}

function appendUniqueRows(previousRows, incomingRows) {
  return prependStreamRows(previousRows, incomingRows)
}

function normalizeStreamRows(rows) {
  const normalizedRows = normalizeTrafficData(rows)
  const now = Date.now()
  return normalizedRows.map((row, index) => ({
    ...row,
    csvRecordId: rows[index]?.csvRecordId || row.csvRecordId,
    sourceFile: rows[index]?.sourceFile || row.sourceFile,
    events: rows[index]?.events || row.events || '',
    _streamId: `${row.id || row.csvRecordId || index}-${rows[index]?._streamSeq || ''}-${now}-${Math.random().toString(36).slice(2, 6)}`,
  }))
}

function getImageDataUrl(row) {
  const candidates = [row.extractedImage, row.vehicleImagePath, row.vehicleImage]
  if (row.hasExtractedImage) candidates.push(row.vehicleImageDataUrl)

  return candidates.find(
    (value) => typeof value === 'string' && /^data:image\/(?:jpeg|png|webp);base64,/i.test(value),
  )
}

function getRowSourceId(row, index) {
  return String(row.id || row.observationId || row.csvRecordId || `REC-${index + 1}`)
}

async function getCloudinaryImagesBySourceId() {
  const imagesBySourceId = new Map()
  let cursor = null

  do {
    const query = new URLSearchParams({ page_size: '100' })
    if (cursor) query.set('cursor', cursor)
    const response = await fetch(`${apiBaseUrl}/api/cloudinary/images/?${query}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.success) {
      throw new Error(data.message || `Unable to load Cloudinary images (status ${response.status}).`)
    }

    for (const image of data.images || []) {
      if (image.source_id && image.secure_url) {
        imagesBySourceId.set(String(image.source_id).toLowerCase(), image.secure_url)
      }
    }
    cursor = data.next_cursor || null
  } while (cursor)

  return imagesBySourceId
}

async function uploadImportedImage(row, sourceId, token) {
  const imageDataUrl = getImageDataUrl(row)
  const imageBlob = await fetch(imageDataUrl).then((response) => response.blob())
  const extension = imageBlob.type === 'image/png' ? 'png' : imageBlob.type === 'image/webp' ? 'webp' : 'jpg'
  const formData = new FormData()
  formData.append('image', imageBlob, row.extractedImageName || `${sourceId}.${extension}`)
  formData.append('category', 'vehicle')
  formData.append('source_id', sourceId)

  const response = await fetch(`${apiBaseUrl}/api/cloudinary/images/upload/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success || !data.image?.secure_url) {
    throw new Error(data.message || `Unable to upload image for ${sourceId} to Cloudinary.`)
  }

  return data.image.secure_url
}

async function attachCloudinaryImages(rows, token) {
  const imagesBySourceId = await getCloudinaryImagesBySourceId()
  const enrichedRows = rows.map((row, index) => {
    const sourceId = getRowSourceId(row, index)
    const existingPath = row.vehicleImagePath || row.vehicleImage
    const matchedUrl = imagesBySourceId.get(sourceId.toLowerCase())
    return {
      ...row,
      vehicleImagePath:
        typeof existingPath === 'string' && /^https?:\/\//i.test(existingPath)
          ? existingPath
          : matchedUrl || row.vehicleImagePath,
    }
  })

  const uploads = enrichedRows
    .map((row, index) => ({ row, index, imageDataUrl: getImageDataUrl(row) }))
    .filter(({ row, imageDataUrl }) => imageDataUrl && !/^https?:\/\//i.test(row.vehicleImagePath || ''))

  if (uploads.length && !token) {
    throw new Error('Sign in again before importing images to Cloudinary.')
  }

  let nextUpload = 0
  async function uploadWorker() {
    while (nextUpload < uploads.length) {
      const upload = uploads[nextUpload]
      nextUpload += 1
      const sourceId = getRowSourceId(upload.row, upload.index)
      const imageUrl = await uploadImportedImage(upload.row, sourceId, token)
      enrichedRows[upload.index] = {
        ...enrichedRows[upload.index],
        vehicleImage: imageUrl,
        vehicleImagePath: imageUrl,
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, uploads.length) }, () => uploadWorker()))
  return enrichedRows
}

export default function App() {
  const { isAuthenticated, loading, token } = useAuth()
  const { pathname } = useLocation()
  const isLiveFeed = pathname.startsWith('/live') || pathname === '/live-view'
  const [liveMode, setLiveMode] = useState(() => {
    try {
      return isLiveFeed || localStorage.getItem('visioniq-live-mode') === 'true'
    } catch {
      return isLiveFeed
    }
  })

  useEffect(() => {
    if (pathname.startsWith('/live') || pathname === '/live-view') {
      setLiveMode(true)
      try {
        localStorage.setItem('visioniq-live-mode', 'true')
      } catch { }
    } else {
      setLiveMode(false)
      try {
        localStorage.setItem('visioniq-live-mode', 'false')
      } catch { }
    }
  }, [pathname])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    try {
      const saved = localStorage.getItem('visioniq-sidebar-pinned')
      return saved === 'true'
    } catch {
      return false
    }
  })
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

  const hoverTimeoutRef = useRef(null)
  const justUnpinnedRef = useRef(false)

  const handleSidebarMouseEnter = () => {
    if (justUnpinnedRef.current) return
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsSidebarHovered(true)
  }

  const handleSidebarMouseLeave = () => {
    justUnpinnedRef.current = false
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(false)
    }, 220)
  }

  const toggleSidebarPin = () => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen((prev) => !prev)
      return
    }

    setIsSidebarPinned((prev) => {
      const next = !prev
      try {
        localStorage.setItem('visioniq-sidebar-pinned', JSON.stringify(next))
      } catch { }
      if (!next) {
        setIsSidebarHovered(false)
        justUnpinnedRef.current = true
        setTimeout(() => {
          justUnpinnedRef.current = false
        }, 400)
      } else {
        setIsSidebarHovered(true)
      }
      return next
    })
  }

  // Automatically close sidebar drawer whenever route changes
  useEffect(() => {
    setSidebarOpen(false)
    setIsSidebarHovered(false)
  }, [pathname])

  // Escape key closes/unpins sidebar immediately
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSidebarHovered(false)
        setSidebarOpen(false)
        if (isSidebarPinned) {
          setIsSidebarPinned(false)
          try {
            localStorage.setItem('visioniq-sidebar-pinned', 'false')
          } catch { }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarPinned])

  const handleMainContentClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
    if (!isSidebarPinned && isSidebarHovered) {
      setIsSidebarHovered(false)
    }
  }

  const [searchOpen, setSearchOpen] = useState(false)
  const [projectList, setProjectList] = useState(() => {
    try {
      const storedProjects = JSON.parse(
        localStorage.getItem(storedProjectsKey) || '[]',
      )
      return [...projects, ...storedProjects.filter((project) => project.created)]
    } catch {
      return projects
    }
  })
  const [selectedProject, setSelectedProject] = useState(projects[0])
  const [connectedProject, setConnectedProject] = useState(projects[0])
  const [trafficData, setTrafficData] = useState([])
  const [addedCameras, setAddedCameras] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storedCamerasKey) || '[]')
    } catch {
      return []
    }
  })
  const [removedCameras, setRemovedCameras] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storedRemovedCamerasKey) || '[]')
    } catch {
      return []
    }
  })
  const [fileName, setFileName] = useState('All Database Records (7,044 Live Archive)')
  const [importError, setImportError] = useState('')
  const [streamNotifications, setStreamNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storedNotificationsKey) || '[]')
    } catch {
      return []
    }
  })
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('vision-iq-notification-sound') !== 'off'
    } catch {
      return true
    }
  })
  const notificationSoundEnabledRef = useRef(notificationSoundEnabled)

  useEffect(() => {
    notificationSoundEnabledRef.current = notificationSoundEnabled
    try {
      localStorage.setItem(
        'vision-iq-notification-sound',
        notificationSoundEnabled ? 'on' : 'off',
      )
    } catch {
      // ignore localStorage write errors
    }
  }, [notificationSoundEnabled])

  function playNotificationTone() {
    if (!notificationSoundEnabledRef.current) return
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const now = ctx.currentTime

      const notificationSound = new Audio('/notification_sound.mp3')
      notificationSound.volume = 1
      notificationSound.currentTime = 0
      notificationSound.play().catch(() => undefined)
      window.setTimeout(() => {
        notificationSound.pause()
        notificationSound.currentTime = 0
      }, 1000)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'triangle'
      osc1.frequency.setValueAtTime(587.33, now)
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12)
      osc2.frequency.setValueAtTime(293.66, now)
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.12)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.23)
      osc2.stop(now + 0.23)
      setTimeout(() => ctx.close().catch(() => { }), 400)
    } catch {
      // audio autoplay policies can suppress this until first user gesture
    }
  }

  const [streamPaused, setStreamPaused] = useState(false)
  const streamPausedRef = useRef(false)

  useEffect(() => {
    try {
      localStorage.setItem('visioniq-live-mode', liveMode ? 'true' : 'false')
    } catch {
      // ignore localStorage errors
    }
  }, [liveMode])

  useEffect(() => {
    if (pathname === '/live-view') {
      if (!liveMode) setLiveMode(true)
    } else {
      if (liveMode) setLiveMode(false)
    }
  }, [pathname, liveMode])

  const [latestBatchInfo, setLatestBatchInfo] = useState({
    batchCount: 0,
    timestamp: null,
    overspeedCount: 0,
    delta: 0,
    isManual: false,
    fileName: 'All Database Records (7,044 Live Archive)',
  })
  const [dbStats, setDbStats] = useState({
    totalRecords: 7044,
    totalPool: 7044,
    overspeedRate: '28%',
    avgSpeed: 65,
    cameras: 6,
    activeCorridor: 'NH-44 Hyderabad Express Corridor',
  })

  useEffect(() => {
    if (!isAuthenticated || isLiveFeed) return
    fetch(`${apiBaseUrl}/api/vehicles/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setDbStats(data.stats)
        }
      })
      .catch(() => undefined)
  }, [isAuthenticated, isLiveFeed])

  const userUploadedFileRef = useRef(false)

  const handleFetchRandomBatch = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/vehicles/stream-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      })
      const data = await response.json()
      if (data.success && Array.isArray(data.vehicles) && data.vehicles.length) {
        const streamRows = normalizeStreamRows(data.vehicles)
        setTrafficData((currentRows) => prependStreamRows(currentRows, streamRows))
        const overspeeds = streamRows.filter((r) => r.isOverSpeed || r.overSpeed === 'Yes').length
        setLatestBatchInfo({
          batchCount: streamRows.length,
          timestamp: new Date().toLocaleTimeString(),
          overspeedCount: overspeeds,
          delta: streamRows.length,
          isManual: true,
          fileName: 'All Database Records (7,044 Live Archive)',
        })
        playNotificationTone()
      }
    } catch (error) {
      console.warn('Unable to trigger random batch:', error)
    }
  }

  const handleToggleStreamPause = async () => {
    try {
      const nextPaused = !streamPausedRef.current
      setStreamPaused(nextPaused)
      streamPausedRef.current = nextPaused

      const nextAction = nextPaused ? 'pause' : 'resume'
      const response = await fetch(`${apiBaseUrl}/api/vehicles/stream-control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction }),
      })
      const data = await response.json()
      if (data && typeof data.isPaused === 'boolean') {
        setStreamPaused(data.isPaused)
        streamPausedRef.current = data.isPaused
      }
    } catch (error) {
      console.warn('Unable to toggle stream pause:', error)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || isLiveFeed) return undefined

    let isCancelled = false
    const lastBatchTimeRef = { current: Date.now() }

    // Ensure backend telemetry stream is actively running on server
    fetch(`${apiBaseUrl}/api/vehicles/stream-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume' }),
    }).catch(() => { })

    async function loadInitialVehicles() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/vehicles?limit=100`)
        if (!response.ok) return
        const data = await response.json()
        if (!isCancelled && !userUploadedFileRef.current && Array.isArray(data.vehicles) && data.vehicles.length) {
          const streamRows = normalizeStreamRows(data.vehicles)
          setTrafficData((currentRows) => (userUploadedFileRef.current ? currentRows : prependStreamRows(currentRows, streamRows)))
          setFileName((currentName) => currentName || 'All Database Records (7,044 Live Archive)')
          setLatestBatchInfo({
            batchCount: streamRows.length,
            timestamp: new Date().toLocaleTimeString(),
            overspeedCount: streamRows.filter((r) => r.isOverSpeed || r.overSpeed === 'Yes').length,
            delta: streamRows.length,
            isManual: false,
            fileName: 'All Database Records (7,044 Live Archive)',
          })
        }
      } catch (error) {
        console.warn('Unable to load initial vehicles from database:', error.message)
      }
    }

    loadInitialVehicles()

    const socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    })

    socket.on('newVehicleBatch', (incomingVehicles) => {
      if (!Array.isArray(incomingVehicles) || !incomingVehicles.length || isCancelled || streamPausedRef.current) return
      lastBatchTimeRef.current = Date.now()
      const streamRows = normalizeStreamRows(incomingVehicles)
      if (!userUploadedFileRef.current) {
        const batchSourceFile = incomingVehicles[0]?.sourceFile || incomingVehicles[0]?.fileName
        setTrafficData((currentRows) => prependStreamRows(currentRows, streamRows))
        if (batchSourceFile) {
          setFileName((currentName) => currentName && !currentName.includes('All Database') ? currentName : 'All Database Records (7,044 Live Archive)')
        }
        const overspeeds = streamRows.filter((r) => r.isOverSpeed || r.overSpeed === 'Yes').length
        setLatestBatchInfo((prev) => ({
          batchCount: streamRows.length,
          timestamp: new Date().toLocaleTimeString(),
          overspeedCount: overspeeds,
          delta: streamRows.length,
          isManual: false,
          fileName: prev.fileName || 'All Database Records (7,044 Live Archive)',
        }))
        const firstRow = streamRows[0]
        const label = firstRow.vehicleNumberPlate || firstRow.plateNumber || firstRow.id || 'Live vehicle'
        const type = firstRow.vehicleType || firstRow.type || 'Detection'
        const sourceLabel = batchSourceFile ? batchSourceFile.replace(/\.[^/.]+$/, '') : 'Surveillance'
        setStreamNotifications((prev) => [
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
            title: `+${streamRows.length} ${sourceLabel} Records: ${label}`,
            message: `${type} captured at ${firstRow.location || firstRow.roadName || 'Traffic Corridor'}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 11),
        ])
        playNotificationTone()
      }
    })

    socket.on('vehicleStreamComplete', (payload) => {
      if (!userUploadedFileRef.current) {
        setStreamNotifications((prev) => [
          {
            id: `${Date.now()}-complete`,
            title: 'Telemetry Stream Cycle Completed',
            message: payload?.fileName
              ? `Completed random polling cycle across ${payload.totalRows || '7,044'} records in ${payload.fileName}.`
              : 'Dataset processing cycle completed.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 11),
        ])
      }
    })

    socket.on('vehicleStreamStatus', (status) => {
      if (!isCancelled) {
        if (status?.fileName) {
          setFileName(status.fileName)
        }
        if (typeof status?.isPaused === 'boolean') {
          setStreamPaused(status.isPaused)
          streamPausedRef.current = status.isPaused
        }
        if (status?.totalPool) {
          setDbStats((prev) => ({
            ...prev,
            totalPool: status.totalPool,
            totalRecords: status.totalPool,
          }))
        }
        if (status?.batchCount) {
          setLatestBatchInfo((prev) => ({
            ...prev,
            batchCount: status.batchCount,
            timestamp: status.timestamp || new Date().toLocaleTimeString(),
            overspeedCount: status.overspeeding || status.overspeed || 0,
            delta: status.batchCount,
            fileName: status.fileName || prev.fileName,
          }))
        }
      }
    })

    // Heartbeat fallback: continuously streams telemetry batches even if WebSockets are blocked or dropped
    const heartbeatInterval = setInterval(async () => {
      if (isCancelled || userUploadedFileRef.current || streamPausedRef.current) return
      const elapsed = Date.now() - lastBatchTimeRef.current
      if (elapsed >= 3500) {
        try {
          const res = await fetch(`${apiBaseUrl}/api/vehicles/random-batch`)
          if (!res.ok) return
          const data = await res.json()
          if (!streamPausedRef.current && data.success && Array.isArray(data.vehicles) && data.vehicles.length) {
            lastBatchTimeRef.current = Date.now()
            const streamRows = normalizeStreamRows(data.vehicles)
            setTrafficData((currentRows) => prependStreamRows(currentRows, streamRows))
            setLatestBatchInfo((prev) => ({
              batchCount: streamRows.length,
              timestamp: new Date().toLocaleTimeString(),
              overspeedCount: streamRows.filter((r) => r.isOverSpeed || r.overSpeed === 'Yes').length,
              delta: streamRows.length,
              isManual: false,
              fileName: prev.fileName || 'All Database Records (7,044 Live Archive)',
            }))
          }
        } catch {
          // ignore transient poll error
        }
      }
    }, 3000)

    return () => {
      isCancelled = true
      clearInterval(heartbeatInterval)
      socket.disconnect()
    }
  }, [isAuthenticated, isLiveFeed])

  useEffect(() => {
    try {
      localStorage.setItem(
        storedProjectsKey,
        JSON.stringify(projectList.filter((project) => project.created)),
      )
    } catch {
      // ignore localStorage write errors
    }
  }, [projectList])

  useEffect(() => {
    try {
      localStorage.setItem(storedCamerasKey, JSON.stringify(addedCameras))
    } catch {
      // ignore localStorage write errors
    }
  }, [addedCameras])

  useEffect(() => {
    try {
      localStorage.setItem(storedRemovedCamerasKey, JSON.stringify(removedCameras))
    } catch {
      // ignore localStorage write errors
    }
  }, [removedCameras])

  useEffect(() => {
    try {
      localStorage.setItem(storedNotificationsKey, JSON.stringify(streamNotifications))
    } catch {
      // ignore localStorage write errors
    }
  }, [streamNotifications])

  const hasImportedFile = Boolean(trafficData.length > 0 && fileName)

  if (loading) return <div className="auth-loading">Checking your session...</div>
  if (!isAuthenticated || pathname === '/login') {
    return (
      <Routes>
        <Route path="*" element={isAuthenticated ? <Navigate replace to="/home" /> : <LoginPage />} />
      </Routes>
    )
  }

  async function handleLoadSampleData() {
    try {
      const res = await fetch('/sample_traffic_feed.xlsx')
      if (res.ok) {
        const blob = await res.blob()
        const file = new File([blob], 'sample_traffic_feed.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const importedRows = await parseTrafficCsv(file)
        userUploadedFileRef.current = true
        setTrafficData(importedRows)
        setFileName('sample_traffic_feed.xlsx')
        setImportError('')
        return
      }
    } catch (e) {
      console.warn('Could not load sample_traffic_feed.xlsx, falling back:', e)
    }
    const fallbackRows = normalizeTrafficData(sampleTrafficData)
    userUploadedFileRef.current = true
    setTrafficData(fallbackRows)
    setFileName('sample_traffic_feed.csv')
    setImportError('')
  }

  function handleSelectProject(project) {
    setSelectedProject(project)
  }

  function handleCreateProject(name) {
    const newProject = {
      name,
      caption: 'Created project',
      status: 'Active',
      modules: '7 modules',
      dashboards: '3 dashboards',
      data: 'CSV analytics',
      created: true,
      createdAt: new Date().toISOString(),
    }
    setProjectList((current) => [...current, newProject])
    setSelectedProject(newProject)
  }

  function handleDeleteProject(name) {
    setProjectList((current) => current.filter((p) => p.name !== name))
    if (selectedProject?.name === name) {
      setSelectedProject(projectList.find((p) => p.name !== name) || projects[0])
    }
    if (connectedProject?.name === name) {
      setConnectedProject(null)
      userUploadedFileRef.current = false
      setTrafficData([])
      setFileName('')
    }
  }

  function handleProjectConnect(project) {
    setConnectedProject(project)
    setSelectedProject(project)
  }

  function handleProjectDisconnect() {
    setConnectedProject(null)
    userUploadedFileRef.current = false
    setTrafficData([])
    setFileName('')
  }

  function handleAddCamera(camera) {
    setAddedCameras((currentCameras) => [...currentCameras, camera])
  }

  function handleRemoveCamera(cameraId) {
    setAddedCameras((currentCameras) => currentCameras.filter((camera) => camera.id !== cameraId))
    setRemovedCameras((currentCameras) => currentCameras.includes(cameraId) ? currentCameras : [...currentCameras, cameraId])
  }

  async function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImportError('')
      // 1. Parse uploaded CSV or XLSX on client
      let importedRows = await parseTrafficCsv(file)
      if (!importedRows || !importedRows.length) {
        throw new Error('No valid records found in the selected file.')
      }

      importedRows = await attachCloudinaryImages(importedRows, token)

      // 2. Extract clean telemetry metadata (strip large base64/synthetic SVGs so payload remains fast and lightweight)
      const cleanRows = importedRows.map((r, idx) => ({
        id: r.id || r.observationId || r.csvRecordId || `REC-${idx + 1}`,
        timestamp: r.timestampIst || r.timestamp || r.time || '',
        vehicleType: r.vehicleType || r.type || 'Car',
        numberPlate: r.vehicleNumberPlate || r.numberPlate || r.plate || '',
        plateConfidence: r.plateConfidence || r.confidence || 0.95,
        speed: Number(r.speed) || 60,
        speedLimit: Number(r.speedLimit) || 60,
        overSpeed: r.overSpeed || (r.isOverSpeed ? 'Yes' : 'No'),
        isOverSpeed: Boolean(r.isOverSpeed || r.overSpeed === 'Yes'),
        latitude: Number(r.latitude) || 17.385044,
        longitude: Number(r.longitude) || 78.486671,
        videoClipPath: r.videoClipPath && !r.videoClipPath.startsWith('data:') ? r.videoClipPath : '',
        vehicleImagePath: r.vehicleImagePath && !r.vehicleImagePath.startsWith('data:') ? r.vehicleImagePath : '',
        plateImagePath: r.plateImagePath && !r.plateImagePath.startsWith('data:') ? r.plateImagePath : '',
        events: r.events || (r.isOverSpeed ? 'Overspeeding' : 'Standard detection'),
        camera: r.camera || '',
        location: r.location || r.roadName || '',
      }))

      // 3. Upload and store records in MySQL database
      // Upload in chunks of 2,500 if file is large, ensuring fast and reliable transfers
      const CHUNK_SIZE = 2500
      let lastResult = null

      if (cleanRows.length <= CHUNK_SIZE) {
        const response = await fetch(`${apiBaseUrl}/api/vehicles/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            rows: cleanRows,
            isAppend: false,
            isLastChunk: true,
            totalRecords: cleanRows.length,
          }),
        })

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          lastResult = await response.json()
        } else {
          const text = await response.text()
          throw new Error(
            response.ok
              ? 'Server returned non-JSON response.'
              : `Upload failed (status ${response.status}): ${text.slice(0, 150)}`
          )
        }

        if (!response.ok || !lastResult.success) {
          throw new Error(lastResult?.message || `Database upload failed (status ${response.status}).`)
        }
      } else {
        // Chunked upload for large datasets
        for (let i = 0; i < cleanRows.length; i += CHUNK_SIZE) {
          const chunk = cleanRows.slice(i, i + CHUNK_SIZE)
          const isFirst = i === 0
          const isLast = i + CHUNK_SIZE >= cleanRows.length

          const response = await fetch(`${apiBaseUrl}/api/vehicles/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              rows: chunk,
              isAppend: !isFirst,
              isLastChunk: isLast,
              totalRecords: cleanRows.length,
            }),
          })

          const contentType = response.headers.get('content-type') || ''
          let chunkResult
          if (contentType.includes('application/json')) {
            chunkResult = await response.json()
          } else {
            const text = await response.text()
            throw new Error(`Upload failed (status ${response.status}): ${text.slice(0, 150)}`)
          }

          if (!response.ok || !chunkResult.success) {
            throw new Error(chunkResult?.message || `Chunk upload failed at record ${i}.`)
          }
          lastResult = chunkResult
        }
      }

      // 4. Immediately update dashboard state with newly uploaded dataset
      userUploadedFileRef.current = false // Live stream sequentially draws random batches from DB for this file!
      setFileName(file.name)

      // Initial batch from the new uploaded dataset (1-20 records)
      const initialBatch = lastResult?.initialBatch && lastResult.initialBatch.length
        ? normalizeStreamRows(lastResult.initialBatch)
        : importedRows.slice(0, Math.floor(Math.random() * 20) + 1)

      setTrafficData(initialBatch)

      setLatestBatchInfo({
        batchCount: initialBatch.length,
        timestamp: new Date().toLocaleTimeString(),
        overspeedCount: initialBatch.filter((r) => r.isOverSpeed || r.overSpeed === 'Yes').length,
        delta: initialBatch.length,
        isManual: true,
        fileName: file.name,
      })

      // Fetch fresh database stats for the uploaded file
      fetch(`${apiBaseUrl}/api/vehicles/stats?fileName=${encodeURIComponent(file.name)}`)
        .then((res) => {
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            return res.json()
          }
          return null
        })
        .then((data) => {
          if (data && data.success && data.stats) {
            setDbStats(data.stats)
          }
        })
        .catch(() => undefined)

      setStreamNotifications((prev) => [
        {
          id: `${Date.now()}-upload`,
          title: `Dataset Uploaded: ${file.name}`,
          message: `Stored ${cleanRows.length.toLocaleString()} records in MySQL database. Telemetry stream is now live for ${file.name}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 11),
      ])

      playNotificationTone()
    } catch (error) {
      console.error('Import error:', error)
      setImportError(error.message || 'Unable to import file.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div
          className={`app-shell ${isSidebarPinned ? 'sidebar-pinned' : 'sidebar-unpinned'
            } ${isSidebarHovered ? 'sidebar-hovered' : ''}`}
        >
          {/* Subtle edge hover zone to expand unpinned sidebar on desktop */}
          {!isSidebarPinned && !isSidebarHovered && (
            <div
              className="sidebar-edge-hover-zone"
              onMouseEnter={handleSidebarMouseEnter}
              aria-hidden="true"
            />
          )}

          {/* Mobile backdrop overlay */}
          {sidebarOpen && (
            <div
              className="viq-sidebar-backdrop"
              onClick={() => {
                setSidebarOpen(false)
                setIsSidebarHovered(false)
              }}
              aria-hidden="true"
            />
          )}

          <Sidebar
            liveMode={isLiveFeed}
            onToggleLiveMode={setLiveMode}
            onSwitchToExcelData={() => setLiveMode(false)}
            connectedProject={connectedProject}
            handleSidebarMouseEnter={handleSidebarMouseEnter}
            handleSidebarMouseLeave={handleSidebarMouseLeave}
            isSidebarHovered={isSidebarHovered}
            isSidebarPinned={isSidebarPinned}
            onCreateProject={handleCreateProject}
            onSelectProject={handleSelectProject}
            projectList={projectList}
            selectedProject={selectedProject}
            setSidebarOpen={setSidebarOpen}
            sidebarOpen={sidebarOpen}
          />

          <main className="main-content" onClick={handleMainContentClick}>
            <Topbar
              handleSidebarMouseEnter={handleSidebarMouseEnter}
              handleSidebarMouseLeave={handleSidebarMouseLeave}
              isSidebarPinned={isSidebarPinned}
              liveMode={isLiveFeed}
              notificationSoundEnabled={notificationSoundEnabled}
              onToggleLiveMode={setLiveMode}
              onToggleStreamPause={handleToggleStreamPause}
              searchOpen={searchOpen}
              setIsSidebarHovered={setIsSidebarHovered}
              setNotificationSoundEnabled={setNotificationSoundEnabled}
              setSearchOpen={setSearchOpen}
              setSidebarOpen={setSidebarOpen}
              sidebarOpen={sidebarOpen}
              streamNotifications={streamNotifications}
              streamPaused={streamPaused}
              toggleSidebarPin={toggleSidebarPin}
            />

            <section className="content-wrap">
              <Routes>
                {/* HOME */}
                <Route path="/" element={<Navigate replace to="/home" />} />
                <Route
                  path="/home"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <PlaceholderPage
                        cameraCount={addedCameras.length}
                        dbStats={dbStats}
                        fileName={fileName}
                        latestBatchInfo={latestBatchInfo}
                        onFetchRandomBatch={handleFetchRandomBatch}
                        onToggleStreamPause={handleToggleStreamPause}
                        rows={trafficData}
                        streamNotifications={streamNotifications}
                        streamPaused={streamPaused}
                      />
                    )
                  }
                />

                {/* ── SEPARATE LIVE FEED INTERFACE (12 INDEPENDENT LIVE PAGES) ── */}
                <Route path="/live/*" element={<LiveInterface excelRows={trafficData} excelFileName={fileName} />} />
                <Route path="/live-view" element={<Navigate replace to="/live/home" />} />

                {/* PROJECTS MANAGEMENT */}
                <Route
                  path="/projects"
                  element={
                    <ProjectsPage
                      connectedProject={connectedProject}
                      dbStats={dbStats}
                      fileName={fileName}
                      hasImportedFile={hasImportedFile}
                      importError={importError}
                      onCreateProject={handleCreateProject}
                      onDeleteProject={handleDeleteProject}
                      onImport={handleImport}
                      onLoadSampleData={handleLoadSampleData}
                      onProjectConnect={handleProjectConnect}
                      onProjectDisconnect={handleProjectDisconnect}
                      onSelectProject={handleSelectProject}
                      projectList={projectList}
                      rows={trafficData}
                      selectedProject={selectedProject}
                      setImportError={setImportError}
                    />
                  }
                />

                {/* ONTOLOGY */}
                <Route
                  path="/ontology"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <OntologyPage
                        fileName={fileName}
                        importError={importError}
                        onImport={handleImport}
                        onLoadSampleData={handleLoadSampleData}
                        projectName={connectedProject.name}
                        rows={trafficData}
                      />
                    )
                  }
                />

                {/* QUERY */}
                <Route
                  path="/query"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <QueryPage fileName={fileName} rows={trafficData} />
                    )
                  }
                />

                {/* KNOWLEDGE GRAPH */}
                <Route
                  path="/knowledge-graph"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <KnowledgeGraphPage
                        fileName={fileName}
                        importError={importError}
                        onImport={handleImport}
                        projectName={connectedProject.name}
                        rows={trafficData}
                      />
                    )
                  }
                />

                {/* TOLL & REVENUE */}
                <Route
                  path="/toll-revenue"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <TollRevenuePage
                        rows={trafficData}
                        streamPaused={streamPaused}
                        onToggleStreamPause={handleToggleStreamPause}
                      />
                    )
                  }
                />

                {/* DOCUMENT INTELLIGENCE */}
                <Route
                  path="/document-intelligence"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <DocumentIntelligence
                        fileName={fileName}
                        importError={importError}
                        onImport={handleImport}
                        onLoadSampleData={handleLoadSampleData}
                        projectName={connectedProject.name}
                        rows={trafficData}
                      />
                    )
                  }
                />

                {/* DASHBOARDS HUB - Redirect to Corridors Performance */}
                <Route
                  path="/dashboards"
                  element={<Navigate replace to="/dashboards/corridors" />}
                />

                {/* Redirect /dashboards/vehicles to unified Traffic Flow & Speeds dashboard */}
                <Route
                  path="/dashboards/vehicles"
                  element={<Navigate replace to="/dashboards/traffic" />}
                />

                {/* DASHBOARD DETAILS */}
                <Route
                  path="/dashboards/:kind"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <DashboardDetail
                        addedCameras={addedCameras}
                        dbStats={dbStats}
                        fileName={fileName}
                        importError={importError}
                        latestBatchInfo={latestBatchInfo}
                        onAddCamera={handleAddCamera}
                        onFetchRandomBatch={handleFetchRandomBatch}
                        onImport={handleImport}
                        onRemoveCamera={handleRemoveCamera}
                        onToggleStreamPause={handleToggleStreamPause}
                        projectName={connectedProject.name}
                        removedCameras={removedCameras}
                        rows={trafficData}
                        streamPaused={streamPaused}
                      />
                    )
                  }
                />

                {/* VEHICLE INFORMATION */}
                <Route
                  path="/vehicle-information"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <VehicleInformation dbStats={dbStats} rows={trafficData} />
                    )
                  }
                />

                <Route
                  path="/evidence-tracking"
                  element={<EvidenceTrackingPage trafficRows={trafficData} />}
                />

                {/* ASSETS & MAINTENANCE */}
                <Route
                  path="/assets-maintenance"
                  element={
                    !connectedProject ? (
                      <ProjectConnectionRequired />
                    ) : (
                      <AssetsMaintenancePage />
                    )
                  }
                />

                {/* RULES & EVENTS: CENTRAL GOVERNMENT TRAFFIC KNOWLEDGE BASE */}
                <Route path="/rules-events" element={<RulesEventsPage />} />

                {/* MODELS: VISIONIQ ANALYTICAL METHODS & MODELS REGISTRY */}
                <Route path="/models" element={<ModelsPage />} />

                {/* PROFILE & SETTINGS */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/settings"
                  element={
                    <SettingsPage
                      notificationSoundEnabled={notificationSoundEnabled}
                      setNotificationSoundEnabled={setNotificationSoundEnabled}
                    />
                  }
                />

                {/* OTHER PLATFORM PAGES */}
                {routePaths
                  .filter(
                    (path) =>
                      path !== '/home' &&
                      !path.startsWith('/dashboards') &&
                      path !== '/ontology' &&
                      path !== '/knowledge-graph' &&
                      path !== '/query' &&
                      path !== '/document-intelligence' &&
                      path !== '/vehicle-information' &&
                      path !== '/evidence-tracking' &&
                      path !== '/assets-maintenance' &&
                      path !== '/rules-events' &&
                      path !== '/models' &&
                      path !== '/profile' &&
                      path !== '/settings' &&
                      path !== '/live-view'
                  )
                  .map((path) => (
                    <Route element={<PlaceholderPage />} key={path} path={path} />
                  ))}

                {/* UNKNOWN URL */}
                <Route path="*" element={<Navigate replace to="/home" />} />
              </Routes>
            </section>
          </main>
          {!isLiveFeed && <BottomCorridorBar />}
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
