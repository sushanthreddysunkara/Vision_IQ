import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Layers,
  Search,
  ShieldAlert,
  Sliders,
  X,
  Zap,
} from 'lucide-react'
import { MODELS_DATA, MODEL_SUMMARY_STATS, DEFAULT_HUGGINGFACE_URL } from '../../data/modelsData'
import '../../styles/models-page.css'

export default function ModelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModel, setActiveModel] = useState(null)

  // Handle direct model link via URL query param (e.g. /models?id=uvh-x)
  useEffect(() => {
    const modelParam = searchParams.get('id') || searchParams.get('model')
    if (modelParam) {
      const found = MODELS_DATA.find(
        (m) => m.id.toLowerCase() === modelParam.toLowerCase() || m.name.toLowerCase() === modelParam.toLowerCase()
      )
      if (found) {
        setActiveModel(found)
      }
    }
  }, [searchParams])

  const filteredModels = useMemo(() => {
    return MODELS_DATA.filter((model) => {
      // 1. Status Filter
      if (selectedFilter !== 'ALL') {
        if (model.status.toUpperCase() !== selectedFilter.toUpperCase()) {
          return false
        }
      }

      // 2. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = model.name.toLowerCase().includes(q)
        const matchSubtitle = model.subtitle.toLowerCase().includes(q)
        const matchTask = model.task.toLowerCase().includes(q)
        const matchLicence = model.licence.toLowerCase().includes(q)
        const matchKind = model.kind.toLowerCase().includes(q)
        const matchRules = model.rules.some((r) => r.toLowerCase().includes(q))
        const matchBlockers = model.blockers.some((b) => b.code.toLowerCase().includes(q))
        return matchName || matchSubtitle || matchTask || matchLicence || matchKind || matchRules || matchBlockers
      }

      return true
    })
  }, [selectedFilter, searchQuery])

  function handleSelectModel(model) {
    setActiveModel(model)
    setSearchParams({ id: model.id })
  }

  function handleCloseModal() {
    setActiveModel(null)
    setSearchParams({})
  }

  function renderStatusBadge(status) {
    const s = String(status || '').toUpperCase()
    if (s === 'REFERENCE') {
      return <span className="model-status-badge status-reference">REFERENCE</span>
    }
    if (s === 'RETIRED') {
      return <span className="model-status-badge status-retired">RETIRED</span>
    }
    if (s === 'EVALUATION ONLY') {
      return <span className="model-status-badge status-eval">EVALUATION ONLY</span>
    }
    if (s === 'CANDIDATE') {
      return <span className="model-status-badge status-candidate">CANDIDATE</span>
    }
    if (s === 'NOT EVALUATED') {
      return <span className="model-status-badge status-not-eval">NOT EVALUATED</span>
    }
    if (s === 'PLANNED') {
      return <span className="model-status-badge status-planned">PLANNED</span>
    }
    return <span className="model-status-badge">{status}</span>
  }

  return (
    <div className="models-page-container">
      {/* ── Page Header ── */}
      <header className="models-page-header">
        <h1>Models</h1>
        <p>
          Every model and analytical method VisionIQ uses, evaluates or plans. No model has a production
          clearance record; the blocking items say why. A method has parameters, not weights; its accuracy
          is unmeasured until confirmed ground cases exist.
        </p>
      </header>

      {/* ── Filter Pills & Metrics Strip ── */}
      <div className="models-filter-strip">
        <div className="models-pills-row">
          <button
            type="button"
            className={`models-status-pill pill-all ${selectedFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter('ALL')}
          >
            ALL {MODEL_SUMMARY_STATS.total}
          </button>

          <button
            type="button"
            className={`models-status-pill pill-reference ${selectedFilter === 'REFERENCE' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter(selectedFilter === 'REFERENCE' ? 'ALL' : 'REFERENCE')}
          >
            REFERENCE {MODEL_SUMMARY_STATS.reference}
          </button>

          <button
            type="button"
            className={`models-status-pill pill-retired ${selectedFilter === 'RETIRED' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter(selectedFilter === 'RETIRED' ? 'ALL' : 'RETIRED')}
          >
            RETIRED {MODEL_SUMMARY_STATS.retired}
          </button>

          <button
            type="button"
            className={`models-status-pill pill-eval ${selectedFilter === 'EVALUATION ONLY' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter(selectedFilter === 'EVALUATION ONLY' ? 'ALL' : 'EVALUATION ONLY')}
          >
            EVALUATION ONLY {MODEL_SUMMARY_STATS.evaluationOnly}
          </button>

          <button
            type="button"
            className={`models-status-pill pill-candidate ${selectedFilter === 'CANDIDATE' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter(selectedFilter === 'CANDIDATE' ? 'ALL' : 'CANDIDATE')}
          >
            CANDIDATE {MODEL_SUMMARY_STATS.candidate}
          </button>

          <button
            type="button"
            className={`models-status-pill pill-not-evaluated ${selectedFilter === 'NOT EVALUATED' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter(selectedFilter === 'NOT EVALUATED' ? 'ALL' : 'NOT EVALUATED')}
          >
            NOT EVALUATED {MODEL_SUMMARY_STATS.notEvaluated}
          </button>

          <button
            type="button"
            className={`models-status-pill pill-planned ${selectedFilter === 'PLANNED' ? 'is-active' : ''}`}
            onClick={() => setSelectedFilter(selectedFilter === 'PLANNED' ? 'ALL' : 'PLANNED')}
          >
            PLANNED {MODEL_SUMMARY_STATS.planned}
          </button>

          <div className="models-counts-text">
            <span>
              model <strong>{MODEL_SUMMARY_STATS.modelCount}</strong>
            </span>
            <span>
              method <strong>{MODEL_SUMMARY_STATS.methodCount}</strong>
            </span>
            <span>
              detector <strong>{MODEL_SUMMARY_STATS.detectorCount}</strong>
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="models-search-wrap">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models, tasks, rules..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={13} className="text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="models-table-card">
        <table className="models-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Pack</th>
              <th>Kind</th>
              <th>Task</th>
              <th>Status</th>
              <th>Licence</th>
              <th>Blockers</th>
              <th>Rules or parameters</th>
              <th>Speed, as recorded</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length ? (
              filteredModels.map((item) => {
                const isSelected = activeModel?.id === item.id

                return (
                  <tr
                    key={item.id}
                    className={isSelected ? 'row-selected' : ''}
                  >
                    {/* 1. Model */}
                    <td className="model-name-cell">
                      <div className="model-title-row">
                        <a
                          href={item.hubUrl || DEFAULT_HUGGINGFACE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="model-title-link"
                          title={`Open ${item.name} model repository on Hugging Face (new page)`}
                        >
                          <span>{item.name}</span>
                          <ExternalLink size={11} className="external-link-icon" />
                        </a>
                        <button
                          type="button"
                          className="model-spec-btn"
                          onClick={() => handleSelectModel(item)}
                          title={`Inspect architecture dossier for ${item.name}`}
                        >
                          Specs
                        </button>
                      </div>
                      <div className="model-subtitle">{item.subtitle}</div>
                    </td>

                    {/* 2. Pack */}
                    <td>
                      <span className="pack-badge-highway">{item.pack}</span>
                    </td>

                    {/* 3. Kind */}
                    <td className="kind-cell">{item.kind}</td>

                    {/* 4. Task */}
                    <td className="task-cell">{item.task}</td>

                    {/* 5. Status */}
                    <td>{renderStatusBadge(item.status)}</td>

                    {/* 6. Licence */}
                    <td className="licence-cell">
                      {item.licenceType === 'ASSUMED' && (
                        <span className="badge-licence-assumed">ASSUMED</span>
                      )}
                      {item.licenceType === 'NO LICENCE' && (
                        <span className="badge-licence-none">NO LICENCE</span>
                      )}
                      <span>{item.licence}</span>
                    </td>

                    {/* 7. Blockers */}
                    <td className="blockers-cell">
                      {item.blockers && item.blockers.length ? (
                        item.blockers.map((b, idx) => (
                          <div key={idx} className="blocker-item-row">
                            <span className="blocker-code">{b.code}</span>
                            {b.blocking && (
                              <span className="badge-blocking">BLOCKING</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-none">none</span>
                      )}
                    </td>

                    {/* 8. Rules or parameters */}
                    <td className="rules-cell">
                      {item.rules && item.rules.length ? (
                        item.rules.map((rule, idx) => (
                          <span key={idx} className="rule-code-line">
                            {rule}
                          </span>
                        ))
                      ) : (
                        <span className="text-none">none</span>
                      )}
                    </td>

                    {/* 9. Speed, as recorded */}
                    <td className="speed-cell">{item.speed}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No models match the active filter or query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Interactive Model Dossier Modal ── */}
      {activeModel && (
        <div className="model-modal-backdrop" onClick={handleCloseModal}>
          <div className="model-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="model-modal-header">
              <div>
                <h2>{activeModel.name}</h2>
                <p>{activeModel.subtitle}</p>
              </div>
              <button
                type="button"
                className="model-modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="model-modal-body">
              {/* Top metadata grid */}
              <div className="modal-section-grid">
                <div className="modal-info-box">
                  <label>Deployment Status</label>
                  <div>{renderStatusBadge(activeModel.status)}</div>
                </div>

                <div className="modal-info-box">
                  <label>Pack & Kind</label>
                  <strong>
                    {activeModel.pack} · {activeModel.kind.toUpperCase()}
                  </strong>
                </div>

                <div className="modal-info-box">
                  <label>Architecture Framework</label>
                  <strong>{activeModel.architecture || activeModel.name}</strong>
                </div>

                <div className="modal-info-box">
                  <label>Benchmarked Latency & Throughput</label>
                  <strong>{activeModel.speed}</strong>
                </div>
              </div>

              {/* Description */}
              <div className="modal-full-box">
                <label>Operational Task & Purpose</label>
                <p>{activeModel.task}</p>
                <p style={{ marginTop: '8px', color: '#475569' }}>
                  {activeModel.description}
                </p>
              </div>

              {/* Supported Classes */}
              {activeModel.classes && activeModel.classes.length > 0 && (
                <div className="modal-full-box">
                  <label>Detected Classes ({activeModel.classes.length})</label>
                  <div className="modal-classes-pills">
                    {activeModel.classes.map((cls, idx) => (
                      <span key={idx} className="modal-class-pill">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Associated Highway Rules */}
              <div className="modal-full-box">
                <label>Triggered Highway Rules & Parameters</label>
                {activeModel.rules && activeModel.rules.length ? (
                  <div className="modal-rules-pills">
                    {activeModel.rules.map((rule, idx) => (
                      <span key={idx} className="modal-rule-pill">
                        {rule}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-none">No active statutory rules assigned.</p>
                )}
              </div>

              {/* License & Copyleft Notice */}
              <div className="modal-full-box">
                <label>Licensing Terms</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeModel.licenceType === 'ASSUMED' && (
                    <span className="badge-licence-assumed">ASSUMED</span>
                  )}
                  {activeModel.licenceType === 'NO LICENCE' && (
                    <span className="badge-licence-none">NO LICENCE</span>
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {activeModel.licence}
                  </span>
                </div>
              </div>

              {/* Blocking Items Warning */}
              {activeModel.blockingDetails && (
                <div className="modal-blocking-alert">
                  <strong>Production Clearance Rationale:</strong>
                  <span>{activeModel.blockingDetails}</span>
                </div>
              )}
            </div>

            <footer className="model-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseModal}
              >
                Close Dossier
              </button>
              {activeModel.hubUrl && (
                <a
                  href={activeModel.hubUrl || DEFAULT_HUGGINGFACE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary-link"
                >
                  <span>Hugging Face Repository</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

