import { AlertTriangle, ArrowDown, Camera, CheckCircle2, Clock3, Gauge, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react'
import { sortObservationsChronologically } from '../../data/vehicleTrackingData'

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unavailable'
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return String(timestamp)
  }
}

export default function VehicleTimeline({ vehicle }) {
  if (!vehicle || !Array.isArray(vehicle.observations)) {
    return null
  }
  const observations = sortObservationsChronologically(vehicle.observations)

  return (
    <section className="vehicle-panel vehicle-timeline-panel">
      <div className="vehicle-panel-heading">
        <div>
          <p className="section-kicker">CHRONOLOGICAL EVIDENCE (NH-44)</p>
          <h2>Highway Camera Traversal</h2>
        </div>
        <span className="corridor-active-cams">
          {vehicle.observations.length} Checkpoints Recorded
        </span>
      </div>

      <div className="vehicle-timeline">
        {observations.map((observation, index) => {
          const isCollision =
            observation.detectionType?.toLowerCase().includes('collision') ||
            observation.detectionType?.toLowerCase().includes('accident') ||
            (vehicle.collisionCamera && observation.cameraId === vehicle.collisionCamera && /collision|accident/i.test(vehicle.incidentType))

          const isOverspeed =
            observation.detectionType?.toLowerCase().includes('overspeed') ||
            (observation.speed && observation.speedLimit && observation.speed > observation.speedLimit)

          return (
            <div className="vehicle-timeline-event" key={`${observation.cameraId}-${observation.timestamp}-${index}`}>
              <div
                className={`vehicle-timeline-marker ${isCollision ? 'collision' : isOverspeed ? 'overspeed' : 'normal'}`}
                title={isCollision ? 'Collision Impact Checkpoint' : 'Optical Camera Capture'}
              >
                {isCollision ? (
                  <AlertTriangle size={14} />
                ) : isOverspeed ? (
                  <ShieldAlert size={14} />
                ) : (
                  <Camera size={13} />
                )}
              </div>

              <div className="vehicle-timeline-line" />

              <div className={`vehicle-timeline-card ${isCollision ? 'card-collision' : ''}`}>
                <div className="vehicle-timeline-top">
                  <div className="timeline-time">
                    <Clock3 size={12} />
                    <strong>{formatTimestamp(observation.timestamp)}</strong>
                  </div>
                  <span className={`timeline-badge ${isCollision ? 'timeline-danger' : isOverspeed ? 'timeline-warning' : 'timeline-normal'}`}>
                    {observation.detectionType || 'Vehicle Detected'}
                  </span>
                </div>

                <h3>{observation.cameraId}</h3>
                <p>
                  <MapPin size={13} />
                  {observation.location || 'NH-44 Checkpoint'}
                </p>

                <div className="vehicle-timeline-meta">
                  {observation.speed && (
                    <span className={observation.speed > (observation.speedLimit || 80) ? 'speed-alert' : ''}>
                      <Gauge size={12} />
                      {observation.speed} km/h (Limit: {observation.speedLimit || 80})
                    </span>
                  )}
                  <span>
                    <ShieldCheck size={12} />
                    {Math.round((observation.confidence || 0.95) * (Number(observation.confidence || 0.95) <= 1 ? 100 : 1))}% confidence
                  </span>
                </div>

                {observation.notes && (
                  <p className={`timeline-notes ${isCollision ? 'notes-danger' : ''}`}>
                    {observation.notes}
                  </p>
                )}
              </div>

              {index < observations.length - 1 && (
                <ArrowDown className="vehicle-timeline-arrow" size={14} />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
