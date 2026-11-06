import React, { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Eye,
  Filter,
  Layers,
  MapPin,
  Maximize2,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'

export default function LiveCameraNetwork() {
  const { cameras, activeCameraId, setActiveCameraId, liveRecords } = useLiveFeed()
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [inspectCamera, setInspectCamera] = useState(null)

  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const matchStatus = statusFilter === 'All' || cam.status === statusFilter
      const matchSearch = !searchQuery || cam.name.toLowerCase().includes(searchQuery.toLowerCase()) || cam.id.toLowerCase().includes(searchQuery.toLowerCase()) || cam.location.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [cameras, statusFilter, searchQuery])

  const activeCamerasCount = cameras.filter((c) => c.status === 'ACTIVE').length

  return (
    <div className="camera-network-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · OPTICAL SURVEILLANCE & ANPR CAMERA GRID
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Camera Network
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            High-definition optical AI surveillance nodes, real-time video stream ingestion status, and plate OCR recognition rates.
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          fontSize: 12,
          fontWeight: 600,
        }}>
          <Wifi size={14} />
          {activeCamerasCount} / {cameras.length} Nodes Streaming Live
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={15} /> Status:
          </span>
          {['All', 'ACTIVE', 'STANDBY', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              type="button"
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: statusFilter === st ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: statusFilter === st ? '#0284c7' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search camera by name, ID or corridor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Cameras Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
        {filteredCameras.map((cam) => {
          const isActive = cam.status === 'ACTIVE'
          const isSelected = activeCameraId === cam.id

          return (
            <div
              key={cam.id}
              onClick={() => {
                setActiveCameraId(cam.id)
                setInspectCamera(cam)
              }}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                padding: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {cam.id} · {cam.corridor}
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>
                    {cam.name}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {cam.location}
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: isActive ? '#dcfce7' : cam.status === 'STANDBY' ? '#fef3c7' : '#fee2e2',
                  color: isActive ? '#15803d' : cam.status === 'STANDBY' ? '#b45309' : '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {isActive ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {cam.status}
                </span>
              </div>

              {/* Live Status Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>STREAM STATUS</div>
                  <strong style={{ color: isActive ? '#10b981' : '#64748b' }}>{cam.streamStatus}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>RESOLUTION</div>
                  <strong>{cam.resolution}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>VEHICLES DETECTED</div>
                  <strong style={{ color: '#0284c7' }}>{cam.vehiclesDetected}</strong>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>OCR FAILURES</div>
                  <strong style={{ color: cam.recognitionFailures > 0 ? '#ef4444' : '#10b981' }}>
                    {cam.recognitionFailures} unrec
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: '#64748b' }}>
                <span>Last Frame: <strong>{cam.lastFrameReceived}</strong></span>
                <span>AI Confidence: <strong style={{ color: '#16a34a' }}>{Math.round(cam.avgConfidence * 100)}%</strong></span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Camera Stream & Details Modal */}
      {inspectCamera && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 8,
            maxWidth: 680,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  OPTICAL SENSOR INSPECTOR · {inspectCamera.id}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>
                  {inspectCamera.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectCamera(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Video Stream Preview placeholder */}
              <div style={{
                height: 240,
                borderRadius: 6,
                backgroundColor: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                position: 'relative',
                marginBottom: 16,
              }}>
                <Video size={40} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Live Optical Stream Active ({inspectCamera.resolution})</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Inference model: YOLOv8-Highway + HSRP OCR v2.1
                </div>
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  fontSize: 10,
                  fontWeight: 700,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  {inspectCamera.streamStatus}
                </div>
              </div>

              {/* Technical details list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>Location: <strong>{inspectCamera.location}</strong></div>
                <div>IP Address: <strong style={{ fontFamily: 'monospace' }}>{inspectCamera.ipAddress}</strong></div>
                <div>Lane Configuration: <strong>{inspectCamera.laneCount} Lanes</strong></div>
                <div>Model Confidence: <strong>{Math.round(inspectCamera.avgConfidence * 100)}%</strong></div>
                <div>Total Detections: <strong>{inspectCamera.vehiclesDetected}</strong></div>
                <div>Plate OCR Failures: <strong style={{ color: '#ef4444' }}>{inspectCamera.recognitionFailures}</strong></div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setInspectCamera(null)}
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
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
