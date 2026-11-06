import React, { useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Info,
  MapPin,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'

export default function LiveIncidents() {
  const { incidents, liveRecords } = useLiveFeed()
  const [severityFilter, setSeverityFilter] = useState('All')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [evidenceModalItem, setEvidenceModalItem] = useState(null)

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (severityFilter === 'All') return true
      return inc.severity === severityFilter
    })
  }, [incidents, severityFilter])

  return (
    <div className="incidents-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
            LIVE TELEMETRY · HIGHWAY INCIDENTS & VIOLATIONS DISPATCH
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Incidents & Violations
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Real-time incident detection, automated collision alerts, speed enforcement, and OCR recognition failure logs.
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          fontSize: 12,
          fontWeight: 600,
        }}>
          <ShieldAlert size={14} />
          {incidents.filter((i) => i.status !== 'Resolved').length} Active Alerts Pending Action
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Live Incidents</span>
            <AlertTriangle size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{incidents.length}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Detected during active stream</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>High Severity</span>
            <AlertCircle size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {incidents.filter((i) => i.severity === 'High').length}
          </div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Urgent highway hazard / security</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Plate OCR Alerts</span>
            <ShieldAlert size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {incidents.filter((i) => i.vehicleNumber === 'Not Recognized').length}
          </div>
          <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>Unrecognized license plate events</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Resolved Incidents</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {incidents.filter((i) => i.status === 'Resolved').length}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>Clear of corridor</div>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Filter size={15} /> Severity:
        </span>
        {['All', 'High', 'Medium', 'Low'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            type="button"
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: severityFilter === sev ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: severityFilter === sev ? '#0284c7' : '#ffffff',
              color: severityFilter === sev ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Incidents Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Active Incident & Violation Records
          </h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {filteredIncidents.length} events
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Incident ID</th>
                <th style={{ padding: '10px 14px' }}>Time</th>
                <th style={{ padding: '10px 14px' }}>Incident Type</th>
                <th style={{ padding: '10px 14px' }}>Severity</th>
                <th style={{ padding: '10px 14px' }}>Location</th>
                <th style={{ padding: '10px 14px' }}>Associated Plate</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc) => (
                <tr key={inc.incidentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                    {inc.incidentId}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{inc.time}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{inc.incidentType}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: inc.severity === 'High' ? '#fee2e2' : inc.severity === 'Medium' ? '#fef3c7' : '#f0fdf4',
                      color: inc.severity === 'High' ? '#b91c1c' : inc.severity === 'Medium' ? '#b45309' : '#15803d',
                    }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{inc.location}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {inc.vehicleNumber === 'Not Recognized' ? (
                      <span className="viq-unrecognized-badge">Not Recognized</span>
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 4 }}>
                        {inc.vehicleNumber}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: inc.status === 'Resolved' ? '#f0fdf4' : '#fff1f2',
                      color: inc.status === 'Resolved' ? '#15803d' : '#be123c',
                    }}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {inc.evidenceUrl && (
                      <button
                        onClick={() => setEvidenceModalItem(inc)}
                        type="button"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#0284c7',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={12} /> View Snapshot
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {evidenceModalItem && (
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
            maxWidth: 520,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Incident Evidence Snapshot ({evidenceModalItem.incidentId})
              </h3>
              <button
                onClick={() => setEvidenceModalItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <img
                src={evidenceModalItem.evidenceUrl}
                alt="Incident Evidence"
                style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 6, marginBottom: 14 }}
              />
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                <div>Type: <strong>{evidenceModalItem.incidentType}</strong></div>
                <div>Plate: <strong>{evidenceModalItem.vehicleNumber}</strong></div>
                <div>Summary: {evidenceModalItem.summary}</div>
              </div>
            </div>
            <div style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                onClick={() => setEvidenceModalItem(null)}
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
