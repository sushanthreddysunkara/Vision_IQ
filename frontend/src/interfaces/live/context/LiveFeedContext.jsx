import React, { createContext, useContext, useMemo, useState } from 'react'
import {
  initialLiveTrafficRecords,
  liveCameras,
  liveIncidents,
  liveKnowledgeGraph,
  liveMaintenanceAssets,
  liveOntologyClasses,
  liveTollPlazas,
} from '../data/liveData'

const LiveFeedContext = createContext(null)

export function LiveFeedProvider({ children, excelRows = [], excelFileName = '' }) {
  const [liveRecords, setLiveRecords] = useState(initialLiveTrafficRecords)
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [cameras, setCameras] = useState(liveCameras)
  const [activeCameraId, setActiveCameraId] = useState('CAM-LIVE-01')

  // Video Upload & AI Model Inference State
  const [uploadedVideoFile, setUploadedVideoFile] = useState(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [activePredictions, setActivePredictions] = useState([])
  const [analyzedFrames, setAnalyzedFrames] = useState([])

  const handleUploadVideo = (file) => {
    if (!file) return
    if (uploadedVideoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedVideoUrl)
    }
    const url = URL.createObjectURL(file)
    setUploadedVideoFile(file)
    setUploadedVideoUrl(url)
    setLiveRecords([])
    setIsDemoMode(false)
    setIsAnalyzed(true)
    setIsAnalyzing(false)
    setAnalysisProgress(0)
    setActivePredictions([])
    setAnalyzedFrames([])
  }

  const handleSetSampleVideo = (url, sampleName = 'Sample Highway Feed') => {
    if (uploadedVideoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedVideoUrl)
    }
    setUploadedVideoFile({ name: sampleName, size: 14200000 })
    setUploadedVideoUrl(url)
    setLiveRecords([])
    setIsDemoMode(false)
    setIsAnalyzed(true)
    setIsAnalyzing(false)
    setAnalysisProgress(0)
    setActivePredictions([])
    setAnalyzedFrames([])
  }

  const clearUploadedVideo = () => {
    if (uploadedVideoUrl && uploadedVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedVideoUrl)
    }
    setUploadedVideoFile(null)
    setUploadedVideoUrl(null)
    setLiveRecords(initialLiveTrafficRecords)
    setIsDemoMode(true)
    setIsAnalyzed(false)
    setIsAnalyzing(false)
    setActivePredictions([])
    setAnalyzedFrames([])
  }

  // Ingest incoming frame detections from Live Video AI model
  const addDetectionEvent = (detection, meta = {}) => {
    const rawPlate = (detection.plate || '').trim()
    const isPlateValid = rawPlate && rawPlate !== '—' && rawPlate !== 'N/A' && rawPlate !== 'Not Recognized'
    const finalPlate = isPlateValid ? rawPlate : 'Not Recognized'
    const vehicleClass = detection.class || detection.type || 'Car'

    const newRecord = {
      id: `LIVE-DET-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      observationId: `LIVE-OBS-${detection.trackId || Date.now()}`,
      trackId: String(detection.trackId || 1),
      vehicleNumberPlate: finalPlate,
      numberPlate: finalPlate,
      isPlateRecognized: isPlateValid,
      type: vehicleClass,
      vehicleType: vehicleClass,
      confidence: typeof detection.confidence === 'number' ? detection.confidence : 0.92,
      speedKmph: detection.speed || Math.round(58 + ((Number(detection.trackId || 1) * 4) % 24)),
      speed: detection.speed || Math.round(58 + ((Number(detection.trackId || 1) * 4) % 24)),
      speedLimit: 80,
      lane: detection.lane || 'Lane 1',
      camera: meta.cameraId || activeCameraId,
      location: meta.corridor || 'NH-44 Toll Plaza (Km 42.8)',
      corridor: meta.corridor || 'NH-44 Bangalore-Hyderabad',
      time: detection.time || new Date().toLocaleTimeString('en-GB'),
      date: new Date().toISOString().split('T')[0],
      timestamp: `${new Date().toISOString().split('T')[0]} ${detection.time || new Date().toLocaleTimeString('en-GB')}`,
      tollAmount: vehicleClass === 'Truck' ? 285 : vehicleClass === 'Bus' ? 180 : vehicleClass === 'LCV' ? 140 : vehicleClass === 'Bike' ? 0 : 85,
      status: detection.violation ? `Violation: ${detection.violation}` : 'Normal Flow',
      violation: detection.violation || null,
      image: detection.image || null,
      vehicle_image_url: detection.image || null,
      isLiveRecord: true,
    }

    setLiveRecords((prev) => [newRecord, ...prev.slice(0, 499)])
  }

  const clearLiveRecords = () => {
    setLiveRecords([])
  }

  const resetToDemoData = () => {
    setLiveRecords(initialLiveTrafficRecords)
    setIsDemoMode(true)
    clearUploadedVideo()
  }

  // Live Aggregate Statistics
  const stats = useMemo(() => {
    const total = liveRecords.length
    const byType = {}
    let unrecognizedCount = 0
    let totalSpeed = 0

    for (const r of liveRecords) {
      const t = r.type || r.vehicleType || 'Car'
      byType[t] = (byType[t] || 0) + 1
      if (!r.isPlateRecognized || r.vehicleNumberPlate === 'Not Recognized') {
        unrecognizedCount += 1
      }
      totalSpeed += Number(r.speedKmph || 65)
    }

    const avgSpeed = total > 0 ? Math.round(totalSpeed / total) : 68
    const recognizedCount = total - unrecognizedCount
    const recognitionRate = total > 0 ? Math.round((recognizedCount / total) * 100) : 0

    return {
      total,
      byType,
      avgSpeed,
      unrecognizedCount,
      recognizedCount,
      recognitionRate,
      activeCamerasCount: cameras.filter((c) => c.status === 'ACTIVE').length,
    }
  }, [liveRecords, cameras])

  const value = {
    liveRecords,
    setLiveRecords,
    isDemoMode,
    setIsDemoMode,
    cameras,
    setCameras,
    activeCameraId,
    setActiveCameraId,
    addDetectionEvent,
    clearLiveRecords,
    resetToDemoData,
    stats,
    tollPlazas: liveTollPlazas,
    incidents: liveIncidents,
    maintenanceAssets: liveMaintenanceAssets,
    knowledgeGraph: liveKnowledgeGraph,
    ontologyClasses: liveOntologyClasses,
    excelRows,
    excelFileName,
    // Video Upload & AI Model Prediction
    uploadedVideoFile,
    uploadedVideoUrl,
    isAnalyzing,
    isAnalyzed,
    analysisProgress,
    activePredictions,
    analyzedFrames,
    handleUploadVideo,
    handleSetSampleVideo,
    clearUploadedVideo,
  }

  return <LiveFeedContext.Provider value={value}>{children}</LiveFeedContext.Provider>
}

export function useLiveFeed() {
  const context = useContext(LiveFeedContext)
  if (!context) {
    throw new Error('useLiveFeed must be used within a LiveFeedProvider')
  }
  return context
}
