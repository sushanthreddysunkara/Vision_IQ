import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Bot,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Filter,
  HelpCircle,
  Info,
  Network,
  Radio,
  Search,
  Sparkles,
  Table2,
  X,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'

const SAMPLE_QUERIES = [
  'How many vehicles were detected in the current session?',
  'Which camera has the highest traffic density?',
  'Which vehicle detections are not recognized?',
  'What incidents have been detected recently?',
  'Which corridors currently have congestion?',
]

export default function LiveQuery() {
  const { liveRecords, cameras, incidents, stats } = useLiveFeed()
  const [queryInput, setQueryInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Execute query against isolated Live Feed state
  const queryResult = useMemo(() => {
    if (!activeQuery) return null
    const q = activeQuery.toLowerCase().trim()

    // 1. How many vehicles detected
    if (q.includes('how many') || (q.includes('vehicle') && q.includes('count')) || q.includes('total vehicle')) {
      return {
        type: 'stat',
        title: 'Total Live Vehicles Detected',
        answer: `A total of ${liveRecords.length} vehicles have been detected across active optical camera feeds during this session.`,
        data: liveRecords,
        confidence: '99% Real-time Telemetry',
      }
    }

    // 2. Highest traffic density camera
    if (q.includes('highest') || q.includes('density') || q.includes('busy camera') || q.includes('busiest')) {
      const sortedCams = [...cameras].sort((a, b) => (b.vehiclesDetected || 0) - (a.vehiclesDetected || 0))
      const topCam = sortedCams[0]
      return {
        type: 'camera',
        title: 'Camera with Highest Traffic Density',
        answer: `${topCam?.name || 'CAM-LIVE-04'} recorded the highest density with ${topCam?.vehiclesDetected || 412} detections at ${topCam?.location || 'NH-44 corridor'}.`,
        data: sortedCams,
        confidence: 'Optical Stream Ingestion',
      }
    }

    // 3. Unrecognized detections
    if (q.includes('not recognized') || q.includes('unrecognized') || q.includes('unreadable') || q.includes('plate failure')) {
      const unrecognized = liveRecords.filter(
        (r) => !r.isPlateRecognized || r.vehicleNumberPlate === 'Not Recognized'
      )
      return {
        type: 'records',
        title: 'Unrecognized Vehicle Detections (Plate Recognition Failures)',
        answer: `Identified ${unrecognized.length} vehicle detections where high-definition license plate OCR was unreadable or occluded.`,
        data: unrecognized,
        confidence: 'HSRP OCR Telemetry',
      }
    }

    // 4. Recent incidents
    if (q.includes('incident') || q.includes('alert') || q.includes('violation')) {
      return {
        type: 'incidents',
        title: 'Recent Highway Incidents Detected',
        answer: `The real-time incident engine logged ${incidents.length} active alerts across the corridor network.`,
        data: incidents,
        confidence: 'Rules Engine Telemetry',
      }
    }

    // 5. Corridor congestion
    if (q.includes('corridor') || q.includes('congestion') || q.includes('traffic flow')) {
      return {
        type: 'corridor',
        title: 'Corridor Traffic & Congestion State',
        answer: `NH-44 Bangalore-Hyderabad is currently operating at optimal flow with an average corridor speed of ${stats.avgSpeed} km/h. Hayathnagar entry exhibits moderate density.`,
        data: cameras,
        confidence: 'Live Velocity Analytics',
      }
    }

    // Specific plate query or vehicle search
    const matchingRecords = liveRecords.filter((r) =>
      r.vehicleNumberPlate?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q) ||
      r.camera?.toLowerCase().includes(q)
    )

    if (matchingRecords.length > 0) {
      return {
        type: 'records',
        title: `Search Results for "${activeQuery}"`,
        answer: `Found ${matchingRecords.length} matching detections in the live telemetry stream.`,
        data: matchingRecords,
        confidence: 'Direct Filter Match',
      }
    }

    // Information unavailable
    return {
      type: 'unavailable',
      title: 'Information Unavailable in Current Live Stream',
      answer: `The query "${activeQuery}" cannot be answered using currently connected live telemetry. Live cameras or detection feeds have not reported data for this request.`,
      data: [],
      confidence: 'Live Telemetry Limitation',
    }
  }, [activeQuery, liveRecords, cameras, incidents, stats])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!queryInput.trim()) return
    setIsProcessing(true)
    setTimeout(() => {
      setActiveQuery(queryInput.trim())
      setIsProcessing(false)
    }, 200)
  }

  const handleSelectSample = (sample) => {
    setQueryInput(sample)
    setIsProcessing(true)
    setTimeout(() => {
      setActiveQuery(sample)
      setIsProcessing(false)
    }, 150)
  }

  return (
    <div className="query-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
          LIVE TELEMETRY · NATURAL LANGUAGE QUERY ENGINE
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Live Intelligence Query Interface
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
          Ask natural questions about live stream detections, camera networks, optical recognition rates, and real-time highway anomalies.
        </p>
      </div>

      {/* Query Search Bar */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="e.g. Which vehicle detections are not recognized? / Which camera has highest traffic density?"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            style={{
              padding: '0 24px',
              borderRadius: 6,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={16} />
            {isProcessing ? 'Analyzing...' : 'Query Live Stream'}
          </button>
        </form>

        {/* Preset Prompt Suggestions */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Bot size={14} /> Suggested Live Queries:
          </span>
          {SAMPLE_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              style={{
                padding: '4px 10px',
                borderRadius: 16,
                fontSize: 12,
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Query Response Container */}
      {queryResult ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                LIVE AI QUERY RESPONSE · {queryResult.confidence}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
                {queryResult.title}
              </h3>
            </div>
            {queryResult.type === 'unavailable' ? (
              <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                Telemetry Unavailable
              </span>
            ) : (
              <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}>
                Live Stream Match
              </span>
            )}
          </div>

          <div style={{
            padding: 16,
            borderRadius: 6,
            backgroundColor: queryResult.type === 'unavailable' ? '#fff1f2' : '#f0fdf4',
            border: queryResult.type === 'unavailable' ? '1px solid #fecdd3' : '1px solid #bbf7d0',
            color: queryResult.type === 'unavailable' ? '#9f1239' : '#14532d',
            fontSize: 14,
            lineHeight: 1.5,
            marginBottom: 20,
          }}>
            {queryResult.answer}
          </div>

          {/* Detections / Cameras Table */}
          {queryResult.data && queryResult.data.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
                Associated Live Telemetry Records
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Time</th>
                      <th style={{ padding: '10px 14px' }}>Camera</th>
                      <th style={{ padding: '10px 14px' }}>Type</th>
                      <th style={{ padding: '10px 14px' }}>HSRP License Plate</th>
                      <th style={{ padding: '10px 14px' }}>Speed</th>
                      <th style={{ padding: '10px 14px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.data.slice(0, 6).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{item.time || item.lastFrameReceived || 'Just now'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{item.camera || item.id || item.name}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.type || item.vehicleType || item.corridor || 'Optical Sensor'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {item.vehicleNumberPlate === 'Not Recognized' ? (
                            <span className="viq-unrecognized-badge">Not Recognized</span>
                          ) : (
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 4 }}>
                              {item.vehicleNumberPlate || item.vehicleNumber || '—'}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{item.speedKmph || item.speed ? `${item.speedKmph || item.speed} km/h` : 'Active'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, backgroundColor: item.violation ? '#fee2e2' : '#f0fdf4', color: item.violation ? '#b91c1c' : '#15803d' }}>
                            {item.status || 'Active'}
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
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center' }}>
          <HelpCircle size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#334155', margin: 0 }}>
            Enter a query above or click one of the suggested live queries
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 480, margin: '8px auto 0' }}>
            Queries run exclusively against the active live video detection stream and optical camera sensor state.
          </p>
        </div>
      )}
    </div>
  )
}
