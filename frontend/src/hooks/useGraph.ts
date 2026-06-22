import { useEffect, useRef, useCallback } from 'react'
import { Graph, Shape } from '@antv/x6'
import { useEditorStore } from '../store/useEditorStore'
import { getWarningNodes } from '../utils/graphUtils'
import type { StoryNode, StoryEdge } from '../types'

export function useGraph(containerRef: React.RefObject<HTMLDivElement>) {
  const graphRef = useRef<Graph | null>(null)
  const isSyncingRef = useRef(false)

  const nodes = useEditorStore((state) => state.nodes)
  const edges = useEditorStore((state) => state.edges)
  const simulationState = useEditorStore((state) => state.simulationState)
  const isSimulating = useEditorStore((state) => state.isSimulating)

  const updateNode = useEditorStore((state) => state.updateNode)
  const addEdge = useEditorStore((state) => state.addEdge)
  const deleteEdge = useEditorStore((state) => state.deleteEdge)
  const setSelectedNode = useEditorStore((state) => state.setSelectedNode)
  const setZoom = useEditorStore((state) => state.setZoom)
  const setPan = useEditorStore((state) => state.setPan)
  const showContextMenu = useEditorStore((state) => state.showContextMenu)

  const initGraph = useCallback(() => {
    if (!containerRef.current || graphRef.current) return

    const graph = new Graph({
      container: containerRef.current,
      background: {
        color: '#f8fafc',
      },
      grid: {
        visible: true,
        type: 'dot',
        size: 20,
        args: {
          color: '#cbd5e1',
          thickness: 1,
        },
      },
      panning: {
        enabled: true,
        eventTypes: ['rightMouseDown'],
      },
      mousewheel: {
        enabled: true,
        factor: 1.1,
        minScale: 0.2,
        maxScale: 3,
      },
      connecting: {
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 8,
          },
        },
        anchor: 'center',
        connectionPoint: 'anchor',
        allowBlank: false,
        allowLoop: false,
        allowMulti: false,
        snap: {
          radius: 20,
        },
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: '#94a3b8',
                strokeWidth: 2,
                targetMarker: {
                  name: 'classic',
                  size: 8,
                },
              },
            },
            zIndex: 0,
          })
        },
        validateConnection({ targetMagnet, sourceCell, targetCell }) {
          if (!sourceCell || !targetCell) return false
          if (sourceCell === targetCell) return false
          if (!targetMagnet) return false

          const sourceData = (sourceCell as any).getData?.()
          const targetData = (targetCell as any).getData?.()

          const sourceType = sourceData?.type
          const targetType = targetData?.type

          if (sourceType === 'ending') return false
          if (targetType === 'start') return false

          return true
        },
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            padding: 3,
            attrs: {
              fill: '#22c55e',
              stroke: '#22c55e',
            },
          },
        },
        magnetAvailable: {
          name: 'stroke',
          args: {
            padding: 3,
            attrs: {
              fill: '#22c55e',
              stroke: '#22c55e',
            },
          },
        },
      },
      interacting: {
        nodeMovable: true,
        edgeMovable: false,
        edgeLabelMovable: false,
      },
    })

    graphRef.current = graph

    graph.on('node:moved', ({ node }) => {
      if (isSyncingRef.current) return
      const position = node.position()
      const id = node.id
      updateNode(id, { x: position.x, y: position.y })
    })

    graph.on('node:click', ({ node }) => {
      setSelectedNode(node.id)
    })

    graph.on('blank:click', () => {
      setSelectedNode(null)
    })

    graph.on('node:contextmenu', ({ node, e }) => {
      e.preventDefault()
      const nodeData = node.getData()
      if (nodeData?.type !== 'start') {
        showContextMenu(e.clientX, e.clientY, node.id)
      }
    })

    graph.on('edge:connected', ({ edge }) => {
      const sourceCell = edge.getSourceCell()
      const targetCell = edge.getTargetCell()
      
      if (!sourceCell || !targetCell) return
      
      const source = sourceCell.id
      const target = targetCell.id
      const sourcePort = edge.getSourcePortId() || undefined
      const targetPort = edge.getTargetPortId() || undefined

      const newEdge: StoryEdge = {
        id: edge.id,
        source,
        target,
        sourcePort,
        targetPort,
      }
      addEdge(newEdge)
    })

    graph.on('edge:dblclick', ({ edge }) => {
      deleteEdge(edge.id)
    })

    graph.on('scale', ({ sx }) => {
      setZoom(sx)
    })

    graph.on('translate', ({ tx, ty }) => {
      setPan({ x: tx, y: ty })
    })

    return graph
  }, [containerRef, updateNode, setSelectedNode, showContextMenu, addEdge, deleteEdge, setZoom, setPan])

  const createNode = useCallback((graph: Graph, node: StoryNode) => {
    const color = getNodeColor(node.type)
    const isVisited = simulationState.visitedNodeIds.includes(node.id)
    const isCurrent = simulationState.currentNodeId === node.id
    const warningNodes = getWarningNodes(
      useEditorStore.getState().nodes,
      useEditorStore.getState().edges,
    )
    const hasWarning = warningNodes.has(node.id) && !isSimulating

    const ports = getNodePorts(node)

    const nodeConfig: any = {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      shape: 'rect',
      data: { ...node.data },
      attrs: {
        body: {
          fill: isVisited && !isCurrent ? '#e2e8f0' : 'white',
          stroke: isCurrent ? '#ffd700' : color,
          strokeWidth: isCurrent ? 3 : 2,
          rx: 8,
          ry: 8,
        },
        label: {
          text: getNodeLabel(node),
          fill: isVisited && !isCurrent ? '#94a3b8' : '#1e293b',
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: color,
                strokeWidth: 1,
                fill: 'white',
              },
            },
          },
          out: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: color,
                strokeWidth: 1,
                fill: 'white',
              },
            },
          },
        },
        items: ports,
      },
    }

    if (hasWarning) {
      nodeConfig.tools = [
        {
          name: 'button',
          args: {
            x: '100%',
            y: 0,
            offset: { x: -5, y: 5 },
            markup: [
              {
                tagName: 'circle',
                selector: 'button',
                attrs: {
                  r: 10,
                  fill: '#ef4444',
                  cursor: 'pointer',
                },
              },
              {
                tagName: 'text',
                textContent: '!',
                selector: 'icon',
                attrs: {
                  fill: 'white',
                  fontSize: 12,
                  fontWeight: 'bold',
                  textAnchor: 'middle',
                  textVerticalAnchor: 'middle',
                  pointerEvents: 'none',
                },
              },
            ],
          },
        },
      ]
    }

    const x6Node = graph.addNode(nodeConfig)

    return x6Node
  }, [simulationState, isSimulating])

  useEffect(() => {
    const graph = initGraph()
    return () => {
      if (graph) {
        graph.dispose()
        graphRef.current = null
      }
    }
  }, [initGraph])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    isSyncingRef.current = true

    const graphNodes = graph.getNodes()
    const existingNodeIds = new Set(graphNodes.map((n) => n.id))
    const newNodeIds = new Set(nodes.map((n) => n.id))

    for (const node of nodes) {
      if (!existingNodeIds.has(node.id)) {
        createNode(graph, node)
      } else {
        const gNode = graph.getNodes().find((n) => n.id === node.id)
        if (gNode) {
          gNode.position(node.x, node.y)
          gNode.setData({ ...node.data })
          gNode.attr('label/text', getNodeLabel(node))

          const color = getNodeColor(node.type)
          const isVisited = simulationState.visitedNodeIds.includes(node.id)
          const isCurrent = simulationState.currentNodeId === node.id

          gNode.attr('body/fill', isVisited && !isCurrent ? '#e2e8f0' : 'white')
          gNode.attr('body/stroke', isCurrent ? '#ffd700' : color)
          gNode.attr('body/strokeWidth', isCurrent ? 3 : 2)

          if (node.type === 'story') {
            const expectedPortIds = getNodePorts(node).map((p) => p.id)
            const currentPorts = gNode.prop('ports/items') || []
            const currentPortIds = currentPorts.map((p: any) => p.id)
            
            const portsChanged =
              expectedPortIds.length !== currentPortIds.length ||
              !expectedPortIds.every((id, idx) => id === currentPortIds[idx])

            if (portsChanged) {
              const portsConfig = {
                groups: {
                  in: {
                    position: 'left',
                    attrs: {
                      circle: {
                        r: 4,
                        magnet: true,
                        stroke: color,
                        strokeWidth: 1,
                        fill: 'white',
                      },
                    },
                  },
                  out: {
                    position: 'right',
                    attrs: {
                      circle: {
                        r: 4,
                        magnet: true,
                        stroke: color,
                        strokeWidth: 1,
                        fill: 'white',
                      },
                    },
                  },
                },
                items: getNodePorts(node),
              }
              gNode.prop('ports', portsConfig)
            }
          }

          const warningNodes = getWarningNodes(nodes, edges)
          const hasWarning = warningNodes.has(node.id) && !isSimulating
          
          if (hasWarning && !gNode.getTools()) {
            gNode.addTools([
              {
                name: 'button',
                args: {
                  x: '100%',
                  y: 0,
                  offset: { x: -5, y: 5 },
                  markup: [
                    {
                      tagName: 'circle',
                      selector: 'button',
                      attrs: {
                        r: 10,
                        fill: '#ef4444',
                        cursor: 'pointer',
                      },
                    },
                    {
                      tagName: 'text',
                      textContent: '!',
                      selector: 'icon',
                      attrs: {
                        fill: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                        textAnchor: 'middle',
                        textVerticalAnchor: 'middle',
                        pointerEvents: 'none',
                      },
                    },
                  ],
                },
              },
            ])
          } else if (!hasWarning && gNode.getTools()) {
            gNode.removeTools()
          }
        }
      }
    }

    for (const id of existingNodeIds) {
      if (!newNodeIds.has(id)) {
        const gNode = graph.getNodes().find((n) => n.id === id)
        if (gNode) {
          graph.removeNode(gNode)
        }
      }
    }

    isSyncingRef.current = false
  }, [nodes, edges, createNode, simulationState, isSimulating])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    isSyncingRef.current = true

    const graphEdges = graph.getEdges()
    const existingEdgeIds = new Set(graphEdges.map((e) => e.id))
    const newEdgeIds = new Set(edges.map((e) => e.id))

    for (const edge of edges) {
      if (!existingEdgeIds.has(edge.id)) {
        const isCurrentEdge = simulationState.currentEdgeId === edge.id
        const isVisitedEdge = simulationState.history.some((h) => h.edgeId === edge.id)

        graph.addEdge({
          id: edge.id,
          source: {
            cell: edge.source,
            port: edge.sourcePort,
          },
          target: {
            cell: edge.target,
            port: edge.targetPort,
          },
          attrs: {
            line: {
              stroke: isCurrentEdge ? '#ffd700' : isVisitedEdge ? '#94a3b8' : '#94a3b8',
              strokeWidth: isCurrentEdge ? 3 : 2,
              targetMarker: {
                name: 'classic',
                size: 8,
              },
              strokeDasharray: isCurrentEdge ? '8 4' : undefined,
            },
          },
          zIndex: isCurrentEdge ? 10 : 0,
        })
      } else {
        const gEdge = graph.getEdges().find((e) => e.id === edge.id)
        if (gEdge) {
          const isCurrentEdge = simulationState.currentEdgeId === edge.id
          const isVisitedEdge = simulationState.history.some((h) => h.edgeId === edge.id)

          gEdge.attr('line/stroke', isCurrentEdge ? '#ffd700' : isVisitedEdge ? '#94a3b8' : '#94a3b8')
          gEdge.attr('line/strokeWidth', isCurrentEdge ? 3 : 2)
          
          if (isCurrentEdge) {
            gEdge.attr('line/strokeDasharray', '8 4')
          } else {
            gEdge.attr('line/strokeDasharray', undefined)
          }
        }
      }
    }

    for (const id of existingEdgeIds) {
      if (!newEdgeIds.has(id)) {
        const gEdge = graph.getEdges().find((e) => e.id === id)
        if (gEdge) {
          graph.removeEdge(gEdge)
        }
      }
    }

    isSyncingRef.current = false
  }, [edges, simulationState])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph) return

    const options = graph.options as any

    if (isSimulating) {
      if (options.panning) {
        options.panning.enabled = false
      }
      if (options.interacting) {
        options.interacting.nodeMovable = false
      }
      if (options.connecting) {
        options.connecting.allowBlank = false
      }
    } else {
      if (options.panning) {
        options.panning.enabled = true
      }
      if (options.interacting) {
        options.interacting.nodeMovable = true
      }
      if (options.connecting) {
        options.connecting.allowBlank = true
      }
    }
  }, [isSimulating])

  const centerCanvas = useCallback(() => {
    const graph = graphRef.current
    if (!graph) return
    graph.centerContent()
  }, [])

  const zoomIn = useCallback(() => {
    const graph = graphRef.current
    if (!graph) return
    graph.zoom(0.1)
  }, [])

  const zoomOut = useCallback(() => {
    const graph = graphRef.current
    if (!graph) return
    graph.zoom(-0.1)
  }, [])

  const zoomToFit = useCallback(() => {
    const graph = graphRef.current
    if (!graph) return
    graph.zoomToFit({ padding: 20, maxScale: 1 })
  }, [])

  const scrollTo = useCallback((x: number, y: number) => {
    const graph = graphRef.current
    if (!graph) return
    graph.translate(x, y)
  }, [])

  const getGraphData = useCallback(() => {
    const graph = graphRef.current
    if (!graph || !containerRef.current) return null
    
    const translate = graph.translate()
    const bbox = graph.getContentBBox()

    return {
      zoom: graph.zoom(),
      translate: {
        x: translate.tx,
        y: translate.ty,
      },
      canvas: {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      },
      content: {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      },
    }
  }, [containerRef])

  return {
    graph: graphRef.current,
    centerCanvas,
    zoomIn,
    zoomOut,
    zoomToFit,
    scrollTo,
    getGraphData,
  }
}

function getNodeColor(type: string): string {
  switch (type) {
    case 'start':
      return '#22c55e'
    case 'story':
      return '#3b82f6'
    case 'ending':
      return '#ef4444'
    default:
      return '#6b7280'
  }
}

function getNodeLabel(node: StoryNode): string {
  if (node.type === 'start') return '▶ 开始'
  if (node.type === 'ending') return '■ 结局'
  return node.data.title || '剧情节点'
}

function getNodePorts(node: StoryNode): any[] {
  const ports: any[] = []
  const color = getNodeColor(node.type)

  if (node.type !== 'start') {
    ports.push({
      id: 'in-1',
      group: 'in',
    })
  }

  if (node.type !== 'ending') {
    if (node.type === 'start') {
      ports.push({
        id: 'out-1',
        group: 'out',
      })
    } else if (node.type === 'story') {
      const optionCount = node.data.options?.length || 2
      for (let i = 0; i < optionCount; i++) {
        ports.push({
          id: `out-${i + 1}`,
          group: 'out',
          attrs: {
            circle: {
              stroke: color,
            },
          },
        })
      }
    }
  }

  return ports
}
