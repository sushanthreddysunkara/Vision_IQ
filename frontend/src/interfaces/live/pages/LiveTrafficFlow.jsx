import React, { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Gauge,
  Info,
  Layers,
  MapPin,
  Radio,
  Search,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLiveFeed } from '../context/LiveFeedContext'
import MediaPreviewModal from '../../../components/MediaPreviewModal'
import VehicleImageThumbnail from '../../../components/VehicleImageThumbnail'
import { findCloudinaryImage, useCloudinaryImages } from '../../../hooks/useCloudinaryImages'

export default function LiveTrafficFlow() {
  const { liveRecords, cameras, stats, isDemoMode } = useLiveFeed()
  const { imagesByKey, error: cloudinaryError } = useCloudinaryImages()
  const [selectedCorridor, setSelectedCorridor] = useState('All')
  const [selectedLane, setSelectedLane] = useState('All')
  const [previewModalRow, setPreviewModalRow] = useState(null)

  const filteredRecords = useMemo(() => {
    return liveRecords.map((record) => {
      const cloudinaryImage = findCloudinaryImage(record, imagesByKey)
      return cloudinaryImage
        ? { ...record, image: cloudinaryImage, vehicle_image_url: cloudinaryImage, vehicleImagePath: cloudinaryImage }
        : record
    }).filter((r) => {
      const matchCorridor = selectedCorridor === 'All' || r.corridor?.includes(selectedCorridor)
      const matchLane = selectedLane === 'All' || r.lane === selectedLane
      return matchCorridor && matchLane
    })
  }, [liveRecords, imagesByKey, selectedCorridor, selectedLane])

  const linkedImageCount = filteredRecords.filter((record) => record.vehicle_image_url?.startsWith('https://')).length

  // Hourly volume simulation from live stream
  const hourlyData = [
    { time: '11:00', volume: 280, speed: 72 },
    { time: '12:00', volume: 340, speed: 68 },
    { time: '13:00', volume: 310, speed: 70 },
    { time: '14:00', volume: 390, speed: 64 },
    { time: '15:00', volume: 420, speed: 62 },
    { time: '15:45 (Now)', volume: filteredRecords.length * 40, speed: stats.avgSpeed },
  ]

  // Lane volume breakdown
  const laneBreakdown = [
    { lane: 'Lane 1 (Heavy / LCV)', count: filteredRecords.filter((r) => r.lane === 'Lane 1').length || 3 },
    { lane: 'Lane 2 (Fast Express)', count: filteredRecords.filter((r) => r.lane === 'Lane 2').length || 4 },
    { lane: 'Lane 3 (Car / Bus)', count: filteredRecords.filter((r) => r.lane === 'Lane 3').length || 2 },
    { lane: 'Lane 4 (Ramp / Mixed)', count: filteredRecords.filter((r) => r.lane === 'Lane 4').length || 1 },
  ]

  return (
    <div className="traffic-flow-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · HIGHWAY TRAFFIC FLOW & VELOCITY
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Traffic Flow Analytics
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Real-time vehicle density, corridor speed profiles, and lane-by-lane throughput calculated from optical camera detections.
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
          <Activity size={14} />
          Corridor Average: {stats.avgSpeed} km/h (Normal Flow)
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Live Flow Density</span>
            <Activity size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{filteredRecords.length} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>active vehicles</span></div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Across monitored highway segments</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Average Corridor Speed</span>
            <Gauge size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{stats.avgSpeed} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>km/h</span></div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Corridor limit: 80 km/h</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Speed Violations</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {filteredRecords.filter((r) => r.violation).length}
          </div>
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Over-speed events detected</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Optical Sensors Active</span>
            <Radio size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{stats.activeCamerasCount} / {cameras.length}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Optical AI detection nodes</div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
          <Filter size={15} /> Corridor:
        </div>
        {['All', 'NH-44', 'NH-65', 'ORR'].map((corr) => (
          <button
            key={corr}
            onClick={() => setSelectedCorridor(corr)}
            type="button"
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: selectedCorridor === corr ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: selectedCorridor === corr ? '#0284c7' : '#ffffff',
              color: selectedCorridor === corr ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            {corr}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
          Lane Filter:
        </div>
        {['All', 'Lane 1', 'Lane 2', 'Lane 3', 'Lane 4'].map((lane) => (
          <button
            key={lane}
            onClick={() => setSelectedLane(lane)}
            type="button"
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: selectedLane === lane ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: selectedLane === lane ? '#0284c7' : '#ffffff',
              color: selectedLane === lane ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            {lane}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Chart 1: Traffic Flow Volume & Speed Trend */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Live Hourly Traffic Flow & Velocity Trend
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#0284c7" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="volume" name="Vehicles / Hr" stroke="#0284c7" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="speed" name="Avg Speed (km/h)" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lane Throughput Distribution */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Live Lane Distribution (Active Optical Feeds)
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={laneBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="lane" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Detections" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Speed Logs Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Speed Telemetry Logs
          </h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {filteredRecords.length} real-time observations · {linkedImageCount} Cloudinary images
          </span>
        </div>
        {cloudinaryError && (
          <p role="alert" style={{ color: '#b91c1c', fontSize: 12, margin: '0 0 12px' }}>
            Could not load Cloudinary images: {cloudinaryError}
          </p>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Time</th>
                <th style={{ padding: '10px 14px' }}>Image</th>
                <th style={{ padding: '10px 14px' }}>Camera</th>
                <th style={{ padding: '10px 14px' }}>Lane</th>
                <th style={{ padding: '10px 14px' }}>Vehicle Class</th>
                <th style={{ padding: '10px 14px' }}>HSRP Number Plate</th>
                <th style={{ padding: '10px 14px' }}>Speed</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{r.time}</td>
                  <td style={{ padding: '6px 14px' }}>
                    {r.vehicle_image_url?.startsWith('https://') ? (
                      <VehicleImageThumbnail
                        row={r}
                        onClick={setPreviewModalRow}
                        size="sm"
                        showFallbackImage={false}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>Not linked</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{r.camera}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{r.lane}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.type || r.vehicleType}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {r.vehicleNumberPlate === 'Not Recognized' ? (
                      <span className="viq-unrecognized-badge">Not Recognized</span>
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 4 }}>
                        {r.vehicleNumberPlate}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: (r.speedKmph || r.speed) > 80 ? '#dc2626' : '#1e293b' }}>
                    {r.speedKmph || r.speed} km/h
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: r.violation ? '#fee2e2' : '#f0fdf4',
                      color: r.violation ? '#b91c1c' : '#15803d',
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {previewModalRow && (
        <MediaPreviewModal
          allRows={filteredRecords}
          isOpen={Boolean(previewModalRow)}
          onClose={() => setPreviewModalRow(null)}
          onSelectRow={setPreviewModalRow}
          row={previewModalRow}
        />
      )}
    </div>
  )
}
