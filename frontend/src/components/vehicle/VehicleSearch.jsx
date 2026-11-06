import { AlertTriangle, Car, CarFront, Search, X } from 'lucide-react'

export default function VehicleSearch({ value, onChange, onSubmit, onClear, loading = false }) {
  const quickSearches = [
    { plate: 'MP44AB1234', label: 'MP44AB1234 (Car - Collision)', type: 'collision' },
    { plate: 'TS09XY4567', label: 'TS09XY4567 (Bike - Collision)', type: 'collision' },
    { plate: 'AP28CD7890', label: 'AP28CD7890 (Auto - Accident)', type: 'collision' },
    { plate: 'TS08EF2468', label: 'TS08EF2468 (Bus - Speeding)', type: 'speed' },
    { plate: 'KA01GH9087', label: 'KA01GH9087 (Truck - Reckless)', type: 'reckless' },
    { plate: 'TG07JK5312', label: 'TG07JK5312 (Car - Full Route)', type: 'normal' },
  ]

  return (
    <div className="vehicle-search-container">
      <form className="vehicle-search" onSubmit={onSubmit}>
        <Search size={18} className="search-icon-svg" />
        <input
          aria-label="Search vehicle number"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search target vehicle by registration number (e.g., MP44AB1234, TS09XY4567)..."
          value={value}
        />
        {value && (
          <button aria-label="Clear vehicle search" className="vehicle-search-clear" onClick={onClear} type="button">
            <X size={16} />
          </button>
        )}
        <button className="primary-action vehicle-search-submit" type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Track Vehicle'}
        </button>
      </form>

      <div className="vehicle-quick-tags">
        <span className="quick-tag-label">QUICK TARGETS:</span>
        {quickSearches.map((item) => (
          <button
            key={item.plate}
            type="button"
            className={`quick-tag-pill ${item.type === 'collision' ? 'tag-collision' : ''}`}
            onClick={() => {
              onChange(item.plate)
              // Trigger synthetic submit
              setTimeout(() => {
                onSubmit({ preventDefault: () => {} })
              }, 50)
            }}
          >
            {item.type === 'collision' && <AlertTriangle size={11} />}
            <span>{item.plate}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
