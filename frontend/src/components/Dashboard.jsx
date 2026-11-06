import {
  Car,
  Bike,
  Bus,
  Camera,
  MapPin,
  Users,
} from 'lucide-react'

const vehicleData = [
  { type: 'Cars', count: 620 },
  { type: 'Bikes', count: 410 },
  { type: 'Autos', count: 120 },
  { type: 'Buses', count: 55 },
  { type: 'Trucks', count: 40 },
]

const recentDetections = [
  {
    time: '08:12:14',
    camera: 'CAM-HYD-001-N',
    type: 'Car',
    plate: 'TS 09 AB 4521',
    location: 'Madhapur Main Road',
  },
  {
    time: '08:13:02',
    camera: 'CAM-HYD-002-E',
    type: 'Bike',
    plate: 'TG 08 CD 8214',
    location: 'HITEC City Road',
  },
  {
    time: '08:14:31',
    camera: 'CAM-HYD-003-S',
    type: 'Auto',
    plate: 'TS 10 EF 2341',
    location: 'Banjara Hills',
  },
  {
    time: '08:15:18',
    if(_type === 'Buses') return <Bus size={17} />
return <Car size={17} />
}

export default function Dashboard() {
  const totalVehicles = vehicleData.reduce(
    (total, vehicle) => total + vehicle.count,
    0
  )

  const maxValue = Math.max(...vehicleData.map((vehicle) => vehicle.count))

  return (
    <div className="dashboard-page">

      {/* PAGE HEADER */}
      <div className="page-intro">
        <div>
          <p className="section-kicker">TRAFFIC INTELLIGENCE</p>

          <h1>Dashboard</h1>

          <p className="intro-copy">
            Real-time traffic overview across Hyderabad road networks.
          </p>
        </div>

        <div className="dashboard-date">
          <span>DATA PERIOD</span>
          <strong>11 September 2026</strong>
        </div>
      </div>

      {/* DASHBOARD 1 - VEHICLES */}
      <section className="dashboard-section">

        <div className="dashboard-section-header">
          <div>
            <p className="section-kicker">DASHBOARD 01</p>
            <h2>Vehicle Analytics</h2>
          </div>

          <span className="dashboard-badge">
            Static Data
          </span>
        </div>

        {/* STAT CARDS */}
        <div className="traffic-stat-grid">

          <div className="traffic-stat-card">
            <div className="traffic-stat-icon">
              <Car size={19} />
            </div>

            <div>
              <span>Total Vehicles</span>
              <strong>{totalVehicles.toLocaleString()}</strong>
            </div>
          </div>

          <div className="traffic-stat-card">
            <div className="traffic-stat-icon">
              <Car size={19} />
            </div>

            <div>
              <span>Cars</span>
              <strong>620</strong>
            </div>
          </div>

          <div className="traffic-stat-card">
            <div className="traffic-stat-icon">
              <Bike size={19} />
            </div>

            <div>
              <span>Bikes</span>
              <strong>410</strong>
            </div>
          </div>
        </div>

        {/* CHART + SUMMARY */}
        <div className="dashboard-grid">

          {/* BAR CHART */}
          <div className="dashboard-panel">

            <div className="panel-heading">
              <div>
                <p className="section-kicker">VEHICLE DISTRIBUTION</p>
                <h2>Vehicles by Type</h2>
              </div>

              <span className="chart-period">
                Today
              </span>
            </div>

            <div className="vehicle-chart">

              {vehicleData.map((vehicle) => (
                <div className="vehicle-chart-row" key={vehicle.type}>

                  <div className="vehicle-label">
                    <span className="vehicle-icon">
                      <VehicleIcon type={vehicle.type} />
                    </span>

                    <span>{vehicle.type}</span>
                  </div>

                  <div className="vehicle-bar-container">
                    <div
                      className="vehicle-bar"
                      style={{
                        width: `${(vehicle.count / maxValue) * 100}%`,
                      }}
                    />
                  </div>

                  <strong>{vehicle.count}</strong>

                </div>
              ))}

            </div>
          </div>

          {/* LOCATION SUMMARY */}
          <div className="dashboard-panel">

            <div className="panel-heading">
              <div>
                <p className="section-kicker">LOCATION</p>
                <h2>Traffic Overview</h2>
              </div>
            </div>

            <div className="location-list">

              <div className="location-row">
                <MapPin size={17} />
                <div>
                  <strong>Madhapur</strong>
                  <span>245 vehicles</span>
                </div>
              </div>

              <div className="location-row">
                <MapPin size={17} />
                <div>
                  <strong>HITEC City</strong>
                  <span>198 vehicles</span>
                </div>
              </div>

              <div className="location-row">
                <MapPin size={17} />
                <div>
                  <strong>Gachibowli</strong>
                  <span>312 vehicles</span>
                </div>
              </div>

              <div className="location-row">
                <MapPin size={17} />
                <div>
                  <strong>Jubilee Hills</strong>
                  <h2>Traffic Flow</h2>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RAW DATA TABLE */}
        <div className="dashboard-panel traffic-table-panel">

          <div className="panel-heading">
            <div>
              <p className="section-kicker">DETECTION DATA</p>
              <h2>Recent Traffic Detections</h2>
            </div>

            <span className="record-count">
              300 records
            </span>
          </div>

          <div className="traffic-table-wrapper">

            <table className="traffic-table">

              <thead>
                <tr>
                  <th>TIME</th>
                  <th>CAMERA ID</th>
                  <th>OBJECT</th>
                  <th>NUMBER PLATE</th>
                  <th>LOCATION</th>
                </tr>
              </thead>

              <tbody>

                {recentDetections.map((item, index) => (
                  <tr key={index}>

                    <td>{item.time}</td>

                    <td>
                      <span className="camera-id">
                        <Camera size={13} />
                        {item.camera}
                      </span>
                    </td>

                    <td>
                      <span className="object-type">
                        {item.type}
                      </span>
                    </td>

                    <td>
                      {item.plate}
                    </td>

                    <td>
                      <span className="location-cell">
                        <MapPin size={13} />
                        {item.location}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

      </section>

      {/* DASHBOARD 2 + DASHBOARD 3 PLACEHOLDERS */}
      <div className="secondary-dashboard-grid">

        <section className="dashboard-mini-card">

          <div className="mini-dashboard-number">
            02
          </div>

          <div>
            <p className="section-kicker">DASHBOARD 02</p>
            <h2>Traffic Flow</h2>
            <p>
              Traffic volume and hourly traffic patterns.
            </p>
          </div>

          <span>Coming next</span>

        </section>

        <section className="dashboard-mini-card">

          <div className="mini-dashboard-number">
            03
          </div>

          <div>
            <p className="section-kicker">DASHBOARD 03</p>
            <h2>Camera & Location Monitoring</h2>
            <p>
              Camera status, object locations and intersection monitoring.
            </p>
          </div>

          <span>Coming next</span>

        </section>

      </div>

    </div>
  )
}