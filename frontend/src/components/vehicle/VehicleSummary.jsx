import { Activity, AlertTriangle, Camera, Car, Clock3, Gauge, MapPin, Radio, ShieldAlert } from 'lucide-react'
import { sortObservationsChronologically } from '../../data/vehicleTrackingData'

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Live Telemetry'
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return String(timestamp)
  }
}

export default function VehicleSummary({ vehicle }) {
  if (!vehicle) return null
  const observations = sortObservationsChronologically(vehicle.observations || [])
  const first = observations[0] || {}
  const last = observations[observations.length - 1] || {}
  const isCollision = /collision|accident/i.test(vehicle.incidentType || '')

  const fields = [
    ['Target Number Plate', vehicle.vehicleNumber, Activity],
    ['Vehicle Classification', vehicle.vehicleType || 'Car', Car],
    ['Surveillance Corridor', 'NH-44 Hyderabad Express', Radio],
    ['Corridor Incident', vehicle.incidentType || 'Normal Traversal', isCollision ? AlertTriangle : ShieldAlert],
    ['First Checkpoint', first.cameraId || 'Entry Gateway', Camera],
    ['Last Detected Camera', last.cameraId || 'Highway Camera', MapPin],
    ['Impact / Flag Time', formatTimestamp(vehicle.incidentTime), Clock3],
    ['Tracked Velocity', `${vehicle.speed || last.speed || 70} km/h (Limit: ${vehicle.speedLimit || last.speedLimit || 80})`, Gauge],
  ]

  return (
    <section className="vehicle-panel vehicle-summary-panel">
      <div className="vehicle-panel-heading">
        <div>
          <p className="section-kicker">FORENSIC TELEMETRY DOSSIER</p>
          <h2>{vehicle.vehicleNumber}</h2>
        </div>
        <div className="summary-header-badges">
          <span className={`vehicle-status ${isCollision ? 'status-danger' : 'status-tracking'}`}>
            {isCollision ? 'COLLISION TARGET' : vehicle.status || 'ACTIVE ON NH-44'}
          </span>
        </div>
      </div>

      {vehicle.summary && (
        <div className={`vehicle-summary-alert ${isCollision ? 'alert-collision' : ''}`}>
          {isCollision ? <AlertTriangle size={15} /> : <Radio size={15} />}
          <p>{vehicle.summary}</p>
        </div>
      )}

      <div className="vehicle-summary-grid">
        {fields.map(([label, value, Icon]) => (
          <div key={label} className="summary-grid-cell">
            <Icon size={16} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
