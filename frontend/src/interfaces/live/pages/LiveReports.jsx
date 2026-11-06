import React, { useState, useMemo } from 'react'
import {
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'
import MediaPreviewModal from '../../../components/MediaPreviewModal'
import VehicleImageThumbnail from '../../../components/VehicleImageThumbnail'
import { findCloudinaryImage, useCloudinaryImages } from '../../../hooks/useCloudinaryImages'

export default function LiveReports() {
  const { liveRecords, stats } = useLiveFeed()
  const { imagesByKey, error: cloudinaryError } = useCloudinaryImages()
  const [selectedType, setSelectedType] = useState('All')
  const [plateFilter, setPlateFilter] = useState('All') // 'All', 'Recognized', 'Not Recognized'
  const [searchQuery, setSearchQuery] = useState('')
  const [previewModalRow, setPreviewModalRow] = useState(null)

  const filteredRecords = useMemo(() => {
    return liveRecords.map((record) => {
      const cloudinaryImage = findCloudinaryImage(record, imagesByKey)
      return cloudinaryImage
        ? { ...record, image: cloudinaryImage, vehicle_image_url: cloudinaryImage, vehicleImagePath: cloudinaryImage }
        : record
    }).filter((r) => {
      const matchType = selectedType === 'All' || (r.type || r.vehicleType) === selectedType
      const matchPlate =
        plateFilter === 'All'
          ? true
          : plateFilter === 'Not Recognized'
            ? !r.isPlateRecognized || r.vehicleNumberPlate === 'Not Recognized'
            : r.isPlateRecognized && r.vehicleNumberPlate !== 'Not Recognized'
      const matchSearch =
        !searchQuery ||
        r.vehicleNumberPlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.camera?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchType && matchPlate && matchSearch
    })
  }, [liveRecords, imagesByKey, selectedType, plateFilter, searchQuery])

  const linkedImageCount = filteredRecords.filter((record) => record.vehicle_image_url?.startsWith('https://')).length

  // CSV Exporter exclusively using Live Feed records
  const handleExportCsv = () => {
    const headers = [
      'Observation ID',
      'Timestamp',
      'Camera Node',
      'Location',
      'Vehicle Class',
      'HSRP License Plate',
      'Plate Recognized',
      'Speed (km/h)',
      'Simulated Toll (INR)',
      'Status / Violation',
    ]

    const csvRows = filteredRecords.map((r) => [
      r.observationId || r.id,
      r.timestamp,
      r.camera,
      `"${r.location}"`,
      r.type || r.vehicleType,
      r.vehicleNumberPlate,
      r.isPlateRecognized ? 'YES' : 'NO',
      r.speedKmph || r.speed,
      r.tollAmount,
      `"${r.status || 'Normal Flow'}"`,
    ])

    const csvContent = [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `VisionIQ_Live_Telemetry_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="reports-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · DOCUMENT INTELLIGENCE & AUDIT REPORTS
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Telemetry Reports & Exports
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Generate official traffic intelligence, ANPR recognition audit reports, and highway speed compliance logs from live optical stream detections.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 6,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
          }}
        >
          <Download size={16} />
          Export Live Telemetry CSV ({filteredRecords.length})
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
            Total Live Records
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{liveRecords.length}</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Optical stream session observations</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
            HSRP Plate Recognition
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{stats.recognitionRate}%</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{stats.recognizedCount} recognized / {stats.total} total</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
            Unrecognized Plates
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ea580c' }}>{stats.unrecognizedCount}</div>
          <div style={{ fontSize: 12, color: '#ea580c', marginTop: 4 }}>OCR occluded or non-standard</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
            Speed Compliance
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
            {Math.round(((liveRecords.length - liveRecords.filter((r) => r.violation).length) / (liveRecords.length || 1)) * 100)}%
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Adhering to 80 km/h ceiling</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={15} /> Vehicle Type:
          </span>
          {['All', 'Car', 'Truck', 'Bus', 'Bike', 'LCV'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              type="button"
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: selectedType === t ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: selectedType === t ? '#0284c7' : '#ffffff',
                color: selectedType === t ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}

          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginLeft: 8 }}>
            Plate Filter:
          </span>
          {['All', 'Recognized', 'Not Recognized'].map((pf) => (
            <button
              key={pf}
              onClick={() => setPlateFilter(pf)}
              type="button"
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: plateFilter === pf ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: plateFilter === pf ? '#0284c7' : '#ffffff',
                color: plateFilter === pf ? '#ffffff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {pf}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search report by plate, camera..."
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

      {/* Report Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Feed Telemetry Audit Table
          </h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {filteredRecords.length} detections · {linkedImageCount} Cloudinary images
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
                <th style={{ padding: '10px 14px' }}>Vehicle Class</th>
                <th style={{ padding: '10px 14px' }}>HSRP License Plate</th>
                <th style={{ padding: '10px 14px' }}>Speed</th>
                <th style={{ padding: '10px 14px' }}>Simulated Toll</th>
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
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{r.speedKmph || r.speed} km/h</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#16a34a' }}>₹ {r.tollAmount}</td>
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
