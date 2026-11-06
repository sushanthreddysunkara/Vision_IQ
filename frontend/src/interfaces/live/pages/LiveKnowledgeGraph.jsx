import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Network } from 'lucide-react'
import KnowledgeGraphPage from '../../../components/knowledgeGraph/KnowledgeGraphPage'
import { useLiveFeed } from '../context/LiveFeedContext'

function getTrackSignature(records) {
  return records
    .map((record) => [
      record.trackId || record.observationId || record.id,
      record.vehicleNumberPlate || record.numberPlate || record.plate || '',
      record.isPlateRecognized ? 'recognized' : 'unrecognized',
      record.vehicleType || record.type || record.label || '',
      record.violation || '',
    ].join(':'))
    .join('|')
}

function getRecognizedPlate(record) {
  const plate = String(record.vehicleNumberPlate || record.numberPlate || record.plate || '').trim()
  return Boolean(
    plate &&
    !['—', 'N/A', 'NOT RECOGNIZED', 'UNKNOWN'].includes(plate.toUpperCase()) &&
    record.isPlateRecognized !== false,
  )
}

function getVideoTimeSeconds(value) {
  const parts = String(value || '').split(':').map(Number)
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return -1
  return parts.reduce((seconds, part) => seconds * 60 + part, 0)
}

export default function LiveKnowledgeGraph() {
  const { liveRecords, isDemoMode, uploadedVideoFile } = useLiveFeed()
  const latestRecordsRef = useRef(liveRecords)
  const graphRecordsRef = useRef(liveRecords)
  const [graphRecords, setGraphRecords] = useState(liveRecords)
  const graphRows = useMemo(
    () => graphRecords.map((record) => ({
      ...record,
      location: record.corridor || record.location,
    })),
    [graphRecords],
  )
  const recognizedRecords = useMemo(
    () => liveRecords
      .filter(getRecognizedPlate)
      .slice()
      .sort((a, b) => getVideoTimeSeconds(b.lastSeenAt || b.time) - getVideoTimeSeconds(a.lastSeenAt || a.time))
      .slice(0, 6),
    [liveRecords],
  )

  useEffect(() => {
    latestRecordsRef.current = liveRecords
  }, [liveRecords])

  useEffect(() => {
    const refreshGraphTracks = () => {
      const latestRecords = latestRecordsRef.current
      if (getTrackSignature(latestRecords) === getTrackSignature(graphRecordsRef.current)) return

      graphRecordsRef.current = latestRecords
      setGraphRecords(latestRecords)
    }

    const refreshInterval = window.setInterval(refreshGraphTracks, 750)
    return () => window.clearInterval(refreshInterval)
  }, [])

  const title = uploadedVideoFile?.name || (isDemoMode ? 'Live Feed telemetry' : 'Uploaded video')

  return (
    <div style={{ width: '100%', minWidth: 0, padding: '20px clamp(16px, 2vw, 32px)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#0284c7', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            <Network size={14} /> Live model telemetry
          </div>
          <h1 style={{ margin: '4px 0', color: '#0f172a', fontSize: 23 }}>Live Knowledge Graph</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
            Excel Knowledge Graph design, populated with unique vehicle tracks detected from {title}.
          </p>
        </div>
        <span style={{ padding: '7px 10px', border: '1px solid #bfdbfe', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 650 }}>
          {liveRecords.length} tracked · {recognizedRecords.length} recognized
        </span>
      </div>

      {recognizedRecords.length > 0 && (
        <section aria-label="Recently recognized vehicles" style={{ marginBottom: 14, padding: 14, border: '1px solid #bbf7d0', borderRadius: 9, background: '#f0fdf4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <h2 style={{ margin: 0, color: '#166534', fontSize: 14 }}>Recently recognized vehicles</h2>
            <span style={{ color: '#15803d', fontSize: 11 }}>Updates automatically as detections change</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 9 }}>
            {recognizedRecords.map((record) => (
              <article
                key={record.trackId || record.observationId || record.id}
                style={{ padding: 11, border: '1px solid #dcfce7', borderRadius: 7, background: '#fff' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: 14 }}>
                    {record.vehicleNumberPlate || record.numberPlate || record.plate}
                  </strong>
                  <span style={{ color: '#64748b', fontSize: 11 }}>Track #{record.trackId || '—'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px', marginTop: 8, color: '#475569', fontSize: 11 }}>
                  <span>Type: <strong style={{ color: '#0f172a' }}>{record.vehicleType || record.type || record.label || 'Vehicle'}</strong></span>
                  <span>Speed: <strong style={{ color: '#0f172a' }}>{record.speedKmph || record.speed || '—'} km/h</strong></span>
                  <span>Lane: <strong style={{ color: '#0f172a' }}>{record.lane || '—'}</strong></span>
                  <span>Confidence: <strong style={{ color: '#0f172a' }}>{Math.round((Number(record.confidence) || 0) * 100)}%</strong></span>
                  <span style={{ gridColumn: '1 / -1' }}>Camera: <strong style={{ color: '#0f172a' }}>{record.camera || '—'}</strong></span>
                  <span style={{ gridColumn: '1 / -1' }}>Last seen: <strong style={{ color: '#0f172a' }}>{record.lastSeenAt || record.time || '—'}</strong></span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <KnowledgeGraphPage
        rows={graphRows}
        fileName={title}
        hideFilters
        isQueryEmbedded
        isLiveFeed
      />
      {!isDemoMode && graphRecords.length === 0 && (
        <div style={{ marginTop: 10, padding: 12, border: '1px solid #bfdbfe', borderRadius: 8, background: '#eff6ff', color: '#1e40af', fontSize: 12 }}>
          Waiting for the video model to identify its first vehicle. The graph and recognized-vehicle details will update automatically as tracks and plate recognition arrive.
        </div>
      )}
    </div>
  )
}
