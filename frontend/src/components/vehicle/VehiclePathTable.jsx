import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Navigation,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { sortObservationsChronologically } from '../../data/vehicleTrackingData'


function formatSafeTime(value) {
  if (!value) return 'Live Detection';
  try {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return 'Live Detection';
      return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    const str = String(value).trim();
    if (!str) return 'Live Detection';
    if (/^\d{1,2}:\d{2}(?::\d{2})?\s*(am|pm)?$/i.test(str)) return str;
    const cleanStr = str.replace(/\s+IST\b/i, '').replace(/,/g, '');
    const d = new Date(cleanStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return str;
  } catch {
    return String(value);
  }
}

export default function VehiclePathTable({ vehicle, onSelectCheckpoint }) {
  if (!vehicle) {
    return (
      <section className="vehicle-path-section" aria-label="Vehicle Traversal Path">
        <div className="path-empty-card">
          <Car size={32} className="text-slate-400" />
          <h3>No Vehicle Selected</h3>
          <p>Click on any vehicle in the collision registry above to inspect its path and camera checkpoints.</p>
        </div>
      </section>
    )
  }

  const rawObservations = Array.isArray(vehicle.observations) ? vehicle.observations : []
  const observations = sortObservationsChronologically(rawObservations)
  const isCollisionTarget = /collision|accident|fire/i.test(vehicle.incidentType || '')

  return (
    <section className="vehicle-path-section" aria-label="Vehicle Traversal Path">
      <header className="vehicle-path-header">
        <div className="path-header-left">
          <div className="path-title-wrap">
            <span className="path-badge-icon">
              <Navigation size={16} />
            </span>
            <div>
              <h3>
                Path Traversed by Vehicle: <span className="highlight-plate">{vehicle.vehicleNumber}</span>
              </h3>
              <p>
                Chronological ANPR optical camera detections along the NH-44 highway corridor ({observations.length} Checkpoints)
              </p>
            </div>
          </div>
        </div>

        <div className="path-header-right">
          <div className="path-vehicle-pill">
            <span className="pill-type">{vehicle.vehicleType || 'Vehicle'}</span>
            <span className={`pill-status ${isCollisionTarget ? 'is-collision' : ''}`}>
              {vehicle.incidentType || 'Tracking'}
            </span>
          </div>
        </div>
      </header>

      <div className="path-table-wrapper">
        <table className="vehicle-path-data-table">
          <thead>
            <tr>
              <th className="th-stop">#</th>
              <th>Camera Checkpoint</th>
              <th>Highway Corridor Location</th>
              <th>Detection Event</th>
              <th>Recorded Speed</th>
              <th>Observation Time</th>
              <th>Confidence</th>
              <th>Forensic Surveillance Notes</th>
            </tr>
          </thead>
          <tbody>
            {observations.length === 0 ? (
              <tr>
                <td colSpan={8} className="path-no-records">
                  No camera detection records available for {vehicle.vehicleNumber}.
                </td>
              </tr>
            ) : (
              observations.map((obs, index) => {
                const isObsCollision =
                  /collision|accident|fire/i.test(obs.detectionType || '') ||
                  obs.cameraId === vehicle.collisionCamera

                const isOverSpeed =
                  obs.speed && obs.speedLimit && obs.speed > obs.speedLimit

                const timeStr = formatSafeTime(obs.timestamp)

                const confidencePct = Math.round(
                  (Number(obs.confidence) || 0.96) <= 1
                    ? (Number(obs.confidence) || 0.96) * 100
                    : Number(obs.confidence) || 96
                )

                return (
                  <tr
                    key={`${obs.cameraId}-${obs.timestamp}-${index}`}
                    className={`path-row ${isObsCollision ? 'row-collision-checkpoint' : ''}`}
                    onClick={() => onSelectCheckpoint && onSelectCheckpoint(obs, index)}
                    title="Click to view this checkpoint on map"
                  >
                    <td className="cell-stop-number">
                      <span className={`stop-badge ${isObsCollision ? 'badge-collision' : ''}`}>
                        {index + 1}
                      </span>
                    </td>

                    <td className="cell-camera-id">
                      <div className="cam-cell-wrap">
                        <Camera size={14} className={isObsCollision ? 'text-red-500' : 'text-blue-500'} />
                        <strong>{obs.cameraId || 'Corridor Camera'}</strong>
                      </div>
                    </td>

                    <td className="cell-location">
                      <div className="loc-cell-wrap">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{obs.location || 'NH-44 Highway Stretch'}</span>
                      </div>
                    </td>

                    <td className="cell-detection">
                      <span
                        className={`detection-tag ${
                          isObsCollision
                            ? 'tag-collision-danger'
                            : isOverSpeed
                            ? 'tag-overspeed'
                            : 'tag-normal'
                        }`}
                      >
                        {isObsCollision && <AlertTriangle size={12} />}
                        {obs.detectionType || 'Vehicle Detected'}
                      </span>
                    </td>

                    <td className="cell-speed">
                      <div className="speed-wrap">
                        <Gauge size={13} className={isOverSpeed ? 'text-red-500' : 'text-slate-500'} />
                        <span className={`speed-text ${isOverSpeed ? 'overspeed-val' : ''}`}>
                          <strong>{obs.speed || 70}</strong> km/h
                        </span>
                        <small className="speed-limit-sub">Limit: {obs.speedLimit || 80}</small>
                      </div>
                    </td>

                    <td className="cell-time">
                      <div className="time-wrap">
                        <Clock size={12} className="text-slate-400" />
                        <span>{timeStr}</span>
                      </div>
                    </td>

                    <td className="cell-confidence">
                      <span className="confidence-chip">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        {confidencePct}%
                      </span>
                    </td>

                    <td className="cell-notes">
                      <span className={`notes-text ${isObsCollision ? 'notes-collision' : ''}`}>
                        {obs.notes || 'Normal passage detected across optical ANPR lane.'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
