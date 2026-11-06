import { useState } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  Bike,
  Bus,
  Car,
  Clock,
  Download,
  Gauge,
  MapPin,
  Navigation,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from 'lucide-react'

function getVehicleTypeIcon(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('bike') || t.includes('two') || t.includes('motorcycle')) {
    return <Bike size={14} />
  }
  if (t.includes('truck') || t.includes('heavy') || t.includes('trailer')) {
    return <Truck size={14} />
  }
  if (t.includes('bus')) {
    return <Bus size={14} />
  }
  if (t.includes('auto') || t.includes('three')) {
    return <AlertOctagon size={14} />
  }
  return <Car size={14} />
}


function formatSafeTime(value) {
  if (!value) return '10:45 am';
  try {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return '10:45 am';
      return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const str = String(value).trim();
    if (!str) return '10:45 am';
    if (/^\d{1,2}:\d{2}(?::\d{2})?\s*(am|pm)?$/i.test(str)) return str;
    const cleanStr = str.replace(/\s+IST\b/i, '').replace(/,/g, '');
    const d = new Date(cleanStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return str;
  } catch {
    return String(value);
  }
}

export default function CollisionVehiclesTable({
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  newlyAddedPlate,
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVehicles = vehicles.filter((v) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase().trim()
    return (
      (v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(q)) ||
      (v.vehicleType && v.vehicleType.toLowerCase().includes(q)) ||
      (v.incidentType && v.incidentType.toLowerCase().includes(q)) ||
      (v.collisionCamera && v.collisionCamera.toLowerCase().includes(q))
    )
  })

  function handleSelect(vehicle) {
    if (onSelectVehicle) {
      onSelectVehicle(vehicle)
    }
  }

  function exportCsv() {
    const headers = [
      'Vehicle Number',
      'Classification',
      'Incident Type',
      'Impact Checkpoint',
      'Speed (km/h)',
      'Speed Limit',
      'Impact Time',
      'Status',
      'Summary',
    ]
    const rows = filteredVehicles.map((v) => [
      v.vehicleNumber,
      v.vehicleType,
      v.incidentType,
      v.collisionCamera,
      v.speed,
      v.speedLimit,
      v.incidentTime,
      v.status,
      `"${(v.summary || '').replace(/"/g, '""')}"`,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `NH44_Collision_Vehicles_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="collision-table-section" aria-label="Vehicles Facing Collision">
      <header className="collision-table-header">
        <div className="collision-header-left">
          <div className="collision-title-badge">
            <span className="badge-flame-dot" />
            <span className="collision-title-kicker">NH-44 INCIDENT RADAR</span>
          </div>
          <h2>Vehicles Involved in Collision</h2>
          <p>
            Click any vehicle to view its traversed path, camera checkpoints, and route on the map.
          </p>
        </div>

        <div className="collision-header-actions">
          <div className="table-search-mini">
            <Search size={13} className="search-icon-svg" />
            <input
              type="text"
              placeholder="Filter plate (e.g. MP44)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-mini-btn"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="collision-export-btn"
            onClick={exportCsv}
            title="Export collision vehicles to CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      <div className="collision-table-wrapper">
        <table className="collision-data-table">
          <thead>
            <tr>
              <th>Vehicle Plate</th>
              <th>Type</th>
              <th>Collision Incident</th>
              <th>Impact Checkpoint</th>
              <th>Speed at Impact</th>
              <th>Impact Time</th>
              <th>Status</th>
              <th className="th-action">Path Traversal</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data-cell">
                  No collision vehicles recorded matching filter.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => {
                const isSelected = selectedVehicle?.vehicleNumber === vehicle.vehicleNumber
                const isNewlyAdded = newlyAddedPlate === vehicle.vehicleNumber
                const isOverSpeed =
                  vehicle.speed && vehicle.speedLimit && vehicle.speed > vehicle.speedLimit
                const status = vehicle.status || 'Under Response'

                return (
                  <tr
                    key={vehicle.vehicleNumber}
                    className={`collision-row ${isSelected ? 'row-selected' : ''} ${isNewlyAdded ? 'row-just-added' : ''
                      }`}
                    onClick={() => handleSelect(vehicle)}
                  >
                    {/* 1. Vehicle Plate */}
                    <td className="cell-plate">
                      <div className="plate-badge-flex">
                        <div className="hsrp-plate-badge-premium">
                          <span className="hsrp-ind-tab">
                            <span className="chakra-dot">☸</span>
                            <span>IND</span>
                          </span>
                          <span className="hsrp-reg-number">{vehicle.vehicleNumber}</span>
                        </div>
                        {isNewlyAdded && (
                          <span className="new-alert-tag">NEW ALERT</span>
                        )}
                      </div>
                    </td>

                    {/* 2. Vehicle Classification */}
                    <td className="cell-classification">
                      <div className="type-badge-cell">
                        <span className="type-icon-circle">
                          {getVehicleTypeIcon(vehicle.vehicleType)}
                        </span>
                        <span>{vehicle.vehicleType || 'Car'}</span>
                      </div>
                    </td>

                    {/* 3. Collision Incident */}
                    <td className="cell-details">
                      <div className="incident-detail-wrap">
                        <div className="incident-title-row">
                          <AlertTriangle size={13} className="text-red-500" />
                          <strong className="incident-title-text">
                            {vehicle.incidentType || 'Collision'}
                          </strong>
                        </div>
                        <p className="incident-summary-text" title={vehicle.summary}>
                          {vehicle.summary || 'Recorded collision impact on NH-44.'}
                        </p>
                      </div>
                    </td>

                    {/* 4. Impact Checkpoint */}
                    <td className="cell-location">
                      <div className="checkpoint-cell-wrap">
                        <MapPin size={13} className="pin-icon text-red-500" />
                        <span className="checkpoint-name">
                          {vehicle.collisionCamera
                            ? vehicle.collisionCamera.replace('CAM-NH44-', '')
                            : 'Shamshabad KM 18'}
                        </span>
                      </div>
                    </td>

                    {/* 5. Speed */}
                    <td className="cell-speed">
                      <div className="speed-cell-wrap">
                        <span className={`speed-value ${isOverSpeed ? 'is-overspeed' : ''}`}>
                          <Gauge size={13} />
                          <strong>{vehicle.speed || 75}</strong> km/h
                        </span>
                        <small className="speed-limit-label">Limit: {vehicle.speedLimit || 80}</small>
                      </div>
                    </td>

                    {/* 6. Timestamp */}
                    <td className="cell-time">
                      <div className="time-cell-wrap">
                        <Clock size={12} className="clock-icon" />
                        <span>
                          {formatSafeTime(vehicle.incidentTime)}
                        </span>
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td className="cell-status">
                      <span
                        className={`status-chip-pill status-${status
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                      >
                        {status}
                      </span>
                    </td>

                    {/* 8. Action */}
                    <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`path-view-btn ${isSelected ? 'is-active-btn' : ''}`}
                        onClick={() => handleSelect(vehicle)}
                      >
                        <Navigation size={12} />
                        <span>{isSelected ? 'Viewing Path' : 'Show Path'}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="collision-table-footer">
        <span className="showing-records-text">
          Showing <strong>{filteredVehicles.length}</strong> active collision incidents on NH-44 corridor
        </span>
        <span className="live-stream-status-text">
          <span className="pulse-dot-small" /> Live Radar Active · Auto-updating
        </span>
      </footer>
    </section>
  )
}
