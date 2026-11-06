import React, { useState, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  Battery,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Filter,
  Info,
  Layers,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Tv,
  VideoOff,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'

export default function LiveAssetsMaintenance() {
  const { maintenanceAssets } = useLiveFeed()
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)

  const filteredAssets = useMemo(() => {
    return maintenanceAssets.filter((a) => {
      const matchStatus = statusFilter === 'All' || a.status === statusFilter
      const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.assetId.toLowerCase().includes(searchQuery.toLowerCase()) || a.camera.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [maintenanceAssets, statusFilter, searchQuery])

  return (
    <div className="assets-maintenance-page" style={{ padding: '24px 32px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · SENSOR HEALTH & ANPR MAINTENANCE
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Assets & Sensor Health
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Optical camera diagnostics, edge inference hardware health, network latency telemetry, and maintenance schedules.
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
          <Wrench size={14} />
          {maintenanceAssets.length} Optical Sensor Assets Monitored
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Network Health Score</span>
            <Activity size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>92%</div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 4 }}>Optical AI cluster operational</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Operational Sensors</span>
            <CheckCircle2 size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
            {maintenanceAssets.filter((a) => a.status === 'Operational').length} / {maintenanceAssets.length}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Passing health telemetry</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Attention Required</span>
            <AlertTriangle size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {maintenanceAssets.filter((a) => a.status === 'Attention Required').length}
          </div>
          <div style={{ fontSize: 12, color: '#d97706', marginTop: 4 }}>High latency or thermal warning</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Offline Nodes</span>
            <VideoOff size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {maintenanceAssets.filter((a) => a.status === 'Disconnected').length}
          </div>
          <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Service technician dispatched</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{ backgroundColor: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={15} /> Status:
          </span>
          {['All', 'Operational', 'Attention Required', 'Disconnected'].map((st) => (
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
            placeholder="Search sensor unit or camera..."
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

      {/* Assets Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Optical Hardware & ANPR Unit Diagnostics
          </h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Showing {filteredAssets.length} hardware assets
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Asset ID</th>
                <th style={{ padding: '10px 14px' }}>Equipment Name</th>
                <th style={{ padding: '10px 14px' }}>Camera Node</th>
                <th style={{ padding: '10px 14px' }}>Health Score</th>
                <th style={{ padding: '10px 14px' }}>Firmware</th>
                <th style={{ padding: '10px 14px' }}>Temperature</th>
                <th style={{ padding: '10px 14px' }}>Latency</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.assetId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                    {asset.assetId}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{asset.name}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0284c7' }}>{asset.camera}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${asset.healthScore}%`,
                          height: '100%',
                          backgroundColor: asset.healthScore > 80 ? '#10b981' : asset.healthScore > 50 ? '#f59e0b' : '#ef4444',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{asset.healthScore}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                    {asset.firmwareVersion}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{asset.temperature}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{asset.networkLatency}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: asset.status === 'Operational' ? '#dcfce7' : asset.status === 'Attention Required' ? '#fef3c7' : '#fee2e2',
                      color: asset.status === 'Operational' ? '#15803d' : asset.status === 'Attention Required' ? '#b45309' : '#b91c1c',
                    }}>
                      {asset.status}
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
