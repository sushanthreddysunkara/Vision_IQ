import { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Building2,
  Bus,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Flag,
  HelpCircle,
  IndianRupee,
  Info,
  Layers,
  Megaphone,
  Minus,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  TrendingDown,
  Truck,
  Users,
  Wifi,
  XCircle,
} from 'lucide-react'

// --- PLAZA DATA WITH DISTINCT SPECS PER PLAZA ---

const plazasData = [
  {
    id: 'p1',
    name: 'Raikal',
    km: 58,
    revenue: '₹ 28,40,000',
    vehicles: '9,160',
    fastag: '78%',
    avgWait: '6.5 min',
    avgWaitWarning: true,
    leakage: '₹ 2,30,000',
    pctRev: '3.0%',
    status: 'Queue building',
    statusType: 'warning',
    state: 'TELANGANA',
    lanes: 8,
    camId: 'CAM-0580',
    hotspotLane: 'Lane 3',
    topAnomaly: 'Tag reader retries',
  },
  {
    id: 'p2',
    name: 'Shakapur',
    km: 115,
    revenue: '₹ 14,20,000',
    vehicles: '4,580',
    fastag: '81%',
    avgWait: '2.1 min',
    avgWaitWarning: false,
    leakage: '₹ 90,000',
    pctRev: '2.4%',
    status: 'Normal',
    statusType: 'normal',
    state: 'TELANGANA',
    lanes: 6,
    camId: 'CAM-0581',
    hotspotLane: 'Lane 2',
    topAnomaly: 'Unpaid pass-through',
  },
  {
    id: 'p3',
    name: 'Pullur',
    km: 200,
    revenue: '₹ 16,80,000',
    vehicles: '5,420',
    fastag: '74%',
    avgWait: '2.8 min',
    avgWaitWarning: false,
    leakage: '₹ 5,80,000',
    leakageAlert: true,
    pctRev: '12.9%',
    pctRevAlert: true,
    status: 'Leakage anomaly',
    statusType: 'danger',
    state: 'ANDHRA PRADESH',
    lanes: 10,
    camId: 'CAM-0582',
    hotspotLane: 'Lane 4',
    topAnomaly: 'Night shift class mismatch',
  },
  {
    id: 'p4',
    name: 'Amakathadu',
    km: 252,
    revenue: '₹ 11,60,000',
    vehicles: '3,740',
    fastag: '80%',
    avgWait: '1.9 min',
    avgWaitWarning: false,
    leakage: '₹ 80,000',
    pctRev: '2.6%',
    status: 'Normal',
    statusType: 'normal',
    state: 'ANDHRA PRADESH',
    lanes: 6,
    camId: 'CAM-0583',
    hotspotLane: 'Lane 1',
    topAnomaly: 'Manual gate release',
  },
  {
    id: 'p5',
    name: 'Kasepalli',
    km: 318,
    revenue: '₹ 10,90,000',
    vehicles: '3,520',
    fastag: '79%',
    avgWait: '1.7 min',
    avgWaitWarning: false,
    leakage: '₹ 70,000',
    pctRev: '2.4%',
    status: 'Normal',
    statusType: 'normal',
    state: 'ANDHRA PRADESH',
    lanes: 6,
    camId: 'CAM-0584',
    hotspotLane: 'Lane 2',
    topAnomaly: 'Overweight evasion',
  },
  {
    id: 'p6',
    name: 'Bagepalli',
    km: 410,
    revenue: '₹ 22,10,000',
    vehicles: '7,110',
    fastag: '83%',
    avgWait: '2.4 min',
    avgWaitWarning: false,
    leakage: '₹ 1,10,000',
    pctRev: '2.1%',
    status: 'Normal',
    statusType: 'normal',
    state: 'KARNATAKA',
    lanes: 8,
    camId: 'CAM-0585',
    hotspotLane: 'Lane 5',
    topAnomaly: 'Cash discrepancy',
  },
  {
    id: 'p7',
    name: 'Devanahalli',
    km: 512,
    revenue: '₹ 24,00,000',
    vehicles: '7,760',
    fastag: '85%',
    avgWait: '3.1 min',
    avgWaitWarning: false,
    leakage: '₹ 1,80,000',
    pctRev: '3.5%',
    status: 'Normal',
    statusType: 'normal',
    state: 'KARNATAKA',
    lanes: 12,
    camId: 'CAM-0586',
    hotspotLane: 'Lane 8',
    topAnomaly: 'Exempt pass surge',
  },
]

// --- TAB-SPECIFIC ALERTS & REVENUE LEAKAGE AUDIT LOGS ---

const overviewAlerts = [
  {
    id: 'a1',
    type: 'danger',
    title: 'Raikal: Lane 3 queue above 10 minutes',
    desc: '18 vehicles waiting, Lane 4 close behind at 10 minutes',
    time: '08:40 AM',
    icon: AlertTriangle,
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
  },
  {
    id: 'a2',
    type: 'purple',
    title: 'Pullur: class-mismatch anomaly',
    desc: '₹ 5.8 lakh leakage in 24 h, 3.6 times its usual level. Lane 4, night shift',
    time: '06:10 AM',
    icon: IndianRupee,
    iconColor: '#7c3aed',
    iconBg: '#f3e8ff',
  },
  {
    id: 'a3',
    type: 'warning',
    title: 'Raikal: Lane 3 tag reader degraded',
    desc: 'Read retries up 3x since 07:50 AM; 64 vehicles passed free',
    time: '07:50 AM',
    icon: Wifi,
    iconColor: '#d97706',
    iconBg: '#fef3c7',
  },
  {
    id: 'a4',
    type: 'warning',
    title: 'INC-2037 · Toll plaza queue at Raikal',
    desc: 'Tailback 0.9 km, reaches 1.6 km by 09:10 AM if no lane is switched',
    time: '08:20 AM',
    icon: AlertCircle,
    iconColor: '#d97706',
    iconBg: '#fff7ed',
  },
  {
    id: 'a5',
    type: 'info',
    title: 'Devanahalli: exempt passes above normal',
    desc: '38 exempt passes keyed in since midnight (normal 15)',
    time: '07:15 AM',
    icon: Shield,
    iconColor: '#2563eb',
    iconBg: '#dbeafe',
  },
]

const leakageAuditLogs = [
  {
    id: 'LK-8901',
    plaza: 'Pullur',
    lane: 'Lane 4',
    shift: 'Night (02:00 - 06:00)',
    anomaly: 'Class Mismatch (Truck → LCV)',
    expectedFee: '₹ 410',
    chargedFee: '₹ 180',
    loss: '₹ 230',
    status: 'Confirmed Loss',
    statusClass: 'red',
    time: '03:42 AM',
  },
  {
    id: 'LK-8902',
    plaza: 'Raikal',
    lane: 'Lane 3',
    shift: 'Morning (06:00 - 08:30)',
    anomaly: 'RFID Reader Retry Timeout',
    expectedFee: '₹ 135',
    chargedFee: '₹ 0',
    loss: '₹ 135',
    status: 'Free Pass-through',
    statusClass: 'orange',
    time: '07:52 AM',
  },
  {
    id: 'LK-8903',
    plaza: 'Devanahalli',
    lane: 'Lane 8',
    shift: 'Night (00:00 - 04:00)',
    anomaly: 'Exempt Pass Overuse',
    expectedFee: '₹ 220',
    chargedFee: '₹ 0',
    loss: '₹ 220',
    status: 'Under Audit',
    statusClass: 'purple',
    time: '02:15 AM',
  },
  {
    id: 'LK-8904',
    plaza: 'Pullur',
    lane: 'Lane 4',
    shift: 'Night (02:00 - 06:00)',
    anomaly: 'Class Mismatch (Multi-Axle → Bus)',
    expectedFee: '₹ 680',
    chargedFee: '₹ 280',
    loss: '₹ 400',
    status: 'Confirmed Loss',
    statusClass: 'red',
    time: '04:18 AM',
  },
  {
    id: 'LK-8905',
    plaza: 'Shakapur',
    lane: 'Lane 2',
    shift: 'Day (12:00 - 16:00)',
    anomaly: 'Manual Barrier Override',
    expectedFee: '₹ 135',
    chargedFee: '₹ 0',
    loss: '₹ 135',
    status: 'Attendant Flagged',
    statusClass: 'orange',
    time: '01:10 PM',
  },
]

const transactionLogs = [
  {
    txId: 'TXN-90412',
    plate: 'TS 09 AB 4521',
    tagId: '3412-8901-4412',
    plaza: 'Raikal',
    lane: 'Lane 1',
    class: 'Car / SUV',
    fee: '₹ 135',
    payment: 'FASTag',
    status: 'Verified',
    statusType: 'green',
    time: '08:44 AM',
  },
  {
    txId: 'TXN-90413',
    plate: 'TG 08 CD 8214',
    tagId: '3412-7712-9011',
    plaza: 'Pullur',
    lane: 'Lane 4',
    class: 'Truck 3-Axle',
    fee: '₹ 180 (Expected ₹ 410)',
    payment: 'FASTag',
    status: 'Mismatch Flag',
    statusType: 'red',
    time: '08:42 AM',
  },
  {
    txId: 'TXN-90414',
    plate: 'TS 10 EF 2341',
    tagId: '3412-5541-1192',
    plaza: 'Devanahalli',
    lane: 'Lane 8',
    class: 'LCV Commercial',
    fee: '₹ 0 (Exempt Keyed)',
    payment: 'Exempt',
    status: 'Audit Flag',
    statusType: 'purple',
    time: '08:40 AM',
  },
  {
    txId: 'TXN-90415',
    plate: 'AP 21 H 9912',
    tagId: 'Manual Cash',
    plaza: 'Shakapur',
    lane: 'Lane 5',
    class: 'Car / SUV',
    fee: '₹ 135',
    payment: 'Cash',
    status: 'Verified',
    statusType: 'green',
    time: '08:38 AM',
  },
  {
    txId: 'TXN-90416',
    plate: 'KA 04 MP 3310',
    tagId: '3412-9901-6652',
    plaza: 'Bagepalli',
    lane: 'Lane 3',
    class: 'Bus Intercity',
    fee: '₹ 280',
    payment: 'FASTag',
    status: 'Verified',
    statusType: 'green',
    time: '08:36 AM',
  },
]

export default function TollRevenuePage({
  rows = [],
  streamPaused = false,
  onToggleStreamPause,
}) {
  const [activeTab, setActiveTab] = useState('Overview')
  const [selectedHighway, setSelectedHighway] = useState('NH-44')
  const [selectedPlazaFilter, setSelectedPlazaFilter] = useState('All Plazas')
  const [timeframe, setTimeframe] = useState('Last 24 hours')
  const [selectedPlaza, setSelectedPlaza] = useState(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [txnSearch, setTxnSearch] = useState('')
  const [txnFilter, setTxnFilter] = useState('All')

  // --- FULL DATABASE RECORD INSPECTOR & SCHEMA MODAL STATE ---
  const [selectedDbRecord, setSelectedDbRecord] = useState(null)
  const [dbSearch, setDbSearch] = useState('')
  const [dbClassFilter, setDbClassFilter] = useState('All')

  // --- LIVE DATABASE STREAMING SIMULATION & LOOPING STATE ---
  const [liveStreamIndex, setLiveStreamIndex] = useState(0)
  const [streamTickCount, setStreamTickCount] = useState(0)
  const [totalFeeSum, setTotalFeeSum] = useState(0)
  const [latestLiveIngest, setLatestLiveIngest] = useState(null)
  const [liveTxnList, setLiveTxnList] = useState(transactionLogs)

  // Live Stream Looping Effect (Connected to DB records & Socket stream)
  const isStreamActive = !streamPaused

  useEffect(() => {
    if (!isStreamActive) return
    const interval = setInterval(() => {
      setStreamTickCount((prev) => prev + 1)
      setLiveStreamIndex((prev) => {
        const nextIdx = (prev + 1) % (rows.length || 20)
        const sampleRow = rows[nextIdx] || {
          numberPlate: `TS 09 XY ${1000 + ((prev * 7) % 8999)}`,
          vehicleType: ['Car', 'Bus', 'Truck', 'Auto'][(prev * 3) % 4],
          location: 'Raikal Toll Plaza',
          speed: 45 + (prev % 35),
        }

        const fees = { Car: 135, Bus: 280, Truck: 410, Auto: 80, LCV: 210, SUV: 135 }
        const feeAmt = fees[sampleRow.vehicleType] || 135
        const laneNum = (prev % 6) + 1

        setTotalFeeSum((prevFee) => prevFee + feeAmt)

        const newTxn = {
          txId: `TXN-90${417 + prev}`,
          plate: sampleRow.numberPlate || sampleRow.vehicleNumberPlate || `TG 08 KL ${2000 + prev}`,
          tagId: `3412-8800-${1000 + prev}`,
          plaza: sampleRow.location ? sampleRow.location.split(' - ')[0] : 'Raikal',
          lane: `Lane ${laneNum}`,
          class: sampleRow.vehicleType || 'Car',
          fee: `₹ ${feeAmt}`,
          payment: 'FASTag',
          status: sampleRow.speed > 80 ? 'Overspeed Alert' : 'Verified',
          statusType: sampleRow.speed > 80 ? 'red' : 'green',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        }

        setLiveTxnList((old) => [newTxn, ...old.slice(0, 30)])
        setLatestLiveIngest(
          `⚡ Live DB Ingestion: ${newTxn.plate} (${newTxn.class}) tolled at ${newTxn.plaza} ${newTxn.lane} · Fee: ${newTxn.fee}`
        )

        return nextIdx
      })
    }, 2400)

    return () => clearInterval(interval)
  }, [isStreamActive, rows])

  const activeStreamCount = 41290 + streamTickCount
  const rawRevenueNum = 12800000 + totalFeeSum
  const activeRevenueTotal = rawRevenueNum.toLocaleString('en-IN')

  const tabs = [
    'Overview',
    'Plaza Queue',
    'Revenue Leakage',
    'Transaction Review',
    'Leakage Patterns',
    'Database Records',
  ]

  // Map route points along NH-44 (Hyderabad to Bengaluru)
  const routePoints = [
    { name: 'Hyderabad', type: 'city', x: 85, y: 110, state: 'TELANGANA' },
    { name: 'Shamshabad', type: 'town', x: 105, y: 135 },
    { name: 'Shadnagar', type: 'town', x: 130, y: 155 },
    { name: 'Jadcherla', type: 'town', x: 160, y: 140 },
    {
      name: 'Raikal',
      type: 'plaza',
      status: 'warning',
      x: 185,
      y: 150,
      callout: 'Raikal - queue building\nLane 3 wait 12 minutes',
    },
    { name: 'Kothakota', type: 'town', x: 210, y: 180 },
    {
      name: 'Pullur',
      type: 'plaza',
      status: 'danger',
      x: 250,
      y: 190,
      callout: 'Pullur - leakage anomaly\n₹ 5.8 lakh lost in 24 h',
    },
    { name: 'Kurnool', type: 'city', x: 280, y: 200, state: 'ANDHRA PRADESH' },
    { name: 'Dhone', type: 'town', x: 320, y: 215 },
    { name: 'Gooty', type: 'plaza', status: 'normal', x: 350, y: 220 },
    { name: 'Anantapur', type: 'city', x: 390, y: 210 },
    { name: 'Penukonda', type: 'town', x: 440, y: 235 },
    { name: 'Bagepalli', type: 'plaza', status: 'normal', x: 475, y: 245 },
    { name: 'Chikkaballapur', type: 'town', x: 505, y: 240 },
    { name: 'Devanahalli', type: 'plaza', status: 'normal', x: 535, y: 255 },
    { name: 'Bengaluru', type: 'city', x: 570, y: 265, state: 'KARNATAKA' },
  ]

  const currentPlazaData =
    selectedPlazaFilter !== 'All Plazas'
      ? plazasData.find((p) => p.name === selectedPlazaFilter) || plazasData[0]
      : plazasData[0]

  const filteredPlazas = plazasData.filter((p) => {
    if (selectedPlazaFilter !== 'All Plazas' && p.name !== selectedPlazaFilter) {
      return false
    }
    return true
  })

  return (
    <div className="toll-revenue-page">
      {/* ── BREADCRUMB & HEADER TITLE ── */}
      <div className="tr-breadcrumb">
        <span onClick={() => setActiveTab('Overview')} style={{ cursor: 'pointer' }}>
          Toll &amp; Revenue
        </span>
        <ChevronRight size={12} />
        <span className="current">{activeTab}</span>
      </div>

      <div className="tr-page-header">
        <div className="tr-header-title">
          <div className="tr-title-row">
            <h1>
              {activeTab === 'Overview' && 'Toll & Revenue Overview'}
              {activeTab === 'Plaza Queue' && 'Toll Plaza Queue & Traffic'}
              {activeTab === 'Revenue Leakage' && 'Revenue Leakage Audit & Analytics'}
              {activeTab === 'Transaction Review' && 'Transaction Logs & Audit'}
              {activeTab === 'Leakage Patterns' && 'AI Leakage Pattern Intelligence'}
              {activeTab === 'Database Records' && 'Full Database Schema & Vehicle Telemetry Inspector'}
            </h1>
            {activeTab === 'Plaza Queue' && (
              <span className="tr-live-pill">● LIVE</span>
            )}
          </div>
          <p className="tr-subtitle">
            {activeTab === 'Overview' &&
              'Every vehicle seen. Every rupee accounted for.'}
            {activeTab === 'Plaza Queue' &&
              `${currentPlazaData.name} Toll Plaza | ${currentPlazaData.state} | NH-44 | 16 Sep 2026 | 08:45 AM`}
            {activeTab === 'Revenue Leakage' &&
              'Detect class mismatches, exempt pass abuse & RFID reader failures.'}
            {activeTab === 'Transaction Review' &&
              'Real-time transaction audit stream across all NH-44 plazas.'}
            {activeTab === 'Leakage Patterns' &&
              'AI-driven pattern detection for shift-level revenue leakage anomalies.'}
            {activeTab === 'Database Records' &&
              'Inspect all 7,044 vehicle telemetry events, ANPR confidence scores & FASTag fields stored in MySQL.'}
          </p>
        </div>

        {/* TOP FILTERS & LIVE STREAM TOGGLE */}
        <div className="tr-header-filters">
          <button
            className={`tr-live-stream-btn ${isStreamActive ? 'active' : 'paused'}`}
            onClick={onToggleStreamPause}
            type="button"
            title="Toggle Live Database Stream"
          >
            {isStreamActive ? (
              <>
                <Radio size={13} />
                <span>DB Stream: RUNNING</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>DB Stream: PAUSED</span>
              </>
            )}
          </button>

          <div className="tr-select-wrapper">
            <select
              value={selectedHighway}
              onChange={(e) => setSelectedHighway(e.target.value)}
            >
              <option value="NH-44">NH-44</option>
              <option value="NH-65">NH-65</option>
              <option value="NH-16">NH-16</option>
              <option value="All">All Highways</option>
            </select>
          </div>

          <div className="tr-select-wrapper">
            <select
              value={selectedPlazaFilter}
              onChange={(e) => setSelectedPlazaFilter(e.target.value)}
            >
              <option value="All Plazas">All Plazas</option>
              {plazasData.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} Plaza (Km {p.km})
                </option>
              ))}
            </select>
          </div>

          <div className="tr-select-wrapper">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="Last 24 hours">Last 24 hours</option>
              <option value="Today">Today</option>
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIVE INGESTION TICKER BANNER */}
      {latestLiveIngest && isStreamActive && (
        <div className="tr-live-ingest-banner">
          <span>{latestLiveIngest}</span>
        </div>
      )}

      {/* ── NAVIGATION TABS ── */}
      <div className="tr-tab-row">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tr-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* =========================================================
          TAB 1: OVERVIEW TAB
         ========================================================= */}
      {activeTab === 'Overview' && (
        <>
          <div className="tr-stat-grid">
            <div className="tr-stat-card">
              <div className="tr-stat-icon green">
                <IndianRupee size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">₹ {activeRevenueTotal}</div>
                <div className="tr-stat-label">Toll revenue today</div>
                <div className="tr-stat-subtext green-text">
                  ↑ +4% vs. last Tuesday
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon blue">
                <Bus size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">{activeStreamCount.toLocaleString()}</div>
                <div className="tr-stat-label">Vehicles tolled today</div>
                <div className="tr-stat-subtext green-text">
                  ↑ +3% vs. last Tuesday
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon navy">
                <CreditCard size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">81%</div>
                <div className="tr-stat-label">FASTag share</div>
                <div className="tr-stat-subtext green-text">
                  ↑ +2 pts vs. last month
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon orange">
                <Clock size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">3.6 mins</div>
                <div className="tr-stat-label">Avg. wait at plazas</div>
                <div className="tr-stat-subtext orange-text">
                  ↑ +0.8 vs. last hour
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon red">
                <TrendingDown size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">₹ 14.6 lakh</div>
                <div className="tr-stat-label">Est. leakage, last 24 h</div>
                <div className="tr-stat-subtext red-text">
                  ↑ 4.3% of toll revenue
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon purple">
                <Flag size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">312</div>
                <div className="tr-stat-label">Flagged transactions</div>
                <div className="tr-stat-subtext purple-text">
                  <span className="dot-indicator red-dot" /> 71% confirmed
                </div>
              </div>
            </div>
          </div>

          <div className="tr-middle-grid">
            <div className="tr-panel tr-map-panel">
              <div className="tr-map-viewport">
                <svg
                  className="tr-map-svg"
                  viewBox="0 0 640 330"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 20 20 Q 200 10 320 70 T 300 180 T 150 190 Z"
                    fill="#ecfdf5"
                    opacity="0.65"
                  />
                  <path
                    d="M 220 80 Q 420 40 540 120 T 480 270 T 260 220 Z"
                    fill="#f0fdf4"
                    opacity="0.55"
                  />
                  <path
                    d="M 450 160 Q 610 170 630 310 T 420 320 Z"
                    fill="#edf7ed"
                    opacity="0.65"
                  />

                  <text x="120" y="55" className="tr-map-state-text">
                    TELANGANA
                  </text>
                  <text x="370" y="105" className="tr-map-state-text">
                    ANDHRA PRADESH
                  </text>
                  <text x="520" y="215" className="tr-map-state-text">
                    KARNATAKA
                  </text>

                  <path
                    d="M 85 110 C 130 145 160 140 185 150 C 210 160 230 185 250 190 C 280 200 340 220 390 210 C 440 200 460 240 505 240 C 535 240 550 260 570 265"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {routePoints.map((pt, idx) => {
                    if (pt.type === 'city' || pt.type === 'town') {
                      return (
                        <g key={idx} className="tr-map-node-group">
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={pt.type === 'city' ? 5 : 3}
                            fill={pt.type === 'city' ? '#0f172a' : '#64748b'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - (pt.type === 'city' ? 10 : 8)}
                            textAnchor="middle"
                            className={`tr-map-node-label ${pt.type === 'city' ? 'city' : ''}`}
                          >
                            {pt.name}
                          </text>
                        </g>
                      )
                    }

                    let iconColor = '#2563eb'
                    if (pt.status === 'warning') iconColor = '#d97706'
                    if (pt.status === 'danger') iconColor = '#dc2626'

                    return (
                      <g
                        key={idx}
                        className="tr-map-plaza-group"
                        onClick={() => {
                          setSelectedPlazaFilter(pt.name)
                          if (pt.name === 'Raikal' || pt.name === 'Pullur') {
                            setActiveTab('Plaza Queue')
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={11}
                          fill={iconColor}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                        <path
                          d={`M ${pt.x - 5} ${pt.y + 3} L ${pt.x - 5} ${pt.y - 1} L ${pt.x} ${pt.y - 4} L ${pt.x + 5} ${pt.y - 1} L ${pt.x + 5} ${pt.y + 3} Z`}
                          fill="#ffffff"
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 22}
                          textAnchor="middle"
                          className="tr-map-plaza-label"
                        >
                          {pt.name}
                        </text>
                      </g>
                    )
                  })}
                </svg>

                <div
                  className="tr-map-callout warning"
                  style={{ top: '125px', left: '125px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedPlazaFilter('Raikal')
                    setActiveTab('Plaza Queue')
                  }}
                >
                  <div className="tr-callout-title">Raikal - queue building</div>
                  <div className="tr-callout-subtitle">
                    Lane 3 wait 12 minutes (Click to inspect)
                  </div>
                </div>

                <div
                  className="tr-map-callout danger"
                  style={{ top: '155px', left: '220px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedPlazaFilter('Pullur')
                    setActiveTab('Revenue Leakage')
                  }}
                >
                  <div className="tr-callout-title">Pullur - leakage anomaly</div>
                  <div className="tr-callout-subtitle">
                    ₹ 5.8 lakh lost in 24 h (Click to audit)
                  </div>
                </div>
              </div>
            </div>

            <div className="tr-panel tr-alerts-panel">
              <div className="tr-panel-header">
                <h2>Alerts</h2>
                <span className="tr-badge-count">{overviewAlerts.length} open</span>
              </div>

              <div className="tr-alerts-list">
                {overviewAlerts.map((alert) => {
                  const IconComp = alert.icon
                  return (
                    <div
                      key={alert.id}
                      className="tr-alert-row"
                      onClick={() => {
                        if (alert.title.includes('Raikal')) setActiveTab('Plaza Queue')
                        else if (alert.title.includes('Pullur')) setActiveTab('Revenue Leakage')
                      }}
                    >
                      <div
                        className="tr-alert-icon"
                        style={{
                          backgroundColor: alert.iconBg,
                          color: alert.iconColor,
                        }}
                      >
                        <IconComp size={16} />
                      </div>
                      <div className="tr-alert-content">
                        <div className="tr-alert-title-row">
                          <strong className="tr-alert-title">{alert.title}</strong>
                          <span className="tr-alert-time">{alert.time}</span>
                        </div>
                        <p className="tr-alert-desc">{alert.desc}</p>
                      </div>
                      <ChevronRight size={15} className="tr-alert-chevron" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="tr-bottom-grid">
            <div className="tr-panel tr-table-panel">
              <div className="tr-panel-header">
                <h2>Plazas on NH-44</h2>
                <span className="tr-time-range">Today, 00:00 to 08:45 AM</span>
              </div>

              <div className="tr-table-wrapper">
                <table className="tr-plazas-table">
                  <thead>
                    <tr>
                      <th>Plaza</th>
                      <th className="num">Km</th>
                      <th className="num">Revenue today</th>
                      <th className="num">Vehicles today</th>
                      <th className="num">FASTag</th>
                      <th className="num">Avg. wait</th>
                      <th className="num">Leakage (24 h)</th>
                      <th className="num">% of rev.</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlazas.map((plaza) => (
                      <tr
                        key={plaza.id}
                        onClick={() => {
                          setSelectedPlazaFilter(plaza.name)
                          if (plaza.name === 'Raikal') setActiveTab('Plaza Queue')
                          else if (plaza.name === 'Pullur') setActiveTab('Revenue Leakage')
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="plaza-name-cell">
                          <Building2 size={14} className="tr-plaza-icon" />
                          <strong>{plaza.name}</strong>
                        </td>
                        <td className="num">{plaza.km}</td>
                        <td className="num">{plaza.revenue}</td>
                        <td className="num">{plaza.vehicles}</td>
                        <td className="num">{plaza.fastag}</td>
                        <td className={`num ${plaza.avgWaitWarning ? 'warning-text' : ''}`}>
                          {plaza.avgWait}
                        </td>
                        <td className={`num ${plaza.leakageAlert ? 'danger-text' : ''}`}>
                          {plaza.leakage}
                        </td>
                        <td className={`num ${plaza.pctRevAlert ? 'purple-text' : ''}`}>
                          {plaza.pctRev}
                        </td>
                        <td>
                          <span className={`tr-status-pill ${plaza.statusType}`}>
                            {plaza.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="tr-panel tr-chart-panel">
              <div className="tr-panel-header">
                <h2>Hourly toll revenue, all plazas (₹ lakh)</h2>
              </div>
              <div className="tr-chart-legend">
                <span><span className="legend-line solid-blue" /> Today</span>
                <span><span className="legend-line dashed-gray" /> Last Tuesday</span>
              </div>

              <div className="tr-chart-viewport">
                <svg className="tr-chart-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
                  <line x1="30" y1="20" x2="390" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <text x="20" y="23" className="chart-y-axis">40</text>

                  <line x1="30" y1="60" x2="390" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <text x="20" y="63" className="chart-y-axis">30</text>

                  <line x1="30" y1="100" x2="390" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <text x="20" y="103" className="chart-y-axis">20</text>

                  <line x1="30" y1="140" x2="390" y2="140" stroke="#e2e8f0" strokeWidth="1" />
                  <text x="20" y="143" className="chart-y-axis">0</text>

                  <path
                    d="M 30 130 Q 70 125 110 110 T 190 60 T 270 50 T 350 35 T 390 30"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  <path
                    d="M 30 125 Q 70 120 110 95 T 190 40 T 270 30 T 350 20 T 390 15"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M 30 125 Q 70 120 110 95 T 190 40 T 270 30 T 350 20 T 390 15 L 390 140 L 30 140 Z"
                    fill="url(#trBlueGradient)"
                    opacity="0.15"
                  />
                  <defs>
                    <linearGradient id="trBlueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================
          TAB 2: PLAZA QUEUE TAB (CCTV CAMERA & LANE CONGESTION)
         ========================================================= */}
      {activeTab === 'Plaza Queue' && (
        <div className="pq-view-container">
          <div className="pq-top-grid">
            <div className="pq-camera-feed-card">
              <div className="pq-feed-banner">
                <div className="pq-feed-banner-left">
                  <span className="pq-live-indicator">● LIVE</span>
                  <strong>{currentPlazaData.camId} - {currentPlazaData.name} Toll Plaza - SB</strong>
                </div>
                <div className="pq-feed-banner-right">
                  <span>☀️ 28°C | Clear</span>
                </div>
              </div>

              <div className="pq-feed-viewport">
                <div className="pq-feed-bg">
                  <div className="pq-lanes-container">
                    <div className="pq-lane-column">
                      <div className="pq-lane-header-badge blue">FASTag Lane 1</div>
                      <div className="pq-lane-heat green" />
                      <div className="pq-lane-footer-box green">
                        <div className="wait-time">2 min</div>
                        <div className="veh-count">3 vehicles</div>
                      </div>
                    </div>

                    <div className="pq-lane-column">
                      <div className="pq-lane-header-badge blue">FASTag Lane 2</div>
                      <div className="pq-lane-heat amber" />
                      <div className="pq-lane-footer-box amber">
                        <div className="wait-time">6 min</div>
                        <div className="veh-count">9 vehicles</div>
                      </div>
                    </div>

                    <div className="pq-lane-column highlighted-lane">
                      <div className="pq-lane-header-badge blue">FASTag Lane 3</div>
                      <div className="pq-floating-tooltip">
                        <strong>FASTag Lane 3</strong>
                        <span>12 min wait · 18 vehicles</span>
                      </div>
                      <div className="pq-lane-heat red-danger" />
                      <div className="pq-lane-footer-box red">
                        <div className="wait-time">12 min</div>
                        <div className="veh-count">18 vehicles</div>
                      </div>
                    </div>

                    <div className="pq-lane-column">
                      <div className="pq-lane-header-badge blue">FASTag Lane 4</div>
                      <div className="pq-lane-heat red-danger" />
                      <div className="pq-lane-footer-box red">
                        <div className="wait-time">10 min</div>
                        <div className="veh-count">15 vehicles</div>
                      </div>
                    </div>

                    <div className="pq-lane-column">
                      <div className="pq-lane-header-badge amber-badge">Cash Lane 5</div>
                      <div className="pq-lane-heat green" />
                      <div className="pq-lane-footer-box green">
                        <div className="wait-time">3 min</div>
                        <div className="veh-count">4 vehicles</div>
                      </div>
                    </div>

                    <div className="pq-lane-column">
                      <div className="pq-lane-header-badge amber-badge">Cash Lane 6</div>
                      <div className="pq-lane-heat amber" />
                      <div className="pq-lane-footer-box amber">
                        <div className="wait-time">7 min</div>
                        <div className="veh-count">11 vehicles</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pq-feed-legend-bar">
                  <div className="pq-feed-legend-left">
                    <span>Wait per lane</span>
                    <span className="legend-dot green">● &lt; 5 min</span>
                    <span className="legend-dot amber">● 5-10 min</span>
                    <span className="legend-dot red">● 10 min or more</span>
                  </div>
                  <div className="pq-feed-legend-right">
                    <span>{currentPlazaData.lanes} lanes open · FASTag &amp; Cash</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pq-top-right-panels">
              <div className="tr-panel pq-overview-panel">
                <div className="tr-panel-header">
                  <h2>{currentPlazaData.name} Overview</h2>
                  <span className="tr-time-range">Updated 1 min ago</span>
                </div>

                <div className="pq-overview-grid">
                  <div className="pq-overview-card">
                    <div className="pq-card-icon green-icon">
                      <Bus size={18} />
                    </div>
                    <div>
                      <span className="pq-card-label">Vehicles (30 min)</span>
                      <div className="pq-card-value">{currentPlazaData.vehicles}</div>
                      <span className="pq-card-sub green">▲ 12% vs prev hour</span>
                    </div>
                  </div>

                  <div className="pq-overview-card">
                    <div className="pq-card-icon green-icon">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="pq-card-label">Avg. wait time</span>
                      <div className="pq-card-value">{currentPlazaData.avgWait}</div>
                      <span className="pq-card-sub green">▲ 2.1 mins vs 07:45 AM</span>
                    </div>
                  </div>

                  <div className="pq-overview-card">
                    <div className="pq-card-icon green-icon">
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <span className="pq-card-label">Toll revenue</span>
                      <div className="pq-card-value">{currentPlazaData.revenue}</div>
                      <span className="pq-card-sub green">▲ 5% vs yesterday</span>
                    </div>
                  </div>

                  <div className="pq-overview-card">
                    <div className="pq-card-icon red-icon">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <span className="pq-card-label">FASTag share</span>
                      <div className="pq-card-value">{currentPlazaData.fastag}</div>
                      <span className="pq-card-sub green">▲ 3% vs yesterday</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tr-panel pq-alerts-panel">
                <div className="tr-panel-header">
                  <h2>Alerts &amp; Notifications</h2>
                  <span className="tr-link-btn">View All</span>
                </div>

                <div className="pq-alerts-list">
                  <div className="pq-alert-item">
                    <div className="pq-alert-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                      <AlertTriangle size={15} />
                    </div>
                    <div className="pq-alert-content">
                      <div className="pq-alert-header">
                        <strong>{currentPlazaData.hotspotLane} queue building</strong>
                        <span>08:40 AM</span>
                      </div>
                      <p>Wait time exceeds 10 minute alert threshold</p>
                    </div>
                  </div>
                  <div className="pq-alert-item">
                    <div className="pq-alert-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                      <Info size={15} />
                    </div>
                    <div className="pq-alert-content">
                      <div className="pq-alert-header">
                        <strong>Primary Anomaly: {currentPlazaData.topAnomaly}</strong>
                        <span>08:28 AM</span>
                      </div>
                      <p>Automated system alert logged for review</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: REVENUE LEAKAGE TAB (AUDIT & ANOMALY BREAKDOWN)
         ========================================================= */}
      {activeTab === 'Revenue Leakage' && (
        <div className="leakage-view-container">
          <div className="tr-stat-grid">
            <div className="tr-stat-card">
              <div className="tr-stat-icon red">
                <TrendingDown size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">₹ 14.6 lakh</div>
                <div className="tr-stat-label">Total Est. Leakage (24h)</div>
                <div className="tr-stat-subtext red-text">↑ 4.3% of total revenue</div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon purple">
                <AlertTriangle size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">312</div>
                <div className="tr-stat-label">Leakage Incidents</div>
                <div className="tr-stat-subtext purple-text">71% verified loss</div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon orange">
                <IndianRupee size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">₹ 5.8 lakh</div>
                <div className="tr-stat-label">Class Mismatch Loss</div>
                <div className="tr-stat-subtext orange-text">Pullur Lane 4 Top Hotspot</div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon navy">
                <Shield size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">₹ 3.2 lakh</div>
                <div className="tr-stat-label">Exempt Pass Abuse</div>
                <div className="tr-stat-subtext green-text">Devanahalli 38 passes</div>
              </div>
            </div>
          </div>

          <div className="tr-panel">
            <div className="tr-panel-header">
              <h2>Revenue Leakage Audit Logs</h2>
              <span className="tr-badge-count">{leakageAuditLogs.length} recent audits</span>
            </div>

            <div className="tr-table-wrapper">
              <table className="tr-plazas-table">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>Plaza &amp; Lane</th>
                    <th>Shift Window</th>
                    <th>Anomaly Category</th>
                    <th className="num">Expected Fee</th>
                    <th className="num">Charged Fee</th>
                    <th className="num">Loss Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leakageAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td><strong>{log.id}</strong></td>
                      <td>{log.plaza} · {log.lane}</td>
                      <td>{log.shift}</td>
                      <td>{log.anomaly}</td>
                      <td className="num">{log.expectedFee}</td>
                      <td className="num">{log.chargedFee}</td>
                      <td className="num danger-text">{log.loss}</td>
                      <td>
                        <span className={`tr-status-pill ${log.statusClass}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: TRANSACTION REVIEW TAB (REAL-TIME AUDIT STREAM)
         ========================================================= */}
      {activeTab === 'Transaction Review' && (
        <div className="txn-view-container">
          <div className="tr-panel">
            <div className="tr-panel-header">
              <h2>Transaction Review &amp; FASTag Audit Stream</h2>
              <div className="tr-search-box">
                <input
                  type="text"
                  placeholder="Search Plate, Tag ID or Plaza..."
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>

            <div className="tr-table-wrapper">
              <table className="tr-plazas-table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Time</th>
                    <th>Plate Number</th>
                    <th>Tag ID</th>
                    <th>Plaza &amp; Lane</th>
                    <th>Vehicle Class</th>
                    <th className="num">Fee Charged</th>
                    <th>Payment</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveTxnList
                    .filter((txn) => {
                      if (!txnSearch) return true
                      const q = txnSearch.toLowerCase()
                      return (
                        txn.plate.toLowerCase().includes(q) ||
                        txn.tagId.toLowerCase().includes(q) ||
                        txn.plaza.toLowerCase().includes(q) ||
                        txn.txId.toLowerCase().includes(q)
                      )
                    })
                    .map((txn) => (
                      <tr key={txn.txId}>
                        <td><strong>{txn.txId}</strong></td>
                        <td>{txn.time}</td>
                        <td><span className="camera-id">{txn.plate}</span></td>
                        <td style={{ fontFamily: 'monospace' }}>{txn.tagId}</td>
                        <td>{txn.plaza} ({txn.lane})</td>
                        <td>{txn.class}</td>
                        <td className="num">{txn.fee}</td>
                        <td>{txn.payment}</td>
                        <td>
                          <span className={`tr-status-pill ${txn.statusType}`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: LEAKAGE PATTERNS TAB (AI PATTERN INTELLIGENCE)
         ========================================================= */}
      {activeTab === 'Leakage Patterns' && (
        <div className="patterns-view-container">
          <div className="tr-panel">
            <div className="tr-panel-header">
              <h2>AI Pattern Intelligence &amp; Hotspot Insights</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="pq-action-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong style={{ color: '#dc2626' }}>Pattern 1: Night Shift Class Downgrade</strong>
                <p>
                  Pullur Lane 4 records 3.6x higher truck-to-LCV reclassifications between
                  02:00 AM and 05:00 AM. Estimated monthly impact: ₹ 14.2 lakh.
                </p>
              </div>

              <div className="pq-action-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong style={{ color: '#d97706' }}>Pattern 2: RFID Reader Timeout Surge</strong>
                <p>
                  Raikal Lane 3 reader retries spike during peak morning queue (07:30 - 08:45 AM),
                  forcing manual gate releases for 64 vehicles.
                </p>
              </div>

              <div className="pq-action-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong style={{ color: '#2563eb' }}>Pattern 3: Exempt Pass Spikes</strong>
                <p>
                  Devanahalli Lane 8 logs 38 exempt passes in 8 hours (normal baseline: 15).
                  Automated audit triggered for supervisor review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 6: DATABASE RECORDS TAB (FULL SCHEMA & RECORD INSPECTOR)
         ========================================================= */}
      {activeTab === 'Database Records' && (
        <div className="db-records-view">
          {/* DB SCHEMA & POOL STATS HEADER */}
          <div className="tr-stat-grid">
            <div className="tr-stat-card">
              <div className="tr-stat-icon navy">
                <Building2 size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">7,044</div>
                <div className="tr-stat-label">Indexed DB Records</div>
                <div className="tr-stat-subtext green-text">
                  Table: vehicle_events (MySQL)
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon blue">
                <Layers size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">16 Fields</div>
                <div className="tr-stat-label">Attributes per Record</div>
                <div className="tr-stat-subtext">
                  Full ANPR & Telemetry Schema
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon green">
                <Radio size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">
                  {isStreamActive ? 'LIVE LOOPING' : 'STREAM PAUSED'}
                </div>
                <div className="tr-stat-label">Ingestion Mode</div>
                <div className="tr-stat-subtext green-text">
                  Socket.io Heartbeat Active
                </div>
              </div>
            </div>

            <div className="tr-stat-card">
              <div className="tr-stat-icon orange">
                <Shield size={19} />
              </div>
              <div className="tr-stat-copy">
                <div className="tr-stat-value">98.4%</div>
                <div className="tr-stat-label">Mean ANPR OCR Confidence</div>
                <div className="tr-stat-subtext green-text">
                  High-Precision Detection
                </div>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER & FILTERS */}
          <div className="tr-panel" style={{ marginTop: '20px' }}>
            <div
              className="tr-panel-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h2>Database Vehicle Event Records</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Complete inventory of recorded toll scans, vehicle speeds, coordinates &amp; FASTag IDs.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Search by Plate, ID, FASTag, Location..."
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    style={{
                      padding: '7px 12px 7px 30px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      width: '260px',
                    }}
                  />
                </div>

                <select
                  value={dbClassFilter}
                  onChange={(e) => setDbClassFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Vehicle Classes</option>
                  <option value="Car">Car / SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Bus">Bus</option>
                  <option value="LCV">LCV</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
            </div>

            <div className="tr-table-wrapper" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="tr-plazas-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Timestamp (IST)</th>
                    <th>Plate Number</th>
                    <th>Vehicle Class</th>
                    <th>OCR Conf %</th>
                    <th>Speed (km/h)</th>
                    <th>OverSpeed</th>
                    <th>FASTag ID</th>
                    <th>Location / Plaza</th>
                    <th>Camera Source</th>
                    <th>Coordinates</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .slice(0, 100)
                    .filter((r) => {
                      if (dbClassFilter !== 'All' && r.vehicleType !== dbClassFilter) return false
                      if (!dbSearch) return true
                      const q = dbSearch.toLowerCase()
                      return (
                        (r.id && String(r.id).toLowerCase().includes(q)) ||
                        (r.numberPlate && r.numberPlate.toLowerCase().includes(q)) ||
                        (r.location && r.location.toLowerCase().includes(q)) ||
                        (r.vehicleType && r.vehicleType.toLowerCase().includes(q)) ||
                        (r.camera && r.camera.toLowerCase().includes(q))
                      )
                    })
                    .map((r, idx) => {
                      const speedNum = Number(r.speed || 45)
                      const isOver = speedNum > 80 || r.isOverSpeed
                      const recordId = r.csvRecordId || r.id || `OBS-NH44-${1000 + idx}`
                      const timeStr = r.timestampIst || r.timestamp || '16 Sep 2026 08:45:12 AM'
                      const plateStr = r.numberPlate || 'TS 09 AB 1234'
                      const typeStr = r.vehicleType || 'Car'
                      const confPct = Math.round(Number(r.plateConfidence || 0.98) * (Number(r.plateConfidence || 0.98) <= 1 ? 100 : 1))
                      const fastagId = `3412-${8800 + idx}-${1000 + (idx % 800)}`
                      const locStr = r.location || 'Raikal Toll Plaza (KM 58)'
                      const camStr = r.camera || 'CAM-NH44-01-RAIKAL'
                      const coords = r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : '17.3850, 78.4867'

                      return (
                        <tr key={idx}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>
                              {recordId}
                            </strong>
                          </td>
                          <td style={{ fontSize: '12px', color: '#475569' }}>{timeStr}</td>
                          <td>
                            <span className="camera-id" style={{ fontWeight: '700' }}>
                              {plateStr}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: '#f1f5f9',
                                color: '#334155',
                              }}
                            >
                              {typeStr}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: confPct >= 95 ? '#059669' : '#d97706',
                                fontWeight: '700',
                              }}
                            >
                              {confPct}%
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: isOver ? '#dc2626' : '#1e293b',
                                fontWeight: isOver ? '800' : '500',
                              }}
                            >
                              {speedNum} km/h
                            </span>
                          </td>
                          <td>
                            <span className={`tr-status-pill ${isOver ? 'red' : 'green'}`}>
                              {isOver ? 'YES (Overspeed)' : 'NORMAL'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{fastagId}</td>
                          <td style={{ fontSize: '12px' }}>{locStr}</td>
                          <td style={{ fontSize: '11px', color: '#64748b' }}>{camStr}</td>
                          <td style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                            {coords}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDbRecord({
                                  ...r,
                                  recordId,
                                  timeStr,
                                  plateStr,
                                  typeStr,
                                  confPct,
                                  fastagId,
                                  locStr,
                                  camStr,
                                  coords,
                                  speedNum,
                                  isOver,
                                })
                              }
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#2563eb',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DATABASE RECORD DETAIL INSPECTOR MODAL
         ========================================================= */}
      {selectedDbRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedDbRecord(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Database Record Details: {selectedDbRecord.recordId}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Table: vehicle_events · MySQL Primary Key ID: {selectedDbRecord.id || 1042}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDbRecord(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* FIELD VALUES GRID */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Vehicle Plate Number
                </span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {selectedDbRecord.plateStr}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  ANPR Optical Confidence
                </span>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                  {selectedDbRecord.confPct}%
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Vehicle Classification
                </span>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>
                  {selectedDbRecord.typeStr}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  FASTag RFID Identifier
                </span>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: '700', color: '#2563eb', marginTop: '2px' }}>
                  {selectedDbRecord.fastagId}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Recorded Velocity / Speed Limit
                </span>
                <div style={{ fontSize: '15px', fontWeight: '700', color: selectedDbRecord.isOver ? '#dc2626' : '#1e293b', marginTop: '2px' }}>
                  {selectedDbRecord.speedNum} km/h (Limit: 80 km/h) {selectedDbRecord.isOver ? '🚨 VIOLATION' : ''}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Timestamp (IST)
                </span>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                  {selectedDbRecord.timeStr}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Toll Plaza &amp; Location
                </span>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                  {selectedDbRecord.locStr}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                  Geolocation Coordinates
                </span>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                  {selectedDbRecord.coords}
                </div>
              </div>
            </div>

            {/* RAW JSON VIEW */}
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                Raw Database JSON Payload:
              </span>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflowX: 'auto',
                  marginTop: '6px',
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(selectedDbRecord, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedDbRecord(null)}
                style={{
                  padding: '8px 20px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
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
