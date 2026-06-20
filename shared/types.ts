export type NodeType = 'start' | 'story' | 'ending'

export const NodeTypeEnum = {
  START: 'start' as NodeType,
  STORY: 'story' as NodeType,
  ENDING: 'ending' as NodeType,
}

export interface StoryOption {
  id: string
  text: string
}

export interface NodeData {
  type: NodeType
  title?: string
  narration?: string
  options?: StoryOption[]
  endingText?: string
}

export interface StoryNode {
  id: string
  type: NodeType
  x: number
  y: number
  width: number
  height: number
  data: NodeData
}

export interface StoryEdge {
  id: string
  source: string
  target: string
  sourcePort?: string
  targetPort?: string
  label?: string
}

export interface Story {
  id: string
  title: string
  description?: string
  nodes: StoryNode[]
  edges: StoryEdge[]
  createdAt: string
  updatedAt: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  type: 'cycle' | 'missing_connection' | 'multiple_starts' | 'no_start'
  message: string
  nodeIds?: string[]
}

export interface SimulationState {
  isSimulating: boolean
  currentNodeId: string | null
  visitedNodeIds: string[]
  currentEdgeId: string | null
  history: { nodeId: string; edgeId: string }[]
}

export interface SaveStoryDto {
  title: string
  description?: string
  nodes: StoryNode[]
  edges: StoryEdge[]
}

export interface CreateStoryDto {
  title: string
  description?: string
}

export type PortType = 'input' | 'output'
