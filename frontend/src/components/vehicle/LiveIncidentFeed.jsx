import {
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  Clock,
  CloudRain,
  Flame,
  Radio,
  Truck,
  Wrench,
} from 'lucide-react'
import { liveHighwayIncidents } from '../../data/vehicleTrackingData'

function getIncidentIcon(iconType) {
  switch (iconType) {
    case 'fire':
      return <Flame size={16} />
    case 'accident':
      return <AlertTriangle size={16} />
    case 'truck':
      return <Truck size={16} />
    case 'water':
      return <CloudRain size={16} />
    case 'roadwork':
      return <Wrench size={16} />
    case 'debris':
      return <AlertOctagon size={16} />
    default:
      return <AlertTriangle size={16} />
  }
}

export default function LiveIncidentFeed({
  incidents = liveHighwayIncidents,
  selectedIncidentId,
  onSelectIncident,
  onViewAll,
}) {
  return (
    <section className="live-incident-feed-panel" aria-label="Live Incident Feed">
      <header className="feed-header">
        <div className="feed-header-left">
          <h3>Live Incident Feed</h3>
        </div>
        <div className="feed-header-right">
          <span className="live-indicator">
            <span className="pulse-dot" /> Auto-refresh (30s)
          </span>
          <button type="button" className="view-all-link" onClick={onViewAll}>
            View All
          </button>
        </div>
      </header>

      <div className="feed-list" role="list">
        {incidents.map((incident) => {
          const isSelected = selectedIncidentId === incident.id
          const severityLower = (incident.severity || 'low').toLowerCase()

          return (
            <div
              key={incident.id}
              role="listitem"
              className={`feed-item ${isSelected ? 'is-selected' : ''} severity-${severityLower}`}
              onClick={() => onSelectIncident && onSelectIncident(incident)}
            >
              <div className={`feed-icon-wrap icon-theme-${severityLower}`}>
                {getIncidentIcon(incident.iconType)}
              </div>

              <div className="feed-item-content">
                <div className="feed-item-top">
                  <strong className="feed-item-title">{incident.title}</strong>
                  <div className="feed-time-wrap">
                    <span className="feed-time-text">{incident.time}</span>
                  </div>
                </div>

                <div className="feed-item-loc">
                  <span>{incident.location}</span>
                  {incident.detail && (
                    <span className="feed-detail-text"> | {incident.detail}</span>
                  )}
                </div>

                <div className="feed-item-bottom">
                  {incident.vehicleNumber && (
                    <span className="feed-plate-tag">{incident.vehicleNumber}</span>
                  )}
                  <span className={`severity-tag tag-${severityLower}`}>
                    {incident.severity}
                  </span>
                </div>
              </div>

              <div className="feed-action-arrow">
                <ChevronRight size={16} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
