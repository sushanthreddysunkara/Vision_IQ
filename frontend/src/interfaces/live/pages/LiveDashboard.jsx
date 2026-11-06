import React, { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bike,
  Building2,
  Bus,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  LayoutGrid,
  MapPin,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Truck,
  Upload,
  UploadCloud,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLiveFeed } from '../context/LiveFeedContext'
import { adaptModelDetectionBatch } from '../../../utils/liveTrafficAdapter'

function formatClassLabel(label = '') {
  if (!label) return 'Vehicle'
  const l = label.toLowerCase().trim()
  if (l === 'motorcycle' || l === 'motorbike' || l === 'bicycle') return 'Bike'
  if (l === 'rickshaw') return 'Auto'
  return l.charAt(0).toUpperCase() + l.slice(1)
}

function isVehicleDetection(label = '') {
  return /\b(car|suv|jeep|taxi|van|truck|lorry|bus|motorcycle|motorbike|bicycle|bike|scooter|auto|rickshaw|lcv|tractor|train|ambulance)\b/i.test(label)
}

function mapFrameDetectionsToBoxes(detections = []) {
  const boxes = []
  const seenTrackIds = new Set()

  for (const [index, detection] of detections.entries()) {
    if (!isVehicleDetection(detection.label) || !Array.isArray(detection.box) || detection.box.length < 4) {
      continue
    }

    const [x, y, width, height] = detection.box
    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue

    const trackId = detection.trackId != null ? String(detection.trackId) : null
    if (trackId && seenTrackIds.has(trackId)) continue

    const duplicateBox = boxes.some((box) => {
      if (box.label !== formatClassLabel(detection.label)) return false
      const overlapX = Math.max(0, Math.min(x + width, box.x + box.width) - Math.max(x, box.x))
      const overlapY = Math.max(0, Math.min(y + height, box.y + box.height) - Math.max(y, box.y))
      const intersection = overlapX * overlapY
      const union = width * height + box.width * box.height - intersection
      return union > 0 && intersection / union > 0.65
    })
    if (duplicateBox) continue

    if (trackId) seenTrackIds.add(trackId)
    const label = formatClassLabel(detection.label)
    const isUnrecognized = !detection.plateNumber || detection.plateNumber === 'Not Recognized'
    const isOverSpeed = (detection.speed || 68) > 80
    boxes.push({
      id: trackId ? `frame-${trackId}` : `det-${index}`,
      trackId: trackId || index + 1,
      label,
      confidence: detection.confidence || 0.9,
      plate: detection.plateNumber || (isUnrecognized ? 'Not Recognized' : 'TS 09 EA 4129'),
      speed: detection.speed || 68,
      lane: detection.lane || 'Lane 1',
      color: getBoxColor(label, isUnrecognized, isOverSpeed),
      x: Number((x * 100).toFixed(2)),
      y: Number((y * 100).toFixed(2)),
      width: Number((width * 100).toFixed(2)),
      height: Number((height * 100).toFixed(2)),
      isUnrecognized,
      isOverSpeed,
    })
  }

  return boxes
}

function getBoxColor(label = '', isUnrecognized = false, isOverSpeed = false) {
  if (isOverSpeed) return '#ef4444' // Red for over-speed
  if (isUnrecognized) return '#f59e0b' // Amber for unreadable plate
  const l = label.toLowerCase()
  if (l.includes('truck') || l.includes('heavy')) return '#f97316'
  if (l.includes('bus')) return '#8b5cf6'
  if (l.includes('bike') || l.includes('motorcycle')) return '#10b981'
  return '#22c55e' // Neon green for cars / clean recognition
}

function createVideoSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `video-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatVideoTime(seconds = 0) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function areDetectionBoxesEqual(firstBoxes, secondBoxes) {
  if (firstBoxes.length !== secondBoxes.length) return false

  return firstBoxes.every((box, index) => {
    const nextBox = secondBoxes[index]
    return box.id === nextBox.id &&
      box.label === nextBox.label &&
      box.plate === nextBox.plate &&
      box.x === nextBox.x &&
      box.y === nextBox.y &&
      box.width === nextBox.width &&
      box.height === nextBox.height &&
      box.confidence === nextBox.confidence
  })
}

const DETECTION_CARD_RETENTION_MS = 10000

function mergeRecentDetectionCards(previousCards, detections, videoTime, now) {
  const cards = previousCards.filter((card) => now - card.lastSeenAtMs < DETECTION_CARD_RETENTION_MS)
  const cardIndices = new Map(cards.map((card, index) => [card.id, index]))

  for (const detection of detections) {
    const existingIndex = cardIndices.get(detection.id)
    const existingCard = existingIndex == null ? null : cards[existingIndex]
    const updatedCard = {
      ...existingCard,
      ...detection,
      firstSeenAt: existingCard?.firstSeenAt || formatVideoTime(videoTime),
      lastSeenAt: formatVideoTime(videoTime),
      lastSeenAtMs: now,
      newUntilMs: existingCard && now - existingCard.lastSeenAtMs < 1500
        ? existingCard.newUntilMs
        : now + 1800,
    }

    if (existingIndex == null) {
      cardIndices.set(detection.id, cards.length)
      cards.push(updatedCard)
    } else {
      cards[existingIndex] = updatedCard
    }
  }

  return cards
}

function mergeVideoVehicleRecords(previousRecords, incomingRecords, currentTime) {
  const mergedRecords = [...previousRecords]
  const recordIndices = new Map(
    mergedRecords.map((record, index) => [String(record.trackId || record.observationId || record.id), index]),
  )
  const observedAt = formatVideoTime(currentTime)

  for (const record of incomingRecords) {
    const key = String(record.trackId || record.observationId || record.id)
    const existingIndex = recordIndices.get(key)
    const existingRecord = existingIndex == null ? null : mergedRecords[existingIndex]
    const updatedRecord = {
      ...existingRecord,
      ...record,
      firstSeenAt: existingRecord?.firstSeenAt || observedAt,
      lastSeenAt: observedAt,
    }

    if (existingIndex == null) {
      recordIndices.set(key, mergedRecords.length)
      mergedRecords.push(updatedRecord)
    } else {
      mergedRecords[existingIndex] = updatedRecord
    }
  }

  return mergedRecords
}

export default function LiveDashboard() {
  const navigate = useNavigate()
  const {
    liveRecords,
    setLiveRecords,
    stats,
    cameras,
    isDemoMode,
    resetToDemoData,
    clearLiveRecords,
    uploadedVideoFile,
    uploadedVideoUrl,
    isAnalyzing,
    isAnalyzed,
    analysisProgress,
    analyzedFrames,
    handleUploadVideo,
    handleSetSampleVideo,
    clearUploadedVideo,
  } = useLiveFeed()

  const [selectedCamera, setSelectedCamera] = useState(cameras[0] || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [dynamicBoxes, setDynamicBoxes] = useState([])
  const [recentDetectionCards, setRecentDetectionCards] = useState([])
  const [isDetectionStreamPaused, setIsDetectionStreamPaused] = useState(false)
  const [videoAspect, setVideoAspect] = useState('16 / 9')
  const [inferenceError, setInferenceError] = useState('')

  const videoElementRef = useRef(null)
  const fileInputRef = useRef(null)
  const offscreenCanvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastSampleTimeRef = useRef(0)
  const requestInFlightRef = useRef(false)
  const lastDetectionTimeRef = useRef(0)
  const hasDynamicBoxesRef = useRef(false)
  const latestDynamicBoxesRef = useRef([])
  const recentDetectionCardsRef = useRef([])
  const isDetectionStreamPausedRef = useRef(false)
  const sessionIdRef = useRef(createVideoSessionId())

  const clearRecentDetectionCards = () => {
    recentDetectionCardsRef.current = []
    setRecentDetectionCards([])
  }

  const updateDynamicBoxes = (boxes) => {
    const boxesChanged = !areDetectionBoxesEqual(latestDynamicBoxesRef.current, boxes)
    latestDynamicBoxesRef.current = boxes
    recentDetectionCardsRef.current = mergeRecentDetectionCards(
      recentDetectionCardsRef.current,
      boxes,
      videoElementRef.current?.currentTime || 0,
      Date.now(),
    )
    if (!isDetectionStreamPausedRef.current) {
      setRecentDetectionCards(recentDetectionCardsRef.current)
    }
    if (boxesChanged && !isDetectionStreamPausedRef.current) {
      setDynamicBoxes(boxes)
    }
  }

  const toggleDetectionStreamPause = () => {
    const shouldPause = !isDetectionStreamPausedRef.current
    isDetectionStreamPausedRef.current = shouldPause
    setIsDetectionStreamPaused(shouldPause)
    if (!shouldPause) {
      recentDetectionCardsRef.current = recentDetectionCardsRef.current.filter(
        (card) => Date.now() - card.lastSeenAtMs < DETECTION_CARD_RETENTION_MS,
      )
      setRecentDetectionCards(recentDetectionCardsRef.current)
      setDynamicBoxes(latestDynamicBoxesRef.current)
    }
  }

  useEffect(() => {
    const cleanupExpiredCards = () => {
      if (isDetectionStreamPausedRef.current) return

      const recentCards = recentDetectionCardsRef.current.filter(
        (card) => Date.now() - card.lastSeenAtMs < DETECTION_CARD_RETENTION_MS,
      )
      if (recentCards.length !== recentDetectionCardsRef.current.length) {
        recentDetectionCardsRef.current = recentCards
        setRecentDetectionCards(recentCards)
      }
    }

    const cleanupInterval = window.setInterval(cleanupExpiredCards, 500)
    return () => window.clearInterval(cleanupInterval)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      sessionIdRef.current = createVideoSessionId()
      lastSampleTimeRef.current = 0
      lastDetectionTimeRef.current = 0
      hasDynamicBoxesRef.current = false
      setInferenceError('')
      setCurrentTime(0)
      setDuration(0)
      setVideoAspect('16 / 9')
      handleUploadVideo(file)
      latestDynamicBoxesRef.current = []
      clearRecentDetectionCards()
      isDetectionStreamPausedRef.current = false
      setIsDetectionStreamPaused(false)
      setDynamicBoxes([])
      setIsPlaying(false)
    }
    e.target.value = ''
  }

  const handleSampleVideo = () => {
    sessionIdRef.current = createVideoSessionId()
    lastSampleTimeRef.current = 0
    lastDetectionTimeRef.current = 0
    hasDynamicBoxesRef.current = false
    setInferenceError('')
    setCurrentTime(0)
    setDuration(0)
    setVideoAspect('16 / 9')
    latestDynamicBoxesRef.current = []
    clearRecentDetectionCards()
    isDetectionStreamPausedRef.current = false
    setIsDetectionStreamPaused(false)
    setDynamicBoxes([])
    handleSetSampleVideo('/videos/traffic_sample1.mp4', 'NH-44 Sample Traffic Feed')
  }

  const handleTogglePlay = () => {
    if (!videoElementRef.current) return
    if (videoElementRef.current.paused) {
      videoElementRef.current.play().catch((error) => {
        setInferenceError(`Video playback could not start: ${error.message || 'Check the video format and try again.'}`)
      })
      setIsPlaying(true)
    } else {
      videoElementRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleVideoEnded = () => {
    const video = videoElementRef.current
    if (!video || !isAnalyzed) return

    sessionIdRef.current = createVideoSessionId()
    lastSampleTimeRef.current = 0
    setLiveRecords([])
    latestDynamicBoxesRef.current = []
    clearRecentDetectionCards()
    isDetectionStreamPausedRef.current = false
    setIsDetectionStreamPaused(false)
    updateDynamicBoxes([])
    setInferenceError('')
    video.currentTime = 0
    video.play().catch((error) => {
      setInferenceError(`Video replay could not start: ${error.message || 'Press Play to try again.'}`)
    })
  }

  // --------------------------------------------------------------------------
  // Exact Dynamic Bounding Box Motion & Model Synchronization Loop
  // --------------------------------------------------------------------------
  useEffect(() => {
    const video = videoElementRef.current
    if (!isAnalyzed || !video || !uploadedVideoUrl) {
      setDynamicBoxes([])
      return undefined
    }

    let isRunning = true

    // Initialize offscreen canvas for real-time live frame capture fallback
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas')
    }

    // Capture & analyze video frame on backend YOLOv8 model in real-time when precomputed frames aren't available
    const sampleBackendFrame = async (timeSec) => {
      if (requestInFlightRef.current || !video || video.videoWidth <= 0) return
      requestInFlightRef.current = true
      const requestSessionId = sessionIdRef.current

      try {
        const canvas = offscreenCanvasRef.current
        const vw = video.videoWidth || 640
        const vh = video.videoHeight || 360
        const scale = Math.min(1, 640 / vw)
        canvas.width = Math.max(1, Math.round(vw * scale))
        canvas.height = Math.max(1, Math.round(vh * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))
        if (!blob || !isRunning) return

        const formData = new FormData()
        formData.append('frame', blob, 'frame.jpg')
        formData.append('sessionId', requestSessionId)
        formData.append('sourceId', uploadedVideoFile?.name || 'live-video')
        formData.append('timeSeconds', String(timeSec))
        formData.append('durationSeconds', String(video.duration || 0))

        const res = await fetch('/api/live-feed/analyze-frame', {
          method: 'POST',
          body: formData,
        })

        let data
        try {
          data = await res.json()
        } catch {
          throw new Error(`Live frame analysis returned an invalid response (${res.status}).`)
        }
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Live frame analysis failed (${res.status}).`)
        }
        if (!isRunning || requestSessionId !== sessionIdRef.current) return
        if (Array.isArray(data.vehicles)) {
          const trackedVehicles = data.vehicles.map((vehicle) => ({
            ...vehicle,
            trackId: vehicle.vehicleId || vehicle.trackId,
            class: vehicle.type || vehicle.class,
          }))
          const incomingRecords = adaptModelDetectionBatch(trackedVehicles, {
            cameraId: 'CAM-LIVE-UPLOAD',
            location: 'Uploaded Video AI Ingestion',
          })
          setLiveRecords((previousRecords) => mergeVideoVehicleRecords(
            previousRecords,
            incomingRecords,
            timeSec,
          ))
        }

        if (video.currentTime - timeSec > 0.75) {
          hasDynamicBoxesRef.current = false
          updateDynamicBoxes([])
          return
        }

        const boxes = mapFrameDetectionsToBoxes(data.frame?.detections || [])
        updateDynamicBoxes(boxes)
        hasDynamicBoxesRef.current = boxes.length > 0
        lastDetectionTimeRef.current = timeSec
        setInferenceError('')
      } catch (error) {
        if (isRunning && requestSessionId === sessionIdRef.current) {
          hasDynamicBoxesRef.current = false
          updateDynamicBoxes([])
          setInferenceError(error.message || 'Live frame analysis failed.')
        }
      } finally {
        requestInFlightRef.current = false
      }
    }

    // Real-time animation loop: updates bounding boxes synchronized with video time
    const updateMotion = () => {
      if (!isRunning) return

      if (video && !video.paused && !video.ended) {
        const timeSec = video.currentTime || 0
        setCurrentTime(timeSec)
        if (video.duration) setDuration(video.duration)
        if (hasDynamicBoxesRef.current && timeSec - lastDetectionTimeRef.current > 0.75) {
          hasDynamicBoxesRef.current = false
          updateDynamicBoxes([])
        }

        if (analyzedFrames && analyzedFrames.length > 0) {
          // Find surrounding frames for exact timestamp
          const previousFrame = [...analyzedFrames].reverse().find((frame) => frame.timeSeconds <= timeSec)
          const frameIsCurrent = previousFrame && timeSec - previousFrame.timeSeconds <= 0.75
          const computed = frameIsCurrent ? mapFrameDetectionsToBoxes(previousFrame.detections || []) : []

          updateDynamicBoxes(computed)
          hasDynamicBoxesRef.current = computed.length > 0
          lastDetectionTimeRef.current = frameIsCurrent ? previousFrame.timeSeconds : 0
        } else {
          // Sample asynchronously so model inference never blocks video playback.
          if (timeSec - lastSampleTimeRef.current >= 0.5 || lastSampleTimeRef.current === 0) {
            lastSampleTimeRef.current = timeSec
            sampleBackendFrame(timeSec)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateMotion)
    }

    animationFrameRef.current = requestAnimationFrame(updateMotion)

    return () => {
      isRunning = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isAnalyzed, uploadedVideoUrl, analyzedFrames])

  // Baseline counts from live telemetry records
  const carsCount = (liveRecords || []).filter((r) => r.vehicleClass === 'Car' || r.vehicleType === 'Car').length
  const trucksCount = (liveRecords || []).filter((r) => r.vehicleClass === 'Truck' || r.vehicleType === 'Truck').length
  const busesCount = (liveRecords || []).filter((r) => r.vehicleClass === 'Bus' || r.vehicleType === 'Bus').length
  const bikesCount = (liveRecords || []).filter((r) => r.vehicleClass === 'Bike' || r.vehicleType === 'Bike').length
  const lcvCount = (liveRecords || []).filter((r) => r.vehicleClass === 'LCV' || r.vehicleClass === 'Auto' || r.vehicleType === 'LCV').length

  // Dynamic detections take precedence during video playback; otherwise fallback to telemetry baseline
  const activeCars = isAnalyzed ? carsCount : dynamicBoxes.length > 0 ? dynamicBoxes.filter((b) => b.label === 'Car').length : carsCount
  const activeTrucks = isAnalyzed ? trucksCount : dynamicBoxes.length > 0 ? dynamicBoxes.filter((b) => b.label === 'Truck').length : trucksCount
  const activeBuses = isAnalyzed ? busesCount : dynamicBoxes.length > 0 ? dynamicBoxes.filter((b) => b.label === 'Bus').length : busesCount
  const activeBikes = isAnalyzed ? bikesCount : dynamicBoxes.length > 0 ? dynamicBoxes.filter((b) => b.label === 'Bike').length : bikesCount
  const activeLCVs = isAnalyzed ? lcvCount : dynamicBoxes.length > 0 ? dynamicBoxes.filter((b) => b.label === 'LCV' || b.label === 'Auto').length : lcvCount

  const maxType = Math.max(1, activeCars, activeTrucks, activeBuses, activeBikes, activeLCVs)

  return (
    <div className="viq-dashboard-container" style={{ minHeight: '100%', paddingBottom: '160px' }}>
      {/* 1. TOP HEADER: Live Corridor Command View */}
      <div className="corridor-top-header">
        <div className="corridor-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="corridor-page-title">Live Video AI Command View</h1>
            <span
              className="viq-live-badge-inline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 9px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 750,
                color: '#ef4444',
              }}
            >
              <span className="viq-sidebar-live-dot" /> LIVE FEED
            </span>
            {isAnalyzed ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 650,
                  color: inferenceError ? '#dc2626' : '#16a34a',
                  background: inferenceError ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${inferenceError ? 'rgba(220, 38, 38, 0.3)' : 'rgba(22, 163, 74, 0.3)'}`,
                }}
              >
                {inferenceError ? '● Live AI feed error' : dynamicBoxes.length ? '● Live detection active' : '● Connecting live AI feed'}
              </span>
            ) : isDemoMode ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 650,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                Demo Telemetry Active
              </span>
            ) : null}
          </div>
          <p className="corridor-page-subtitle">
            NH-44 Hyderabad-Bangalore Highway · Optical AI Ingestion Stream · Real-Time YOLOv8 & Plate OCR
          </p>
        </div>

        <div className="corridor-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="viq-btn viq-btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <UploadCloud size={15} />
            <span>Upload Traffic Video</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/mov,video/avi,video/mkv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {isDemoMode ? (
            <button
              type="button"
              className="viq-btn viq-btn-secondary"
              onClick={clearLiveRecords}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Clear data to view zero/empty state"
            >
              Clear Records
            </button>
          ) : (
            <button
              type="button"
              className="viq-btn viq-btn-secondary"
              onClick={resetToDemoData}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Load Demo Data
            </button>
          )}
        </div>
      </div>

      {/* 2. LIVE METRIC TILES */}
      <div
        className="viq-metrics-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}
      >
        {/* Tile 1: Total Live Vehicles */}
        <div
          className="viq-metric-card"
          style={{
            background: '#fff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Live Vehicles Detected
            </span>
            <Car size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {isAnalyzed ? stats.total : dynamicBoxes.length > 0 ? dynamicBoxes.length : stats.total}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={13} /> {isAnalyzed ? 'Unique vehicles detected in this video' : 'Active session stream'}
          </div>
        </div>

        {/* Tile 2: Active AI Cameras */}
        <div
          className="viq-metric-card"
          style={{
            background: '#fff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Active Optical Cameras
            </span>
            <Camera size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {stats.activeCamerasCount} / {cameras.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {uploadedVideoUrl ? '1 Video Ingestion Active' : '1 Standby · 1 Disconnected'}
          </div>
        </div>

        {/* Tile 3: Average Corridor Speed */}
        <div
          className="viq-metric-card"
          style={{
            background: '#fff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Avg Flow Velocity
            </span>
            <Activity size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {dynamicBoxes.length > 0
              ? Math.round(dynamicBoxes.reduce((acc, b) => acc + b.speed, 0) / dynamicBoxes.length)
              : stats.avgSpeed}{' '}
            km/h
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
            Within NH-44 compliance (80 km/h)
          </div>
        </div>

        {/* Tile 4: Plate Recognition Success */}
        <div
          className="viq-metric-card"
          style={{
            background: '#fff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              HSRP OCR Recognition
            </span>
            <CheckCircle2 size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
            {dynamicBoxes.length > 0
              ? Math.round(((dynamicBoxes.length - dynamicBoxes.filter((b) => b.isUnrecognized).length) / dynamicBoxes.length) * 100)
              : stats.recognitionRate}
            %
          </div>
          <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
            {dynamicBoxes.filter((b) => b.isUnrecognized).length} unreadable in frame
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: DYNAMIC VIDEO PREDICTION VIEWPORT & CLASSIFICATION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Video Player with Dynamic Moving Bounding Boxes */}
        <div
          className="viq-card"
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color={isAnalyzed ? '#10b981' : '#ef4444'} />
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Video AI Ingestion & Model Predictions
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {uploadedVideoUrl && (
                <button
                  type="button"
                  onClick={clearUploadedVideo}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Remove video and return to null state"
                >
                  <X size={12} /> Clear Video
                </button>
              )}

              <select
                value={selectedCamera?.id || ''}
                onChange={(e) => setSelectedCamera(cameras.find((c) => c.id === e.target.value) || cameras[0])}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MAIN VIEWPORT: NULL STATE / PREVIEW / DYNAMIC VARIABLE BOXES */}
          {!uploadedVideoUrl ? (
            /* NULL STATE */
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '320px',
                background: '#090d16',
                borderRadius: '12px',
                border: '2px dashed #1e293b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Video size={28} color="#64748b" />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' }}>
                No Video Loaded (Null Ingestion State)
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', maxWidth: 420, lineHeight: 1.5 }}>
                No video will play until you upload a video file and press the Analyze button.
                Upload your highway surveillance clip to run real-time YOLOv8 vehicle detection & OCR.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 8,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <UploadCloud size={16} /> Upload Video File
                </button>

                <button
                  type="button"
                  onClick={handleSampleVideo}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid #334155',
                    cursor: 'pointer',
                  }}
                >
                  Load Sample Clip
                </button>
              </div>
            </div>
          ) : !isAnalyzed ? (
            /* UPLOADED BUT NOT ANALYZED */
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '320px',
                background: '#090d16',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  color: '#fbbf24',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <span>Awaiting Analysis</span>
              </div>

              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(2, 132, 199, 0.2)',
                  border: '1px solid #0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Sparkles size={24} color="#38bdf8" />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>
                {uploadedVideoFile?.name || 'Highway Traffic Video Loaded'}
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', maxWidth: 440 }}>
                Video is ready. Playback and vehicle detection start automatically as soon as the video is available.
              </p>

              {isAnalyzing ? (
                <div style={{ width: '80%', maxWidth: 360 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#38bdf8', fontWeight: 600, marginBottom: 6 }}>
                    <span>Running YOLOv8 Vehicle Detection & OCR...</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${analysisProgress}%`, height: '100%', backgroundColor: '#0284c7', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    borderRadius: 8,
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                  }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>Start Live Feed</span>
                </button>
              )}
            </div>
          ) : (
            /* ANALYZED STATE: VIDEO PLAYS WITH REAL DYNAMIC VARIABLE BOUNDING BOXES TRACKING VEHICLES */
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: videoAspect || '16 / 9',
                maxHeight: '480px',
                background: '#020617',
                borderRadius: '12px',
                overflow: 'hidden',
                margin: '0 auto',
              }}
            >
              {/* HTML5 Video element */}
              <video
                ref={videoElementRef}
                src={uploadedVideoUrl}
                autoPlay
                muted={isMuted}
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                onLoadedMetadata={(e) => {
                  if (e.target.videoWidth && e.target.videoHeight) {
                    setVideoAspect(`${e.target.videoWidth} / ${e.target.videoHeight}`)
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleVideoEnded}
                onError={() => {
                  setIsPlaying(false)
                  setInferenceError('The selected video could not be decoded. Try an MP4 or WebM video.')
                }}
              />

              {/* DYNAMIC VARIABLE BOUNDING BOXES OVERLAY */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                {dynamicBoxes.map((box) => (
                  <div
                    key={box.id}
                    onClick={() => setSelectedVehicle(box)}
                    style={{
                      position: 'absolute',
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      border: `2px solid ${box.color}`,
                      borderRadius: 6,
                      boxShadow: `0 0 10px ${box.color}88, inset 0 0 6px ${box.color}22`,
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'left 0.08s linear, top 0.08s linear, width 0.08s linear, height 0.08s linear',
                    }}
                    title={`Click to inspect ${box.label} (${Math.round(box.confidence * 100)}%)`}
                  >
                    {/* Floating identification tag */}
                    <div
                      style={{
                        position: 'absolute',
                        top: -22,
                        left: -2,
                        backgroundColor: box.color,
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 750,
                        padding: '2px 7px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      }}
                    >
                      <span>{box.label}</span>
                      <span style={{ opacity: 0.85 }}>{Math.round(box.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Stream Status Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 11,
                  zIndex: 10,
                }}
              >
                <span style={{ color: inferenceError ? '#fca5a5' : '#4ade80', fontWeight: 700 }}>
                  {inferenceError ? '● AI FEED ERROR' : dynamicBoxes.length ? '● INFERENCE ACTIVE' : '● FEED CONNECTING'}
                </span>
                <span>{inferenceError ? 'INFERENCE ERROR' : dynamicBoxes.length ? 'YOLOv8 · LIVE DETECTION' : 'LIVE FEED · CONNECTING AI'}</span>
              </div>

              {inferenceError && (
                <div
                  role="alert"
                  style={{
                    position: 'absolute',
                    top: 42,
                    left: 10,
                    zIndex: 10,
                    maxWidth: 'min(520px, calc(100% - 20px))',
                    padding: '7px 10px',
                    borderRadius: 6,
                    color: '#fee2e2',
                    background: 'rgba(127, 29, 29, 0.9)',
                    fontSize: 11,
                  }}
                >
                  {inferenceError}
                </div>
              )}

              {/* Bottom Control Bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 11,
                  zIndex: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <span>{uploadedVideoFile?.name || 'Uploaded Video Stream'}</span>
                  <span style={{ color: '#4ade80', fontWeight: 650 }}>· {dynamicBoxes.length} Moving Vehicles Tracked</span>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Change Video
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Vehicle Classification Bar Distribution (Adapts to Active Moving Detections) */}
        <div
          className="viq-card"
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Live Vehicle Classification</h2>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {isAnalyzed ? 'Unique vehicles detected this video' : 'Real-time breakdown'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Cars / SUVs', count: activeCars, icon: Car, color: '#3b82f6' },
              { label: 'Heavy Trucks', count: activeTrucks, icon: Truck, color: '#ef4444' },
              { label: 'Buses', count: activeBuses, icon: Bus, color: '#8b5cf6' },
              { label: 'Two-Wheelers', count: activeBikes, icon: Bike, color: '#10b981' },
              { label: 'LCVs / Vans', count: activeLCVs, icon: Truck, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                    <item.icon size={14} color={item.color} />
                    {item.label}
                  </span>
                  <span style={{ color: '#0f172a' }}>{item.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((item.count / maxType) * 100)}%`,
                      background: item.color,
                      borderRadius: '9999px',
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Monitored Corridor:</span>
              <strong style={{ color: '#0f172a' }}>NH-44 Bangalore-Hyderabad</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Camera Node:</span>
              <strong style={{ color: '#0284c7' }}>{selectedCamera?.id || 'CAM-LIVE-01'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: REAL-TIME ANPR DETECTION STREAM (DYNAMICALLY SYNCED) */}
      <div
        className="viq-card"
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Real-Time ANPR Optical Detection Stream
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              New vehicles are added as detected and stay visible for 10 seconds. Pause the display to inspect them.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '12px', fontWeight: 650, color: '#0284c7' }}>
              {dynamicBoxes.length} in view · {recentDetectionCards.length} recent
            </span>
            <button
              type="button"
              onClick={toggleDetectionStreamPause}
              disabled={!isAnalyzed}
              aria-pressed={isDetectionStreamPaused}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                background: isDetectionStreamPaused ? '#eff6ff' : '#fff',
                color: '#1e40af',
                fontSize: 12,
                fontWeight: 650,
                cursor: isAnalyzed ? 'pointer' : 'not-allowed',
                opacity: isAnalyzed ? 1 : 0.6,
              }}
            >
              {isDetectionStreamPaused ? <Play size={14} /> : <Pause size={14} />}
              {isDetectionStreamPaused ? 'Resume display' : 'Pause display'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {recentDetectionCards.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              {isDetectionStreamPaused ? 'Display paused. Resume to show new detections.' : 'Detected vehicles will remain visible here for 10 seconds.'}
            </div>
          )}
          {recentDetectionCards.map((record) => {
            const isInCurrentFrame = dynamicBoxes.some((box) => box.id === record.id)
            const isNewDetection = Date.now() < record.newUntilMs

            return (
            <div
              key={record.id}
              onClick={() => setSelectedVehicle(record)}
              style={{
                border: `1px solid ${isNewDetection ? '#60a5fa' : '#e2e8f0'}`,
                borderRadius: '10px',
                padding: '14px',
                background: record.isOverSpeed ? '#fffbfa' : '#f8fafc',
                borderLeft: record.isOverSpeed ? '4px solid #ef4444' : record.isUnrecognized ? '4px solid #f59e0b' : '4px solid #10b981',
                cursor: 'pointer',
                boxShadow: isNewDetection ? '0 0 0 2px rgba(59, 130, 246, 0.12)' : 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                  Track #{record.trackId || 1}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {isNewDetection && (
                    <span style={{ padding: '2px 6px', borderRadius: 10, background: '#dbeafe', color: '#1d4ed8', fontSize: 10, fontWeight: 750 }}>
                      NEW
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {record.lastSeenAt || formatVideoTime(currentTime)}
                  </span>
                </div>
              </div>

              {/* Number Plate with "Not Recognized" Badge */}
              <div style={{ marginBottom: '8px' }}>
                {record.plate === 'Not Recognized' || record.vehicleNumberPlate === 'Not Recognized' ? (
                  <span className="viq-unrecognized-badge">Not Recognized</span>
                ) : (
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 750,
                      fontSize: '13px',
                      background: '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                    }}
                  >
                    {record.plate || record.vehicleNumberPlate}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '12px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                <div>Type: <strong style={{ color: '#0f172a' }}>{record.label || record.type || record.vehicleType}</strong></div>
                <div>Speed: <strong style={{ color: record.speed > 80 ? '#ef4444' : '#0f172a' }}>{record.speed} km/h</strong></div>
                <div>Lane: <span>{record.lane || 'Lane 1'}</span></div>
                <div>Conf: <span>{Math.round((record.confidence || 0.92) * 100)}%</span></div>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: isInCurrentFrame ? '#15803d' : '#64748b', fontWeight: 650 }}>
                {isInCurrentFrame ? 'Currently in frame' : `Last seen at ${record.lastSeenAt}`}
              </div>

              {record.isOverSpeed && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#dc2626', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> Over-speed violation ({record.speed} in 80)
                </div>
              )}
            </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>All Vehicles Detected</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                Unique vehicle tracks retained for review, including vehicles no longer in the current frame.
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 650, color: '#475569' }}>
              {liveRecords.length} total
            </span>
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                  {['Track', 'License Plate', 'Vehicle Type', 'Speed', 'Lane', 'Confidence', 'First Seen', 'Last Seen'].map((heading) => (
                    <th key={heading} style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                      Vehicles detected during playback will appear here.
                    </td>
                  </tr>
                ) : liveRecords.map((record) => (
                  <tr key={record.trackId || record.observationId || record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>#{record.trackId || '—'}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 650, color: record.vehicleNumberPlate === 'Not Recognized' ? '#b91c1c' : '#0f172a', whiteSpace: 'nowrap' }}>
                      {record.vehicleNumberPlate || record.numberPlate || 'Not Recognized'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#1e293b' }}>{record.type || record.vehicleType || 'Vehicle'}</td>
                    <td style={{ padding: '10px 12px', color: '#1e293b', whiteSpace: 'nowrap' }}>{record.speedKmph || record.speed || '—'} km/h</td>
                    <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap' }}>{record.lane || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{Math.round((record.confidence || 0) * 100)}%</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{record.firstSeenAt || record.time || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{record.lastSeenAt || record.time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Vehicle Detail Modal */}
      {selectedVehicle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              maxWidth: 480,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Vehicle Telemetry · Track #{selectedVehicle.trackId}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Vehicle Type:</span>
                <strong style={{ color: '#0f172a' }}>{selectedVehicle.label}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>License Plate:</span>
                {selectedVehicle.plate === 'Not Recognized' ? (
                  <span className="viq-unrecognized-badge">Not Recognized</span>
                ) : (
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{selectedVehicle.plate}</strong>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Model Confidence:</span>
                <strong style={{ color: '#16a34a' }}>{Math.round((selectedVehicle.confidence || 0.94) * 100)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Track Velocity:</span>
                <strong style={{ color: selectedVehicle.speed > 80 ? '#ef4444' : '#0f172a' }}>{selectedVehicle.speed} km/h</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Assigned Lane:</span>
                <strong>{selectedVehicle.lane}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Screen Box Coordinates:</span>
                <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                  [X: {selectedVehicle.x}%, Y: {selectedVehicle.y}%, W: {selectedVehicle.width}%, H: {selectedVehicle.height}%]
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
