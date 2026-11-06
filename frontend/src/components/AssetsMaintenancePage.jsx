import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Battery,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Columns,
  Cpu,
  Crosshair,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Layers,
  Lightbulb,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tv,
  VideoOff,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ageProfileStackedData,
  alertsTrendData,
  assetHealthData,
  assetKPIs,
  assetsAtDesignLifeTable,
  closedWorkOrdersWeeklyChart,
  coverageAtRiskItems,
  coverageAtRiskMetrics,
  crewWorkOrdersData,
  failureRateAgainstAgeData,
  healthByClassData,
  highPriorityOpenTodayAlerts,
  keyMapCallouts,
  lifecycleKPIs,
  lifecycleRecommendationsList,
  maintenanceSchedules,
  maintenanceTabKPIs,
  maintenanceWorkOrdersList,
  mapCities,
  otherOpenAlertsList,
  overdueIncidentsCard,
  recentAssetAlerts,
  replacementBudgetChartData,
  visibleAssetsList,
  warrantiesEndingList,
  weeklyScheduleMatrix,
  whatToDoFirstItems,
} from '../data/assetsMaintenanceData'

export default function AssetsMaintenancePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Maintenance')
  const [viewMode, setViewMode] = useState('map') // 'map' or 'list'
  const [corridorFilter, setCorridorFilter] = useState('NH-44')
  const [typeFilter, setTypeFilter] = useState('All Asset Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [timeFilter, setTimeFilter] = useState('Last 7 days')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedCallout, setSelectedCallout] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [selectedDetailedAlert, setSelectedDetailedAlert] = useState(highPriorityOpenTodayAlerts[0])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [assetSearchTerm, setAssetSearchTerm] = useState('')
  const [actionToast, setActionToast] = useState(null)

  const tabs = ['Overview', 'Asset Map', 'Alerts', 'Maintenance', 'Lifecycle']

  function renderKPIIcon(type) {
    switch (type) {
      case 'camera':
        return <Camera size={20} strokeWidth={2.4} />
      case 'vms':
        return <Tv size={20} strokeWidth={2.4} />
      case 'power':
        return <Zap size={20} strokeWidth={2.4} />
      case 'road':
        return <Columns size={20} strokeWidth={2.4} />
      case 'sensor':
        return <Wifi size={20} strokeWidth={2.4} />
      default:
        return <Cpu size={20} strokeWidth={2.4} />
    }
  }

  function renderMaintKPIIcon(type) {
    switch (type) {
      case 'file':
        return <FileText size={20} strokeWidth={2.4} />
      case 'alert':
        return <AlertTriangle size={20} strokeWidth={2.4} />
      case 'calendar':
        return <Calendar size={20} strokeWidth={2.4} />
      case 'clock':
        return <Clock size={20} strokeWidth={2.4} />
      case 'shield':
        return <ShieldCheck size={20} strokeWidth={2.4} />
      default:
        return <Wrench size={20} strokeWidth={2.4} />
    }
  }

  function renderAlertIcon(type) {
    switch (type) {
      case 'camera':
        return <Camera size={14} />
      case 'drain':
        return <Wrench size={14} />
      case 'tag':
        return <Radio size={14} />
      case 'vms':
        return <Tv size={14} />
      case 'fence':
        return <Columns size={14} />
      case 'power':
        return <Zap size={14} />
      default:
        return <AlertTriangle size={14} />
    }
  }

  function renderAssetTableIcon(type) {
    switch (type) {
      case 'camera':
        return <Camera size={14} className="text-emerald-600" />
      case 'vms':
        return <Tv size={14} className="text-emerald-600" />
      case 'power':
        return <Zap size={14} className="text-emerald-600" />
      case 'light':
        return <Lightbulb size={14} className="text-emerald-600" />
      case 'drain':
        return <Wrench size={14} className="text-red-500" />
      case 'road':
        return <Columns size={14} className="text-emerald-600" />
      case 'sensor':
        return <Wifi size={14} className="text-emerald-600" />
      case 'tag':
        return <Radio size={14} className="text-amber-500" />
      default:
        return <Cpu size={14} className="text-slate-600" />
    }
  }

  const filteredAssets = visibleAssetsList.filter((item) => {
    if (!assetSearchTerm) return true
    const term = assetSearchTerm.toLowerCase()
    return (
      item.id.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.status.toLowerCase().includes(term) ||
      item.classCategory.toLowerCase().includes(term)
    )
  })

  return (
    <div className="assets-maintenance-container">
      {/* ── TOP HEADER ── */}
      <div className="am-page-header">
        <div className="am-header-left">
          <h1 className="am-title">Assets & Maintenance</h1>
          <p className="am-subtitle">Monitor. Detect. Maintain. Keep Highways Moving.</p>
        </div>

        {/* KPI Summary Badges */}
        <div className={`am-kpi-row ${activeTab === 'Lifecycle' ? 'lifecycle-kpis' : ''}`}>
          {activeTab === 'Lifecycle'
            ? lifecycleKPIs.map((kpi) => (
                <div className="am-kpi-card am-lifecycle-kpi-card" key={kpi.id}>
                  <div className={`am-kpi-icon icon-${kpi.id}`}>
                    {kpi.icon === 'clock' && <Clock size={20} strokeWidth={2.4} />}
                    {kpi.icon === 'alert' && <AlertTriangle size={20} strokeWidth={2.4} />}
                    {kpi.icon === 'rupee' && <span className="am-kpi-rupee-symbol">₹</span>}
                    {kpi.icon === 'shield' && <ShieldCheck size={20} strokeWidth={2.4} />}
                  </div>
                  <div className="am-kpi-info">
                    <div className="am-kpi-count">
                      {kpi.count} {kpi.unit && <span className="am-kpi-unit">{kpi.unit}</span>}
                    </div>
                    <div className="am-kpi-title">{kpi.title}</div>
                    <div className={`am-lifecycle-kpi-sub ${kpi.subtextType}`}>
                      <span>{kpi.subtext}</span>
                    </div>
                  </div>
                </div>
              ))
            : activeTab === 'Maintenance'
            ? maintenanceTabKPIs.map((kpi) => (
                <div className="am-kpi-card am-maint-kpi-card" key={kpi.id}>
                  <div className={`am-kpi-icon icon-${kpi.icon}`}>
                    {renderMaintKPIIcon(kpi.icon)}
                  </div>
                  <div className="am-kpi-info">
                    <div className="am-kpi-count">{kpi.count}</div>
                    <div className="am-kpi-title">{kpi.title}</div>
                    <div className={`am-maint-kpi-change ${kpi.changeType}`}>
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              ))
            : assetKPIs.map((kpi) => (
                <div className="am-kpi-card" key={kpi.id}>
                  <div
                    className="am-kpi-icon"
                    style={{ backgroundColor: kpi.color }}
                  >
                    {renderKPIIcon(kpi.iconType)}
                  </div>
                  <div className="am-kpi-info">
                    <div className="am-kpi-count">{kpi.count}</div>
                    <div className="am-kpi-title">{kpi.title}</div>
                    <div className="am-kpi-status">
                      <span
                        className="am-status-dot"
                        style={{ backgroundColor: kpi.color }}
                      />
                      <span>{kpi.status}</span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* ── SUB-NAVIGATION TABS & FILTERS BAR ── */}
      <div className="am-subnav-bar">
        <div className="am-tabs">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`am-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="am-filters-group">
          <div className="am-select-wrap">
            <select
              value={corridorFilter}
              onChange={(e) => setCorridorFilter(e.target.value)}
              className="am-filter-select"
            >
              <option value="NH-44">NH-44</option>
              <option value="NH-65">NH-65</option>
              <option value="NH-16">NH-16</option>
            </select>
          </div>

          <div className="am-select-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="am-filter-select"
            >
              <option value="All Asset Types">All Asset Types</option>
              <option value="Cameras">Cameras</option>
              <option value="VMS Signs">VMS Signs</option>
              <option value="Power & IT">Power & IT</option>
              <option value="Road Assets">Road Assets</option>
              <option value="Sensors">Sensors</option>
            </select>
          </div>

          <div className="am-select-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="am-filter-select"
            >
              <option value="All Status">All Status</option>
              <option value="Operational">Operational</option>
              <option value="Attention">Attention Required</option>
              <option value="Fault">Fault / Offline</option>
              <option value="Maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="am-select-wrap">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="am-filter-select"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 24 hours">Last 24 hours</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="This Quarter">This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CONDITIONAL VIEW BASED ON ACTIVE TAB ── */}
      {activeTab === 'Asset Map' ? (
        /* =========================================================
           ASSET MAP TAB: VISIBLE ASSETS TABLE + COVERAGE AT RISK & ACTIONS
           ========================================================= */
        <div className="am-asset-map-page-grid">
          {/* LEFT COLUMN: VISIBLE ASSETS TABLE CARD (~65% WIDTH) */}
          <div className="am-card am-visible-assets-card">
            <div className="am-card-header">
              <div className="am-card-title-group">
                <h3>Visible assets</h3>
              </div>

              {/* Status Breakdown Chips */}
              <div className="am-status-chips-row">
                <span className="am-status-chip green">19 Healthy</span>
                <span className="am-status-chip amber">6 Attention</span>
                <span className="am-status-chip red">4 Fault / Offline</span>
                <span className="am-status-chip blue">3 Under maintenance</span>
              </div>
            </div>

            {/* Quick search input */}
            <div className="am-table-quick-search">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Filter visible assets by ID, class, nearest city, or status..."
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
              />
              {assetSearchTerm && (
                <button
                  type="button"
                  onClick={() => setAssetSearchTerm('')}
                  className="am-search-clear-btn"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="am-table-scroll-container">
              <table className="am-visible-assets-table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Asset · class</th>
                    <th>Km · nearest place</th>
                    <th>Status</th>
                    <th>Last healthy</th>
                    <th>Open ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const isHealthy = asset.status === 'Healthy'
                    const isAttention = asset.status === 'Attention'
                    const isFault = asset.status === 'Fault / Offline'
                    const isMaint = asset.status === 'Under maintenance'

                    return (
                      <tr key={asset.id} className="am-visible-asset-row">
                        {/* 1. Asset ID with icon */}
                        <td className="am-col-id">
                          <div className="am-id-cell">
                            <span className="am-asset-row-icon">
                              {renderAssetTableIcon(asset.type)}
                            </span>
                            <strong>{asset.id}</strong>
                          </div>
                        </td>

                        {/* 2. Asset · class */}
                        <td className="am-col-class">
                          <div className="am-class-cell">
                            <span className="am-asset-name">{asset.name}</span>
                            <span className="am-asset-category">{asset.classCategory}</span>
                          </div>
                        </td>

                        {/* 3. Km · nearest place */}
                        <td className="am-col-km">
                          <span className="am-km-text">{asset.location}</span>
                        </td>

                        {/* 4. Status Pill */}
                        <td className="am-col-status">
                          <span
                            className={`am-table-status-pill ${
                              isHealthy
                                ? 'status-healthy'
                                : isAttention
                                ? 'status-attention'
                                : isFault
                                ? 'status-fault'
                                : 'status-maint'
                            }`}
                          >
                            {asset.status}
                          </span>
                        </td>

                        {/* 5. Last healthy */}
                        <td className="am-col-last">
                          <span className={`am-last-text ${asset.lastHealthy === 'Now' ? 'is-now' : ''}`}>
                            {asset.lastHealthy}
                          </span>
                        </td>

                        {/* 6. Open ticket */}
                        <td className="am-col-ticket">
                          {asset.openTicket !== 'None' ? (
                            <button
                              type="button"
                              className="am-ticket-link-btn"
                              onClick={() => {
                                setSelectedTicket({
                                  id: asset.openTicket,
                                  assetId: asset.id,
                                  location: asset.location,
                                  status: asset.status,
                                })
                                setTicketModalOpen(true)
                              }}
                            >
                              <span>{asset.openTicket}</span>
                              <ChevronRight size={13} />
                            </button>
                          ) : (
                            <span className="am-ticket-none">None</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: 3 STACKED CARDS (~35% WIDTH) */}
          <div className="am-map-right-sidebar">
            {/* CARD 1: COVERAGE AT RISK */}
            <div className="am-card am-risk-card">
              <div className="am-card-header">
                <div className="am-card-title-group">
                  <div className="am-title-with-icon">
                    <ShieldAlert size={16} className="text-red-500" />
                    <h3>Coverage at risk</h3>
                  </div>
                </div>
                <span className="am-card-sub-tag">Asset failure impact</span>
              </div>

              {/* Top 3 Metric Counters */}
              <div className="am-risk-metrics-row">
                <div className="am-risk-metric-box">
                  <div className="am-metric-number red">{coverageAtRiskMetrics.blindKm}</div>
                  <div className="am-metric-label">{coverageAtRiskMetrics.blindKmLabel}</div>
                </div>
                <div className="am-risk-metric-box">
                  <div className="am-metric-number amber">{coverageAtRiskMetrics.stretches}</div>
                  <div className="am-metric-label">{coverageAtRiskMetrics.stretchesLabel}</div>
                </div>
                <div className="am-risk-metric-box">
                  <div className="am-metric-number red">{coverageAtRiskMetrics.incidents}</div>
                  <div className="am-metric-label">{coverageAtRiskMetrics.incidentsLabel}</div>
                </div>
              </div>

              {/* List of Risk Impact Items */}
              <div className="am-risk-items-list">
                {coverageAtRiskItems.map((item) => (
                  <div className="am-risk-item" key={item.id}>
                    <div className="am-risk-item-header">
                      <div className="am-risk-loc-group">
                        {item.icon === 'camera' && <Camera size={14} className="am-risk-item-icon" />}
                        {item.icon === 'drain' && <Wrench size={14} className="am-risk-item-icon" />}
                        {item.icon === 'fence' && <Columns size={14} className="am-risk-item-icon" />}
                        {item.icon === 'power' && <Zap size={14} className="am-risk-item-icon" />}
                        {item.icon === 'tag' && <Radio size={14} className="am-risk-item-icon" />}
                        <h4>{item.location}</h4>
                      </div>
                      <span className={`am-risk-tag ${item.tagType}`}>{item.tag}</span>
                    </div>

                    <p className="am-risk-desc">{item.description}</p>
                    <p className="am-risk-subtext">{item.subtext}</p>
                    <ChevronRight size={14} className="am-risk-item-arrow" />
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 2: WHAT TO DO FIRST */}
            <div className="am-card am-todo-card">
              <div className="am-card-header">
                <h3>What to do first</h3>
              </div>

              <div className="am-todo-list">
                {whatToDoFirstItems.map((todo) => (
                  <div className="am-todo-item" key={todo.id}>
                    <div className={`am-todo-icon-wrap ${todo.icon}`}>
                      {todo.icon === 'sparkle' ? <Sparkles size={16} /> : <Wrench size={16} />}
                    </div>
                    <div className="am-todo-content">
                      <h4>{todo.title}</h4>
                      <p>{todo.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: HEALTH BY CLASS, WHOLE CORRIDOR */}
            <div className="am-card am-class-health-card">
              <div className="am-card-header">
                <h3>Health by class, whole corridor</h3>
              </div>

              <div className="am-class-bars-list">
                {healthByClassData.map((cls) => (
                  <div className="am-class-bar-row" key={cls.name}>
                    <div className="am-class-name-wrap">
                      {cls.icon === 'camera' && <Camera size={14} />}
                      {cls.icon === 'vms' && <Tv size={14} />}
                      {cls.icon === 'power' && <Zap size={14} />}
                      {cls.icon === 'road' && <Columns size={14} />}
                      {cls.icon === 'sensor' && <Wifi size={14} />}
                      <span>{cls.name}</span>
                    </div>

                    <div className="am-class-bar-track">
                      <div
                        className="am-class-bar-fill"
                        style={{
                          width: `${cls.percentage}%`,
                          backgroundColor: cls.color,
                        }}
                      />
                    </div>

                    <div className="am-class-pct-label">
                      <strong>{cls.percentage}%</strong> <span>of {cls.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="am-class-card-footer">
                <span>The map shows 32 key assets. These figures cover all 2,412.</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'Alerts' ? (
        /* =========================================================
           ALERTS TAB: HIGH PRIORITY & OTHER ALERTS + LIVE FEED LINK TO CAMERA NETWORK
           ========================================================= */
        <div className="am-alerts-page-grid">
          {/* TOAST FEEDBACK NOTIFICATION */}
          {actionToast && (
            <div className="am-action-toast">
              <CheckCircle2 size={16} />
              <span>{actionToast}</span>
            </div>
          )}

          {/* LEFT COLUMN: 2 CARDS (HIGH PRIORITY + OTHER OPEN ALERTS) */}
          <div className="am-alerts-left-column">
            {/* 1. HIGH PRIORITY · OPEN TODAY */}
            <div className="am-card am-alerts-panel-card">
              <div className="am-card-header">
                <div className="am-title-with-icon">
                  <ShieldAlert size={16} className="text-red-500" />
                  <h3>High priority · open today</h3>
                </div>
                <div className="am-badge-counter-group">
                  <span className="am-badge-pill light-red">5 open</span>
                  <span className="am-badge-pill red">2 new</span>
                </div>
              </div>

              <div className="am-alerts-scroll-list">
                {highPriorityOpenTodayAlerts.map((alt) => {
                  const isSelected = selectedDetailedAlert?.id === alt.id
                  return (
                    <div
                      key={alt.id}
                      className={`am-alert-row-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedDetailedAlert(alt)}
                    >
                      <div className="am-alert-row-thumb">
                        <img src={alt.image} alt={alt.title} />
                        <div className="am-alert-row-thumb-icon">
                          {renderAlertIcon(alt.type)}
                        </div>
                      </div>

                      <div className="am-alert-row-body">
                        <div className="am-alert-row-title-line">
                          <h4 className="am-alert-row-title">{alt.title}</h4>
                          {alt.isNew && <span className="am-badge-new">NEW</span>}
                        </div>
                        <div className="am-alert-row-sub">
                          <span>{alt.code} · {alt.location}</span>
                        </div>
                        <div className="am-alert-row-desc">
                          <span>{alt.subtext}</span>
                        </div>
                      </div>

                      <div className="am-alert-row-badge-wrap">
                        <span className="am-priority-pill high">
                          <span>{alt.priority}</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. OTHER OPEN ALERTS */}
            <div className="am-card am-alerts-panel-card mt-4">
              <div className="am-card-header">
                <h3>Other open alerts</h3>
                <span className="am-card-sub-count">6 medium and low</span>
              </div>

              <div className="am-alerts-scroll-list">
                {otherOpenAlertsList.map((alt) => {
                  const isSelected = selectedDetailedAlert?.id === alt.id
                  const isMedium = alt.priority === 'Medium'
                  return (
                    <div
                      key={alt.id}
                      className={`am-alert-row-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedDetailedAlert(alt)}
                    >
                      <div className="am-alert-row-thumb">
                        {alt.image ? (
                          <img src={alt.image} alt={alt.title} />
                        ) : (
                          <div className="am-alert-thumb-placeholder">
                            {renderAlertIcon(alt.type)}
                          </div>
                        )}
                        <div className="am-alert-row-thumb-icon">
                          {renderAlertIcon(alt.type)}
                        </div>
                      </div>

                      <div className="am-alert-row-body">
                        <h4 className="am-alert-row-title">{alt.title}</h4>
                        <div className="am-alert-row-sub">
                          <span>{alt.code} · {alt.location}</span>
                        </div>
                        <div className="am-alert-row-desc">
                          <span>{alt.subtext}</span>
                        </div>
                      </div>

                      <div className="am-alert-row-badge-wrap">
                        <span className={`am-priority-pill ${isMedium ? 'medium' : 'low'}`}>
                          <span>{alt.priority}</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ALERT DETAIL + DIAGNOSTICS + ACTIONS */}
          <div className="am-alerts-right-column">
            {/* CARD 1: ALERT OVERVIEW & DIAGNOSTICS */}
            <div className="am-card am-alert-detail-card">
              {/* Header */}
              <div className="am-card-header">
                <div className="am-title-with-icon">
                  {renderAlertIcon(selectedDetailedAlert.type)}
                  <h3>{selectedDetailedAlert.title}</h3>
                </div>

                <div className="am-detail-badges-group">
                  {selectedDetailedAlert.isNew && <span className="am-badge-new">NEW</span>}
                  <span className={`am-priority-pill ${selectedDetailedAlert.priority.toLowerCase()}`}>
                    {selectedDetailedAlert.priority}
                  </span>
                  <span className="am-table-status-pill status-fault">
                    {selectedDetailedAlert.status}
                  </span>
                </div>
              </div>

              {/* Two-Column Detail Body: Live Feed / Player + Diagnostics */}
              <div className="am-alert-detail-body-grid">
                {/* LEFT: LIVE FEED / CAMERA NETWORK PLACEHOLDER */}
                <div
                  className="am-alert-video-placeholder"
                  onClick={() => navigate('/dashboards/cameras')}
                  title="Click to view full stream in Camera Network page"
                >
                  <div className="am-video-overlay-badge">
                    <Camera size={13} />
                    <span>Live Feed Channel</span>
                  </div>

                  <div className="am-video-offline-content">
                    <div className="am-video-off-icon-wrap">
                      <Camera size={30} strokeWidth={1.75} />
                      <div className="am-video-slash-bar" />
                    </div>

                    <p className="am-no-feed-text">
                      {selectedDetailedAlert.observedState?.includes('No video')
                        ? `No video feed since ${selectedDetailedAlert.alertRaised?.split(' · ')[0] || '08:32 AM'}`
                        : `Live telemetry stream interrupted`}
                    </p>

                    {/* Prominent link to Camera Network page */}
                    <button
                      type="button"
                      className="am-link-to-camera-network-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/dashboards/cameras')
                      }}
                    >
                      <Camera size={15} />
                      <span>View in Camera Network</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>

                  <div className="am-video-corner-tag">
                    <span>{selectedDetailedAlert.code} · Live Feed</span>
                  </div>
                </div>

                {/* RIGHT: STATE DIAGNOSTICS & AI INFERENCE */}
                <div className="am-alert-diagnostics-col">
                  {/* 1. Expected state */}
                  <div className="am-diag-row">
                    <div className="am-diag-label">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      <span>Expected state</span>
                    </div>
                    <div className="am-diag-value">
                      <p>{selectedDetailedAlert.expectedState}</p>
                    </div>
                  </div>

                  {/* 2. Observed state */}
                  <div className="am-diag-row">
                    <div className="am-diag-label">
                      <Eye size={15} className="text-blue-500" />
                      <span>Observed state</span>
                    </div>
                    <div className="am-diag-value">
                      <p className={selectedDetailedAlert.observedStateAlert ? 'text-red-highlight' : ''}>
                        {selectedDetailedAlert.observedState}
                      </p>
                    </div>
                  </div>

                  {/* 3. Affected coverage */}
                  <div className="am-diag-row">
                    <div className="am-diag-label">
                      <Layers size={15} className="text-sky-500" />
                      <span>Affected coverage</span>
                    </div>
                    <div className="am-diag-value">
                      <p>{selectedDetailedAlert.affectedCoverage}</p>
                    </div>
                  </div>

                  {/* 4. Probable issue (AI) */}
                  <div className="am-diag-row">
                    <div className="am-diag-label">
                      <Sparkles size={15} className="text-indigo-500" />
                      <span>Probable issue (AI)</span>
                    </div>
                    <div className="am-diag-value">
                      <p>
                        {selectedDetailedAlert.probableIssue}{' '}
                        <span className="am-confidence-chip">
                          Confidence {selectedDetailedAlert.confidence}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* 5. Operational risk */}
                  <div className="am-diag-row">
                    <div className="am-diag-label">
                      <Shield size={15} className="text-amber-500" />
                      <span>Operational risk</span>
                    </div>
                    <div className="am-diag-value">
                      <p>{selectedDetailedAlert.operationalRisk}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Metadata Bar */}
              <div className="am-alert-meta-bar">
                <div className="am-meta-item">
                  <span className="am-meta-label">
                    <Cpu size={13} /> Asset ID
                  </span>
                  <strong>{selectedDetailedAlert.code}</strong>
                </div>

                <div className="am-meta-item">
                  <span className="am-meta-label">
                    <MapPin size={13} /> Location
                  </span>
                  <strong>{selectedDetailedAlert.detailedLocation || selectedDetailedAlert.location}</strong>
                </div>

                <div className="am-meta-item">
                  <span className="am-meta-label">
                    <Clock size={13} /> Alert raised
                  </span>
                  <strong>{selectedDetailedAlert.alertRaised}</strong>
                </div>

                <div className="am-meta-item">
                  <span className="am-meta-label">
                    <CheckCircle2 size={13} /> Last healthy
                  </span>
                  <strong>{selectedDetailedAlert.lastHealthy}</strong>
                </div>
              </div>
            </div>

            {/* CARD 2 & 3: REPAIR & ACTIONS ROW */}
            <div className="am-alerts-mid-row">
              {/* REPAIR CARD */}
              <div className="am-card am-repair-card">
                <div className="am-card-header">
                  <div className="am-title-with-icon">
                    <Wrench size={16} className="text-blue-600" />
                    <h3>Repair</h3>
                  </div>
                </div>

                <div className="am-repair-content">
                  <div className="am-repair-row">
                    <span className="am-repair-label">Nearest team</span>
                    <strong className="am-repair-val">
                      {selectedDetailedAlert.repair?.nearestTeam}
                    </strong>
                  </div>

                  <div className="am-repair-row">
                    <span className="am-repair-label">ETA</span>
                    <strong className="am-repair-val">
                      {selectedDetailedAlert.repair?.eta}
                    </strong>
                  </div>

                  <div className="am-repair-row">
                    <span className="am-repair-label">Repair priority</span>
                    <strong className="am-repair-val">
                      {selectedDetailedAlert.repair?.priority}
                    </strong>
                  </div>

                  <div className="am-repair-row">
                    <span className="am-repair-label">Work order</span>
                    <strong className="am-repair-val">
                      {selectedDetailedAlert.repair?.workOrder}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="am-open-maintenance-btn"
                    onClick={() => {
                      setSelectedTicket({
                        id: selectedDetailedAlert.repair?.workOrder?.replace(/ \(.*\)/, '') || 'MT-5164',
                        assetId: selectedDetailedAlert.code,
                        location: selectedDetailedAlert.detailedLocation || selectedDetailedAlert.location,
                        status: selectedDetailedAlert.status,
                      })
                      setTicketModalOpen(true)
                    }}
                  >
                    <Wrench size={14} />
                    <span>Open maintenance</span>
                  </button>
                </div>
              </div>

              {/* ACTIONS CARD */}
              <div className="am-card am-actions-card">
                <div className="am-card-header">
                  <div className="am-title-with-icon">
                    <Zap size={16} className="text-blue-600" />
                    <h3>Actions</h3>
                  </div>
                </div>

                <div className="am-actions-list">
                  {selectedDetailedAlert.actions?.map((act) => (
                    <div className="am-action-item-row" key={act.id}>
                      <div className="am-action-icon-wrap">
                        {act.title.toLowerCase().includes('work order') && <Cpu size={15} />}
                        {act.title.toLowerCase().includes('dispatch') && <Navigation size={15} />}
                        {act.title.toLowerCase().includes('switch') && <RefreshCw size={15} />}
                        {act.title.toLowerCase().includes('snooze') && <Clock size={15} />}
                        {!act.title.toLowerCase().includes('work') &&
                          !act.title.toLowerCase().includes('dispatch') &&
                          !act.title.toLowerCase().includes('switch') &&
                          !act.title.toLowerCase().includes('snooze') && <Activity size={15} />}
                      </div>

                      <div className="am-action-text-wrap">
                        <h4>{act.title}</h4>
                        <p>{act.desc}</p>
                      </div>

                      <button
                        type="button"
                        className={`am-action-btn ${act.btnType === 'primary' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => {
                          if (act.title.toLowerCase().includes('backup')) {
                            setActionToast('Switched to backup: CAM-0960 PTZ pointed south.')
                          } else if (act.title.toLowerCase().includes('dispatch')) {
                            setActionToast(`Technician dispatched: ${selectedDetailedAlert.repair?.nearestTeam}`)
                          } else if (act.title.toLowerCase().includes('work order')) {
                            setSelectedTicket({
                              id: selectedDetailedAlert.repair?.workOrder?.replace(/ \(.*\)/, '') || 'MT-5164',
                              assetId: selectedDetailedAlert.code,
                              location: selectedDetailedAlert.location,
                              status: selectedDetailedAlert.status,
                            })
                            setTicketModalOpen(true)
                          } else if (act.title.toLowerCase().includes('snooze')) {
                            setActionToast(`Alert ${selectedDetailedAlert.code} snoozed for 2 hours.`)
                          } else {
                            setActionToast(`Action executed: ${act.title}`)
                          }
                          setTimeout(() => setActionToast(null), 4000)
                        }}
                      >
                        {act.btnText}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CORRIDOR MISSION & VALUES BOTTOM BANNER */}
            <div className="am-mission-footer-banner">
              <div className="am-mission-pillars-group">
                <div className="am-mission-pillar">
                  <ShieldCheck size={20} className="text-blue-600" />
                  <div>
                    <h5>Safer People</h5>
                    <p>Well-maintained assets prevent incidents.</p>
                  </div>
                </div>

                <div className="am-mission-pillar">
                  <Columns size={20} className="text-slate-600" />
                  <div>
                    <h5>Smoother Journeys</h5>
                    <p>Reliable infrastructure keeps traffic moving.</p>
                  </div>
                </div>

                <div className="am-mission-pillar">
                  <span className="am-currency-symbol">₹</span>
                  <div>
                    <h5>Stronger Economy</h5>
                    <p>Less downtime. Higher productivity.</p>
                  </div>
                </div>

                <div className="am-mission-pillar">
                  <Sparkles size={20} className="text-emerald-600" />
                  <div>
                    <h5>Greener Highways</h5>
                    <p>Efficient assets reduce emissions.</p>
                  </div>
                </div>
              </div>

              <div className="am-mission-motto">
                <span>INTELLIGENCE TODAY.</span>
                <strong>STRONGER TOMORROW.</strong>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'Maintenance' ? (
        /* =========================================================
           MAINTENANCE TAB: WORK ORDERS TABLE + OVERDUE CARD + CREW BARS + CLOSED CHART + WEEKLY SCHEDULE GANTT
           ========================================================= */
        <div className="am-maintenance-page-layout">
          {/* TOAST FEEDBACK NOTIFICATION */}
          {actionToast && (
            <div className="am-action-toast">
              <CheckCircle2 size={16} />
              <span>{actionToast}</span>
            </div>
          )}

          {/* TOP SPLIT: WORK ORDERS TABLE (LEFT ~68%) + 3 IMPACT/INSIGHT CARDS (RIGHT ~32%) */}
          <div className="am-maint-top-grid">
            {/* LEFT COLUMN: WORK ORDERS TABLE */}
            <div className="am-card am-work-orders-card">
              <div className="am-card-header">
                <div className="am-title-with-icon">
                  <Wrench size={16} className="text-blue-600" />
                  <h3>Work orders</h3>
                </div>

                <div className="am-maint-header-actions">
                  <span className="am-maint-sub-count">12 of 64 open, highest priority first</span>
                  <button
                    type="button"
                    className="am-new-work-order-btn"
                    onClick={() => {
                      setSelectedTicket(null)
                      setTicketModalOpen(true)
                    }}
                  >
                    <Plus size={14} />
                    <span>New work order</span>
                  </button>
                </div>
              </div>

              {/* Work Orders Table */}
              <div className="am-work-orders-table-wrap">
                <table className="am-work-orders-table">
                  <thead>
                    <tr>
                      <th>Work order</th>
                      <th>Asset</th>
                      <th>Km</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Crew</th>
                      <th>Raised</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceWorkOrdersList.map((wo) => {
                      const isCorrective = wo.type === 'Corrective'
                      const isP1 = wo.priority === 'P1'
                      const isP2 = wo.priority === 'P2'

                      return (
                        <tr
                          key={wo.id}
                          className="am-wo-row"
                          onClick={() => {
                            setSelectedTicket({
                              id: wo.id,
                              assetId: wo.assetId,
                              location: `${wo.km} (${wo.crew})`,
                              status: wo.status,
                            })
                            setTicketModalOpen(true)
                          }}
                        >
                          {/* 1. Work Order ID */}
                          <td className="am-wo-col-id">
                            <strong>{wo.id}</strong>
                          </td>

                          {/* 2. Asset ID & Name */}
                          <td className="am-wo-col-asset">
                            <div className="am-wo-asset-cell">
                              <strong>{wo.assetId}</strong>
                              <span className="am-wo-asset-name">{wo.assetName}</span>
                            </div>
                          </td>

                          {/* 3. Km */}
                          <td className="am-wo-col-km">
                            <span>{wo.km}</span>
                          </td>

                          {/* 4. Type (Corrective or Preventive with colored square) */}
                          <td className="am-wo-col-type">
                            <div className="am-wo-type-cell">
                              <span
                                className={`am-wo-type-square ${
                                  isCorrective ? 'corrective' : 'preventive'
                                }`}
                              />
                              <span>{wo.type}</span>
                            </div>
                          </td>

                          {/* 5. Priority Pill */}
                          <td className="am-wo-col-priority">
                            <span
                              className={`am-priority-tag ${
                                isP1 ? 'p1' : isP2 ? 'p2' : 'p3'
                              }`}
                            >
                              {wo.priority}
                            </span>
                          </td>

                          {/* 6. Crew */}
                          <td className="am-wo-col-crew">
                            <span>{wo.crew}</span>
                          </td>

                          {/* 7. Raised Date */}
                          <td className="am-wo-col-raised">
                            <span>{wo.raised}</span>
                          </td>

                          {/* 8. Due Date */}
                          <td className="am-wo-col-due">
                            <span>{wo.due}</span>
                          </td>

                          {/* 9. Status Badge with optional incident subtitle */}
                          <td className="am-wo-col-status">
                            <div className="am-wo-status-cell">
                              <span className={`am-wo-status-badge ${wo.statusType}`}>
                                {wo.status}
                              </span>
                              {wo.rootCause && (
                                <span className="am-wo-root-cause">{wo.rootCause}</span>
                              )}
                            </div>
                          </td>

                          {/* 10. Link Arrow */}
                          <td className="am-wo-col-arrow">
                            <ChevronRight size={14} className="am-wo-arrow-icon" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: 3 STACKED CARDS */}
            <div className="am-maint-right-sidebar">
              {/* CARD 1: OVERDUE WORK IS CAUSING INCIDENTS */}
              <div className="am-card am-overdue-incidents-card">
                <div className="am-overdue-header">
                  <AlertTriangle size={16} className="text-red-600" />
                  <h4>{overdueIncidentsCard.title}</h4>
                </div>
                <p className="am-overdue-desc">{overdueIncidentsCard.description}</p>

                <div className="am-overdue-items-list">
                  {overdueIncidentsCard.items.map((item) => (
                    <div
                      key={item.id}
                      className="am-overdue-item"
                      onClick={() => {
                        const wo = maintenanceWorkOrdersList.find((w) => w.id === item.id)
                        setSelectedTicket({
                          id: item.id,
                          assetId: wo?.assetId || 'ASSET',
                          location: wo?.km || 'NH-44',
                          status: wo?.status || 'Overdue',
                        })
                        setTicketModalOpen(true)
                      }}
                    >
                      <div className="am-overdue-item-icon">
                        {item.type === 'drain' ? (
                          <Wrench size={14} className="text-red-600" />
                        ) : (
                          <Columns size={14} className="text-red-600" />
                        )}
                      </div>
                      <div className="am-overdue-item-text">
                        <h5>{item.title}</h5>
                        <p>{item.subtitle}</p>
                      </div>
                      <ChevronRight size={14} className="am-overdue-item-arrow" />
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 2: OPEN WORK ORDERS BY CREW */}
              <div className="am-card am-crew-orders-card">
                <div className="am-card-header">
                  <h4>Open work orders by crew</h4>
                </div>

                <div className="am-crew-bars-list">
                  {crewWorkOrdersData.map((crew) => {
                    const pct = Math.round((crew.count / crew.max) * 100)
                    return (
                      <div className="am-crew-bar-row" key={crew.name}>
                        <span className="am-crew-name">{crew.name}</span>
                        <div className="am-crew-bar-track">
                          <div
                            className="am-crew-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <strong className="am-crew-count">{crew.count}</strong>
                      </div>
                    )
                  })}
                </div>

                <div className="am-crew-footer-note">
                  <span>
                    C-6 Penukonda carries 14 of the 64 open orders and 5 of the 9 overdue. Move two
                    C-7 technicians to Penukonda for this week.
                  </span>
                </div>
              </div>

              {/* CARD 3: WORK ORDERS CLOSED, LAST 4 WEEKS (STACKED BAR CHART) */}
              <div className="am-card am-closed-orders-card">
                <div className="am-card-header">
                  <h4>Work orders closed, last 4 weeks</h4>
                  <div className="am-chart-legend">
                    <span className="am-legend-box preventive" />
                    <span>Preventive</span>
                    <span className="am-legend-box corrective" />
                    <span>Corrective</span>
                  </div>
                </div>

                <div className="am-closed-chart-wrap">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={closedWorkOrdersWeeklyChart}
                      margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="week"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 15, 30, 45, 60]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0f172a',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="preventive" stackId="a" fill="#0284c7" barSize={26} />
                      <Bar dataKey="corrective" stackId="a" fill="#f97316" barSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="am-closed-footer-note">
                  <span>
                    212 closed: 131 preventive (62%) and 81 corrective (38%). The target is 70%
                    preventive.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: WEEKLY SCHEDULE GANTT MATRIX */}
          <div className="am-card am-weekly-schedule-card">
            <div className="am-card-header">
              <div className="am-title-with-icon">
                <Calendar size={16} className="text-blue-600" />
                <h3>This week, 16 – 22 Sep</h3>
              </div>

              <div className="am-gantt-header-right">
                <div className="am-chart-legend">
                  <span className="am-legend-box preventive" />
                  <span>Preventive</span>
                  <span className="am-legend-box corrective" />
                  <span>Corrective</span>
                  <span className="am-legend-box overdue" />
                  <span>Overdue work, now booked</span>
                </div>

                <button
                  type="button"
                  className="am-schedule-action-btn"
                  onClick={() => {
                    setActionToast('Opening corridor schedule planner...')
                    setTimeout(() => setActionToast(null), 3000)
                  }}
                >
                  <Plus size={13} />
                  <span>Schedule maintenance</span>
                </button>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="am-gantt-matrix-wrap">
              {/* Day Header Row */}
              <div className="am-gantt-header-row">
                <div className="am-gantt-crew-col-hdr">Crew</div>
                {weeklyScheduleMatrix.days.map((day, idx) => (
                  <div
                    key={day}
                    className={`am-gantt-day-col-hdr ${idx === 0 ? 'is-today' : ''}`}
                  >
                    <span>{day}</span>
                  </div>
                ))}
              </div>

              {/* Crew Rows */}
              <div className="am-gantt-rows-container">
                {weeklyScheduleMatrix.crews.map((cr) => (
                  <div className="am-gantt-crew-row" key={cr.crew}>
                    <div className="am-gantt-crew-label">
                      <strong>{cr.crew}</strong>
                    </div>

                    <div className="am-gantt-days-slots">
                      {/* Background grid lines for 7 days */}
                      {weeklyScheduleMatrix.days.map((d, dIdx) => (
                        <div
                          key={d}
                          className={`am-gantt-day-slot ${dIdx === 0 ? 'is-today' : ''}`}
                        />
                      ))}

                      {/* Positioned task blocks */}
                      {cr.tasks.map((task) => (
                        <div
                          key={task.name}
                          className={`am-gantt-task-block ${task.type}`}
                          style={{
                            left: `calc(${(task.startDayIdx / 7) * 100}% + 4px)`,
                            width: `calc(${(task.span / 7) * 100}% - 8px)`,
                          }}
                          title={`${task.name} (${task.type})`}
                        >
                          <span className="am-gantt-task-text">{task.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="am-gantt-footer-caption">
              <span>
                Main jobs only; 38 tasks are scheduled this week. Both overdue jobs now have dates:
                the drain today and tomorrow, the fence on 19–20 Sep.
              </span>
            </div>
          </div>
        </div>
      ) : activeTab === 'Lifecycle' ? (
        /* =========================================================
           LIFECYCLE TAB: AGE PROFILES + FAILURE RATE + ASSETS PAST DESIGN LIFE + FORECAST/BUDGET + EXPIRING WARRANTIES + RECOMMENDATIONS
           ========================================================= */
        <div className="am-lifecycle-page-layout">
          {/* TOAST FEEDBACK NOTIFICATION */}
          {actionToast && (
            <div className="am-action-toast">
              <CheckCircle2 size={16} />
              <span>{actionToast}</span>
            </div>
          )}

          {/* ROW 1: 2 CHARTS SIDE BY SIDE (AGE PROFILE + FAILURE RATE) */}
          <div className="am-lifecycle-row">
            {/* CARD 1: AGE PROFILE OF EACH CLASS (% OF CLASS) */}
            <div className="am-card am-lifecycle-card">
              <div className="am-card-header">
                <h4>Age profile of each class (% of the class)</h4>
                <div className="am-chart-legend">
                  <span className="am-legend-box age-0-2" />
                  <span>0–2 yrs</span>
                  <span className="am-legend-box age-3-5" />
                  <span>3–5 yrs</span>
                  <span className="am-legend-box age-6-8" />
                  <span>6–8 yrs</span>
                  <span className="am-legend-box age-9-plus" />
                  <span>9+ yrs</span>
                </div>
              </div>

              <div className="am-lifecycle-chart-wrap">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart
                    data={ageProfileStackedData}
                    margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
                  >
                    <XAxis
                      dataKey="category"
                      tick={(props) => {
                        const { x, y, payload } = props
                        const item = ageProfileStackedData.find((d) => d.category === payload.value)
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={0} y={12} textAnchor="middle" fill="#0f172a" fontSize={11} fontWeight={600}>
                              {payload.value}
                            </text>
                            <text x={0} y={26} textAnchor="middle" fill="#64748b" fontSize={9.5}>
                              {item?.subLabel}
                            </text>
                          </g>
                        )
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="0–2 yrs" stackId="a" fill="#0284c7" barSize={34} />
                    <Bar dataKey="3–5 yrs" stackId="a" fill="#ea580c" barSize={34} />
                    <Bar dataKey="6–8 yrs" stackId="a" fill="#10b981" barSize={34} />
                    <Bar dataKey="9+ yrs" stackId="a" fill="#eab308" barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="am-lifecycle-footer-note">
                <span>
                  Road assets are the oldest class: 104 of 486 are nine years or older. Cameras are
                  the largest, and 316 of them are past six years.
                </span>
              </div>
            </div>

            {/* CARD 2: FAILURE RATE AGAINST AGE */}
            <div className="am-card am-lifecycle-card">
              <div className="am-card-header">
                <h4>Failure rate against age</h4>
                <div className="am-chart-legend">
                  <span className="am-legend-line cameras" />
                  <span>Cameras</span>
                  <span className="am-legend-line sensors" />
                  <span>Sensors</span>
                  <span className="am-legend-line vms" />
                  <span>VMS signs</span>
                </div>
              </div>

              <div className="am-lifecycle-chart-wrap">
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart
                    data={failureRateAgainstAgeData}
                    margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="age"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      ticks={[0, 5, 10, 15, 20]}
                      label={{
                        value: 'Faults per 100 assets a year',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#64748b',
                        fontSize: 10,
                        dx: 5,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <ReferenceLine
                      x="7 yr"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Camera design life',
                        position: 'top',
                        fill: '#0f172a',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Cameras"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Sensors"
                      stroke="#ea580c"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="VMS signs"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="am-lifecycle-footer-note">
                <span>
                  Camera faults double between year 5 and year 7, then keep climbing. Replacing at
                  design life costs less than repairing after it.
                </span>
              </div>
            </div>
          </div>

          {/* ROW 2: ASSETS PAST DESIGN LIFE (LEFT) + REPLACEMENT FORECAST (RIGHT) */}
          <div className="am-lifecycle-row">
            {/* CARD 3: ASSETS AT OR PAST DESIGN LIFE TABLE */}
            <div className="am-card am-lifecycle-card">
              <div className="am-card-header">
                <h4>Assets at or past design life</h4>
              </div>

              <div className="am-lifecycle-table-wrap">
                <table className="am-design-life-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Design life</th>
                      <th>At or past</th>
                      <th>% of class</th>
                      <th>Unit cost (₹ lakh)</th>
                      <th>Replacement (₹ lakh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetsAtDesignLifeTable.map((row) => (
                      <tr key={row.class}>
                        <td className="am-dl-class-cell">
                          <span className="am-dl-icon">
                            {row.type === 'camera' && <Camera size={14} className="text-blue-600" />}
                            {row.type === 'vms' && <Tv size={14} className="text-blue-600" />}
                            {row.type === 'power' && <Zap size={14} className="text-blue-600" />}
                            {row.type === 'road' && <Columns size={14} className="text-blue-600" />}
                            {row.type === 'sensor' && <Wifi size={14} className="text-blue-600" />}
                          </span>
                          <strong>{row.class}</strong>
                        </td>
                        <td>{row.designLife}</td>
                        <td className="am-dl-num">{row.atOrPast}</td>
                        <td>{row.pctOfClass}</td>
                        <td className="am-dl-num">{row.unitCost}</td>
                        <td className="am-dl-num bold">{row.replacementCost}</td>
                      </tr>
                    ))}
                    {/* Highlighted Total Row */}
                    <tr className="am-dl-total-row">
                      <td>
                        <strong>All classes</strong>
                      </td>
                      <td></td>
                      <td className="am-dl-num">
                        <strong>222</strong>
                      </td>
                      <td>
                        <strong>9.2%</strong>
                      </td>
                      <td></td>
                      <td className="am-dl-num bold">
                        <strong>497.2</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="am-lifecycle-footer-note">
                <span>
                  Road assets here are lighting poles, barriers and sign gantries. Pavement is planned
                  separately under resurfacing.
                </span>
              </div>
            </div>

            {/* CARD 4: REPLACEMENT FORECAST AND BUDGET, NEXT 12 MONTHS */}
            <div className="am-card am-lifecycle-card">
              <div className="am-card-header">
                <h4>Replacement forecast and budget, next 12 months</h4>
                <div className="am-chart-legend">
                  <span className="am-legend-box forecast" />
                  <span>Forecast need (₹ lakh)</span>
                  <span className="am-legend-box budget" />
                  <span>Approved budget (₹ lakh)</span>
                </div>
              </div>

              <div className="am-lifecycle-chart-wrap">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart
                    data={replacementBudgetChartData}
                    margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="quarter"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      ticks={[0, 50, 100, 150, 200]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="Forecast need (₹ lakh)" fill="#0284c7" barSize={22} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Approved budget (₹ lakh)" fill="#cbd5e1" barSize={22} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="am-lifecycle-footer-note">
                <span>
                  Need is ₹ 497.2 lakh against ₹ 440 lakh approved. The gap of ₹ 57.2 lakh falls in
                  the first two quarters, when the VMS signs come due.
                </span>
              </div>
            </div>
          </div>

          {/* ROW 3: WARRANTIES EXPIRING (LEFT) + RECOMMENDATIONS (RIGHT) */}
          <div className="am-lifecycle-row">
            {/* CARD 5: WARRANTY ENDING IN THE NEXT 90 DAYS */}
            <div className="am-card am-lifecycle-card">
              <div className="am-card-header">
                <h4>Warranty ending in the next 90 days</h4>
                <span className="am-warranty-total-tag">140 assets</span>
              </div>

              <div className="am-warranty-list">
                {warrantiesEndingList.map((item) => (
                  <div
                    key={item.id}
                    className="am-warranty-item"
                    onClick={() => {
                      setActionToast(`Warranty claim initiated for ${item.title}`)
                      setTimeout(() => setActionToast(null), 3000)
                    }}
                  >
                    <div className={`am-warranty-icon-box ${item.tagType}`}>
                      {item.icon === 'tag' && <Radio size={14} />}
                      {item.icon === 'camera' && <Camera size={14} />}
                      {item.icon === 'vms' && <Tv size={14} />}
                      {item.icon === 'power' && <Zap size={14} />}
                      {item.icon === 'sensor' && <Wifi size={14} />}
                    </div>

                    <div className="am-warranty-body">
                      <h5>{item.title}</h5>
                      <p>{item.subtitle}</p>
                    </div>

                    <div className="am-warranty-expiry-box">
                      <span className="am-expiry-label">Expires</span>
                      <span className={`am-expiry-date-tag ${item.tagType}`}>{item.expires}</span>
                    </div>

                    <ChevronRight size={14} className="am-warranty-arrow" />
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 6: RECOMMENDATIONS */}
            <div className="am-card am-lifecycle-card">
              <div className="am-card-header">
                <div className="am-title-with-icon">
                  <Sparkles size={16} className="text-blue-600" />
                  <h4>Recommendations</h4>
                </div>
              </div>

              <div className="am-lifecycle-recs-list">
                {lifecycleRecommendationsList.map((rec) => (
                  <div className={`am-lifecycle-rec-box ${rec.color}`} key={rec.id}>
                    <div className="am-rec-icon-wrap">
                      {rec.icon === 'camera' && <Camera size={15} />}
                      {rec.icon === 'tag' && <Radio size={15} />}
                      {rec.icon === 'drain' && <Wrench size={15} />}
                      {rec.icon === 'power' && <Zap size={15} />}
                    </div>

                    <div className="am-rec-text-wrap">
                      <h5>{rec.title}</h5>
                      <p>{rec.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================
           OVERVIEW TAB: SCHEMATIC MAP + ALERTS + 4 CARDS
           ========================================================= */
        <>
          <div className="am-middle-grid">
            {/* LEFT COLUMN: ASSET MAP CARD */}
            <div className={`am-card am-map-card ${isFullscreen ? 'fullscreen-map' : ''}`}>
              <div className="am-card-header">
                <div className="am-card-title-group">
                  <h3>Asset Map</h3>
                </div>

                <div className="am-map-header-actions">
                  <span className="am-map-asset-count">15 key assets of 2,412</span>

                  <div className="am-view-toggle">
                    <button
                      type="button"
                      className={`am-toggle-pill ${viewMode === 'map' ? 'active' : ''}`}
                      onClick={() => setViewMode('map')}
                    >
                      Map View
                    </button>
                    <button
                      type="button"
                      className={`am-toggle-pill ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => {
                        setViewMode('list')
                        setActiveTab('Asset Map')
                      }}
                    >
                      List View
                    </button>
                  </div>

                  <button
                    type="button"
                    className="am-icon-action-btn"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>

              <div className="am-map-viewport">
                {/* SCHEMATIC HIGHWAY MAP CANVAS */}
                <svg
                  viewBox="0 0 740 520"
                  className="am-schematic-svg"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <rect width="740" height="520" fill="#f4f6ea" />

                  {/* State Region Fills */}
                  <path
                    d="M0,0 L320,0 L320,290 L180,330 L0,330 Z"
                    fill="#ebf1e2"
                    opacity="0.9"
                  />
                  <path
                    d="M320,0 L740,0 L740,360 L460,400 L320,290 Z"
                    fill="#eaf0e6"
                    opacity="0.9"
                  />
                  <path
                    d="M0,330 L180,330 L320,290 L460,400 L740,360 L740,520 L0,520 Z"
                    fill="#f2f5e8"
                    opacity="0.95"
                  />

                  {/* State Boundaries dashed line */}
                  <path
                    d="M320,0 L320,290 L460,400 L740,360"
                    stroke="#cad8bf"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                    fill="none"
                  />

                  <text x="120" y="110" fill="#a4b49a" fontSize="13" fontWeight="700" letterSpacing="0.1em">
                    TELANGANA
                  </text>
                  <text x="360" y="200" fill="#a4b49a" fontSize="13" fontWeight="700" letterSpacing="0.1em">
                    ANDHRA PRADESH
                  </text>
                  <text x="560" y="325" fill="#a4b49a" fontSize="13" fontWeight="700" letterSpacing="0.1em">
                    KARNATAKA
                  </text>

                  {/* Main NH-44 Highway Route Line */}
                  <path
                    d="M75,190 C120,205 130,230 165,200 C200,175 220,245 285,295 C335,335 380,300 425,335 C480,380 500,410 575,415 C615,420 630,440 650,460"
                    stroke="#ffffff"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M75,190 C120,205 130,230 165,200 C200,175 220,245 285,295 C335,335 380,300 425,335 C480,380 500,410 575,415 C615,420 630,440 650,460"
                    stroke="#059669"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Cities */}
                  {mapCities.map((city) => (
                    <g key={city.name} className="am-city-node">
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r={city.isHub ? 5 : 3}
                        fill={city.isHub ? '#1e293b' : '#64748b'}
                        stroke="#ffffff"
                        strokeWidth={city.isHub ? 2 : 1}
                      />
                      <text
                        x={city.x + (city.isHub ? 8 : 6)}
                        y={city.y + (city.isHub ? 4 : 3)}
                        fill={city.isHub ? '#0f172a' : '#475569'}
                        fontSize={city.isHub ? 12 : 9.5}
                        fontWeight={city.isHub ? 700 : 500}
                      >
                        {city.name}
                        {city.name === 'Bengaluru' ? ' ➔' : ''}
                        {city.name === 'Hyderabad' ? ' ➔' : ''}
                      </text>
                    </g>
                  ))}

                  {/* Pins */}
                  <g transform="translate(162, 192)">
                    <circle cx="0" cy="0" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="0" cy="0" r="14" fill="#ef4444" opacity="0.2" className="am-ping-circle" />
                  </g>
                  <g transform="translate(262, 275)">
                    <circle cx="0" cy="0" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  </g>
                  <g transform="translate(485, 370)">
                    <circle cx="0" cy="0" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="0" cy="0" r="14" fill="#ef4444" opacity="0.2" className="am-ping-circle" />
                  </g>
                </svg>

                {/* Callout 1 */}
                <div
                  className="am-map-callout am-callout-fault"
                  style={{ top: '15%', left: '22%' }}
                  onClick={() => setSelectedCallout('CAM-101')}
                >
                  <div className="am-callout-badge-icon red">
                    <AlertTriangle size={13} />
                  </div>
                  <div className="am-callout-content">
                    <div className="am-callout-title">Camera</div>
                    <div className="am-callout-sub">Km 101</div>
                    <div className="am-callout-status red">Offline</div>
                  </div>
                </div>

                {/* Callout 2 */}
                <div
                  className="am-map-callout am-callout-success"
                  style={{ top: '38%', left: '36%' }}
                  onClick={() => setSelectedCallout('VMS-212')}
                >
                  <div className="am-callout-badge-icon green">
                    <Tv size={13} />
                  </div>
                  <div className="am-callout-content">
                    <div className="am-callout-title">VMS Sign</div>
                    <div className="am-callout-sub">Km 212</div>
                    <div className="am-callout-status green">Operational</div>
                  </div>
                </div>

                {/* Callout 3 */}
                <div
                  className="am-map-callout am-callout-fault"
                  style={{ top: '48%', left: '62%' }}
                  onClick={() => setSelectedCallout('DRN-441')}
                >
                  <div className="am-callout-badge-icon red">
                    <Wrench size={13} />
                  </div>
                  <div className="am-callout-content">
                    <div className="am-callout-title">Side Drain</div>
                    <div className="am-callout-sub">Km 441</div>
                    <div className="am-callout-status red">Maintenance overdue</div>
                  </div>
                </div>

                {/* Floating Map Controls */}
                <div className="am-floating-map-controls">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
                    title="Zoom In"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
                    title="Zoom Out"
                  >
                    <Minus size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    title="Reset Corridor View"
                  >
                    <Layers size={14} />
                  </button>
                </div>

                {/* Legend */}
                <div className="am-floating-map-legend">
                  <div className="am-legend-item">
                    <span className="am-legend-dot" style={{ backgroundColor: '#10b981' }} />
                    <span>Healthy</span>
                  </div>
                  <div className="am-legend-item">
                    <span className="am-legend-dot" style={{ backgroundColor: '#f59e0b' }} />
                    <span>Attention</span>
                  </div>
                  <div className="am-legend-item">
                    <span className="am-legend-dot" style={{ backgroundColor: '#ef4444' }} />
                    <span>Fault / Offline</span>
                  </div>
                  <div className="am-legend-item">
                    <span className="am-legend-dot" style={{ backgroundColor: '#3b82f6' }} />
                    <span>Under maintenance</span>
                  </div>
                </div>

                <div className="am-schematic-watermark">
                  Schematic · not to scale
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RECENT ASSET ALERTS CARD */}
            <div className="am-card am-alerts-card">
              <div className="am-card-header">
                <div className="am-card-title-group">
                  <h3>Recent Asset Alerts</h3>
                </div>
                <div className="am-alerts-header-meta">
                  <span className="am-alert-count-pill">5 high priority · 2 new</span>
                  <button type="button" className="am-view-all-link">View All</button>
                </div>
              </div>

              <div className="am-alerts-list">
                {recentAssetAlerts.map((alert) => (
                  <div
                    className={`am-alert-item ${selectedAlert?.id === alert.id ? 'selected' : ''}`}
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="am-alert-thumb-wrap">
                      <img
                        src={alert.image}
                        alt={alert.title}
                        className="am-alert-thumbnail"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://res.cloudinary.com/fikkfcud/image/upload/v1793856345/image_1.jpg'
                        }}
                      />
                      <span className="am-alert-thumb-icon">
                        {renderAlertIcon(alert.type)}
                      </span>
                    </div>

                    <div className="am-alert-content">
                      <div className="am-alert-title-row">
                        <h4 className="am-alert-title">{alert.title}</h4>
                        {alert.isNew && <span className="am-new-tag">NEW</span>}
                      </div>
                      <div className="am-alert-meta">
                        <strong>{alert.code}</strong> · <span>{alert.location}</span>
                      </div>
                      <div className="am-alert-subtext">{alert.subtext}</div>
                    </div>

                    <div className="am-alert-right">
                      <span className={`am-priority-pill ${alert.priority.toLowerCase()}`}>
                        {alert.priority}
                      </span>
                      <ChevronRight size={16} className="am-alert-chevron" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW: 4 ANALYTIC CARDS ── */}
          <div className="am-bottom-grid">
            {/* CARD 1: ASSET HEALTH DONUT */}
            <div className="am-card am-health-card">
              <div className="am-card-header">
                <h3>Asset Health</h3>
              </div>
              <div className="am-health-body">
                <div className="am-donut-wrap">
                  <ResponsiveContainer width={170} height={170}>
                    <PieChart>
                      <Pie
                        data={assetHealthData.breakdown}
                        innerRadius={54}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="count"
                        strokeWidth={0}
                      >
                        {assetHealthData.breakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} assets`, name]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="am-donut-center-label">
                    <strong>2,412</strong>
                    <span>Total Assets</span>
                  </div>
                </div>

                <div className="am-health-legend">
                  {assetHealthData.breakdown.map((item) => (
                    <div className="am-health-legend-row" key={item.name}>
                      <div className="am-legend-left">
                        <span className="am-legend-dot" style={{ backgroundColor: item.color }} />
                        <span className="am-legend-name">{item.name}</span>
                      </div>
                      <div className="am-legend-right">
                        <strong>{item.count.toLocaleString()}</strong>
                        <span className="am-legend-pct">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 2: ALERTS TREND BAR CHART */}
            <div className="am-card am-trend-card">
              <div className="am-card-header">
                <h3>Alerts Trend</h3>
                <div className="am-chart-legend-row">
                  <span className="am-legend-bullet"><i style={{ background: '#ef4444' }} /> Fault</span>
                  <span className="am-legend-bullet"><i style={{ background: '#f59e0b' }} /> Attention</span>
                  <span className="am-legend-bullet"><i style={{ background: '#3b82f6' }} /> Maintenance</span>
                </div>
              </div>
              <div className="am-trend-body">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={alertsTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 45]} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 11, background: '#ffffff', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="fault" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={14} />
                    <Bar dataKey="attention" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={14} />
                    <Bar dataKey="maintenance" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CARD 3: MAINTENANCE SCHEDULE */}
            <div className="am-card am-schedule-card">
              <div className="am-card-header">
                <h3>Maintenance Schedule</h3>
                <button type="button" className="am-view-all-link">View All</button>
              </div>
              <div className="am-schedule-list">
                {maintenanceSchedules.map((item) => (
                  <div className="am-schedule-item" key={item.id}>
                    <div className="am-schedule-date-box">
                      <span className="am-date-day">{item.date}</span>
                      <span className="am-date-month">{item.month}</span>
                    </div>
                    <div className="am-schedule-info">
                      <h4>{item.title}</h4>
                      <p className="am-schedule-loc">{item.location}</p>
                      <p className="am-schedule-crew">{item.crew}</p>
                    </div>
                    <ChevronRight size={16} className="am-schedule-arrow" />
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 4: QUICK ACTIONS */}
            <div className="am-card am-actions-card">
              <div className="am-card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="am-quick-actions-body">
                <button
                  type="button"
                  className="am-action-btn-large"
                  onClick={() => setTicketModalOpen(true)}
                >
                  <div className="am-action-btn-icon">
                    <Wrench size={22} />
                  </div>
                  <span>Raise Maintenance Ticket</span>
                </button>

                <button
                  type="button"
                  className="am-action-btn-large"
                  onClick={() => setActiveTab('Asset Map')}
                >
                  <div className="am-action-btn-icon">
                    <Crosshair size={22} />
                  </div>
                  <span>Locate Asset on Map</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TICKET DETAILS / CREATION MODAL */}
      {ticketModalOpen && (
        <div className="am-modal-backdrop" onClick={() => setTicketModalOpen(false)}>
          <div className="am-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="am-modal-header">
              <div className="am-modal-title">
                <Wrench size={18} className="text-emerald-600" />
                <h3>
                  {selectedTicket
                    ? `Maintenance Work Order: ${selectedTicket.id}`
                    : 'Raise NH-44 Highway Maintenance Ticket'}
                </h3>
              </div>
              <button
                type="button"
                className="am-modal-close"
                onClick={() => setTicketModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="am-modal-body">
              <div className="am-form-group">
                <label>Asset Identification</label>
                <input
                  type="text"
                  placeholder="e.g. CAM-1010, VMS-0487, DRN-0441"
                  defaultValue={selectedTicket ? selectedTicket.assetId : 'CAM-1010'}
                />
              </div>
              <div className="am-form-group">
                <label>Highway Location</label>
                <input
                  type="text"
                  placeholder="e.g. NH-44 · Km 101 near Shadnagar Bypass"
                  defaultValue={selectedTicket ? selectedTicket.location : 'NH-44 · Km 101 (Jadcherla)'}
                />
              </div>
              <div className="am-form-group">
                <label>Priority Severity</label>
                <select defaultValue={selectedTicket?.status === 'Fault / Offline' ? 'CRITICAL' : 'HIGH'}>
                  <option value="CRITICAL">Critical (Immediate Hazard)</option>
                  <option value="HIGH">High Priority (Service Impact)</option>
                  <option value="MEDIUM">Medium (Scheduled Repair)</option>
                  <option value="LOW">Low (Preventative Routine)</option>
                </select>
              </div>
              <div className="am-form-group">
                <label>Issue Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the failure, telemetry loss, or obstruction..."
                  defaultValue={
                    selectedTicket
                      ? `Work order ${selectedTicket.id} scheduled for ${selectedTicket.assetId} at ${selectedTicket.location}. Status: ${selectedTicket.status}. Dispatching field crew.`
                      : 'Camera feed offline since 08:32 AM. Optical sensor not responding to ping. Possible cable damage or local power outage.'
                  }
                />
              </div>
              <div className="am-modal-actions">
                <button
                  type="button"
                  className="am-modal-cancel"
                  onClick={() => setTicketModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="am-modal-submit"
                  onClick={() => {
                    alert('Maintenance ticket action dispatched to NH-44 Field Crew C-5!')
                    setTicketModalOpen(false)
                  }}
                >
                  Dispatch Maintenance Crew
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
