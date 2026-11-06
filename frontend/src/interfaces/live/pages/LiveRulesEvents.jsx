import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Filter,
  Info,
  Layers,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'

const INITIAL_LIVE_RULES = [
  {
    id: 'RULE-LIVE-01',
    name: 'Number Plate Not Recognized (HSRP OCR Failure)',
    description: 'Triggers when a moving vehicle passes through optical ANPR field without recognizable license plate characters.',
    triggerCondition: 'OCR confidence < 0.60 or plate unreadable',
    action: 'Generate Inspection Alert & Flag in Live Feed',
    severity: 'High',
    enabled: true,
    triggersToday: 14,
    lastTriggered: '15:42:48',
  },
  {
    id: 'RULE-LIVE-02',
    name: 'Over-speed Threshold Exceeded (>80 km/h)',
    description: 'Monitors optical telemetry velocity vectors. Triggers when vehicle exceeds designated corridor speed ceiling.',
    triggerCondition: 'Speed > 80 km/h',
    action: 'Record Violation & Log Evidence Snapshot',
    severity: 'Medium',
    enabled: true,
    triggersToday: 8,
    lastTriggered: '15:42:30',
  },
  {
    id: 'RULE-LIVE-03',
    name: 'Camera Stream Disconnected / Frame Loss',
    description: 'Detects RTSP/optical stream frame drops or heartbeat loss exceeding 10 seconds.',
    triggerCondition: 'Frame timeout > 10s',
    action: 'Dispatch Asset Sensor Warning & Notify Ops',
    severity: 'High',
    enabled: true,
    triggersToday: 1,
    lastTriggered: '15:24:10',
  },
  {
    id: 'RULE-LIVE-04',
    name: 'Heavy Commercial Vehicle in Express Lane',
    description: 'Detects heavy multi-axle trucks or construction machinery occupying Lane 2 (Dedicated Express).',
    triggerCondition: 'Vehicle class == "Truck" & Lane == "Lane 2"',
    action: 'Issue Lane Compliance Advisory',
    severity: 'Low',
    enabled: true,
    triggersToday: 3,
    lastTriggered: '15:38:12',
  },
  {
    id: 'RULE-LIVE-05',
    name: 'Corridor Traffic Density Congestion Warning',
    description: 'Triggers when localized camera throughput exceeds 400 vehicles per hour.',
    triggerCondition: 'Hourly volume >= 400 veh/hr',
    action: 'Adjust Variable Message Signage (VMS)',
    severity: 'Medium',
    enabled: false,
    triggersToday: 0,
    lastTriggered: 'Never',
  },
]

export default function LiveRulesEvents() {
  const { liveRecords, incidents } = useLiveFeed()
  const [rules, setRules] = useState(INITIAL_LIVE_RULES)
  const [activeTab, setActiveTab] = useState('rules') // 'rules', 'history'

  const toggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  return (
    <div className="rules-events-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · AUTOMATED RULES ENGINE & EVENT TRIGGERS
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Rules & Event Framework
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Real-time optical event rules, automatic threshold alerts, unrecognized plate monitoring, and audit history.
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setActiveTab('rules')}
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: activeTab === 'rules' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: activeTab === 'rules' ? '#0284c7' : '#ffffff',
              color: activeTab === 'rules' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            Configured Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: activeTab === 'history' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: activeTab === 'history' ? '#0284c7' : '#ffffff',
              color: activeTab === 'history' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            Live Trigger History ({rules.reduce((acc, r) => acc + r.triggersToday, 0)})
          </button>
        </div>
      </div>

      {activeTab === 'rules' ? (
        /* Rules List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                padding: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0284c7' }}>
                    {rule.id}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: rule.severity === 'High' ? '#fee2e2' : rule.severity === 'Medium' ? '#fef3c7' : '#f0fdf4',
                    color: rule.severity === 'High' ? '#b91c1c' : rule.severity === 'Medium' ? '#b45309' : '#15803d',
                  }}>
                    {rule.severity} Severity
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                  {rule.name}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {rule.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
                  <div>Condition: <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{rule.triggerCondition}</strong></div>
                  <div>Action: <strong style={{ color: '#0284c7' }}>{rule.action}</strong></div>
                </div>
              </div>

              {/* Status and Toggle */}
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Triggers Today: <strong style={{ color: '#0f172a', fontSize: 15 }}>{rule.triggersToday}</strong>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Last: {rule.lastTriggered}</div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: rule.enabled ? '#dcfce7' : '#f1f5f9',
                    color: rule.enabled ? '#15803d' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: rule.enabled ? '#10b981' : '#94a3b8' }} />
                  {rule.enabled ? 'Rule Active' : 'Standby / Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Event History Stream */
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Live Stream Event Trigger Audit Log
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.map((inc, idx) => (
              <div key={idx} style={{ padding: '12px 16px', borderRadius: 6, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertCircle size={16} color={inc.severity === 'High' ? '#ef4444' : '#f59e0b'} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{inc.incidentType}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Camera: <strong>{inc.camera}</strong> · Plate: <strong>{inc.vehicleNumber}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{inc.time}</span>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Action Dispatched</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
