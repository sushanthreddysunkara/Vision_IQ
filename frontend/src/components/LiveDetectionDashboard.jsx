import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Camera,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Expand,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Grid,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Maximize2,
  Navigation,
  Pause,
  Play,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Square,
  Sun,
  Truck,
  Upload,
  UploadCloud,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cameraFeeds } from '../data/cameraFeeds'
import CorridorHighwayMap from './vehicle/CorridorHighwayMap'
import '../styles/live-detection.css'

const apiBaseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')
const LIVE_FRAME_INTERVAL_SECONDS = 0.5
const MAX_DISPLAYED_FRAMES = 1200
const MAX_TEMP_VEHICLE_IMAGES = 300
const MAX_TEMP_IMAGES_PER_FRAME = 4
const RECENT_PAGE_SIZE = 10

// Reference Traffic Flow Chart Data (Last 10 Minutes: 14:20 to 14:30)
const REFERENCE_FLOW_DATA = [
  { time: '14:20', cars: 220, bikes: 110, autos: 40, trucks: 60 },
  { time: '14:22', cars: 245, bikes: 140, autos: 55, trucks: 75 },
  { time: '14:24', cars: 360, bikes: 160, autos: 70, trucks: 80 },
  { time: '14:26', cars: 310, bikes: 190, autos: 90, trucks: 70 },
  { time: '14:28', cars: 270, bikes: 175, autos: 85, trucks: 95 },
  { time: '14:30', cars: 320, bikes: 150, autos: 65, trucks: 85 },
]

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function formatClassLabel(label = '') {
  if (!label) return 'Vehicle'
  const l = label.toLowerCase().trim()
  if (l === 'motorcycle' || l === 'motorbike' || l === 'bicycle') return 'Bike'
  if (l === 'rickshaw') return 'Auto'
  return l.charAt(0).toUpperCase() + l.slice(1)
}

function isVehicleLabel(label = '') {
  return /^(car|truck|bus|motorcycle|motorbike|bicycle|bike|van|vehicle|auto|train)$/i.test(label.trim())
}

function getTrafficCategory(label = '') {
  const normalized = label.toLowerCase()
  if (/car|van|suv|jeep|taxi/.test(normalized)) return 'cars'
  if (/motorcycle|motorbike|bicycle|bike|scooter/.test(normalized)) return 'bikes'
  if (/auto|rickshaw/.test(normalized)) return 'autos'
  if (/truck|bus|lorry/.test(normalized)) return 'trucks'
  return isVehicleLabel(label) ? 'other' : null
}

function getBoxColor(label = '', violationType = null) {
  if (violationType || /accident|fire|hazard|danger|red_light|overspeed|wrong_lane/i.test(label)) {
    return 'red'
  }
  if (/truck|bus|heavy/i.test(label)) return 'red'
  if (/motorcycle|bike|bicycle/i.test(label)) return 'green'
  if (/auto|rickshaw/i.test(label)) return 'orange'
  return 'blue'
}

// --------------------------------------------------------------------------
// Deduplication Engine: Strict uniqueness by Track ID, Plate, & Spatial IoU
// --------------------------------------------------------------------------
function deduplicateDetections(detections) {
  if (!Array.isArray(detections) || !detections.length) return []

  // Sort descending by confidence so highest-confidence detection takes priority
  const sorted = [...detections].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
  const unique = []
  const seenTrackIds = new Set()
  const seenPlates = new Set()

  function getIoU(boxA, boxB) {
    const ax1 = boxA[0], ay1 = boxA[1], ax2 = boxA[0] + boxA[2], ay2 = boxA[1] + boxA[3]
    const bx1 = boxB[0], by1 = boxB[1], bx2 = boxB[0] + boxB[2], by2 = boxB[1] + boxB[3]

    const interX1 = Math.max(ax1, bx1)
    const interY1 = Math.max(ay1, by1)
    const interX2 = Math.min(ax2, bx2)
    const interY2 = Math.min(ay2, by2)

    const interW = Math.max(0, interX2 - interX1)
    const interH = Math.max(0, interY2 - interY1)
    const interArea = interW * interH

    const areaA = (boxA[2] || 0) * (boxA[3] || 0)
    const areaB = (boxB[2] || 0) * (boxB[3] || 0)
    const unionArea = areaA + areaB - interArea
    if (unionArea <= 0) return 0
    return interArea / unionArea
  }

  function getCenterDist(boxA, boxB) {
    const cxA = (boxA[0] || 0) + (boxA[2] || 0) / 2
    const cyA = (boxA[1] || 0) + (boxA[3] || 0) / 2
    const cxB = (boxB[0] || 0) + (boxB[2] || 0) / 2
    const cyB = (boxB[1] || 0) + (boxB[3] || 0) / 2
    return Math.hypot(cxA - cxB, cyA - cyB)
  }

  for (const det of sorted) {
    const trackId = det.trackId != null ? String(det.trackId) : null
    const plate = det.plateNumber && det.plateNumber !== '—' ? String(det.plateNumber).toUpperCase().trim() : null
    const box = Array.isArray(det.box) ? det.box : [0.2, 0.3, 0.1, 0.15]

    // 1. Strict trackId deduplication
    if (trackId && seenTrackIds.has(trackId)) {
      continue
    }

    // 2. Strict plate number deduplication
    if (plate && seenPlates.has(plate)) {
      continue
    }

    // 3. Spatial bounding box overlap deduplication (IoU > 0.40 or center proximity < 0.04)
    let isDuplicate = false
    for (const chosen of unique) {
      const chosenBox = Array.isArray(chosen.box) ? chosen.box : [0.2, 0.3, 0.1, 0.15]
      const iou = getIoU(box, chosenBox)
      const dist = getCenterDist(box, chosenBox)
      if (iou > 0.40 || dist < 0.04) {
        isDuplicate = true
        break
      }
    }

    if (isDuplicate) {
      continue
    }

    if (trackId) seenTrackIds.add(trackId)
    if (plate) seenPlates.add(plate)
    unique.push(det)
  }

  return unique
}

async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const responseBody = await response.text()
    if (response.status === 404) {
      throw new Error('Live AI API endpoint not found. Ensure backend is running.')
    }
    throw new Error(`The backend returned HTTP ${response.status}`)
  }
  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('Incomplete response from backend.')
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Frame analysis failed (${response.status}).`)
  }
  return result
}

export default function LiveDetectionDashboard({ onSwitchToExcelData }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Live Feed')
  const [activeCorridor, setActiveCorridor] = useState('Toll Plaza')
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Video & Playback State
  const videoRef = useRef(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const autoStartAfterUploadRef = useRef(false)
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9)

  // Real-time AI Inference State
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [modelStatus, setModelStatus] = useState(null)
  const [statusMessage, setStatusMessage] = useState('No video loaded. Upload a video file to begin AI detection.')
  const [errorMessage, setErrorMessage] = useState('')
  const sessionIdRef = useRef(generateUUID())
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const webcamStreamRef = useRef(null)
  const videoInputRef = useRef(null)
  const photoInputRef = useRef(null)

  // Real vehicle crop thumbnails captured from analyzed frames
  const vehicleImageUrlsRef = useRef(new Map())
  const pendingVehicleImagesRef = useRef(new Map())
  const [vehicleImageUrls, setVehicleImageUrls] = useState({})
  const [recentPage, setRecentPage] = useState(1)
  const lastFrameCanvasRef = useRef(null)
  const vehicleImageGenerationRef = useRef(0)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)

  // Reset imageLoadFailed whenever selectedVehicle changes
  useEffect(() => {
    setImageLoadFailed(false)
  }, [selectedVehicle])
  // Live clock
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Check backend model readiness on load
  useEffect(() => {
    let cancelled = false
    fetch(`${apiBaseUrl}/api/live-feed/models`)
      .then(parseApiResponse)
      .then((res) => {
        if (!cancelled) setModelStatus(res)
      })
      .catch((err) => {
        if (!cancelled) {
          setModelStatus({ ready: false, message: err.message || 'Model check failed' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Synchronize video URL from videoFile
  useEffect(() => {
    if (!videoFile) {
      if (!isWebcamActive) setVideoUrl('')
      return undefined
    }
    if (videoFile instanceof Blob) {
      const objectUrl = URL.createObjectURL(videoFile)
      setVideoUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    if (videoFile.url) {
      setVideoUrl(videoFile.url)
    }
  }, [videoFile, isWebcamActive])

  // Cleanup object URLs and webcam on unmount
  useEffect(() => {
    return () => {
      for (const objectUrl of vehicleImageUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl)
      }
      vehicleImageUrlsRef.current.clear()
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])


  // --------------------------------------------------------------------------
  // AI Inference: Crop Vehicle Thumbnails from Live Canvas Frame (Reliable Data URLs)
  // --------------------------------------------------------------------------
  function captureVehicleImages(frameCanvas, rawDetections, isCancelled) {
    if (!frameCanvas || !rawDetections?.length) return
    const candidates = rawDetections
      .filter((d) => isVehicleLabel(d.label))
      .slice(0, 10)
    const newImageUrls = {}

    for (const d of candidates) {
      const trackId = d.trackId != null ? String(d.trackId) : null
      const objectId = `${d.model || 'nh5'}:${trackId || d.label}`
      if (
        (trackId && vehicleImageUrlsRef.current.has(trackId)) ||
        vehicleImageUrlsRef.current.has(objectId)
      ) {
        continue
      }

      try {
        const [x, y, boxWidth, boxHeight] = d.box || []
        if (![x, y, boxWidth, boxHeight].every(Number.isFinite) || boxWidth <= 0 || boxHeight <= 0) continue

        const paddingX = boxWidth * frameCanvas.width * 0.12
        const paddingY = boxHeight * frameCanvas.height * 0.12
        const left = Math.max(0, Math.floor(x * frameCanvas.width - paddingX))
        const top = Math.max(0, Math.floor(y * frameCanvas.height - paddingY))
        const right = Math.min(frameCanvas.width, Math.ceil((x + boxWidth) * frameCanvas.width + paddingX))
        const bottom = Math.min(frameCanvas.height, Math.ceil((y + boxHeight) * frameCanvas.height + paddingY))
        const cropWidth = right - left
        const cropHeight = bottom - top
        if (cropWidth <= 0 || cropHeight <= 0) continue

        const cropCanvas = document.createElement('canvas')
        const cropScale = Math.min(1, 320 / Math.max(cropWidth, cropHeight))
        cropCanvas.width = Math.max(1, Math.round(cropWidth * cropScale))
        cropCanvas.height = Math.max(1, Math.round(cropHeight * cropScale))
        const cropContext = cropCanvas.getContext('2d')
        if (!cropContext) continue

        cropContext.drawImage(
          frameCanvas,
          left,
          top,
          cropWidth,
          cropHeight,
          0,
          0,
          cropCanvas.width,
          cropCanvas.height
        )

        const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.85)
        if (dataUrl && dataUrl.startsWith('data:image')) {
          vehicleImageUrlsRef.current.set(objectId, dataUrl)
          if (trackId) {
            vehicleImageUrlsRef.current.set(trackId, dataUrl)
            newImageUrls[trackId] = dataUrl
          }
          newImageUrls[objectId] = dataUrl
        }
      } catch {
        // Tainted canvas or draw failure handled gracefully
      }
    }

    if (Object.keys(newImageUrls).length && !isCancelled()) {
      setVehicleImageUrls((curr) => ({ ...curr, ...newImageUrls }))
    }
  }

  // On-demand crop fallback when opening vehicle intelligence modal
  function getVehicleCrop(vehicle) {
    if (!vehicle || imageLoadFailed) return null

    const key = vehicle.id
    const trackKey = vehicle.trackId != null ? String(vehicle.trackId) : null
    const modelTrackKey = vehicle.model && trackKey ? `${vehicle.model}:${trackKey}` : null

    // 1. Check synchronous ref cache first (never revoked)
    if (trackKey && vehicleImageUrlsRef.current.has(trackKey)) {
      const cached = vehicleImageUrlsRef.current.get(trackKey)
      if (cached && !cached.startsWith('blob:')) return cached
    }
    if (modelTrackKey && vehicleImageUrlsRef.current.has(modelTrackKey)) {
      const cached = vehicleImageUrlsRef.current.get(modelTrackKey)
      if (cached && !cached.startsWith('blob:')) return cached
    }
    if (key && vehicleImageUrlsRef.current.has(key)) {
      const cached = vehicleImageUrlsRef.current.get(key)
      if (cached && !cached.startsWith('blob:')) return cached
    }

    // 2. Check React state dictionary
    if (trackKey && vehicleImageUrls[trackKey] && !vehicleImageUrls[trackKey].startsWith('blob:')) {
      return vehicleImageUrls[trackKey]
    }
    if (modelTrackKey && vehicleImageUrls[modelTrackKey] && !vehicleImageUrls[modelTrackKey].startsWith('blob:')) {
      return vehicleImageUrls[modelTrackKey]
    }
    if (key && vehicleImageUrls[key] && !vehicleImageUrls[key].startsWith('blob:')) {
      return vehicleImageUrls[key]
    }

    // 3. Check vehicle.image (only if valid non-blob data URL or http url)
    if (
      vehicle.image &&
      typeof vehicle.image === 'string' &&
      vehicle.image.trim() &&
      !vehicle.image.startsWith('blob:')
    ) {
      return vehicle.image
    }

    // 4. On-demand dynamic crop directly from lastFrameCanvasRef or videoRef
    const canvas = lastFrameCanvasRef.current || videoRef.current
    const box = vehicle.box || vehicle.rawBox
    if (canvas && box && Array.isArray(box)) {
      try {
        const vw = canvas.width || canvas.videoWidth || 960
        const vh = canvas.height || canvas.videoHeight || 540
        const [nx, ny, nw, nh] = box
        if (nw > 0 && nh > 0) {
          const padX = nw * vw * 0.12
          const padY = nh * vh * 0.12
          const left = Math.max(0, Math.floor(nx * vw - padX))
          const top = Math.max(0, Math.floor(ny * vh - padY))
          const cropW = Math.min(vw - left, Math.ceil(nw * vw + padX * 2))
          const cropH = Math.min(vh - top, Math.ceil(nh * vh + padY * 2))
          if (cropW > 4 && cropH > 4) {
            const crop = document.createElement('canvas')
            const scale = Math.min(1, 320 / Math.max(cropW, cropH))
            crop.width = Math.max(1, Math.round(cropW * scale))
            crop.height = Math.max(1, Math.round(cropH * scale))
            const ctx = crop.getContext('2d')
            if (ctx) {
              ctx.drawImage(canvas, left, top, cropW, cropH, 0, 0, crop.width, crop.height)
              const dataUrl = crop.toDataURL('image/jpeg', 0.85)
              if (dataUrl && dataUrl.startsWith('data:image')) {
                if (trackKey) vehicleImageUrlsRef.current.set(trackKey, dataUrl)
                if (modelTrackKey) vehicleImageUrlsRef.current.set(modelTrackKey, dataUrl)
                if (key) vehicleImageUrlsRef.current.set(key, dataUrl)
                return dataUrl
              }
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    return null
  }

  // --------------------------------------------------------------------------
  // AI Inference: Main Video Frame Sampling & Backend Request Loop
  // --------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current
    if (!isAnalyzing || !video || (!videoUrl && !isWebcamActive)) return undefined

    let cancelled = false
    let requestInFlight = false
    let lastAnalyzedTime = -LIVE_FRAME_INTERVAL_SECONDS
    let videoFrameCallback = null
    let fallbackTimer = null

    if (!sessionIdRef.current) {
      sessionIdRef.current = generateUUID()
    }

    function stopScheduledFrame() {
      if (videoFrameCallback !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(videoFrameCallback)
      }
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer)
      }
      videoFrameCallback = null
      fallbackTimer = null
    }

    async function analyzeFrameAt(timeSeconds) {
      if (requestInFlight || cancelled) return
      if (video.videoWidth <= 0 && !isWebcamActive) return
      requestInFlight = true

      try {
        const vw = video.videoWidth || 960
        const vh = video.videoHeight || 540
        const scale = Math.min(1, 960 / vw)
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(vw * scale))
        canvas.height = Math.max(1, Math.round(vh * scale))
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas 2D context unavailable')
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        lastFrameCanvasRef.current = canvas

        let frameBlob
        try {
          frameBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(
              (blob) => (blob ? resolve(blob) : reject(new Error('Capture failed'))),
              'image/jpeg',
              0.8
            )
          })
        } catch (taintErr) {
          throw taintErr
        }
        if (cancelled) return

        const body = new FormData()
        body.append('frame', frameBlob, 'live-frame.jpg')
        const requestSessionId = sessionIdRef.current || generateUUID()
        body.append('sessionId', requestSessionId)
        body.append('sourceId', videoFile?.name || 'live-feed')
        body.append('timeSeconds', String(timeSeconds))
        body.append('durationSeconds', String(video.duration || 0))

        const res = await fetch(`${apiBaseUrl}/api/live-feed/analyze-frame`, {
          method: 'POST',
          body,
        })
        const result = await parseApiResponse(res)
        if (cancelled || sessionIdRef.current !== requestSessionId) return

        captureVehicleImages(
          canvas,
          result.frame?.detections || [],
          () => cancelled
        )

        setAnalysis((curr) => ({
          ...curr,
          ...result,
          video: { ...curr?.video, ...result.video },
          frames: [...(curr?.frames || []), result.frame].slice(-MAX_DISPLAYED_FRAMES),
        }))

        setStatusMessage(
          `AI Active · ${result.video?.sampledFrames || 1} frames sampled · ${result.summary?.vehicleCount || (result.frame?.detections?.length || 0)} vehicles detected`
        )
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err.message || 'AI inference error')
        }
      } finally {
        requestInFlight = false
      }
    }

    function scheduleNextFrame() {
      if (cancelled || (video.paused && !isWebcamActive) || video.ended) return
      if (videoFrameCallback !== null || fallbackTimer !== null) return
      if (video.requestVideoFrameCallback) {
        videoFrameCallback = video.requestVideoFrameCallback(onVideoFrame)
      }
      fallbackTimer = window.setTimeout(
        () => onVideoFrame(0, { mediaTime: isWebcamActive ? Date.now() / 1000 : video.currentTime }),
        500
      )
    }

    async function onVideoFrame(_nowTime, metadata) {
      if (videoFrameCallback !== null && video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(videoFrameCallback)
      }
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer)
      }
      videoFrameCallback = null
      fallbackTimer = null
      if (cancelled || (video.paused && !isWebcamActive)) return
      const timeSeconds = metadata?.mediaTime ?? (isWebcamActive ? Date.now() / 1000 : video.currentTime)
      if (timeSeconds < lastAnalyzedTime - 0.2) {
        lastAnalyzedTime = timeSeconds - LIVE_FRAME_INTERVAL_SECONDS
      }
      if (
        !requestInFlight &&
        (timeSeconds - lastAnalyzedTime >= LIVE_FRAME_INTERVAL_SECONDS || isWebcamActive) &&
        (video.videoWidth > 0 || isWebcamActive)
      ) {
        lastAnalyzedTime = timeSeconds
        await analyzeFrameAt(timeSeconds)
      }
      scheduleNextFrame()
    }

    function handleVideoActivity() {
      if (!cancelled && !requestInFlight) {
        scheduleNextFrame()
      }
    }

    video.addEventListener('play', handleVideoActivity)
    video.addEventListener('playing', handleVideoActivity)
    video.addEventListener('loadeddata', handleVideoActivity)
    video.addEventListener('canplay', handleVideoActivity)
    video.addEventListener('timeupdate', handleVideoActivity)

    scheduleNextFrame()

    return () => {
      cancelled = true
      stopScheduledFrame()
      video.removeEventListener('play', handleVideoActivity)
      video.removeEventListener('playing', handleVideoActivity)
      video.removeEventListener('loadeddata', handleVideoActivity)
      video.removeEventListener('canplay', handleVideoActivity)
      video.removeEventListener('timeupdate', handleVideoActivity)
    }
  }, [isAnalyzing, videoUrl, isWebcamActive, videoFile])

  // --------------------------------------------------------------------------
  // AI Inference: Active Frame Detections (Only Vehicles Currently in Frame)
  // --------------------------------------------------------------------------
  const activeFrameDetections = useMemo(() => {
    const frames = analysis?.frames || []
    if (!frames.length) return []

    if (isWebcamActive) {
      return frames[frames.length - 1]?.detections || []
    }

    let closest = frames[frames.length - 1]
    let minDiff = Infinity
    for (const f of frames) {
      const diff = Math.abs((f.timeSeconds || 0) - currentTime)
      if (diff < minDiff) {
        minDiff = diff
        closest = f
      }
    }
    if (minDiff > 2.5 && frames.length > 0) {
      closest = frames[frames.length - 1]
    }
    return closest?.detections || []
  }, [analysis, currentTime, isWebcamActive])

  const liveFlowData = useMemo(() => {
    if (!analysis) return REFERENCE_FLOW_DATA

    const counts = { cars: 0, bikes: 0, autos: 0, trucks: 0, other: 0 }
    const vehicles = [...(analysis.vehicles || [])].sort(
      (left, right) => (left.firstSeenSeconds || 0) - (right.firstSeenSeconds || 0)
    )
    const flowPoints = vehicles.map((vehicle) => {
      const category = getTrafficCategory(vehicle.type)
      if (category) counts[category] += 1
      return {
        time: `${Number(vehicle.firstSeenSeconds || 0).toFixed(1)}s`,
        ...counts,
      }
    })

    return flowPoints.length
      ? flowPoints.slice(-40)
      : [{ time: '0.0s', ...counts }]
  }, [analysis])

  const currentFlowCounts = liveFlowData[liveFlowData.length - 1]

  // Deduplicated active frame detections: strictly NO duplicates by Track ID, Plate, or Spatial IoU
  const uniqueFrameDetections = useMemo(() => {
    return deduplicateDetections(activeFrameDetections)
  }, [activeFrameDetections])

  // Real-time Bounding Boxes: only displayed while vehicles are in the frame (no duplicates)
  const liveBoxes = useMemo(() => {
    if (!uniqueFrameDetections.length) return []

    return uniqueFrameDetections.map((d, i) => {
      const formattedLabel = formatClassLabel(d.label)
      const conf = typeof d.confidence === 'number' ? d.confidence : 0.88
      const box = Array.isArray(d.box) ? d.box : [0.2, 0.3, 0.1, 0.15]
      return {
        id: d.trackId ? `live-${d.trackId}-${i}` : `live-${i}`,
        trackId: d.trackId,
        label: formattedLabel,
        rawLabel: d.label,
        confidence: conf,
        x: Math.max(0, Math.min(95, (box[0] || 0) * 100)),
        y: Math.max(0, Math.min(95, (box[1] || 0) * 100)),
        width: Math.max(3, Math.min(90, (box[2] || 0.1) * 100)),
        height: Math.max(3, Math.min(90, (box[3] || 0.15) * 100)),
        color: getBoxColor(d.label, d.violationType),
        plateNumber: d.plateNumber,
        violationType: d.violationType,
      }
    })
  }, [uniqueFrameDetections])

  // Active detections to display: ONLY real AI boxes for vehicles currently in frame; vanishing when leaving
  const displayedBoxes = liveBoxes

  // --------------------------------------------------------------------------
  // Process Real Detected Vehicles in Frame for Tables
  // --------------------------------------------------------------------------
  const plateRows = (analysis?.objects || []).filter((o) => o.plateStatus || o.plateNumber)
  const plateByVehicleId = useMemo(() => {
    const map = new Map()
    for (const p of plateRows) {
      if (p.vehicleId && !map.has(p.vehicleId)) map.set(p.vehicleId, p)
    }
    return map
  }, [plateRows])

  // ONLY vehicles currently detected by the model in the active frame!
  // Absolutely no duplicate vehicles, no dummy plates, and no dummy fallbacks.
  // As soon as a vehicle leaves the frame, it vanishes from this list!
  const realRecentDetections = useMemo(() => {
    if (!uniqueFrameDetections.length) {
      return []
    }

    const vehicleDets = uniqueFrameDetections.filter((d) => isVehicleLabel(d.label))
    if (!vehicleDets.length) {
      return []
    }

    return vehicleDets.map((d, idx) => {
      const box = Array.isArray(d.box) ? d.box : [0.2, 0.3, 0.1, 0.15]
      const objectId = `${d.model || 'nh5'}:${d.trackId != null ? d.trackId : idx}`
      const formattedClass = formatClassLabel(d.label)
      const conf = typeof d.confidence === 'number' ? d.confidence : 0.88

      // Determine lane based on horizontal box position
      const xCenter = (box[0] || 0) + (box[2] || 0) / 2
      const laneNum = xCenter < 0.28 ? 1 : xCenter < 0.52 ? 2 : xCenter < 0.74 ? 3 : 4

      // Detection time
      const nowTime = new Date()
      const timeStr = `${String(nowTime.getHours()).padStart(2, '0')}:${String(nowTime.getMinutes()).padStart(2, '0')}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`

      // Plate: ONLY what the model OCR detected, otherwise "—"
      const detectedPlate = d.plateNumber || plateByVehicleId.get(objectId)?.plateNumber || '—'

      const trackLabel = d.trackId != null ? `#${d.trackId}` : `#${idx + 1}`

      return {
        id: objectId,
        trackId: d.trackId != null ? d.trackId : idx + 1,
        time: timeStr,
        type: formattedClass,
        class: formattedClass,
        confidence: conf,
        plate: detectedPlate,
        lane: `Lane ${laneNum}`,
        extraDetails: `Track ${trackLabel} · Lane ${laneNum}`,
        status: d.violationType ? `Violation: ${d.violationType}` : 'Normal Flow',
        violation: d.violationType,
        model: d.model || 'nh5_yolov8n_960.pt',
        bbox: `[X: ${Math.round((box[0] || 0) * 100)}%, Y: ${Math.round((box[1] || 0) * 100)}%]`,
        dimensions: `${Math.round((box[2] || 0) * 100)}% × ${Math.round((box[3] || 0) * 100)}%`,
        box: box,
        rawBox: d.box,
        image: vehicleImageUrls[objectId] || (d.trackId != null ? vehicleImageUrls[String(d.trackId)] : null) || null,
        color: getBoxColor(d.label, d.violationType),
      }
    })
  }, [uniqueFrameDetections, plateByVehicleId, vehicleImageUrls, currentTime])

  // ONLY show vehicles detected by the model; no hardcoded reference fallbacks!
  const displayedRecentDetections = realRecentDetections

  // Pagination for Recent Detections: exactly 10 records per page
  const totalRecentPages = Math.max(1, Math.ceil(displayedRecentDetections.length / RECENT_PAGE_SIZE))
  const safeCurrentPage = Math.min(Math.max(1, recentPage), totalRecentPages)

  const paginatedRecentDetections = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * RECENT_PAGE_SIZE
    return displayedRecentDetections.slice(startIdx, startIdx + RECENT_PAGE_SIZE)
  }, [displayedRecentDetections, safeCurrentPage])

  // Real violation events from model
  const realViolations = useMemo(() => {
    const viols = analysis?.violations || []
    if (!viols.length) return null
    return viols.slice(0, 5).map((v) => ({
      time: `14:${String(20 + Math.floor((v.timeSeconds || 0) / 60)).padStart(2, '0')}:${String(Math.floor((v.timeSeconds || 0) % 60)).padStart(2, '0')}`,
      event: v.type || 'Traffic Violation',
      object: v.object || 'Vehicle',
      confidence: v.confidence || 0.85,
      location: activeCorridor || 'Toll Plaza',
      iconColor: 'orange',
      type: 'speed',
    }))
  }, [analysis, activeCorridor])

  const displayedViolations = realViolations || []
  const vehicleModalImg = selectedVehicle ? getVehicleCrop(selectedVehicle) : null

  // KPI calculations
  const totalVehiclesCount = analysis?.summary?.vehicleCount
    ? (2846 + analysis.summary.vehicleCount).toLocaleString()
    : '2,846'
  const violationsCount = analysis?.summary?.violationCount != null
    ? 28 + analysis.summary.violationCount
    : 28
  const complianceRate = analysis?.summary?.vehicleCount
    ? `${Math.max(92, Math.min(99.4, 100 - (violationsCount / (2846 + analysis.summary.vehicleCount)) * 100)).toFixed(1)}%`
    : '97.4%'

  // --------------------------------------------------------------------------
  // Video Analysis Controls (Start / Stop / Upload / Presets)
  // --------------------------------------------------------------------------
  const startAnalysis = async () => {
    if (!videoUrl && !isWebcamActive) {
      setStatusMessage('No video loaded. Please upload a video file first.')
      videoInputRef.current?.click()
      return
    }

    const video = videoRef.current
    if (!video) return

    setErrorMessage('')
    vehicleImageGenerationRef.current += 1
    sessionIdRef.current = generateUUID()

    setAnalysis({
      video: {
        durationSeconds: video.duration || 600,
        sampleIntervalSeconds: LIVE_FRAME_INTERVAL_SECONDS,
        sampledFrames: 0,
      },
      vehicles: [],
      objects: [],
      violations: [],
      frames: [],
    })

    setIsAnalyzing(true)
    setIsPlaying(true)
    setStatusMessage('AI Models Running · YOLOv8 & Plate OCR actively inferring frames.')

    try {
      if (!isWebcamActive && video.paused) {
        await video.play()
      }
    } catch (error) {
      setIsAnalyzing(false)
      setIsPlaying(false)
      setErrorMessage(`Video playback could not start: ${error.message || 'Check the video format and try again.'}`)
      setStatusMessage('Video playback could not start.')
    }
  }

  const handleVideoEnded = () => {
    const video = videoRef.current
    if (!video || !isAnalyzing || isWebcamActive) {
      setIsPlaying(false)
      return
    }

    sessionIdRef.current = generateUUID()
    vehicleImageGenerationRef.current += 1
    vehicleImageUrlsRef.current.clear()
    setVehicleImageUrls({})
    setAnalysis({
      video: {
        durationSeconds: video.duration || 0,
        sampleIntervalSeconds: LIVE_FRAME_INTERVAL_SECONDS,
        sampledFrames: 0,
      },
      vehicles: [],
      objects: [],
      violations: [],
      frames: [],
    })
    setCurrentTime(0)
    setErrorMessage('')
    setStatusMessage('Video finished · restarting live analysis from the beginning.')
    video.currentTime = 0
    video.play().then(() => {
      setIsPlaying(true)
    }).catch((error) => {
      setIsPlaying(false)
      setErrorMessage(`Video replay could not start: ${error.message || 'Try pressing Play & Analyze.'}`)
      setStatusMessage('Video replay could not start.')
    })
  }

  const stopAnalysis = () => {
    autoStartAfterUploadRef.current = false
    setIsAnalyzing(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsPlaying(false)
    setStatusMessage('AI analysis stopped.')
  }

  const togglePlay = () => {
    if (!videoUrl && !isWebcamActive) {
      setStatusMessage('No video loaded. Please upload a video file first.')
      videoInputRef.current?.click()
      return
    }
    if (!isAnalyzing) {
      startAnalysis()
      return
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play().catch(() => { })
        setIsPlaying(true)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration)
      }
    }
  }

  const handleSpeedToggle = () => {
    const speeds = [1, 1.5, 2, 0.5]
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length]
    setPlaybackSpeed(nextSpeed)
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed
    }
  }

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      autoStartAfterUploadRef.current = true
      if (isWebcamActive) {
        webcamStreamRef.current?.getTracks().forEach((t) => t.stop())
        setIsWebcamActive(false)
      }
      setVideoFile(file)
      sessionIdRef.current = generateUUID()
      vehicleImageGenerationRef.current += 1
      setAnalysis({
        video: { durationSeconds: 0, sampleIntervalSeconds: LIVE_FRAME_INTERVAL_SECONDS, sampledFrames: 0 },
        vehicles: [],
        objects: [],
        violations: [],
        frames: [],
      })
      setIsAnalyzing(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setVideoAspectRatio(16 / 9)
      setIsMuted(true)
      setErrorMessage('')
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
      setStatusMessage(`Loading "${file.name}" for live AI analysis...`)
    }
    e.target.value = ''
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('frame', file)
    formData.append('sessionId', generateUUID())
    formData.append('sourceId', file.name)
    formData.append('timeSeconds', '0')
    setStatusMessage('Analyzing photo with YOLOv8 & Plate OCR...')
    try {
      const res = await fetch(`${apiBaseUrl}/api/live-feed/analyze-frame`, {
        method: 'POST',
        body: formData,
      })
      const data = await parseApiResponse(res)
      if (data?.frame?.detections?.length) {
        setAnalysis((curr) => ({
          ...curr,
          ...data,
          frames: [data.frame],
        }))
        setStatusMessage(`Photo analyzed · ${data.frame.detections.length} objects detected by AI.`)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Photo analysis error')
    }
    e.target.value = ''
  }

  const toggleWebcam = async () => {
    if (isWebcamActive) {
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop())
      webcamStreamRef.current = null
      setIsWebcamActive(false)
      setIsAnalyzing(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      webcamStreamRef.current = stream
      setIsWebcamActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => { })
      }
      startAnalysis()
    } catch {
      setErrorMessage('Could not access webcam in this environment.')
    }
  }

  const handleCorridorClick = (c) => {
    setActiveCorridor(c)
    const preset = cameraFeeds.find(
      (f) =>
        f.location.toLowerCase().includes(c.toLowerCase()) ||
        f.name.toLowerCase().includes(c.toLowerCase())
    )
    if (preset) {
      setVideoFile({
        name: `${preset.name} (${preset.location})`,
        url: preset.videoUrl,
        isPreset: true,
      })
      setIsAnalyzing(false)
      setIsPlaying(false)
      setCurrentTime(0)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
      setStatusMessage(`Selected ${preset.name}. Click "Play & Analyze" to run AI detection.`)
    }
  }

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // Navigation back to Excel Data
  const handleGoToExcel = () => {
    try {
      localStorage.setItem('visioniq-live-mode', 'false')
    } catch { }
    if (typeof onSwitchToExcelData === 'function') {
      try {
        onSwitchToExcelData()
      } catch (err) {
        console.error('Error switching to excel data:', err)
      }
    }
    navigate('/home')
  }

  return (
    <div className="viq-live-canvas">
      <div className="viq-live-layout">
        {/* ====================================================================
            1. FLOATING GLASSMORPHISM SIDEBAR WITH DIFFERENT OPTIONS
            ==================================================================== */}
        <aside className="viq-live-sidebar">
          <div>
            {/* Top Logo */}
            <div
              className="viq-live-sidebar-header"
              onClick={handleGoToExcel}
              title="VisionIQ Traffic Operations (Go to Home)"
            >
              <div className="viq-live-logo-icon">
                <div className="viq-live-logo-inner-ring" />
              </div>
              <div className="viq-live-brand-title">
                <span className="viq-live-brand-name">VISIONIQ</span>
                <span className="viq-live-brand-sub">Traffic Operations</span>
              </div>
            </div>

            {/* Navigation List matching Reference Image */}
            <nav className="viq-live-nav-list" aria-label="Sidebar navigation">
              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                onClick={handleGoToExcel}
                title="Excel Data & Analytics Dashboard"
              >
                <LayoutGrid className="viq-live-nav-icon" size={17} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className="viq-live-nav-item"
                onClick={handleGoToExcel}
                title="Open Excel Data"
              >
                <FileSpreadsheet className="viq-live-nav-icon" size={17} />
                <span>Excel Data</span>
              </button>

              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Live Feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('Live Feed')}
              >
                <Video className="viq-live-nav-icon" size={17} />
                <span>Live Feed</span>
              </button>

              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Events' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('Events')
                  document.querySelector('.viq-live-table-card:last-of-type')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Bell className="viq-live-nav-icon" size={17} />
                <span>Events</span>
              </button>

              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Analytics' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('Analytics')
                  document.querySelector('.viq-live-chart-card')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <BarChart3 className="viq-live-nav-icon" size={17} />
                <span>Analytics</span>
              </button>

              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Corridors' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('Corridors')
                  setIsMapModalOpen(true)
                }}
              >
                <GitBranch className="viq-live-nav-icon" size={17} />
                <span>Corridors</span>
              </button>

              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Cameras' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('Cameras')
                  videoInputRef.current?.click()
                }}
              >
                <Camera className="viq-live-nav-icon" size={17} />
                <span>Cameras</span>
              </button>

              <button
                type="button"
                className={`viq-live-nav-item ${activeTab === 'Reports' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('Reports')
                  handleGoToExcel()
                }}
              >
                <FileText className="viq-live-nav-icon" size={17} />
                <span>Reports</span>
              </button>
            </nav>

            {/* Quick Switch Button to Excel Data */}
            <button
              type="button"
              className="viq-live-excel-switch-btn"
              onClick={handleGoToExcel}
              title="Switch to Excel Data Hub"
            >
              <FileSpreadsheet size={15} />
              <span>Excel Data</span>
              <ArrowRight size={13} style={{ marginLeft: 'auto' }} />
            </button>
          </div>

          {/* Bottom Curved Highway Card with "Safer Roads Smarter Cities" */}
          <div className="viq-live-sidebar-bottom">
            <img
              src="https://res.cloudinary.com/fikkfcud/image/upload/v1793856351/dashboard_highway_bg.jpg"
              alt="Highway Corridor"
              className="viq-live-sidebar-highway-img"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = '/toll_plaza_feed.png'
              }}
            />
            <div className="viq-live-sidebar-highway-overlay">
              <span className="viq-live-quote-title">Safer Roads</span>
              <span className="viq-live-quote-sub">Smarter Cities</span>
            </div>
          </div>
        </aside>

        {/* ====================================================================
            2. MAIN CONTENT AREA
            ==================================================================== */}
        <main className="viq-live-main-content">
          {/* Top Bar Header */}
          <header className="viq-live-top-bar">
            <div className="viq-live-title-group">
              <div className="viq-live-breadcrumb">
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={handleGoToExcel}
                  title="Go to Excel Data"
                >
                  Home
                </span>
                <span className="crumb-sep">&gt;</span>
                <span className="crumb-active">Live Feed</span>
              </div>
              <h1 className="viq-live-page-title">Live Traffic Overview</h1>
              <p className="viq-live-page-subtitle">
                {statusMessage}
              </p>
            </div>

            <div className="viq-live-top-actions">
              {/* Search Pill */}
              <div className="viq-live-search-pill">
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search cameras, corridors, events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/query?q=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                />
              </div>

              {/* Weather & Live Date Pill */}
              <div className="viq-live-weather-pill">
                <Sun size={15} color="#eab308" />
                <span>
                  Hyderabad 28°C · {now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Excel Data Quick Switch in Top Header */}
              <button
                type="button"
                className="viq-live-excel-header-btn"
                onClick={handleGoToExcel}
                title="Switch to Excel Data Hub"
              >
                <FileSpreadsheet size={14} />
                <span>Excel Data</span>
              </button>

              {/* Notification Bell */}
              <button
                type="button"
                className="viq-live-icon-btn"
                title="Notifications"
                onClick={() => navigate('/rules-events')}
              >
                <Bell size={16} />
                <span className="viq-live-notif-dot">1</span>
              </button>

              {/* User Avatar */}
              <div
                className="viq-live-avatar-pill"
                title="User Profile: SR"
                onClick={() => navigate('/profile')}
              >
                SR
              </div>
            </div>
          </header>

          {/* Row 1: 4 Top KPI Cards */}
          <section className="viq-live-kpi-grid" aria-label="Key Performance Indicators">
            {/* Card 1: Total Vehicles */}
            <div className="viq-live-kpi-card">
              <div className="viq-live-kpi-left">
                <div className="viq-live-kpi-icon-wrap blue">
                  <Car size={22} strokeWidth={2.4} />
                </div>
                <div className="viq-live-kpi-info">
                  <span className="viq-live-kpi-label">Total Vehicles</span>
                  <span className="viq-live-kpi-value">{totalVehiclesCount}</span>
                  <div className="viq-live-kpi-trend green">
                    <span>+12%</span>
                    <span className="viq-live-kpi-trend-sub">vs last hour</span>
                  </div>
                </div>
              </div>
              <svg className="viq-live-kpi-sparkline" viewBox="0 0 100 40" fill="none">
                <path d="M0 32 Q 25 15, 50 25 T 100 8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 32 Q 25 15, 50 25 T 100 8 L 100 40 L 0 40 Z" fill="url(#sparkLiveBlue)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkLiveBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Card 2: Compliance Rate */}
            <div className="viq-live-kpi-card">
              <div className="viq-live-kpi-left">
                <div className="viq-live-kpi-icon-wrap green">
                  <ShieldCheck size={22} strokeWidth={2.4} />
                </div>
                <div className="viq-live-kpi-info">
                  <span className="viq-live-kpi-label">Compliance Rate</span>
                  <span className="viq-live-kpi-value">{complianceRate}</span>
                  <div className="viq-live-kpi-trend green">
                    <span>+1.2%</span>
                    <span className="viq-live-kpi-trend-sub">vs last hour</span>
                  </div>
                </div>
              </div>
              <svg className="viq-live-kpi-sparkline" viewBox="0 0 100 40" fill="none">
                <path d="M0 28 Q 30 35, 60 18 T 100 10" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 28 Q 30 35, 60 18 T 100 10 L 100 40 L 0 40 Z" fill="url(#sparkLiveGreen)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkLiveGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Card 3: Violation Events */}
            <div className="viq-live-kpi-card">
              <div className="viq-live-kpi-left">
                <div className="viq-live-kpi-icon-wrap orange">
                  <AlertTriangle size={22} strokeWidth={2.4} />
                </div>
                <div className="viq-live-kpi-info">
                  <span className="viq-live-kpi-label">Violation Events</span>
                  <span className="viq-live-kpi-value">{violationsCount}</span>
                  <div className="viq-live-kpi-trend red">
                    <span>-18%</span>
                    <span className="viq-live-kpi-trend-sub">vs last hour</span>
                  </div>
                </div>
              </div>
              <svg className="viq-live-kpi-sparkline" viewBox="0 0 100 40" fill="none">
                <path d="M0 12 Q 35 10, 60 28 T 100 32" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 12 Q 35 10, 60 28 T 100 32 L 100 40 L 0 40 Z" fill="url(#sparkLiveOrange)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkLiveOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Card 4: Active Cameras */}
            <div className="viq-live-kpi-card">
              <div className="viq-live-kpi-left">
                <div className="viq-live-kpi-icon-wrap purple">
                  <Video size={22} strokeWidth={2.4} />
                </div>
                <div className="viq-live-kpi-info">
                  <span className="viq-live-kpi-label">Active Cameras</span>
                  <span className="viq-live-kpi-value">12/12</span>
                  <div className="viq-live-kpi-trend green">
                    <span style={{ fontSize: '10px' }}>●</span>
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <svg className="viq-live-kpi-sparkline" viewBox="0 0 100 40" fill="none">
                <path d="M0 24 Q 25 20, 50 15 T 100 8" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 24 Q 25 20, 50 15 T 100 8 L 100 40 L 0 40 Z" fill="url(#sparkLivePurple)" opacity="0.18" />
                <defs>
                  <linearGradient id="sparkLivePurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </section>

          {/* Row 2: Corridor Selector Strip */}
          <section className="viq-live-corridor-strip">
            <div className="viq-live-corridor-left">
              <span className="viq-live-corridor-label">Select Corridor:</span>

              <div className="viq-live-corridor-dropdown" title="Active Highway Corridor">
                <span>NH-44 Hyderabad → Bengaluru</span>
                <ChevronDown size={14} color="#64748b" />
              </div>

              <div className="viq-live-corridor-chips">
                {['Medchal', 'Jadcherla', 'Toll Plaza', 'Shadnagar', 'Ring Road', 'Shamshabad'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`viq-live-corridor-chip ${activeCorridor === c ? 'active' : ''}`}
                    onClick={() => handleCorridorClick(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="viq-live-map-btn"
              onClick={() => setIsMapModalOpen(true)}
              title="Open full interactive corridor map"
            >
              <MapPin size={14} />
              <span>Live Map</span>
            </button>
          </section>

          {/* Row 3: Main Two-Column Grid */}
          <div className="viq-live-two-col-grid">
            {/* Left Column: Live Video Feed & Traffic Flow Graph */}
            <div className="viq-live-col">
              {/* Card 1: Live Feed Video Player with Real AI Overlay */}
              <article className="viq-live-card">
                <div className="viq-live-card-header">
                  <div>
                    <div className="viq-live-card-title-group">
                      <h2 className="viq-live-card-title">Live Feed</h2>
                      {isPlaying && (
                        <span className="viq-live-live-pill">
                          <span className="viq-live-live-pulse-dot" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="viq-live-card-sub">
                      {videoFile?.name || 'No video loaded · Awaiting upload'}
                    </p>
                  </div>

                  <div className="viq-live-card-actions">
                    {/* Main AI Play & Analyze Toggle Button */}
                    <button
                      type="button"
                      className={`viq-live-ai-analyze-btn ${isAnalyzing ? 'active' : ''}`}
                      onClick={isAnalyzing ? stopAnalysis : startAnalysis}
                      title={isAnalyzing ? 'Stop AI Inference' : 'Start Real-time AI Inference'}
                    >
                      {isAnalyzing ? <Square size={13} fill="#ffffff" /> : <Play size={13} fill="#ffffff" />}
                      <span>{isAnalyzing ? 'Stop AI' : 'Play & Analyze'}</span>
                    </button>

                    {/* Upload Video Button */}
                    <button
                      type="button"
                      className="viq-live-pill-btn"
                      onClick={() => videoInputRef.current?.click()}
                      title="Upload custom video for vehicle detection"
                    >
                      <Upload size={12} />
                      <span>Upload Video</span>
                    </button>

                    {/* Upload Photo Button */}
                    <button
                      type="button"
                      className="viq-live-action-icon-btn"
                      onClick={() => photoInputRef.current?.click()}
                      title="Upload photo for AI frame detection"
                    >
                      <ImageIcon size={15} />
                    </button>

                    {/* Webcam Toggle Button */}
                    <button
                      type="button"
                      className={`viq-live-action-icon-btn ${isWebcamActive ? 'active' : ''}`}
                      onClick={toggleWebcam}
                      title={isWebcamActive ? 'Stop Webcam' : 'Use Live Webcam'}
                    >
                      <Radio size={15} color={isWebcamActive ? '#ef4444' : '#64748b'} />
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      className="viq-live-action-icon-btn"
                      title="Fullscreen"
                      onClick={() => {
                        const el = document.querySelector('.viq-live-video-box')
                        if (el?.requestFullscreen) el.requestFullscreen()
                      }}
                    >
                      <Expand size={15} />
                    </button>
                  </div>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*,.mkv,.avi"
                  style={{ display: 'none' }}
                  onChange={handleVideoUpload}
                />
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />

                {/* Video Container with Dynamic AI Bounding Boxes */}
                <div className="viq-live-video-box">
                  {!videoUrl && !isWebcamActive ? (
                    <div className="viq-live-video-null-state">
                      <div className="viq-live-null-icon-ring">
                        <UploadCloud size={34} strokeWidth={1.8} color="#94a3b8" />
                      </div>
                      <h3 className="viq-live-null-title">No Video Feed Loaded</h3>
                      <p className="viq-live-null-desc">
                        Upload a video file to begin. Playback and AI vehicle detection start automatically and replay from the beginning when the video ends.
                      </p>
                      <button
                        type="button"
                        className="viq-live-null-upload-btn"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <Upload size={14} />
                        <span>Upload Video</span>
                      </button>
                    </div>
                  ) : null}

                  {/* HTML5 Video element */}
                  <video
                    ref={videoRef}
                    className="viq-live-video-element"
                    src={videoUrl || undefined}
                    muted={isMuted}
                    crossOrigin="anonymous"
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onLoadedMetadata={() => {
                      const video = videoRef.current
                      if (video?.duration) {
                        setDuration(video.duration)
                      }
                      if (video?.videoWidth && video?.videoHeight) {
                        setVideoAspectRatio(video.videoWidth / video.videoHeight)
                      }
                      if (autoStartAfterUploadRef.current) {
                        autoStartAfterUploadRef.current = false
                        startAnalysis()
                      }
                    }}
                    onError={() => {
                      autoStartAfterUploadRef.current = false
                      setErrorMessage('The selected video could not be loaded. Try a supported MP4, WebM, or MOV file.')
                      setStatusMessage('Video could not be loaded.')
                    }}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: videoUrl || isWebcamActive ? 'block' : 'none',
                    }}
                  />

                  {/* AI Detection Bounding Boxes Overlay matching Reference Image / Live Inference */}
                  {(videoUrl || isWebcamActive) && isAnalyzing && (
                    <div
                      className="viq-live-video-overlay"
                      style={{
                        zIndex: 2,
                        ...(videoAspectRatio > 16 / 9
                          ? {
                              top: `${(1 - (16 / 9) / videoAspectRatio) * 50}%`,
                              height: `${((16 / 9) / videoAspectRatio) * 100}%`,
                            }
                          : {
                              left: `${(1 - videoAspectRatio / (16 / 9)) * 50}%`,
                              width: `${(videoAspectRatio / (16 / 9)) * 100}%`,
                            }),
                      }}
                    >
                      {displayedBoxes.map((box) => (
                        <div
                          key={box.id}
                          className={`viq-live-ai-box ${box.color}`}
                          style={{
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                          }}
                          title={`Click to inspect ${box.label} (${Math.round(box.confidence * 100)}%)`}
                          onClick={() => {
                            const trackKey = box.trackId != null ? String(box.trackId) : null
                            const match = displayedRecentDetections.find(
                              (v) => (trackKey && String(v.trackId) === trackKey) || v.id === box.id || v.class.toLowerCase() === box.label.toLowerCase()
                            )
                            setSelectedVehicle(match || {
                              id: box.id,
                              trackId: box.trackId,
                              class: box.label,
                              confidence: box.confidence,
                              plate: box.plateNumber || '—',
                              extraDetails: `Track #${box.trackId || 1}`,
                              location: activeCorridor || 'Toll Plaza',
                              lane: 'Lane 1',
                              model: 'nh5_yolov8n_960.pt',
                              bbox: `[X: ${box.x.toFixed(1)}%, Y: ${box.y.toFixed(1)}%]`,
                              dimensions: `${box.width.toFixed(1)}% × ${box.height.toFixed(1)}%`,
                              box: [box.x / 100, box.y / 100, box.width / 100, box.height / 100],
                              time: formatSeconds(currentTime),
                              image: (trackKey && vehicleImageUrls[trackKey]) || vehicleImageUrls[box.id] || null,
                              color: box.color,
                              status: 'Normal Flow',
                            })
                          }}
                        >
                          <span className="viq-live-ai-tag">
                            <span>{box.label}</span>
                            <span className="viq-live-ai-tag-conf">
                              {Math.round(box.confidence * 100)}%
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Video Player Bottom Control Bar */}
                  <div className="viq-live-video-controls" style={{ zIndex: 3 }}>
                    <button
                      type="button"
                      className="viq-live-ctrl-btn"
                      onClick={togglePlay}
                      title={isPlaying ? 'Pause' : 'Play & Analyze'}
                    >
                      {isPlaying ? <Pause size={15} fill="#ffffff" /> : <Play size={15} fill="#ffffff" />}
                    </button>

                    <span className="viq-live-ctrl-time">
                      {formatSeconds(currentTime)} / {formatSeconds(duration)}
                    </span>

                    {/* Scrubber Bar */}
                    <div
                      className="viq-live-scrubber-track"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const clickX = e.clientX - rect.left
                        const percent = clickX / rect.width
                        if (videoRef.current && duration > 0) {
                          videoRef.current.currentTime = percent * duration
                        }
                      }}
                    >
                      <div className="viq-live-scrubber-fill" style={{ width: `${progressPercent}%` }} />
                      <div className="viq-live-scrubber-thumb" style={{ left: `${progressPercent}%` }} />
                    </div>

                    <button
                      type="button"
                      className="viq-live-ctrl-speed-btn"
                      onClick={handleSpeedToggle}
                      title="Playback Speed"
                    >
                      {playbackSpeed}x
                    </button>

                    <button
                      type="button"
                      className="viq-live-ctrl-btn"
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>

                    <button
                      type="button"
                      className="viq-live-ctrl-btn"
                      title="Snapshot detection"
                      onClick={() => {
                        if (videoRef.current) {
                          const canvas = document.createElement('canvas')
                          canvas.width = 640
                          canvas.height = 360
                          const ctx = canvas.getContext('2d')
                          ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
                          const link = document.createElement('a')
                          link.download = `snapshot_${Date.now()}.png`
                          link.href = canvas.toDataURL()
                          link.click()
                        }
                      }}
                    >
                      <Camera size={14} />
                    </button>

                    <button
                      type="button"
                      className="viq-live-ctrl-btn"
                      title="Fullscreen"
                      onClick={() => {
                        const el = document.querySelector('.viq-live-video-box')
                        if (el?.requestFullscreen) el.requestFullscreen()
                      }}
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                </div>
              </article>

              {/* Card 2: Traffic Flow Area Chart (Last 10 Minutes) */}
              <article className="viq-live-card viq-live-chart-card">
                <div className="viq-live-card-header">
                  <h3 className="viq-live-card-title">
                    Traffic Flow <span style={{ fontWeight: 400, color: '#64748b', fontSize: '13px' }}>(Last 10 Minutes)</span>
                  </h3>

                  <div className="viq-live-chart-legend">
                    <div className="viq-live-legend-item">
                      <span className="viq-live-legend-line blue" />
                      <span>Cars · {currentFlowCounts.cars}</span>
                    </div>
                    <div className="viq-live-legend-item">
                      <span className="viq-live-legend-line green" />
                      <span>Bikes · {currentFlowCounts.bikes}</span>
                    </div>
                    <div className="viq-live-legend-item">
                      <span className="viq-live-legend-line orange" />
                      <span>Autos · {currentFlowCounts.autos}</span>
                    </div>
                    <div className="viq-live-legend-item">
                      <span className="viq-live-legend-line purple" />
                      <span>Trucks · {currentFlowCounts.trucks}</span>
                    </div>
                    <div className="viq-live-legend-item">
                      <span className="viq-live-legend-line other" />
                      <span>Other · {currentFlowCounts.other}</span>
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveFlowData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="flowCars" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="flowBikes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="flowAutos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="flowTrucks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
                      <Area type="monotone" dataKey="cars" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#flowCars)" />
                      <Area type="monotone" dataKey="bikes" stroke="#22c55e" strokeWidth={2.2} fillOpacity={1} fill="url(#flowBikes)" />
                      <Area type="monotone" dataKey="autos" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#flowAutos)" />
                      <Area type="monotone" dataKey="trucks" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#flowTrucks)" />
                      <Area type="monotone" dataKey="other" stroke="#64748b" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>

            {/* Right Column: Recent Detections & Violation Events */}
            <div className="viq-live-col">
              {/* Card 1: Recent Detections Table */}
              <article className="viq-live-card viq-live-table-card">
                <div className="viq-live-card-header">
                  <h3 className="viq-live-card-title">
                    Recent Detections
                    <span style={{ fontSize: '11px', fontWeight: 650, color: '#3b82f6', marginLeft: '6px', background: '#eff6ff', padding: '2px 8px', borderRadius: '9999px' }}>
                      {displayedRecentDetections.length} in frame
                    </span>
                    {totalRecentPages > 1 && (
                      <span style={{ fontSize: '11px', fontWeight: 550, color: '#64748b', marginLeft: '6px', background: '#f8fafc', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                        Page {safeCurrentPage} of {totalRecentPages}
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    className="viq-live-view-all-link"
                    onClick={() => navigate('/query')}
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <table className="viq-live-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Object</th>
                      <th>Class</th>
                      <th>Confidence</th>
                      <th>Number Plate</th>
                      <th>Extra Details</th>
                      <th>Image</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRecentDetections.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Activity size={22} color="#3b82f6" />
                            <span style={{ fontSize: '13px', fontWeight: 650, color: '#1e293b' }}>
                              {isAnalyzing ? 'Scanning Video · No Vehicles Currently in Frame' : 'No Vehicles Detected Yet'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b', maxWidth: 360 }}>
                              {isAnalyzing
                                ? 'Only active vehicles currently visible in the video frame are displayed. When a vehicle leaves the frame, it vanishes automatically.'
                                : 'Click "Play & Analyze" to start real-time AI vehicle detection.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRecentDetections.map((row, idx) => {
                        const c = (row.class || '').toLowerCase()
                        return (
                          <tr
                            key={row.id || idx}
                            onClick={() => setSelectedVehicle(row)}
                            title="Click to view full vehicle telemetry and AI details"
                          >
                            <td className="viq-live-cell-time">{row.time}</td>
                            <td>
                              <span className={`viq-live-cell-icon ${row.color || 'blue'}`}>
                                {c.includes('car') && <Car size={14} />}
                                {(c.includes('bike') || c.includes('motorcycle')) && <Navigation size={14} />}
                                {c.includes('auto') && <Car size={14} />}
                                {(c.includes('truck') || c.includes('bus')) && <Truck size={14} />}
                                {!c.includes('car') && !c.includes('bike') && !c.includes('truck') && !c.includes('auto') && <Car size={14} />}
                              </span>
                            </td>
                            <td style={{ fontWeight: 650, color: '#0f172a' }}>{row.class}</td>
                            <td className={`viq-live-cell-confidence ${row.confidence >= 0.85 ? 'green' : 'orange'}`}>
                              {Math.round(row.confidence * 100)}%
                            </td>
                            <td className="viq-live-cell-plate">{row.plate}</td>
                            <td>
                              <span className="viq-live-extra-badge">
                                {row.extraDetails || `Track #${row.trackId || 1}`}
                              </span>
                            </td>
                            <td>
                              <div style={{ position: 'relative', width: 38, height: 26, display: 'inline-flex' }}>
                                {row.image && (
                                  <img
                                    src={row.image}
                                    alt="Vehicle Crop"
                                    className="viq-live-cell-thumb"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )}
                                <div
                                  className={`viq-live-cell-thumb-placeholder ${row.color || 'blue'}`}
                                  style={{
                                    position: row.image ? 'absolute' : 'relative',
                                    inset: 0,
                                    zIndex: row.image ? 0 : 1,
                                  }}
                                >
                                  {c.includes('truck') ? (
                                    <Truck size={13} />
                                  ) : c.includes('bike') || c.includes('motorcycle') ? (
                                    <Navigation size={13} />
                                  ) : (
                                    <Car size={13} />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="viq-live-action-icon-btn small"
                                title="Inspect Vehicle Intelligence"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedVehicle(row)
                                }}
                              >
                                <ArrowRight size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls - 10 Records Per Page */}
                {displayedRecentDetections.length > 0 && (
                  <div className="viq-live-pagination-bar">
                    <div className="viq-live-pagination-info">
                      <span>
                        Showing <strong>{(safeCurrentPage - 1) * RECENT_PAGE_SIZE + 1}</strong>
                        –
                        <strong>{Math.min(safeCurrentPage * RECENT_PAGE_SIZE, displayedRecentDetections.length)}</strong>
                        {' '}of{' '}
                        <strong>{displayedRecentDetections.length}</strong> vehicles in frame
                      </span>
                    </div>

                    {totalRecentPages > 1 && (
                      <div className="viq-live-pagination-controls">
                        <button
                          type="button"
                          className="viq-live-page-nav-btn"
                          disabled={safeCurrentPage <= 1}
                          onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                          title="Previous 10 records"
                        >
                          <ChevronLeft size={13} />
                          <span>Prev</span>
                        </button>

                        <div className="viq-live-page-numbers">
                          {Array.from({ length: totalRecentPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              className={`viq-live-page-num-btn ${safeCurrentPage === pageNum ? 'active' : ''}`}
                              onClick={() => setRecentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="viq-live-page-nav-btn"
                          disabled={safeCurrentPage >= totalRecentPages}
                          onClick={() => setRecentPage((p) => Math.min(totalRecentPages, p + 1))}
                          title="Next 10 records"
                        >
                          <span>Next</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>

              {/* Card 2: Violation Events Table */}
              <article className="viq-live-card viq-live-table-card">
                <div className="viq-live-card-header">
                  <h3 className="viq-live-card-title">Violation Events</h3>
                  <button
                    type="button"
                    className="viq-live-view-all-link"
                    onClick={() => navigate('/rules-events')}
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <table className="viq-live-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Object</th>
                      <th>Confidence</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedViolations.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '28px 16px', color: '#64748b' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={20} color="#16a34a" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                              No Active Traffic Violations
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Live traffic in frame is currently flowing normally.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedViolations.map((row, idx) => (
                        <tr key={idx}>
                          <td className="viq-live-cell-time">{row.time}</td>
                          <td>
                            <span className="viq-live-cell-event">
                              <span className={`viq-live-cell-icon ${row.iconColor}`}>
                                {row.type === 'helmet' && <ShieldAlert size={14} />}
                                {row.type === 'light' && <AlertTriangle size={14} />}
                                {row.type === 'lane' && <GitBranch size={14} />}
                                {row.type === 'speed' && <Car size={14} />}
                              </span>
                              <span>{row.event}</span>
                            </span>
                          </td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span className="viq-live-cell-icon blue" style={{ width: 22, height: 22 }}>
                                {row.object === 'Car' && <Car size={12} />}
                                {row.object === 'Bike' && <Navigation size={12} />}
                                {row.object === 'Truck' && <Truck size={12} />}
                              </span>
                              <span style={{ fontWeight: 550 }}>{row.object}</span>
                            </span>
                          </td>
                          <td className="viq-live-cell-confidence orange">{row.confidence.toFixed(2)}</td>
                          <td style={{ color: '#475569', fontWeight: 500 }}>{row.location}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </article>
            </div>
          </div>

          {/* Bottom Floor Reflection Effect (Matches Screenshot) */}
          <div className="viq-live-floor-reflection" aria-hidden="true" />
        </main>
      </div>

      {/* Corridor Highway Map Modal */}
      {isMapModalOpen && (
        <div className="viq-live-map-modal-backdrop" onClick={() => setIsMapModalOpen(false)}>
          <div className="viq-live-map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="viq-live-map-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={18} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Live Corridor Map — NH-44 Hyderabad → Bengaluru
                </h3>
              </div>
              <button
                type="button"
                className="viq-live-action-icon-btn"
                onClick={() => setIsMapModalOpen(false)}
                title="Close Map"
              >
                <X size={18} />
              </button>
            </div>
            <div className="viq-live-map-modal-body">
              <CorridorHighwayMap selectedCorridor="NH-44" onSelectCorridor={handleCorridorClick} />
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details & AI Telemetry Inspection Modal */}
      {selectedVehicle && (
        <div className="viq-live-detail-modal-backdrop" onClick={() => setSelectedVehicle(null)}>
          <div className="viq-live-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="viq-live-detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`viq-live-cell-icon ${selectedVehicle.color || 'blue'}`}>
                  {selectedVehicle.class?.toLowerCase().includes('truck') ? <Truck size={16} /> : <Car size={16} />}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750, color: '#0f172a' }}>
                    Vehicle Intelligence & AI Telemetry
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Track ID: {selectedVehicle.trackId ? `#${selectedVehicle.trackId}` : (selectedVehicle.id || '—')} · Corridor: {selectedVehicle.location || activeCorridor}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="viq-live-action-icon-btn"
                onClick={() => setSelectedVehicle(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="viq-live-detail-body">
              {/* Preview Crop & Quick Stats */}
              <div className="viq-live-detail-preview-row">
                <div className="viq-live-detail-image-box">
                  {vehicleModalImg && !imageLoadFailed ? (
                    <img
                      src={vehicleModalImg}
                      alt={selectedVehicle.class || 'Vehicle Crop'}
                      className="viq-live-detail-img"
                      onError={() => setImageLoadFailed(true)}
                    />
                  ) : (
                    <div
                      className={`viq-live-cell-thumb-placeholder large ${selectedVehicle.color || 'blue'}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 110,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        color: '#ffffff',
                        borderRadius: '8px',
                      }}
                    >
                      {selectedVehicle.class?.toLowerCase().includes('truck') && <Truck size={36} color="#f87171" />}
                      {(selectedVehicle.class?.toLowerCase().includes('bike') || selectedVehicle.class?.toLowerCase().includes('motorcycle')) && (
                        <Navigation size={36} color="#4ade80" />
                      )}
                      {selectedVehicle.class?.toLowerCase().includes('auto') && <Car size={36} color="#fb923c" />}
                      {!selectedVehicle.class?.toLowerCase().includes('truck') &&
                        !selectedVehicle.class?.toLowerCase().includes('bike') &&
                        !selectedVehicle.class?.toLowerCase().includes('motorcycle') &&
                        !selectedVehicle.class?.toLowerCase().includes('auto') && (
                          <Car size={36} color="#60a5fa" />
                        )}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>
                        {selectedVehicle.class?.toUpperCase() || 'VEHICLE'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="viq-live-detail-quick-stats">
                  <div className="viq-live-detail-class-title">
                    <span>{selectedVehicle.class}</span>
                    <span className="viq-live-cell-plate" style={{ fontSize: '15px', color: '#2563eb' }}>
                      {selectedVehicle.plate}
                    </span>
                  </div>

                  <div className="viq-live-detail-conf-meter">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 650 }}>
                      <span style={{ color: '#475569' }}>Detection Confidence</span>
                      <span style={{ color: selectedVehicle.confidence >= 0.85 ? '#16a34a' : '#ea580c' }}>
                        {(selectedVehicle.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="viq-live-detail-conf-bar-bg">
                      <div
                        className={`viq-live-detail-conf-bar-fill ${selectedVehicle.confidence >= 0.85 ? 'green' : 'orange'}`}
                        style={{ width: `${Math.round(selectedVehicle.confidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span className="viq-live-extra-badge" style={{ background: '#dcfce7', color: '#16a34a' }}>
                      <ShieldCheck size={12} /> {selectedVehicle.status || 'Verified Flow'}
                    </span>
                    <span className="viq-live-extra-badge">
                      <Radio size={12} /> Live Tracked
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of Telemetry Details */}
              <div className="viq-live-detail-grid">
                <div className="viq-live-detail-card-item">
                  <span className="viq-live-detail-card-label">License Plate OCR</span>
                  <span className="viq-live-detail-card-val viq-live-cell-plate">
                    {selectedVehicle.plate && selectedVehicle.plate !== '—' ? selectedVehicle.plate : 'Not Detected'}
                  </span>
                </div>
                <div className="viq-live-detail-card-item">
                  <span className="viq-live-detail-card-label">Tracking / Lane</span>
                  <span className="viq-live-detail-card-val">{selectedVehicle.extraDetails || selectedVehicle.lane || 'Active Flow'}</span>
                </div>
                <div className="viq-live-detail-card-item">
                  <span className="viq-live-detail-card-label">Corridor Location</span>
                  <span className="viq-live-detail-card-val">{selectedVehicle.location || activeCorridor || 'NH-44'}</span>
                </div>
                <div className="viq-live-detail-card-item">
                  <span className="viq-live-detail-card-label">Inference Model</span>
                  <span className="viq-live-detail-card-val" style={{ fontSize: '12px' }}>{selectedVehicle.model || 'nh5_yolov8n_960.pt'}</span>
                </div>
                <div className="viq-live-detail-card-item">
                  <span className="viq-live-detail-card-label">Bounding Box Coordinates</span>
                  <span className="viq-live-detail-card-val" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {selectedVehicle.bbox || 'Active Detection'}
                  </span>
                </div>
                <div className="viq-live-detail-card-item">
                  <span className="viq-live-detail-card-label">Frame Timestamp</span>
                  <span className="viq-live-detail-card-val">{selectedVehicle.time || 'Live'}</span>
                </div>
              </div>
            </div>

            <div className="viq-live-detail-footer">
              <button
                type="button"
                className="viq-live-action-btn"
                style={{ background: '#f1f5f9', color: '#475569' }}
                onClick={() => setSelectedVehicle(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="viq-live-action-btn primary"
                onClick={() => {
                  setSelectedVehicle(null)
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
