import type { StoryNode, StoryEdge, StoryOption } from '../types'

export const NODE_COLORS: Record<string, string> = {
  start: '#22c55e',
  story: '#3b82f6',
  ending: '#ef4444',
}

export const NODE_WIDTH: Record<string, number> = {
  start: 120,
  story: 200,
  ending: 120,
}

export const NODE_HEIGHT: Record<string, number> = {
  start: 60,
  story: 140,
  ending: 60,
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getOutgoingEdges(nodeId: string, edges: StoryEdge[]): StoryEdge[] {
  return edges.filter((e) => e.source === nodeId)
}

export function getIncomingEdges(nodeId: string, edges: StoryEdge[]): StoryEdge[] {
  return edges.filter((e) => e.target === nodeId)
}

export function getExpectedOutgoingCount(node: StoryNode): number {
  if (node.type === 'start') return 1
  if (node.type === 'ending') return 0
  if (node.type === 'story') return node.data.options?.length || 0
  return 0
}

export function checkNodeConnectionComplete(node: StoryNode, edges: StoryEdge[]): boolean {
  const expected = getExpectedOutgoingCount(node)
  const actual = getOutgoingEdges(node.id, edges).length
  return actual >= expected
}

export function getWarningNodes(nodes: StoryNode[], edges: StoryEdge[]): Set<string> {
  const warningNodes = new Set<string>()
  for (const node of nodes) {
    if (node.type === 'ending') continue
    if (!checkNodeConnectionComplete(node, edges)) {
      warningNodes.add(node.id)
    }
  }
  return warningNodes
}

export function findNextNodeByOption(
  sourceNodeId: string,
  optionIndex: number,
  edges: StoryEdge[],
  nodes: StoryNode[],
): StoryNode | undefined {
  const outgoingEdges = getOutgoingEdges(sourceNodeId, edges)
    .sort((a, b) => {
      const aPort = a.sourcePort || ''
      const bPort = b.sourcePort || ''
      return aPort.localeCompare(bPort)
    })

  const targetEdge = outgoingEdges[optionIndex]
  if (!targetEdge) return undefined

  return nodes.find((n) => n.id === targetEdge.target)
}

export function getEdgeIdByOption(
  sourceNodeId: string,
  optionIndex: number,
  edges: StoryEdge[],
): string | undefined {
  const outgoingEdges = getOutgoingEdges(sourceNodeId, edges)
    .sort((a, b) => {
      const aPort = a.sourcePort || ''
      const bPort = b.sourcePort || ''
      return aPort.localeCompare(bPort)
    })

  return outgoingEdges[optionIndex]?.id
}

export function getOptionByPortId(
  node: StoryNode,
  portId: string,
): StoryOption | undefined {
  if (node.type !== 'story') return undefined
  const options = node.data.options || []
  const match = portId.match(/out-(\d+)/)
  if (match) {
    const index = parseInt(match[1], 10) - 1
    return options[index]
  }
  return undefined
}

export function getEdgeLabel(
  edge: StoryEdge,
  sourceNode: StoryNode | undefined,
): string {
  if (!sourceNode || sourceNode.type !== 'story') return ''
  const option = getOptionByPortId(sourceNode, edge.sourcePort || '')
  return option?.text || ''
}

export function getPortPosition(index: number, total: number, height: number): number {
  if (total <= 1) return height / 2
  return ((index + 1) / (total + 1)) * height
}
