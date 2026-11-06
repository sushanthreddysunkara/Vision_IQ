import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'

export default function LogIncidentModal({ isOpen, onClose, onAddIncident, cameras = [] }) {
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [incidentType, setIncidentType] = useState('Collision')
  const [severity, setSeverity] = useState('High')
  const [camera, setCamera] = useState(cameras[0]?.id || 'CAM-NH44-01-SHAMSHABAD')
  const [detail, setDetail] = useState('')
  const [reportedBy, setReportedBy] = useState('Highway Patrol Unit 4')

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (!vehicleNumber.trim()) return

    const newIncident = {
      id: `inc-${Date.now()}`,
      title: `${incidentType} (${vehicleNumber.toUpperCase()})`,
      location: camera.replace('CAM-', '').replace(/-/g, ' '),
      detail: detail.trim() || `${incidentType} reported by ${reportedBy}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity,
      type: incidentType,
      iconType: incidentType.toLowerCase().includes('fire') ? 'fire' : 'accident',
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      cameraId: camera,
    }

    if (onAddIncident) {
      onAddIncident(newIncident)
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="incident-log-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <AlertTriangle size={18} />
            </span>
            <div>
              <h3>Log Highway Incident</h3>
              <p>Record a collision, stall, or emergency on NH-44 corridor</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label>
              <span>Vehicle Number Plate *</span>
              <input
                type="text"
                required
                placeholder="e.g. TS09AB1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </label>

            <label>
              <span>Incident Type</span>
              <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                <option value="Collision">Accident / Collision</option>
                <option value="Vehicle Fire">Vehicle Fire</option>
                <option value="Stalled Vehicle">Stalled Vehicle</option>
                <option value="Overspeeding">Overspeeding</option>
                <option value="Reckless Driving">Reckless Driving</option>
                <option value="Obstacle / Debris">Obstacle / Debris</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Corridor Camera Checkpoint</span>
              <select value={camera} onChange={(e) => setCamera(e.target.value)}>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.corridorKm})
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Severity Level</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>

          <label>
            <span>Incident Description & Lane Status</span>
            <textarea
              rows={3}
              placeholder="e.g. High-speed rear collision, lane 2 blocked, emergency response dispatched..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </label>

          <label>
            <span>Reported By</span>
            <input
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
            />
          </label>

          <footer className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              <Plus size={15} /> Log Incident
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
