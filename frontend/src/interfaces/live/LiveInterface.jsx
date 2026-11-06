import React from 'react'
import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { LiveFeedProvider } from './context/LiveFeedContext'
import LiveDashboard from './pages/LiveDashboard'
import LiveTollRevenue from './pages/LiveTollRevenue'
import LiveQuery from './pages/LiveQuery'
import LiveKnowledgeGraph from './pages/LiveKnowledgeGraph'
import LiveOntology from './pages/LiveOntology'
import LiveTrafficFlow from './pages/LiveTrafficFlow'
import LiveCameraNetwork from './pages/LiveCameraNetwork'
import LiveIncidents from './pages/LiveIncidents'
import EvidenceTrackingPage from '../../components/vehicle/EvidenceTrackingPage'
import LiveAssetsMaintenance from './pages/LiveAssetsMaintenance'
import LiveReports from './pages/LiveReports'
import LiveRulesEvents from './pages/LiveRulesEvents'
import ModelsPage from '../../components/models/ModelsPage'
import './live-interface.css'

/**
 * LiveInterface
 * Root wrapper for the independent Live Feed interface.
 * Hosts the isolated LiveFeedProvider and renders all Live pages.
 */
export default function LiveInterface({ excelRows = [], excelFileName = '' }) {
  return (
    <LiveFeedProvider excelRows={excelRows} excelFileName={excelFileName}>
      <div className="live-interface-pages">
        <Routes>
          <Route path="/" element={<Navigate replace to="home" />} />
          <Route path="home" element={<LiveDashboard />} />
          <Route path="toll-revenue" element={<LiveTollRevenue />} />
          <Route path="query" element={<LiveQuery />} />
          <Route path="knowledge-graph" element={<LiveKnowledgeGraph />} />
          <Route path="ontology" element={<LiveOntology />} />
          <Route path="dashboards" element={<Navigate replace to="dashboards/traffic" />} />
          <Route path="dashboards/traffic" element={<LiveTrafficFlow />} />
          <Route path="dashboards/cameras" element={<LiveCameraNetwork />} />
          <Route path="dashboards/vehicles" element={<Navigate replace to="dashboards/traffic" />} />
          <Route path="dashboards/corridors" element={<Navigate replace to="dashboards/traffic" />} />
          <Route path="dashboards/:kind" element={<LiveTrafficFlow />} />
          <Route path="vehicle-information" element={<LiveIncidents />} />
          <Route path="evidence-tracking" element={<EvidenceTrackingPage trafficRows={excelRows} />} />
          <Route path="assets-maintenance" element={<LiveAssetsMaintenance />} />
          <Route path="document-intelligence" element={<LiveReports />} />
          <Route path="rules-events" element={<LiveRulesEvents />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="*" element={<Navigate replace to="home" />} />
        </Routes>
      </div>
    </LiveFeedProvider>
  )
}
