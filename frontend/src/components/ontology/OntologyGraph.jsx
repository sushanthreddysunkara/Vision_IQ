import { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'

export default function OntologyGraph({
  nodes,
  relationships,
  selectedNode,
  searchTerm,
  onNodeSelect,
  onReady,
}) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Group nodes into concentric radial rings based on ontology category
    const tierGroups = { 0: [], 1: [], 2: [], 3: [], 4: [] }
    nodes.forEach((node) => {
      let tier = 4
      if (node.category === 'Ontology') tier = 0
      else if (node.category === 'OntologyClass' || node.category === 'Entity') tier = 1
      else if (node.category === 'ObjectProperty') tier = 2
      else if (node.category === 'DataProperty') tier = 3
      else tier = 4
      tierGroups[tier].push(node)
    })

    const radiusMap = { 0: 0, 1: 240, 2: 480, 3: 720, 4: 960 }

    const nodeElements = []
    Object.keys(tierGroups).forEach((tierKey) => {
      const tier = Number(tierKey)
      const group = tierGroups[tier]
      const radius = radiusMap[tier] || 500
      const count = group.length
      group.forEach((node, idx) => {
        const angle = count > 1 ? (2 * Math.PI * idx) / count : 0
        const posX = radius === 0 ? 0 : Math.round(radius * Math.cos(angle))
        const posY = radius === 0 ? 0 : Math.round(radius * Math.sin(angle))
        nodeElements.push({
          data: {
            id: node.id,
            label: node.label,
            category: node.category,
          },
          position: { x: posX, y: posY },
        })
      })
    })

    const elements = [
      ...nodeElements,
      ...relationships.map((relationship) => ({
        data: {
          id: relationship.id,
          source: relationship.source,
          target: relationship.target,
          label: relationship.label,
        },
      })),
    ]

    let cy = cyRef.current

    if (!cy) {
      cy = cytoscape({
        container: containerRef.current,
        elements: [],
        minZoom: 0.08,
        maxZoom: 4,
        wheelSensitivity: 0.18,
        style: [
          {
            selector: 'node',
            style: {
              width: 72,
              height: 72,
              label: 'data(label)',
              'background-color': '#94a3b8',
              color: '#ffffff',
              'font-size': 11.5,
              'font-weight': 700,
              'text-valign': 'center',
              'text-halign': 'center',
              'text-wrap': 'wrap',
              'text-max-width': 62,
              'border-width': 2.5,
              'border-color': '#ffffff',
              'overlay-opacity': 0,
              'min-zoomed-font-size': 8,
            },
          },

          {
            selector: 'node[category = "Entity"]',
            style: {
              'background-color': '#d89b7f',
            },
          },

          {
            selector: 'node[category = "DataProperty"]',
            style: {
              'background-color': '#ffab6b',
            },
          },

          {
            selector: 'node[category = "Datatype"]',
            style: {
              'background-color': '#f3a9dc',
            },
          },

          {
            selector: 'node[category = "ObjectProperty"]',
            style: {
              'background-color': '#ff8415',
            },
          },

          {
            selector: 'node[category = "OntologyClass"]',
            style: {
              'background-color': '#a878d4',
            },
          },

          {
            selector: 'node[category = "Ontology"]',
            style: {
              'background-color': '#53b9d7',
              width: 90,
              height: 90,
              'font-size': 13,
            },
          },

          {
            selector: 'node[category = "OperationalStatus"]',
            style: {
              'background-color': '#83b65e',
            },
          },

          {
            selector: 'edge',
            style: {
              width: 1.5,
              'line-color': '#cbd5e1',
              'target-arrow-color': '#94a3b8',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              label: 'data(label)',
              color: '#475569',
              'font-size': 8.5,
              'font-weight': 600,
              'text-rotation': 'autorotate',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.9,
              'text-background-padding': 3,
              'min-zoomed-font-size': 7,
            },
          },

          {
            selector: 'node:selected',
            style: {
              'border-width': 5,
              'border-color': '#2563eb',
              'overlay-color': '#2563eb',
              'overlay-opacity': 0.12,
            },
          },

          {
            selector: '.search-match',
            style: {
              'border-width': 5,
              'border-color': '#f59e0b',
              'overlay-color': '#f59e0b',
              'overlay-opacity': 0.15,
            },
          },

          {
            selector: '.dimmed',
            style: {
              opacity: 0.16,
            },
          },

          {
            selector: '.highlight-edge',
            style: {
              width: 3,
              'line-color': '#2563eb',
              'target-arrow-color': '#2563eb',
              opacity: 1,
            },
          },
        ],
      })

      cyRef.current = cy

      cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id()
        onNodeSelect(nodeId)
      })

      cy.on('mouseover', 'node', (event) => {
        event.target.style('border-width', 4)
      })

      cy.on('mouseout', 'node', (event) => {
        if (!event.target.selected()) {
          event.target.style('border-width', 2.5)
        }
      })
    }

    // Replace graph elements
    cy.json({ elements })

    // Execute structured concentric layout so nodes radiate in clear non-overlapping orbits
    const runConcentricLayout = () => {
      cy.layout({
        name: 'concentric',
        animate: true,
        animationDuration: 700,
        animationEasing: 'ease-out',
        fit: true,
        padding: 90,
        startAngle: (3 * Math.PI) / 2,
        sweep: 2 * Math.PI,
        clockwise: true,
        equidistant: false,
        minNodeSpacing: 80,
        spacingFactor: 1.8,
        concentric: (node) => {
          const cat = node.data('category')
          if (cat === 'Ontology') return 10
          if (cat === 'OntologyClass' || cat === 'Entity') return 8
          if (cat === 'ObjectProperty') return 6
          if (cat === 'DataProperty') return 4
          if (cat === 'OperationalStatus') return 3
          if (cat === 'Datatype') return 1
          return 5
        },
        levelWidth: () => 1.5,
      }).run()
    }

    runConcentricLayout()

    if (onReady) {
      onReady({
        zoomIn: () => {
          cy.zoom({
            level: Math.min(cy.zoom() * 1.35, cy.maxZoom()),
            renderedPosition: {
              x: cy.width() / 2,
              y: cy.height() / 2,
            },
          })
        },

        zoomOut: () => {
          cy.zoom({
            level: Math.max(cy.zoom() / 1.35, cy.minZoom()),
            renderedPosition: {
              x: cy.width() / 2,
              y: cy.height() / 2,
            },
          })
        },

        fit: () => {
          cy.fit(undefined, 70)
        },

        relayout: () => {
          runConcentricLayout()
        },
      })
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [nodes, relationships])

  useEffect(() => {
    const cy = cyRef.current

    if (!cy) return

    cy.nodes().removeClass('search-match')
    cy.nodes().removeClass('dimmed')

    const term = searchTerm.trim().toLowerCase()

    if (!term) return

    const matches = cy.nodes().filter((node) => {
      const label = String(node.data('label') || '').toLowerCase()
      const category = String(node.data('category') || '').toLowerCase()

      return (
        label.includes(term) ||
        category.includes(term)
      )
    })

    cy.nodes().addClass('dimmed')
    matches.removeClass('dimmed')
    matches.addClass('search-match')

    if (matches.length > 0) {
      cy.animate({
        fit: {
          eles: matches,
          padding: 120,
        },
        duration: 500,
      })
    }
  }, [searchTerm])

  useEffect(() => {
    const cy = cyRef.current

    if (!cy) return

    cy.nodes().unselect()
    cy.edges().removeClass('highlight-edge')

    if (!selectedNode) return

    const node = cy.getElementById(selectedNode)

    if (node.length === 0) return

    node.select()

    node.connectedEdges().addClass('highlight-edge')

    cy.animate({
      center: {
        eles: node,
      },
      duration: 450,
    })
  }, [selectedNode])

  return (
    <div
      ref={containerRef}
      className="ontology-graph-canvas"
    />
  )
}