import { Navigate } from 'react-router-dom'

/**
 * DashboardHub previously contained the "Highway Intelligence Overview" tab and data.
 * The Highway Intelligence Overview part and its data have been removed as requested.
 * All dashboard analytics now route to Corridors Performance (/dashboards/corridors)
 * and its related sub-dashboards (Vehicle Analytics, Traffic Flow, Camera Network).
 */
export default function DashboardHub() {
  return <Navigate to="/dashboards/corridors" replace />
}