import React, { useState, useMemo } from 'react'
import {
  ChevronDown,
  Database,
  Maximize,
  Layers,
  Minus,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useLiveFeed } from '../context/LiveFeedContext'
import OntologyGraph from '../../../components/ontology/OntologyGraph'
import OntologyDetails from '../../../components/ontology/OntologyDetails'
import { generateOntologyFromRows } from '../../../data/ontologyData'

export default function LiveOntology() {
  const { ontologyClasses, liveRecords, excelRows, excelFileName } = useLiveFeed()
  const [selectedClass, setSelectedClass] = useState(ontologyClasses[0] || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [graphSearch, setGraphSearch] = useState('')
  const [graphCategory, setGraphCategory] = useState('')
  const [selectedGraphNode, setSelectedGraphNode] = useState(null)
  const [graphControls, setGraphControls] = useState(null)

  const ontologyModel = useMemo(() => generateOntologyFromRows(excelRows), [excelRows])
  const graphCategories = useMemo(
    () => Array.from(new Set(ontologyModel.nodes.map((node) => node.category))).sort(),
    [ontologyModel.nodes],
  )
  const visibleGraphNodes = useMemo(
    () => graphCategory
      ? ontologyModel.nodes.filter((node) => node.category === graphCategory)
      : ontologyModel.nodes,
    [ontologyModel.nodes, graphCategory],
  )
  const visibleGraphRelationships = useMemo(() => {
    const visibleNodeIds = new Set(visibleGraphNodes.map((node) => node.id))
    return ontologyModel.relationships.filter(
      (relationship) => visibleNodeIds.has(relationship.source) && visibleNodeIds.has(relationship.target),
    )
  }, [ontologyModel.relationships, visibleGraphNodes])
  const selectedGraphNodeData = useMemo(
    () => ontologyModel.nodes.find((node) => node.id === selectedGraphNode) || null,
    [ontologyModel.nodes, selectedGraphNode],
  )
  const vehicleTypeCount = useMemo(
    () => new Set(excelRows.map((row) => row.vehicleType || row.type).filter(Boolean)).size,
    [excelRows],
  )
  const overSpeedCount = useMemo(
    () => excelRows.filter((row) => row.isOverSpeed || row.overSpeed === 'Yes').length,
    [excelRows],
  )

  const filteredClasses = useMemo(() => {
    return ontologyClasses.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [ontologyClasses, searchQuery])

  return (
    <div
      className="ontology-page live-ontology-page"
      style={{ width: '100%', maxWidth: 'none', margin: 0, padding: '24px clamp(16px, 2vw, 32px)' }}
    >
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMETRY · TRAFFIC AI ONTOLOGY SCHEMA
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Live Feed Traffic Ontology
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Domain conceptual framework defining optical inference entities, bounding vectors, OCR detections, and highway event taxonomy.
          </p>
        </div>

        {/* Demo Mode Notice Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 6,
          backgroundColor: '#f5f3ff',
          border: '1px solid #ddd6fe',
          color: '#6d28d9',
          fontSize: 12,
          fontWeight: 600,
        }}>
          <Database size={14} />
          {ontologyClasses.length} Live Ontology Classes · W3C OWL Schema
        </div>
      </div>

      {/* Main Ontology Explorer Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* Left: Class Hierarchy & Search */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search ontology classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Traffic AI Classes ({filteredClasses.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredClasses.map((cls) => {
              const isSelected = selectedClass?.name === cls.name
              return (
                <div
                  key={cls.name}
                  onClick={() => setSelectedClass(cls)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 6,
                    border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#0284c7' : '#0f172a' }}>
                      {cls.name}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: 10, color: '#475569' }}>
                      {cls.instancesCount} inst
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                    {cls.description}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Class Schema & Details View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedClass ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    OWL:CLASS DEFINITION · LIVE FEED DOMAIN
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
                    {selectedClass.name}
                  </h2>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                  Active Optical Ingestion
                </span>
              </div>

              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
                {selectedClass.description}
              </p>

              {/* Data & Object Properties */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase' }}>
                Defined RDF Data Properties & Slots
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                {selectedClass.properties?.map((prop, idx) => (
                  <div key={idx} style={{ padding: 12, borderRadius: 6, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Property Slot</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', fontFamily: 'monospace', marginTop: 2 }}>
                      viq:{prop}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      xsd:string / numeric scalar
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Instance Preview */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, textTransform: 'uppercase' }}>
                Live Stream Instance Preview
              </h3>
              <div style={{ padding: 14, borderRadius: 6, backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', lineHeight: 1.6 }}>
                <div>&lt;http://visioniq.ai/live/{selectedClass.name.toLowerCase()}/001&gt;</div>
                <div style={{ paddingLeft: 16, color: '#94a3b8' }}>a viq:{selectedClass.name} ;</div>
                {selectedClass.properties?.map((prop, idx) => (
                  <div key={idx} style={{ paddingLeft: 16, color: '#a5f3fc' }}>
                    viq:{prop} "{prop === 'confidenceScore' ? '0.94' : prop === 'isRecognized' ? 'false (Not Recognized)' : `live_${prop}_val`}" ;
                  </div>
                ))}
                <div style={{ paddingLeft: 16, color: '#94a3b8' }}>viq:sourceStream "CAM-LIVE-01" .</div>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center' }}>
              Select a class from the left sidebar to inspect its definition.
            </div>
          )}
        </div>
      </div>

      <section
        aria-labelledby="ontology-diagram-title"
        style={{
          marginTop: 20,
          padding: 20,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <h2 id="ontology-diagram-title" style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Full Excel Traffic Ontology
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
              Explore the complete schema generated from the loaded workbook: entities, vehicle classes, properties, datatypes, and relationships.
            </p>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Source: {excelFileName || 'Excel dataset'} · {excelRows.length.toLocaleString()} records
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ flex: '1 1 240px', minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}>
            <Search size={15} color="#64748b" />
            <input
              aria-label="Search ontology diagram"
              type="search"
              value={graphSearch}
              onChange={(event) => setGraphSearch(event.target.value)}
              placeholder="Search nodes and properties..."
              style={{ width: '100%', border: 0, outline: 0, fontSize: 12 }}
            />
          </div>
          <select
            aria-label="Filter ontology category"
            value={graphCategory}
            onChange={(event) => setGraphCategory(event.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', fontSize: 12 }}
          >
            <option value="">All categories</option>
            {graphCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" aria-label="Zoom out" onClick={() => graphControls?.zoomOut()} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><Minus size={15} /></button>
            <button type="button" aria-label="Zoom in" onClick={() => graphControls?.zoomIn()} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><Plus size={15} /></button>
            <button type="button" aria-label="Fit diagram" onClick={() => graphControls?.fit()} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><Maximize size={15} /></button>
            <button type="button" aria-label="Re-layout diagram" onClick={() => graphControls?.relayout()} style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}><RefreshCw size={15} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 300px)', gap: 12 }}>
          <div style={{ position: 'relative', height: 'min(72vh, 760px)', minHeight: 520, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <OntologyGraph
              nodes={visibleGraphNodes}
              relationships={visibleGraphRelationships}
              selectedNode={selectedGraphNode}
              searchTerm={graphSearch}
              onNodeSelect={setSelectedGraphNode}
              onReady={setGraphControls}
            />
            <div style={{ position: 'absolute', right: 12, bottom: 12, padding: '6px 9px', borderRadius: 6, background: 'rgba(255,255,255,.92)', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11 }}>
              {visibleGraphNodes.length} / {ontologyModel.nodes.length} nodes · {visibleGraphRelationships.length} relationships
            </div>
          </div>
          <aside style={{ minWidth: 0, maxHeight: 'min(72vh, 760px)', overflowY: 'auto', padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
            {selectedGraphNodeData
              ? <OntologyDetails node={selectedGraphNodeData} relationships={ontologyModel.relationships} />
              : (
                <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6 }}>
                  <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 14 }}>Workbook overview</h3>
                  <div>{excelRows.length.toLocaleString()} traffic records</div>
                  <div>{vehicleTypeCount} vehicle categories</div>
                  <div>{overSpeedCount.toLocaleString()} overspeed observations</div>
                  <p>Click any node to inspect its definition and incoming or outgoing relationships.</p>
                  {!excelRows.length && <strong>No Excel records are loaded. Import a workbook from the Excel Data section to generate a dataset-specific ontology.</strong>}
                </div>
              )}
          </aside>
        </div>
      </section>
    </div>
  )
}
