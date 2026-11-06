import { AlertTriangle, ArrowUpRight, Camera, Car, Clock3, ShieldCheck } from 'lucide-react'
import { sortObservationsChronologically } from '../../data/vehicleTrackingData'

function formatTime(timestamp) {
  if (!timestamp) return 'Live'
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return String(timestamp)
  }
}

export default function VehicleList({ vehicles = [], selectedVehicle, onSelect }) {
  return (
    <section className="vehicle-panel vehicle-list-panel">
      <div className="vehicle-panel-heading">
        <div>
          <p className="section-kicker">INCIDENT QUEUE · NH-44 HIGHWAY</p>
          <h2>Collision & Tracked Vehicles</h2>
        </div>
        <span className="corridor-active-cams">{vehicles.length} Active Targets</span>
      </div>

      <div className="vehicle-list">
        {vehicles.map((vehicle) => {
          const observations = sortObservationsChronologically(vehicle.observations || [])
          const lastObservation = observations[observations.length - 1] || {}
          const isSelected = selectedVehicle?.vehicleNumber === vehicle.vehicleNumber
          const isCollision = /collision|accident/i.test(vehicle.incidentType || '')

          return (
            <button
              className={`vehicle-list-item ${isSelected ? 'selected' : ''} ${isCollision ? 'item-collision' : ''}`}
              key={vehicle.vehicleNumber}
              onClick={() => onSelect(vehicle)}
              type="button"
            >
              <span className={`vehicle-list-icon ${isCollision ? 'icon-danger' : 'icon-normal'}`}>
                {isCollision ? <AlertTriangle size={17} /> : <Car size={17} />}
              </span>

              <span className="vehicle-list-copy">
                <div className="hsrp-plate-badge-small">
                  <span className="hsrp-country-mini">IND</span>
                  <span className="hsrp-code-mini">{vehicle.vehicleNumber}</span>
                </div>
                <span className="vehicle-list-subtitle">
                  {vehicle.vehicleType} · {vehicle.incidentType} at {vehicle.collisionCamera?.replace('CAM-NH44-', '') || 'NH-44'}
                </span>
              </span>

              <span className="vehicle-list-meta">
                <span>
                  <Clock3 size={12} />
                  {formatTime(vehicle.incidentTime)}
                </span>
                <span>
                  <Camera size={12} />
                  {lastObservation.cameraId?.replace('CAM-NH44-', '') || 'Live Camera'}
                </span>
              </span>

              <span className={`vehicle-status ${isCollision ? 'status-danger' : 'status-tracking'}`}>
                {isCollision ? 'COLLISION' : vehicle.status || 'TRACKING'}
              </span>

              <ArrowUpRight size={16} className="list-item-arrow" />
            </button>
          )
        })}
      </div>
    </section>
  )
}
