import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KnowledgeGraphPage from '../knowledgeGraph/KnowledgeGraphPage'
import QueryPage from '../QueryPage'

export default function InsightsAnalyticsPage({
  rows = [],
  fileName = '',
  importError = '',
  onImport,
  projectName = '',
}) {
  const location = useLocation()
  const navigate = useNavigate()

  // Derive initial tab from path if nested or state
  const getInitialTab = () => {
    if (location.pathname.includes('query')) return 'query'
    return 'knowledge-graph' // Knowledge Graph is primary tab
  }

  const [activeTab, setActiveTab] = useState(getInitialTab)

  useEffect(() => {
    if (location.pathname.includes('query')) {
      setActiveTab('query')
    } else {
      setActiveTab('knowledge-graph')
    }
  }, [location.pathname])

  const tabs = [
    { id: 'knowledge-graph', label: 'Knowledge Graph' },
    { id: 'query', label: 'Query Explorer' },
  ]

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'query') {
      navigate('/insights-analytics/query', { replace: true })
    } else {
      navigate('/insights-analytics/knowledge-graph', { replace: true })
    }
  }

  return (
    <div className="insights-analytics-container">
      {/* ── HEADER BANNER ── */}
      <div className="insights-header-banner">
        <span className="insights-eyebrow">OPERATIONAL INTELLIGENCE</span>
        <h1 className="insights-page-title">Insights & Analytics</h1>
        <p className="insights-subtitle">Explore and manage your insights & analytics configuration and assets.</p>
      </div>

      {/* ── TOP HORIZONTAL SUB-NAVIGATION TABS BAR ── */}
      <div className="insights-top-tabbar">
        <div className="insights-tabs-scroll">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={`insights-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.label}</span>
                {isActive && <div className="insights-active-line" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SUB-PAGE CONTENT RENDERER ── */}
      <div className="insights-tab-content">
        {activeTab === 'knowledge-graph' && (
          <KnowledgeGraphPage
            fileName={fileName}
            importError={importError}
            onImport={onImport}
            projectName={projectName}
            rows={rows}
          />
        )}

        {activeTab === 'query' && (
          <QueryPage
            fileName={fileName}
            rows={rows}
          />
        )}
      </div>
    </div>
  )
}
