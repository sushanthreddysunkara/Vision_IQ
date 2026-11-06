import React, { useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Filter,
  IndianRupee,
  Info,
  Layers,
  Radio,
  RefreshCw,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wifi,
  XCircle,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'

export default function LiveTollRevenue() {
  const { tollPlazas, liveRecords, isDemoMode, setIsDemoMode } = useLiveFeed()
  const [selectedCorridor, setSelectedCorridor] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlaza, setSelectedPlaza] = useState(null)

  const filteredPlazas = useMemo(() => {
    return tollPlazas.filter((p) => {
      const matchCorridor = selectedCorridor === 'All' || p.corridor.toLowerCase().includes(selectedCorridor.toLowerCase())
      const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.corridor.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCorridor && matchSearch
    })
  }, [tollPlazas, selectedCorridor, searchQuery])

  // Aggregate simulated metrics
  const totalVolume = tollPlazas.reduce((acc, p) => acc + (p.liveHourlyVolume || 0), 0)
  const avgWait = Math.round(tollPlazas.reduce((acc, p) => acc + (p.avgWaitSeconds || 0), 0) / tollPlazas.length)

  return (
    <div className="toll-revenue-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · TOLL & REVENUE INTELLIGENCE
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Toll & Revenue Analytics
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Real-time automated toll transaction telemetry, optical lane throughput, and simulated revenue metrics.
          </p>
        </div>

        {/* Demo Mode Notice Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 6,
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <Info size={14} />
            Simulated / Demo Revenue Figures (Live Optical Ingestion Active)
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Live Toll Volume</span>
            <Building2 size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{totalVolume} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>veh/hr</span></div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> +8.4% vs last hour
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Simulated Revenue Today</span>
            <IndianRupee size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>₹ 10,50,370</div>
          <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>
            *Estimated from optical vehicle classes
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>FASTag Penetration Rate</span>
            <CreditCard size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>94.2%</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> MoRTH Target Compliant (≥92%)
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Avg Lane Clearance</span>
            <Clock size={16} color="#ea580c" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{avgWait}s</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingDown size={14} /> Below 30s congestion ceiling
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
            <Filter size={15} /> Corridor:
          </div>
          {['All', 'NH-44', 'NH-65', 'ORR'].map((corr) => (
            <button
              key={corr}
              onClick={() => setSelectedCorridor(corr)}
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search toll plaza or node..."
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

      {/* Toll Plazas Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
        {filteredPlazas.map((plaza) => (
          <div
            key={plaza.id}
            onClick={() => setSelectedPlaza(plaza)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: selectedPlaza?.id === plaza.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
              padding: 20,
              boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Km {plaza.km} · {plaza.corridor}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>
                  {plaza.name}
                </h3>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                backgroundColor: plaza.statusType === 'success' ? '#dcfce7' : '#fef3c7',
                color: plaza.statusType === 'success' ? '#15803d' : '#b45309',
              }}>
                {plaza.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>LIVE HOURLY FLOW</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{plaza.liveHourlyVolume} veh</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>SIMULATED REVENUE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{plaza.revenueToday}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>FASTAG %</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{plaza.fastagRate}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>AVG CLEARANCE</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{plaza.avgWaitSeconds}s</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#64748b' }}>
              <span>Lanes: <strong>{plaza.activeLanes} Active</strong></span>
              <span>Optical Feed: <strong style={{ color: '#0284c7' }}>{plaza.camId}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Live ANPR Toll Audit Log */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Live Telemetry Audit Feed (Optical Classification)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Real-time records captured from connected optical sensors with simulated toll fees.
            </p>
          </div>
          <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
            {liveRecords.length} Live Detections
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Time</th>
                <th style={{ padding: '10px 14px' }}>Camera</th>
                <th style={{ padding: '10px 14px' }}>Vehicle Class</th>
                <th style={{ padding: '10px 14px' }}>HSRP Number Plate</th>
                <th style={{ padding: '10px 14px' }}>Speed</th>
                <th style={{ padding: '10px 14px' }}>Simulated Toll</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {liveRecords.slice(0, 8).map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{record.time}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{record.camera}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{record.type || record.vehicleType}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {record.vehicleNumberPlate === 'Not Recognized' ? (
                      <span className="viq-unrecognized-badge">Not Recognized</span>
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        {record.vehicleNumberPlate}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{record.speedKmph || record.speed} km/h</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#16a34a' }}>₹ {record.tollAmount}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: record.violation ? '#fee2e2' : '#f0fdf4',
                      color: record.violation ? '#b91c1c' : '#15803d',
                    }}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
