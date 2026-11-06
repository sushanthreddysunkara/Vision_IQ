import {
  Box,
  CircleDot,
  Database,
  GitBranch,
  Info,
  Tag,
} from 'lucide-react'

const iconMap = {
  Entity: CircleDot,
  DataProperty: Database,
  Datatype: Tag,
  ObjectProperty: GitBranch,
  OntologyClass: Box,
  Ontology: Info,
  OperationalStatus: CircleDot,
}

export default function OntologyDetails({
  node,
  relationships,
}) {
  if (!node) {
    return (
      <div className="ontology-details-empty">
        <Info size={28} />
        <h3>Select a node</h3>
        <p>
          Click any node in the ontology graph to view
          its information and relationships.
        </p>
      </div>
    )
  }

  const Icon = iconMap[node.category] || CircleDot

  const outgoing = relationships.filter(
    (item) => item.source === node.id
  )

  const incoming = relationships.filter(
    (item) => item.target === node.id
  )

  return (
    <div className="ontology-details">
      <div className="ontology-details-header">
        <div className="ontology-details-icon">
          <Icon size={20} />
        </div>

        <div>
          <div className="ontology-details-category">
            {node.category}
          </div>

          <h2>{node.label}</h2>
        </div>
      </div>

      <div className="ontology-detail-section">
        <h4>Description</h4>

        <p>
          {node.description || 'No description available.'}
        </p>
      </div>

      <div className="ontology-detail-section">
        <h4>Node information</h4>

        <div className="ontology-info-row">
          <span>ID</span>
          <strong>{node.id}</strong>
        </div>

        <div className="ontology-info-row">
          <span>Type</span>
          <strong>{node.category}</strong>
        </div>
      </div>

      <div className="ontology-detail-section">
        <h4>Relationships</h4>

        {outgoing.length === 0 && incoming.length === 0 ? (
          <p>No relationships found.</p>
        ) : (
          <div className="ontology-relationship-list">
            {outgoing.map((relationship) => (
              <div
                className="ontology-relationship"
                key={`out-${relationship.id}`}
              >
                <span className="relationship-direction">
                  →
                </span>

                <div>
                  <strong>{relationship.label}</strong>
                  <small>
                    → {relationship.target}
                  </small>
                </div>
              </div>
            ))}

            {incoming.map((relationship) => (
              <div
                className="ontology-relationship"
                key={`in-${relationship.id}`}
              >
                <span className="relationship-direction">
                  ←
                </span>

                <div>
                  <strong>{relationship.label}</strong>
                  <small>
                    ← {relationship.source}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}