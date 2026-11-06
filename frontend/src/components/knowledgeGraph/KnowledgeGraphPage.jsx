import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import cytoscape from 'cytoscape'
import {
  Activity,
  AlertTriangle,
  Camera,
  Car,
  Check,
  ChevronDown,
  Compass,
  Eye,
  EyeOff,
  Filter,
  Info,
  Layers,
  Loader2,
  MapPin,
  Maximize,
  Minus,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Zap,
  X,
} from 'lucide-react'
import { getCanonicalVehicleDomain, getVehicleMeta, isVehicleTypeMatch } from '../../data/vehicleTypes'
import MediaPreviewModal from '../MediaPreviewModal'

const QueryPage = lazy(() => import('../QueryPage'))

// Centralized Node Styling Tokens for Light Enterprise UI
export const NODE_STYLES = {
  Entity: { color: '#0284c7', bg: '#e0f2fe', border: '#0284c7', shadow: 'rgba(2, 132, 199, 0.22)' },
  OntologyClass: { color: '#7c3aed', bg: '#f3e8ff', border: '#7c3aed', shadow: 'rgba(124, 58, 237, 0.22)' },
  DataProperty: { color: '#ea580c', bg: '#ffedd5', border: '#ea580c', shadow: 'rgba(234, 88, 12, 0.22)' },
  Datatype: { color: '#db2777', bg: '#fce7f3', border: '#db2777', shadow: 'rgba(219, 39, 119, 0.22)' },
  ObjectProperty: { color: '#d97706', bg: '#fef3c7', border: '#d97706', shadow: 'rgba(217, 119, 6, 0.22)' },
  Ontology: { color: '#4338ca', bg: '#e0e7ff', border: '#4338ca', shadow: 'rgba(67, 56, 202, 0.22)' },
  OperationalStatus: { color: '#16a34a', bg: '#dcfce7', border: '#16a34a', shadow: 'rgba(22, 163, 74, 0.22)' },
  Observation: { color: '#2563eb', bg: '#eff6ff', border: '#2563eb', shadow: 'rgba(37, 99, 235, 0.22)' },
  Camera: { color: '#059669', bg: '#ecfdf5', border: '#059669', shadow: 'rgba(5, 150, 105, 0.22)' },
  Location: { color: '#0d9488', bg: '#ccfbf1', border: '#0d9488', shadow: 'rgba(13, 148, 136, 0.22)' },
  Violation: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', shadow: 'rgba(220, 38, 38, 0.22)' },
  Signal: { color: '#d97706', bg: '#fef3c7', border: '#d97706', shadow: 'rgba(217, 119, 6, 0.22)' },
  VehicleType: { color: '#8b5cf6', bg: '#f5f3ff', border: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.22)' },
}

export function getNodeColorMeta(category, vehicleType) {
  if (vehicleType) {
    const meta = getVehicleMeta(vehicleType)
    if (meta && meta.color) {
      return {
        color: meta.color,
        bg: meta.bg || '#eff6ff',
        border: meta.color,
        shadow: `${meta.color}40`,
      }
    }
  }
  return NODE_STYLES[category] || NODE_STYLES.Entity
}

export function separateOverlappingNodes(cy) {
  if (!cy || typeof cy.nodes !== 'function') return
  const nodes = cy.nodes()
  if (!nodes || nodes.length < 2) return

  for (let pass = 0; pass < 15; pass++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i]
      const pos1 = n1.position()
      const w1 = n1.outerWidth() || 50

      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j]
        const pos2 = n2.position()
        const w2 = n2.outerWidth() || 50

        const minDist = (w1 + w2) / 2 + 45
        let dx = pos2.x - pos1.x
        let dy = pos2.y - pos1.y
        let dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < minDist) {
          moved = true
          if (dist < 0.001) {
            dx = (Math.random() - 0.5) || 1
            dy = (Math.random() - 0.5) || 1
            dist = Math.sqrt(dx * dx + dy * dy)
          }
          const overlap = minDist - dist
          const moveX = (dx / dist) * (overlap / 2)
          const moveY = (dy / dist) * (overlap / 2)

          n1.position({ x: pos1.x - moveX, y: pos1.y - moveY })
          n2.position({ x: pos2.x + moveX, y: pos2.y + moveY })
        }
      }
    }
    if (!moved) break
  }
}

export default function KnowledgeGraphPage({
  rows = [],
  fileName = 'Active Dataset',
  hideFilters = false,
  isQueryEmbedded = false,
  initialTab = 'graph',
  isLiveFeed = false,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const shouldHideFilters = hideFilters || isQueryEmbedded

  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === 'query') return 'query'
    if (location.pathname === '/query') return 'query'
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('tab') === 'query' || location.state?.tab === 'query') return 'query'
    return 'graph'
  })

  useEffect(() => {
    if (location.pathname === '/query' || initialTab === 'query') {
      setActiveTab('query')
      return
    }
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('tab') === 'query' || location.state?.tab === 'query') {
      setActiveTab('query')
    } else if (
      location.pathname === '/knowledge-graph' ||
      searchParams.get('tab') === 'graph' ||
      location.state?.tab === 'graph' ||
      location.state?.camera ||
      location.state?.vehicle
    ) {
      setActiveTab('graph')
    }
  }, [location.pathname, location.search, location.state, initialTab])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      if (cyRef.current && typeof cyRef.current.resize === 'function') {
        try {
          cyRef.current.resize()
        } catch {
          // ignore
        }
      }
    })
    ro.observe(containerRef.current)
    const handleWinResize = () => {
      if (cyRef.current && typeof cyRef.current.resize === 'function') {
        try {
          cyRef.current.resize()
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('resize', handleWinResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', handleWinResize)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'graph' && cyRef.current) {
      const timer = setTimeout(() => {
        try {
          cyRef.current?.resize()
          cyRef.current?.fit(null, 60)
        } catch {
          // ignore
        }
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'query') {
      navigate('/query', { replace: true })
    } else {
      navigate('/knowledge-graph', { replace: true })
    }
  }

  const [segmentFilter, setSegmentFilter] = useState(() => location.state?.queryFilter || null)
  const [segmentExplanation, setSegmentExplanation] = useState(() => location.state?.explanation || '')

  // Primary Modes: 'ALL' | 'VEHICLE' | 'CAMERA'
  const [focusMode, setFocusMode] = useState('ALL')
  const [frozenVehicle, setFrozenVehicle] = useState(null)
  const [focusedCamera, setFocusedCamera] = useState(null)
  const [liveDetectionCount, setLiveDetectionCount] = useState(0)
  const [latestLiveAlert, setLatestLiveAlert] = useState(null)
  const [autoStreamActive, setAutoStreamActive] = useState(false)
  const [layoutMode, setLayoutMode] = useState('cose') // 'cose' | 'concentric' | 'circle' | 'grid'

  const [dynamicExtraByType, setDynamicExtraByType] = useState({})

  useEffect(() => {
    setDynamicExtraByType({})
  }, [focusedCamera, focusMode])

  const renderedObsIdsRef = useRef(new Set())
  const firstNeighborsRef = useRef(new Set())

  // Dynamic active rows based on filters
  const activeRows = useMemo(() => {
    if (!segmentFilter) return rows
    return rows.filter((r) => {
      if (segmentFilter.vehicleTypes || segmentFilter.vehicleType) {
        const rawTypes = []
        if (Array.isArray(segmentFilter.vehicleTypes)) rawTypes.push(...segmentFilter.vehicleTypes)
        if (Array.isArray(segmentFilter.vehicleType)) rawTypes.push(...segmentFilter.vehicleType)
        else if (typeof segmentFilter.vehicleType === 'string') rawTypes.push(segmentFilter.vehicleType)
        if (rawTypes.length) {
          const matchType = rawTypes.some((t) => isVehicleTypeMatch(r.vehicleType || r.type, t))
          if (!matchType) return false
        }
      }
      if (segmentFilter.location) {
        const loc = (r.roadName || r.location || '').toLowerCase().trim()
        const target = String(Array.isArray(segmentFilter.location) ? segmentFilter.location[0] : segmentFilter.location).toLowerCase().trim()
        if (target && !loc.includes(target) && !target.includes(loc)) {
          const targetWords = target.split(/\s+/).filter((w) => w.length > 2)
          if (!targetWords.some((w) => loc.includes(w))) return false
        }
      }
      if (segmentFilter.camera) {
        const cam = String(r.camera || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const targetCam = String(Array.isArray(segmentFilter.camera) ? segmentFilter.camera[0] : segmentFilter.camera).toLowerCase().replace(/[^a-z0-9]/g, '')
        if (cam && targetCam && !cam.includes(targetCam) && !targetCam.includes(cam)) return false
      }
      if (segmentFilter.signalState && (r.signalState || '').toLowerCase() !== String(segmentFilter.signalState).toLowerCase()) return false
      if (segmentFilter.weather && !(r.weather || '').toLowerCase().includes(String(segmentFilter.weather).toLowerCase())) return false
      if (segmentFilter.overspeedOnly && !(r.overSpeed === 'Yes' || r.isOverSpeed || (r.speed && r.speedLimit && r.speed > r.speedLimit))) return false
      if (segmentFilter.minSpeed !== null && segmentFilter.minSpeed !== undefined && (r.speed || 0) < Number(segmentFilter.minSpeed)) return false
      if (segmentFilter.maxSpeed !== null && segmentFilter.maxSpeed !== undefined && (r.speed || 0) > Number(segmentFilter.maxSpeed)) return false
      if (segmentFilter.plateSearch) {
        const plate = (r.numberPlate || r.vehicleNumberPlate || '').toUpperCase()
        if (!plate.includes(String(segmentFilter.plateSearch).toUpperCase())) return false
      }
      return true
    })
  }, [rows, segmentFilter])

  useEffect(() => {
    renderedObsIdsRef.current = new Set()
  }, [focusedCamera])

  const [isLayersOpen, setIsLayersOpen] = useState(false)
  const [recordLimit, setRecordLimit] = useState(isLiveFeed ? 50 : 350)

  // Controls & Options State
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [selectedNode, setSelectedNode] = useState(null)
  const [previewModalRow, setPreviewModalRow] = useState(null)

  const [showLabels, setShowLabels] = useState(true)
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)
  const [hiddenCategorySet, setHiddenCategorySet] = useState(new Set())
  const [zoomPercent, setZoomPercent] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const pinnedNodeRef = useRef(null)

  // Camera list
  const allCameras = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.camera).filter(Boolean)))
  }, [rows])

  // Search auto-suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return { cameras: [], vehicles: [] }
    const qNorm = q.replace(/[^a-z0-9]/g, '')

    const matchedCameras = allCameras
      .filter((cam) => {
        const cLower = cam.toLowerCase()
        const cNorm = cLower.replace(/[^a-z0-9]/g, '')
        if (cLower.includes(q)) return true
        if (qNorm.length >= 2 && (cNorm.includes(qNorm) || qNorm.includes(cNorm))) return true
        return false
      })
      .slice(0, 5)

    const matchedVehicles = rows
      .filter((r) => {
        const plate = (r.numberPlate || r.vehicleNumberPlate || '').toLowerCase()
        const id = String(r.observationId || r.id || '').toLowerCase()
        return plate.includes(q) || id.includes(q)
      })
      .slice(0, 5)

    return { cameras: matchedCameras, vehicles: matchedVehicles }
  }, [searchTerm, allCameras, rows])

  function handleSelectVehicle(vehicleRow) {
    if (!vehicleRow) return
    const plate = vehicleRow.numberPlate || vehicleRow.vehicleNumberPlate || vehicleRow.observationId || vehicleRow.id
    setFocusMode('VEHICLE')
    setFrozenVehicle(vehicleRow)
    setFocusedCamera(null)
    setSearchTerm('')
    setShowSuggestions(false)

    const domain = getCanonicalVehicleDomain(vehicleRow.vehicleType || vehicleRow.type)
    const meta = getVehicleMeta(domain)
    setSelectedNode({
      id: vehicleRow.observationId ? `obs-${vehicleRow.observationId}` : `obs-${vehicleRow.id || plate}`,
      label: plate,
      category: 'Observation',
      vehicleType: domain,
      color: meta.color,
      image: vehicleRow.extractedImage || vehicleRow.vehicleImageDataUrl,
      hasExtractedImage: vehicleRow.hasExtractedImage,
      rawRow: vehicleRow,
      properties: {
        'Number Plate': plate,
        'Vehicle Domain': domain,
        'Timestamp (IST)': vehicleRow.timestampIst || vehicleRow.timestamp || 'N/A',
        'Captured By': vehicleRow.camera || 'N/A',
        'Location': vehicleRow.location || vehicleRow.roadName || 'N/A',
        'Speed (km/h)': `${vehicleRow.speed || 0} km/h`,
        'Speed Limit': `${vehicleRow.speedLimit || 60} km/h`,
        'Violation Status': vehicleRow.overSpeed || (Number(vehicleRow.speed) > Number(vehicleRow.speedLimit || 60) ? 'Overspeeding' : 'Compliant'),
      },
    })
  }

  function handleSelectCamera(camId) {
    if (!camId) return
    setFocusMode('CAMERA')
    setFocusedCamera(camId)
    setAutoStreamActive(true)
    setFrozenVehicle(null)
    setSearchTerm('')
    setShowSuggestions(false)
    const currentCamRows = activeRows.filter((r) => r.camera === camId)
    setLiveDetectionCount(currentCamRows.length)

    setSelectedNode({
      id: `cam-${camId}`,
      label: camId,
      category: 'Camera',
      color: '#059669',
      properties: {
        'Camera ID': camId,
        'Operational Status': '🟢 Live Telemetry Stream Active',
        'Assigned Location': currentCamRows[0]?.location || currentCamRows[0]?.roadName || 'Monitored Corridor',
        'Total Ingested Detections': currentCamRows.length,
      },
    })
  }

  function handleExitFocusMode() {
    setFocusMode('ALL')
    setFrozenVehicle(null)
    setFocusedCamera(null)
    setAutoStreamActive(false)
    setLatestLiveAlert(null)
    setSelectedNode(null)
  }

  useEffect(() => {
    if (location.state?.camera) {
      handleSelectCamera(location.state.camera)
    } else if (location.state?.queryFilter?.camera) {
      const cam = Array.isArray(location.state.queryFilter.camera)
        ? location.state.queryFilter.camera[0]
        : location.state.queryFilter.camera
      if (cam) handleSelectCamera(cam)
    } else if (location.state?.vehicle) {
      handleSelectVehicle(location.state.vehicle)
    }
  }, [location.state])

  // Construct Graph Elements (Direct Pure Graph without clusters)
  const { currentNodes, currentEdges } = useMemo(() => {
    let edgeIndex = 1

    if (focusMode === 'VEHICLE' && frozenVehicle) {
      const v = frozenVehicle
      const obsId = v.observationId ? `obs-${v.observationId}` : `obs-${v.id || v.numberPlate}`
      const obsLabel = v.numberPlate && v.numberPlate !== 'N/A' ? v.numberPlate : (v.observationId || 'Vehicle')
      const domain = getCanonicalVehicleDomain(v.vehicleType || v.type)
      const meta = getVehicleMeta(domain)
      const loc = v.location || v.roadName || 'Monitored Corridor'
      const cam = v.camera || 'Surveillance Unit'
      const isOverSpeed = v.isOverSpeed || v.overSpeed === 'Yes' || (Number(v.speed) > Number(v.speedLimit || 60))

      const nodes = [
        {
          id: obsId,
          label: obsLabel,
          category: 'Observation',
          vehicleType: domain,
          color: meta.color,
          isCenter: true,
          image: v.extractedImage || v.vehicleImageDataUrl,
          hasExtractedImage: v.hasExtractedImage,
          rawRow: v,
          properties: {
            'Number Plate': obsLabel,
            'Vehicle Type': domain,
            'Captured By': cam,
            'Location': loc,
            'Speed': `${v.speed || 0} km/h`,
            'Speed Limit': `${v.speedLimit || 60} km/h`,
            'Violation': isOverSpeed ? '⚠️ Overspeed Violation' : 'Compliant',
            'Timestamp': v.timestampIst || v.timestamp || 'N/A',
          },
        },
        {
          id: `cam-${cam}`,
          label: `Camera: ${cam}`,
          category: 'Camera',
          color: '#059669',
          properties: { 'Camera ID': cam, 'Zone': loc },
        },
        {
          id: `loc-${loc}`,
          label: `Location: ${loc}`,
          category: 'Location',
          color: '#0d9488',
          properties: { 'Monitored Zone': loc },
        },
        {
          id: `type-${domain}`,
          label: `${domain} Domain`,
          category: 'VehicleType',
          vehicleType: domain,
          color: meta.color,
          properties: { 'Classification': domain },
        },
      ]

      const edges = [
        { id: `edge-${edgeIndex++}`, source: obsId, target: `cam-${cam}`, label: 'CAPTURED_BY', color: '#0284c7' },
        { id: `edge-${edgeIndex++}`, source: obsId, target: `loc-${loc}`, label: 'OCCURRED_AT', color: '#0d9488' },
        { id: `edge-${edgeIndex++}`, source: obsId, target: `type-${domain}`, label: 'OF_TYPE', color: meta.color },
        { id: `edge-${edgeIndex++}`, source: `cam-${cam}`, target: `loc-${loc}`, label: 'MONITORS', color: '#94a3b8' },
      ]

      if (isOverSpeed) {
        nodes.push({
          id: 'violation-overspeed',
          label: `Overspeed (${v.speed} km/h)`,
          category: 'Violation',
          color: '#dc2626',
          properties: { 'Violation': 'Speed Exceeded', 'Speed': `${v.speed} km/h` },
        })
        edges.push({ id: `edge-${edgeIndex++}`, source: obsId, target: 'violation-overspeed', label: 'TRIGGERED', color: '#dc2626' })
      }

      return { currentNodes: nodes, currentEdges: edges }
    }

    if (!activeRows || !activeRows.length) {
      return { currentNodes: [], currentEdges: [] }
    }

    const standardDomains = ['Car', 'Bike', 'Truck', 'Auto', 'Van', 'Bus']
    const rowDomains = Array.from(new Set(activeRows.map((r) => getCanonicalVehicleDomain(r.vehicleType || r.type)).filter(Boolean)))
    const domains = Array.from(new Set([...standardDomains, ...rowDomains]))
    const cameras = Array.from(new Set(activeRows.map((r) => r.camera).filter(Boolean)))
    if (focusMode === 'CAMERA' && focusedCamera && !cameras.includes(focusedCamera)) {
      cameras.push(focusedCamera)
    }
    const locations = Array.from(new Set(activeRows.map((r) => r.location || r.roadName).filter(Boolean)))
    if (locations.length === 0) locations.push('Monitored Corridor')

    const nodes = []
    const edges = []

    // Helper: Determine if camera / location belongs to South highway cluster or North/urban galaxy
    const isSouthCorridor = (camName = '', locName = '') => {
      const text = `${camName} ${locName}`.toLowerCase()
      return (
        text.includes('001') ||
        text.includes('002') ||
        text.includes('005') ||
        text.includes('hyd-001') ||
        text.includes('shamshabad') ||
        text.includes('shadnagar') ||
        text.includes('jadcherla') ||
        text.includes('airport') ||
        text.includes('main road') ||
        text.includes('south')
      )
    }

    // Color palettes matching reference photo:
    // Left cluster: rich terracotta, rust red, wine, dark orange
    const southPalette = ['#b91c1c', '#c2410c', '#dc2626', '#991b1b', '#ea580c', '#d97706', '#a16207', '#b45309']
    // Right cluster: warm coral, peach, apricot, tangerine
    const northPalette = ['#f97316', '#fb923c', '#ea580c', '#f59e0b', '#fdba74', '#fb7185', '#e11d48', '#f43f5e']

    // 1. Location Hubs
    locations.forEach((loc) => {
      nodes.push({
        id: `loc-${loc}`,
        label: loc,
        category: 'Location',
        isHub: true,
        color: '#8b5cf6', // Violet/purple hub matching photo
        properties: { 'Monitored Corridor': loc },
      })
    })

    // 2. Camera Hubs (Teal/Cyan hubs matching photo)
    cameras.forEach((cam) => {
      const camRows = activeRows.filter((r) => r.camera === cam)
      const loc = camRows[0]?.location || camRows[0]?.roadName || locations[0]
      const isFocused = focusMode === 'CAMERA' && focusedCamera === cam
      const isSouth = isSouthCorridor(cam, loc)
      nodes.push({
        id: `cam-${cam}`,
        label: cam,
        category: 'Camera',
        zone: isSouth ? 'South' : 'North',
        isHub: true,
        color: isFocused ? '#059669' : isSouth ? '#0d9488' : '#06b6d4',
        isCenter: isFocused,
        properties: {
          'Camera ID': cam,
          'Corridor Zone': isSouth ? 'South Highway Corridor' : 'North Urban Corridor',
          'Ingested Detections': camRows.length,
        },
      })
      if (loc) {
        edges.push({
          id: `edge-${edgeIndex++}`,
          source: `cam-${cam}`,
          target: `loc-${loc}`,
          label: 'MONITORS',
          isInterCluster: true,
          color: '#cbd5e1',
        })
      }
    })

    // 3. Vehicle Type Classification Hubs
    domains.forEach((domain) => {
      const meta = getVehicleMeta(domain)
      nodes.push({
        id: `type-${domain}`,
        label: domain,
        category: 'VehicleType',
        vehicleType: domain,
        isHub: true,
        color: meta.color,
        properties: { 'Vehicle Domain': domain },
      })
    })

    // 4. Target Rows (Constellation Slice)
    let hasViolation = false
    const limitNum = recordLimit === 'ALL' ? activeRows.length : Math.max(50, Number(recordLimit) || 350)
    const targetRows = isLiveFeed
      ? activeRows.slice(-Math.min(limitNum, activeRows.length))
      : activeRows.slice(0, Math.min(limitNum, activeRows.length))

    targetRows.forEach((row, i) => {
      const obsId = row.observationId ? `obs-${row.observationId}` : `obs-${row.id || i + 1}`
      const obsLabel = (row.numberPlate && row.numberPlate !== 'N/A' && row.numberPlate !== 'Unknown')
        ? row.numberPlate
        : (row.observationId || row.id || `Record #${i + 1}`)
      const loc = row.location || row.roadName
      const domain = getCanonicalVehicleDomain(row.vehicleType || row.type)
      const isOver = row.overSpeed === 'Yes'
        || row.isOverSpeed
        || (isLiveFeed && Boolean(row.violation))
        || (row.speed && row.speedLimit && Number(row.speed) > Number(row.speedLimit))
      if (isOver) hasViolation = true

      const isSouth = isSouthCorridor(row.camera, loc)
      const palette = isSouth ? southPalette : northPalette
      const color = palette[i % palette.length]

      nodes.push({
        id: obsId,
        label: obsLabel,
        category: 'Observation',
        vehicleType: domain,
        color: color,
        isHub: false,
        image: row.extractedImage || row.vehicleImageDataUrl,
        hasExtractedImage: row.hasExtractedImage,
        rawRow: row,
        properties: {
          'Number Plate': obsLabel,
          'Vehicle Type': domain,
          'Captured By': row.camera || 'N/A',
          'Location': loc || 'N/A',
          'Speed': `${row.speed || 0} km/h`,
          'Timestamp': row.timestampIst || row.timestamp || 'N/A',
          'Violation Status': isOver ? '⚠️ Overspeed Violation' : 'Compliant',
        },
      })

      // Primary edge: tightly anchors observation to its camera hub (intra-cluster)
      if (row.camera && cameras.includes(row.camera)) {
        edges.push({
          id: `edge-${edgeIndex++}`,
          source: obsId,
          target: `cam-${row.camera}`,
          label: 'CAPTURED_BY',
          isInterCluster: false,
          color: '#94a3b8',
        })
      }

      // Secondary edge: ~25% connect to vehicle type domain to form classification spokes
      if (i % 4 === 0) {
        edges.push({
          id: `edge-${edgeIndex++}`,
          source: obsId,
          target: `type-${domain}`,
          label: 'OF_TYPE',
          isInterCluster: false,
          color: '#cbd5e1',
        })
      }

      // If overspeed, link to violation hub
      if (isOver) {
        edges.push({
          id: `edge-${edgeIndex++}`,
          source: obsId,
          target: 'violation-overspeed',
          label: 'TRIGGERED',
          isInterCluster: false,
          color: '#ec4899',
        })
      }
    })

    if (hasViolation) {
      nodes.push({
        id: 'violation-overspeed',
        label: 'Overspeed Violation',
        category: 'Violation',
        isHub: true,
        color: '#ec4899',
        properties: { 'Type': 'Speed Limit Exceeded' },
      })
    }

    // 5. Inter-cluster Transit Corridor Links (bridge the left and right clusters across the open gap)
    const transitCorridors = [
      ['CAM-001', 'CAM-002'],
      ['CAM-002', 'CAM-005'],
      ['CAM-005', 'CAM-008'], // Cross-corridor highway bridge connecting South and North
      ['CAM-004', 'CAM-006'],
      ['CAM-006', 'CAM-009'],
      ['CAM-008', 'CAM-012'],
      ['CAM-HYD-001-N', 'CAM-001'],
    ]
    transitCorridors.forEach(([c1, c2]) => {
      if (cameras.includes(c1) && cameras.includes(c2)) {
        edges.push({
          id: `edge-${edgeIndex++}`,
          source: `cam-${c1}`,
          target: `cam-${c2}`,
          label: 'TRANSIT_LINK',
          isInterCluster: true,
          color: '#94a3b8',
        })
      }
    })

    return { currentNodes: nodes, currentEdges: edges }
  }, [activeRows, focusMode, frozenVehicle, focusedCamera, recordLimit, isLiveFeed])

  const visibleNodes = useMemo(() => {
    if (focusMode === 'VEHICLE') return currentNodes

    const baseNodes = currentNodes

    return baseNodes.filter((node) => {
      const matchCat = activeCategory === 'ALL' || node.category === activeCategory
      const searchLower = searchTerm.toLowerCase()
      const matchSearch =
        !searchTerm ||
        node.label.toLowerCase().includes(searchLower) ||
        node.category.toLowerCase().includes(searchLower)

      return matchCat && matchSearch
    })
  }, [currentNodes, focusMode, activeCategory, searchTerm])

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])
  const visibleEdges = useMemo(() => {
    return currentEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
  }, [currentEdges, visibleNodeIds])

  // Compute node degrees for dynamic size hierarchy
  const nodeDegreeMap = useMemo(() => {
    const map = new Map()
    visibleEdges.forEach((e) => {
      map.set(e.source, (map.get(e.source) || 0) + 1)
      map.set(e.target, (map.get(e.target) || 0) + 1)
    })
    return map
  }, [visibleEdges])

  // Dynamic Category stats for left sidebar toggle panel
  const dynamicCategories = useMemo(() => {
    const catMap = new Map()
    visibleNodes.forEach((n) => {
      const key = n.vehicleType ? `${n.vehicleType}` : n.category
      if (key) {
        const meta = getNodeColorMeta(n.category, n.vehicleType)
        const existing = catMap.get(key) || { key, category: n.category, vehicleType: n.vehicleType, count: 0, color: meta.color, bg: meta.bg }
        existing.count += 1
        catMap.set(key, existing)
      }
    })
    return Array.from(catMap.values()).sort((a, b) => b.count - a.count)
  }, [visibleNodes])

  // Layout Configuration
  const layoutConfig = useMemo(() => {
    if (layoutMode === 'concentric' || focusMode === 'VEHICLE') {
      return {
        name: 'concentric',
        concentric: (node) => (node.data('isCenter') ? 2 : 1),
        levelWidth: () => 1,
        minNodeSpacing: 220,
        padding: 90,
        animate: true,
        animationDuration: 600,
      }
    }
    if (layoutMode === 'circle') {
      return { name: 'circle', padding: 90, animate: true, animationDuration: 600 }
    }
    if (layoutMode === 'grid') {
      return { name: 'grid', padding: 90, animate: true, animationDuration: 600 }
    }

    // Default: Force-Directed COSE with tight celestial clusters and bridge links
    return {
      name: 'cose',
      animate: true,
      animationDuration: isLiveFeed ? 350 : 750,
      randomize: false,
      padding: 50,
      componentSpacing: 140,
      nodeRepulsion: (node) => (node.data('isHub') ? 9500 : 2800),
      idealEdgeLength: (edge) => (edge.data('isInterCluster') ? 260 : 42),
      edgeElasticity: (edge) => (edge.data('isInterCluster') ? 18 : 65),
      nestingFactor: 1.2,
      gravity: 0.22,
      numIter: isLiveFeed ? 240 : 1200,
      initialTemp: isLiveFeed ? 120 : 250,
      coolingFactor: 0.95,
      stop: () => {
        if (cyRef.current && typeof cyRef.current.nodes === 'function') {
          cyRef.current.nodes().forEach((n) => {
            const p = n.position()
            n.scratch('_basePos', { x: p.x, y: p.y, phase: Math.random() * Math.PI * 2 })
          })
          cyRef.current.animate({
            fit: { eles: cyRef.current.elements(), padding: 60 },
            duration: 350,
          })
        }
      },
    }
  }, [focusMode, layoutMode, isLiveFeed])

  // Cytoscape Canvas Initialization
  useEffect(() => {
    if (!containerRef.current) return

    const elements = [
      ...visibleNodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          category: n.category,
          color: n.color,
          vehicleType: n.vehicleType || '',
          isCenter: n.isCenter || false,
          isHub: n.isHub || false,
        },
      })),
      ...visibleEdges.map((e) => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          color: e.color || '#94a3b8',
          isInterCluster: e.isInterCluster || false,
        },
      })),
    ]

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.01,
      maxZoom: 3.5,
      wheelSensitivity: 0.15,
      layout: layoutConfig,
      style: [
        // ─── PURE SOLID CIRCULAR BEADS ─────────────────────────────────
        {
          selector: 'node',
          style: {
            shape: 'ellipse',
            width: (node) => {
              if (node.data('isCenter')) return 26
              if (node.data('isHub')) return 22
              return 9.5
            },
            height: (node) => {
              if (node.data('isCenter')) return 26
              if (node.data('isHub')) return 22
              return 9.5
            },
            'background-color': (node) => node.data('color') || '#e05638',
            'border-width': (node) => (node.data('isHub') ? 2.5 : 0),
            'border-color': '#ffffff',
            'border-opacity': 0.95,
            label: (node) => {
              if (node.hasClass('node-active') || node.hasClass('node-hovered')) return node.data('label')
              if (showLabels && (node.data('isHub') || node.data('isCenter'))) return node.data('label')
              return ''
            },
            color: '#1e293b',
            'font-size': 8.5,
            'font-weight': 600,
            'font-family': 'Inter, system-ui, -apple-system, sans-serif',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'text-wrap': 'nowrap',
            'text-background-opacity': 0.85,
            'text-background-color': '#ffffff',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#e2e8f0',
          },
        },
        // ─── DELICATE SPIDERWEB THREAD EDGES (WAVY THREAD UNDERWATER AESTHETIC) ────────
        {
          selector: 'edge',
          style: {
            width: 0.85,
            'line-color': '#94a3b8',
            opacity: 0.38,
            'curve-style': 'unbundled-bezier',
            'control-point-distances': [14],
            'control-point-weights': [0.5],
            'target-arrow-shape': 'none',
            label: (edge) => (showEdgeLabels && edge.data('isInterCluster') ? edge.data('label') : ''),
            color: '#64748b',
            'font-size': 7.5,
            'font-weight': 600,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
            'text-background-padding': '1px',
            'text-background-shape': 'roundrectangle',
          },
        },
        // ─── Hovered Node Style ──────────────────────────────────────────
        {
          selector: 'node.node-hovered',
          style: {
            opacity: 1,
            'border-width': 3.5,
            'border-color': '#0284c7',
            'underlay-color': '#0284c7',
            'underlay-padding': 8,
            'underlay-opacity': 0.3,
            'z-index': 9999,
            label: (node) => node.data('label'),
          },
        },
        // ─── Hovered Connected Edges ─────────────────────────────────────
        {
          selector: 'edge.edge-hovered',
          style: {
            width: 2.5,
            opacity: 0.95,
            'line-color': '#0284c7',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#0284c7',
            'arrow-scale': 0.6,
            'z-index': 9998,
          },
        },
        // ─── Neighbor Highlighted ─────────────────────────────────────────
        {
          selector: 'node.neighbor-hovered',
          style: {
            opacity: 1,
            'border-width': 2.5,
            'border-color': '#0284c7',
            label: (node) => node.data('label'),
            'z-index': 9997,
          },
        },
        // ─── Active Click-Selected Node ──────────────────────────────────
        {
          selector: 'node.node-active',
          style: {
            opacity: 1,
            'border-width': 4.0,
            'border-color': '#0284c7',
            'underlay-color': '#0284c7',
            'underlay-padding': 10,
            'underlay-opacity': 0.35,
            'z-index': 9999,
            label: (node) => node.data('label'),
          },
        },
        // ─── Dimmed State ────────────────────────────────────────────────
        {
          selector: '.dimmed',
          style: {
            opacity: 0.12,
          },
        },
        {
          selector: '.hidden-category',
          style: { display: 'none' },
        },
      ],
    })

    // ─── AMBIENT WATER WAVE FLOATING & FLUID DRAG ANIMATION ───────────
    let animId = null
    let angle = 0
    let draggedNode = null
    let dragStartPos = null
    let isDragging = false
    let dragVelocity = { x: 0, y: 0 }
    let connectedNodeMap = null // Map<nodeId, { node, depth, targetPos: {x,y} }>

    function floatNodesLikeWater() {
      angle += 0.035
      if (cyRef.current && typeof cyRef.current.batch === 'function') {
        try {
          if (!cyRef.current.destroyed || !cyRef.current.destroyed()) {
            cyRef.current.batch(() => {
              // 1. FLUID DRAGGING PHYSICS: Lerp connected nodes with liquid inertia lag
              if (isDragging && connectedNodeMap) {
                const speed = Math.sqrt(dragVelocity.x * dragVelocity.x + dragVelocity.y * dragVelocity.y)
                connectedNodeMap.forEach((entry) => {
                  const { node, depth, targetPos } = entry
                  const p = node.position()

                  // Lerp factor decreases with depth -> realistic fluid drag inertia / underwater rope lag
                  const lerpFactor = Math.max(0.12, 0.38 * Math.pow(0.72, depth - 1))
                  const nextX = p.x + (targetPos.x - p.x) * lerpFactor
                  const nextY = p.y + (targetPos.y - p.y) * lerpFactor

                  // Dynamic lateral water ripple wake created by moving through liquid
                  const ripple = Math.sin(angle * 4.2 + depth * 1.4) * Math.min(speed * 0.7, 8)
                  const rippleY = Math.cos(angle * 3.6 + depth * 1.4) * Math.min(speed * 0.7, 8)

                  node.position({ x: nextX + ripple, y: nextY + rippleY })
                  node.scratch('_basePos', { x: targetPos.x, y: targetPos.y, phase: node.scratch('_basePos')?.phase || 0 })
                })
                // Gradually dampen drag velocity vector
                dragVelocity.x *= 0.8
                dragVelocity.y *= 0.8
              }

              // 2. AMBIENT WATER BOBBING: Floating un-dragged nodes like objects in calm water
              cyRef.current.nodes().forEach((node) => {
                if (node === draggedNode) return
                if (isDragging && connectedNodeMap && connectedNodeMap.has(node.id())) return

                let base = node.scratch('_basePos')
                if (!base) {
                  const p = node.position()
                  base = { x: p.x, y: p.y, phase: Math.random() * Math.PI * 2 }
                  node.scratch('_basePos', base)
                }
                const dx = Math.sin(angle + base.phase) * 3.2
                const dy = Math.cos(angle * 0.75 + base.phase * 1.3) * 4.0
                node.position({ x: base.x + dx, y: base.y + dy })
              })

              // 3. WAVY THREAD LINES: Oscillating silk thread links under water tension
              const threadAmp = isDragging ? 32 : 16
              cyRef.current.edges().forEach((edge) => {
                let phase = edge.scratch('_edgePhase')
                if (phase === undefined) {
                  phase = Math.random() * Math.PI * 2
                  edge.scratch('_edgePhase', phase)
                }
                const waveOffset = Math.sin(angle * 1.8 + phase) * threadAmp + Math.cos(angle * 1.1 + phase * 1.4) * (threadAmp * 0.6)
                edge.style('control-point-distances', [waveOffset])
              })
            })
          }
        } catch {
          // ignore batch error if destroyed
        }
      }
      animId = requestAnimationFrame(floatNodesLikeWater)
    }

    cy.ready(() => {
      cy.nodes().forEach((n) => {
        const p = n.position()
        n.scratch('_basePos', { x: p.x, y: p.y, phase: Math.random() * Math.PI * 2 })
      })
      cy.animate({
        fit: { eles: cy.elements(), padding: 60 },
        duration: 350,
      })
      setZoomPercent(Math.round(cy.zoom() * 100))
    if (!isLiveFeed) {
      animId = requestAnimationFrame(floatNodesLikeWater)
    }
    })

    cy.on('zoom pan', () => {
      if (cy && typeof cy.zoom === 'function') {
        setZoomPercent(Math.round(cy.zoom() * 100))
      }
    })

    // ─── SYNCHRONIZED LIQUID DRAGGING: WATER DRAG INERTIA & BFS RIPPLE ───
    cy.on('grab', 'node', (evt) => {
      draggedNode = evt.target
      dragStartPos = { ...draggedNode.position() }
      isDragging = true
      dragVelocity = { x: 0, y: 0 }

      // Breadth-First Search to find all connected nodes & initialize target positions
      connectedNodeMap = new Map()
      const queue = [{ node: draggedNode, depth: 0 }]
      const visited = new Set([draggedNode.id()])

      while (queue.length > 0) {
        const { node, depth } = queue.shift()
        if (depth > 0) {
          const p = node.position()
          connectedNodeMap.set(node.id(), {
            node,
            depth,
            targetPos: { x: p.x, y: p.y },
          })
        }
        const neighbors = node.neighborhood('node')
        neighbors.forEach((nb) => {
          if (!visited.has(nb.id())) {
            visited.add(nb.id())
            queue.push({ node: nb, depth: depth + 1 })
          }
        })
      }

      firstNeighborsRef.current = visited
    })

    cy.on('drag', 'node', (evt) => {
      if (!draggedNode || !dragStartPos || !connectedNodeMap) return
      const currPos = draggedNode.position()
      const dx = currPos.x - dragStartPos.x
      const dy = currPos.y - dragStartPos.y
      dragStartPos = { ...currPos }
      dragVelocity = { x: dx, y: dy }

      draggedNode.scratch('_basePos', {
        x: currPos.x,
        y: currPos.y,
        phase: draggedNode.scratch('_basePos')?.phase || 0,
      })

      // Shift target positions according to water drag attenuation weight
      connectedNodeMap.forEach((entry) => {
        const { depth } = entry
        const weight = Math.max(0.08, 0.85 * Math.pow(0.72, depth - 1))
        entry.targetPos.x += dx * weight
        entry.targetPos.y += dy * weight
      })
    })

    cy.on('free', 'node', (evt) => {
      const n = evt.target
      const p = n.position()
      n.scratch('_basePos', { x: p.x, y: p.y, phase: n.scratch('_basePos')?.phase || Math.random() * Math.PI * 2 })

      if (connectedNodeMap) {
        connectedNodeMap.forEach(({ node, targetPos }) => {
          node.scratch('_basePos', { x: targetPos.x, y: targetPos.y, phase: node.scratch('_basePos')?.phase || Math.random() * Math.PI * 2 })
        })
      }

      isDragging = false
      dragVelocity = { x: 0, y: 0 }
      draggedNode = null
      dragStartPos = null
      connectedNodeMap = null
      firstNeighborsRef.current = new Set()
    })

    // ─── HOVERED NODE — 4× EDGE THICKNESS ─────────────────────────────
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      if (pinnedNodeRef.current) return

      const connectedEdges = node.connectedEdges()
      const neighborNodes = connectedEdges.connectedNodes().difference(node)

      cy.elements().addClass('dimmed')
      node.removeClass('dimmed').addClass('node-hovered')
      connectedEdges.removeClass('dimmed').addClass('edge-hovered')
      neighborNodes.removeClass('dimmed').addClass('neighbor-hovered')
    })

    cy.on('mouseout', 'node', () => {
      if (pinnedNodeRef.current) return
      cy.elements().removeClass('dimmed').removeClass('node-hovered').removeClass('edge-hovered').removeClass('neighbor-hovered')
    })

    // ─── NODE SELECTION & NEIGHBORHOOD PINNING ───────────────────────
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id()
      const nodeData = evt.target.data()
      const cyNode = evt.target

      const connectedEdges = cyNode.connectedEdges()
      const connectedLinks = []
      connectedEdges.forEach((edge) => {
        const src = edge.source()
        const tgt = edge.target()
        const neighborNode = src.id() === nodeId ? tgt : src
        connectedLinks.push({
          edgeLabel: edge.data('label') || '',
          direction: src.id() === nodeId ? 'outgoing' : 'incoming',
          neighborId: neighborNode.id(),
          neighborLabel: neighborNode.data('label') || neighborNode.id(),
          neighborCategory: neighborNode.data('category') || '',
          neighborColor: (NODE_STYLES[neighborNode.data('category')] || NODE_STYLES.Entity).color,
        })
      })

      const nodeObj = currentNodes.find((n) => n.id === nodeId) || {
        id: nodeData.id,
        label: nodeData.label,
        category: nodeData.category,
        properties: nodeData.properties || {},
      }

      if (nodeObj) {
        setSelectedNode({ ...nodeObj, connectedLinks })
      }

      pinnedNodeRef.current = nodeId
      cy.elements().removeClass('dimmed').removeClass('node-hovered').removeClass('edge-hovered').removeClass('neighbor-hovered').removeClass('node-active')
      cyNode.addClass('node-active')
      connectedEdges.addClass('edge-hovered')
      connectedEdges.connectedNodes().difference(cyNode).addClass('neighbor-hovered')
      cy.elements().not(cyNode).not(connectedEdges).not(connectedEdges.connectedNodes()).addClass('dimmed')
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        pinnedNodeRef.current = null
        cy.elements().removeClass('dimmed').removeClass('node-hovered').removeClass('edge-hovered').removeClass('neighbor-hovered').removeClass('node-active')
        setSelectedNode(null)
      }
    })

    cyRef.current = cy

    return () => {
      if (animId) cancelAnimationFrame(animId)
      try {
        if (cy && typeof cy.destroyed === 'function' && !cy.destroyed()) {
          cy.destroy()
        }
      } catch {
        // ignore
      }
    }
  }, [visibleNodes, visibleEdges, layoutConfig, showLabels, showEdgeLabels, isLiveFeed])

  // Toggle Category visibility
  useEffect(() => {
    if (!cyRef.current || (typeof cyRef.current.destroyed === 'function' && cyRef.current.destroyed())) return
    const cy = cyRef.current
    cy.batch(() => {
      cy.nodes().removeClass('hidden-category')
      cy.edges().removeClass('hidden-category')
      hiddenCategorySet.forEach((catKey) => {
        const hiddenNodes = cy.nodes().filter((n) => {
          const itemKey = n.data('vehicleType') ? n.data('vehicleType') : n.data('category')
          return itemKey === catKey
        })
        hiddenNodes.addClass('hidden-category')
        hiddenNodes.connectedEdges().addClass('hidden-category')
      })
    })
  }, [hiddenCategorySet])

  // Search Submission
  function handleSearchSubmit(e) {
    e?.preventDefault?.()
    const query = searchTerm.trim()
    if (!query) return

    if (query.toLowerCase() === 'all' || query.toLowerCase().includes('all camera')) {
      handleExitFocusMode()
      return
    }

    const matchedCam = allCameras.find((c) => c.toLowerCase().includes(query.toLowerCase()))
    if (matchedCam) {
      handleSelectCamera(matchedCam)
      return
    }

    const matchedVehicle = rows.find((r) => {
      const plate = (r.numberPlate || r.vehicleNumberPlate || '').toLowerCase()
      return plate.includes(query.toLowerCase())
    })

    if (matchedVehicle) {
      handleSelectVehicle(matchedVehicle)
      return
    }

    if (searchSuggestions.cameras.length > 0) {
      handleSelectCamera(searchSuggestions.cameras[0])
      return
    }

    setShowSuggestions(false)
  }

  // Zoom / Viewport controls
  function handleZoomIn() {
    if (!cyRef.current) return
    cyRef.current.animate({
      zoom: { level: Math.min(3.5, cyRef.current.zoom() * 1.3), renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } },
      duration: 180,
    })
  }

  function handleZoomOut() {
    if (!cyRef.current) return
    cyRef.current.animate({
      zoom: { level: Math.max(0.02, cyRef.current.zoom() * 0.75), renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } },
      duration: 180,
    })
  }

  function handleFit() {
    if (!cyRef.current) return
    cyRef.current.animate({ fit: { eles: cyRef.current.elements(), padding: 70 }, duration: 250 })
  }

  function handleRelayout() {
    if (!cyRef.current) return
    cyRef.current.layout({
      ...layoutConfig,
      animate: true,
      animationDuration: 400,
      stop: () => {
        if (cyRef.current) {
          separateOverlappingNodes(cyRef.current)
          cyRef.current.nodes().forEach((n) => {
            const p = n.position()
            n.scratch('_basePos', { x: p.x, y: p.y, phase: Math.random() * Math.PI * 2 })
          })
          cyRef.current.animate({ fit: { eles: cyRef.current.elements(), padding: 70 }, duration: 250 })
        }
      },
    }).run()
  }

  function handleInspectNeighbor(neighborId) {
    if (!cyRef.current) return
    const cyNode = cyRef.current.getElementById(neighborId)
    if (cyNode && cyNode.length) {
      cyNode.emit('tap')
      cyRef.current.animate({
        center: { eles: cyNode },
        zoom: Math.max(cyRef.current.zoom(), 1.0),
        duration: 350,
      })
    }
  }

  return (
    <div className="kg-page-wrapper">
      {/* ── SUB-PAGES HORIZONTAL TAB BAR (Knowledge Graph / Query) ── */}
      {!isQueryEmbedded && !isFullscreen && (
        <div className="tr-tab-row" style={{ marginTop: '0', marginBottom: '16px', background: 'transparent' }}>
          <button
            type="button"
            className={`tr-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => handleTabChange('graph')}
          >
            <Network size={15} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Knowledge Graph
          </button>
          <button
            type="button"
            className={`tr-tab-btn ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => handleTabChange('query')}
          >
            <Search size={15} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            Query
          </button>
        </div>
      )}

      {/* TAB 1: KNOWLEDGE GRAPH CANVAS */}
      <div
        className={`kg-explorer-container ${isFullscreen ? 'fullscreen' : ''}`}
        style={{ display: activeTab === 'graph' ? 'flex' : 'none' }}
      >
        {/* TOP KNOWLEDGE GRAPH CLEAN TOOLBAR */}
        <div className="kg-graph-top-toolbar">
          <div className="kg-graph-top-left">
            <div className="kg-search-wrapper" style={{ maxWidth: 280, height: 32 }}>
              <Search size={13} className="kg-search-icon" />
              <input
                type="text"
                placeholder="Find plate / camera / node..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                style={{ fontSize: 12, paddingLeft: 28 }}
              />
              {searchTerm && (
                <button className="kg-search-clear" onClick={() => setSearchTerm('')} type="button">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Auto-suggestions dropdown */}
            {showSuggestions && (searchSuggestions.cameras.length > 0 || searchSuggestions.vehicles.length > 0) && (
              <div className="kg-suggestions-dropdown">
                {searchSuggestions.cameras.map((cam) => (
                  <div
                    key={cam}
                    className="kg-suggestion-item"
                    onMouseDown={() => handleSelectCamera(cam)}
                  >
                    <Camera size={13} style={{ color: '#059669' }} />
                    <span>Camera: <strong>{cam}</strong></span>
                  </div>
                ))}
                {searchSuggestions.vehicles.map((v) => {
                  const plate = v.numberPlate || v.vehicleNumberPlate || v.observationId || v.id
                  return (
                    <div
                      key={plate}
                      className="kg-suggestion-item"
                      onMouseDown={() => handleSelectVehicle(v)}
                    >
                      <Car size={13} style={{ color: '#0284c7' }} />
                      <span>Vehicle: <strong>{plate}</strong></span>
                    </div>
                  )
                })}
              </div>
            )}

            {focusMode !== 'ALL' && (
              <div className="kg-active-focus-pill">
                <span>Focus: <strong>{focusedCamera || frozenVehicle?.numberPlate || 'Selected Node'}</strong></span>
                <button type="button" onClick={handleExitFocusMode} title="Reset focus to all entities">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="kg-graph-top-right">
            <span className="kg-neo4j-meta-pill">
              ⚡ {visibleNodes.length} nodes · {visibleEdges.length} rels
            </span>

            <button
              type="button"
              className={`kg-status-btn ${isLayersOpen ? 'active' : ''}`}
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              title="Toggle Layers Panel"
            >
              <Layers size={13} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              Layers
            </button>

            <button
              type="button"
              className="kg-status-btn"
              onClick={handleRelayout}
              title="Reset layout physics"
            >
              <RefreshCw size={13} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              Re-layout
            </button>
          </div>
        </div>

        {/* MAIN GRAPH BODY */}
        <div className="kg-explorer-main">
          {/* OPTIONAL SLIDE-OUT GRAPH LAYERS PANEL */}
          <div
            className="kg-explorer-sidebar"
            style={{ display: isLayersOpen ? 'flex' : 'none' }}
          >
            {/* GRAPH LAYERS */}
            <div className="kg-sidebar-section">
              <div className="kg-sidebar-title-row">
                <span className="kg-sidebar-title">GRAPH LAYERS</span>
                <div className="kg-sidebar-actions">
                  <button onClick={() => setHiddenCategorySet(new Set())} type="button">Show All</button>
                  <button onClick={() => setHiddenCategorySet(new Set(dynamicCategories.map((c) => c.key)))} type="button">Hide All</button>
                </div>
              </div>

              <div className="kg-sidebar-list">
                {dynamicCategories.map((cat) => {
                  const isHidden = hiddenCategorySet.has(cat.key)
                  return (
                    <div
                      key={cat.key}
                      className={`kg-category-item ${isHidden ? 'hidden' : ''}`}
                      onClick={() => {
                        setHiddenCategorySet((prev) => {
                          const next = new Set(prev)
                          if (next.has(cat.key)) next.delete(cat.key)
                          else next.add(cat.key)
                          return next
                        })
                      }}
                    >
                      <div className="kg-category-left">
                        <span className="kg-category-dot" style={{ backgroundColor: cat.color }} />
                        <span className="kg-category-name">{cat.key}</span>
                      </div>
                      <div className="kg-category-right">
                        <span className="kg-category-count">{cat.count}</span>
                        <button className="kg-eye-btn" type="button">
                          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="kg-sidebar-divider" />

            {/* DISPLAY OPTIONS */}
            <div className="kg-sidebar-section">
              <div className="kg-sidebar-title">DISPLAY OPTIONS</div>
              <div className="kg-sidebar-toggles">
                <label className="kg-toggle-row">
                  <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                  <span className="kg-toggle-custom" />
                  <span className="kg-toggle-label">Hub Labels</span>
                </label>

                <label className="kg-toggle-row">
                  <input type="checkbox" checked={showEdgeLabels} onChange={(e) => setShowEdgeLabels(e.target.checked)} />
                  <span className="kg-toggle-custom" />
                  <span className="kg-toggle-label">Transit Labels</span>
                </label>
              </div>
            </div>

            <div className="kg-sidebar-divider" />

            {/* LAYOUT ALGORITHM SELECTOR */}
            <div className="kg-sidebar-section">
              <div className="kg-sidebar-title">LAYOUT ALGORITHM</div>
              <select
                className="kg-layout-select"
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value)}
              >
                <option value="cose">Force Directed (COSE Constellation)</option>
                <option value="concentric">Concentric Hierarchy</option>
                <option value="circle">Circular Distribution</option>
                <option value="grid">Orthogonal Grid</option>
              </select>
            </div>
          </div>

          {/* CENTRAL CONSTELLATION GRAPH CANVAS */}
          <div className="kg-explorer-canvas-area">
            <div ref={containerRef} className="kg-cytoscape-container" />

            {/* Floating Canvas Controls */}
            <div className="kg-floating-controls">
              <button className="kg-floating-btn" onClick={handleZoomIn} title="Zoom In (+)" type="button">
                <Plus size={14} />
              </button>
              <button className="kg-floating-btn" onClick={handleZoomOut} title="Zoom Out (-)" type="button">
                <Minus size={14} />
              </button>
              <button className="kg-floating-btn" onClick={handleFit} title="Fit Entire Constellation" type="button">
                <Maximize size={13} />
              </button>
              <button className="kg-floating-btn" onClick={handleRelayout} title="Re-run Force Simulation" type="button">
                <RefreshCw size={13} />
              </button>
              <button className={`kg-floating-btn ${isFullscreen ? 'active' : ''}`} onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen" type="button">
                <Layers size={13} />
              </button>
            </div>

            {/* Canvas Mode Indicator Badge */}
            <div className="kg-canvas-mode-badge">
              <span className="kg-status-dot green" />
              <span>{layoutMode === 'cose' ? 'Constellation Physics Active' : `${layoutMode.toUpperCase()} Layout`}</span>
            </div>
          </div>

        {/* RIGHT NODE DETAILS PANEL - OPENS ONLY WHEN A NODE IS SELECTED */}
        {selectedNode && (
          <div className="kg-details-panel-light">
            <div className="kg-details-header">
              <div className="kg-details-title-row">
                <span
                  className="kg-badge"
                  style={{
                    backgroundColor: getNodeColorMeta(selectedNode.category, selectedNode.vehicleType).bg,
                    color: getNodeColorMeta(selectedNode.category, selectedNode.vehicleType).color,
                    border: `1px solid ${getNodeColorMeta(selectedNode.category, selectedNode.vehicleType).border}`,
                  }}
                >
                  {selectedNode.vehicleType ? `${selectedNode.vehicleType} · ${selectedNode.category}` : selectedNode.category}
                </span>
                <button className="kg-details-close" onClick={() => setSelectedNode(null)} type="button">
                  <X size={15} />
                </button>
              </div>
              <h2>{selectedNode.label}</h2>
              <span className="kg-node-id">ID: {selectedNode.id}</span>
            </div>

            <div className="kg-details-body">
              {selectedNode.image && (
                <div className="kg-inspector-media-card">
                  <div className="kg-media-card-label">
                    <Camera size={12} /> Surveillance Capture
                  </div>
                  <div
                    className="kg-media-preview-box"
                    onClick={() => selectedNode.rawRow && setPreviewModalRow(selectedNode.rawRow)}
                    title="Click to view full image"
                  >
                    <img alt={selectedNode.label} src={selectedNode.image} />
                    <div className="kg-media-overlay-tag"><Eye size={10} /> View</div>
                  </div>
                </div>
              )}

              <h3 className="kg-section-subhead">Node Attributes</h3>
              <div className="kg-property-list">
                {Object.entries(selectedNode.properties || {}).map(([key, val]) => (
                  <div className="kg-property-row" key={key}>
                    <span className="kg-prop-key">{key}</span>
                    <strong className="kg-prop-val">{String(val)}</strong>
                  </div>
                ))}
              </div>

              {selectedNode.connectedLinks && selectedNode.connectedLinks.length > 0 && (
                <div className="kg-relationships-section">
                  <h3 className="kg-section-subhead">
                    Relationships ({selectedNode.connectedLinks.length})
                  </h3>
                  <div className="kg-relationships-list">
                    {selectedNode.connectedLinks.map((link, i) => (
                      <div
                        key={i}
                        className="kg-relationship-card"
                        onClick={() => handleInspectNeighbor(link.neighborId)}
                        title={`Click to focus ${link.neighborLabel}`}
                      >
                        <div className="kg-rel-direction">
                          <span className="kg-arrow-symbol">{link.direction === 'outgoing' ? '➔' : '⬅'}</span>
                          <span className="kg-rel-label">{link.edgeLabel || 'LINK'}</span>
                        </div>
                        <span
                          className="kg-neighbor-pill"
                          style={{ backgroundColor: getNodeColorMeta(link.neighborCategory, null).bg, color: getNodeColorMeta(link.neighborCategory, null).color }}
                        >
                          {link.neighborLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM GRAPH STATUSBAR */}
      <div className="kg-explorer-statusbar">
        <div className="kg-status-left">
          <span className="kg-status-item">
            <span className="kg-status-dot green" />
            Distributed Knowledge Graph Engine
          </span>
          <span className="kg-status-divider" />
          <span className="kg-status-item">
            Nodes: <strong>{visibleNodes.length}</strong>
          </span>
          <span className="kg-status-divider" />
          <span className="kg-status-item">
            Edges: <strong>{visibleEdges.length}</strong>
          </span>
        </div>

        <div className="kg-status-right">
          <span className="kg-status-item">
            Zoom: <strong>{zoomPercent}%</strong>
          </span>
          <span className="kg-status-divider" />
          <button className="kg-status-btn" onClick={handleFit} type="button">Fit Graph</button>
          <button className="kg-status-btn" onClick={handleRelayout} type="button">Reset Layout</button>
        </div>
      </div>

      {/* Media Inspection Modal */}
      {previewModalRow && (
        <MediaPreviewModal
          allRows={rows}
          isOpen={Boolean(previewModalRow)}
          onClose={() => setPreviewModalRow(null)}
          onSelectRow={setPreviewModalRow}
          row={previewModalRow}
        />
      )}
      </div>

      {/* TAB 2: QUERY STUDIO (NATURAL LANGUAGE TELEMETRY SEARCH) */}
      {!isQueryEmbedded && activeTab === 'query' && (
        <div className="kg-query-tab-view" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <Suspense
            fallback={
              <div
                className="query-empty-results"
                style={{
                  padding: '80px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Loader2 className="spinning" size={32} style={{ color: '#0284c7' }} />
                <p style={{ marginTop: '14px', color: '#64748b', fontSize: '13px' }}>
                  Loading Telemetry Query Engine...
                </p>
              </div>
            }
          >
            <QueryPage fileName={fileName} rows={rows} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
