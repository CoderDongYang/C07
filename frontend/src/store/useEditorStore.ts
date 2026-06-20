import { create } from 'zustand'
import type {
  StoryNode,
  StoryEdge,
  SimulationState,
  ValidationResult,
  NodeType,
} from '../types'

interface EditorState {
  storyId: string | null
  storyTitle: string
  nodes: StoryNode[]
  edges: StoryEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  isSimulating: boolean
  simulationState: SimulationState
  validationResult: ValidationResult | null
  isSaving: boolean
  lastSavedAt: string | null
  zoom: number
  pan: { x: number; y: number }
  contextMenu: {
    visible: boolean
    x: number
    y: number
    nodeId: string | null
  }

  setStory: (id: string, title: string, nodes: StoryNode[], edges: StoryEdge[]) => void
  setStoryTitle: (title: string) => void
  addNode: (type: NodeType, x: number, y: number) => void
  updateNode: (id: string, updates: Partial<StoryNode>) => void
  updateNodeData: (id: string, dataUpdates: Record<string, any>) => void
  deleteNode: (id: string) => void
  addEdge: (edge: StoryEdge) => void
  updateEdge: (id: string, updates: Partial<StoryEdge>) => void
  deleteEdge: (id: string) => void
  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  setValidationResult: (result: ValidationResult | null) => void
  setSaving: (saving: boolean) => void
  setLastSavedAt: (time: string) => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  showContextMenu: (x: number, y: number, nodeId: string | null) => void
  hideContextMenu: () => void

  startSimulation: () => void
  stopSimulation: () => void
  goToNextNode: (nodeId: string, edgeId: string) => void
  resetSimulation: () => void

  getNodeById: (id: string) => StoryNode | undefined
  getOutgoingEdges: (nodeId: string) => StoryEdge[]
  getIncomingEdges: (nodeId: string) => StoryEdge[]
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useEditorStore = create<EditorState>((set, get) => ({
  storyId: null,
  storyTitle: '未命名故事',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isSimulating: false,
  simulationState: {
    isSimulating: false,
    currentNodeId: null,
    visitedNodeIds: [],
    currentEdgeId: null,
    history: [],
  },
  validationResult: null,
  isSaving: false,
  lastSavedAt: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  },

  setStory: (id, title, nodes, edges) => {
    set({
      storyId: id,
      storyTitle: title,
      nodes,
      edges,
    })
  },

  setStoryTitle: (title) => set({ storyTitle: title }),

  addNode: (type, x, y) => {
    const newNode: StoryNode = {
      id: generateId('node'),
      type,
      x,
      y,
      width: type === 'start' ? 120 : type === 'ending' ? 120 : 200,
      height: type === 'start' ? 60 : type === 'ending' ? 60 : 140,
      data: {
        type,
        title: type === 'start' ? '开始' : type === 'ending' ? '结局' : '剧情节点',
        narration: type === 'story' ? '在这里输入旁白文本...' : undefined,
        options: type === 'story'
          ? [
              { id: generateId('opt'), text: '选项A' },
              { id: generateId('opt'), text: '选项B' },
            ]
          : undefined,
        endingText: type === 'ending' ? '结局描述...' : undefined,
      },
    }
    set((state) => ({ nodes: [...state.nodes, newNode] }))
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }))
  },

  updateNodeData: (id, dataUpdates) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...dataUpdates } } : n,
      ),
    }))
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }))
  },

  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge] }))
  },

  updateEdge: (id, updates) => {
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }))
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }))
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  setValidationResult: (result) => set({ validationResult: result }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSavedAt: (time) => set({ lastSavedAt: time }),

  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),

  showContextMenu: (x, y, nodeId) => {
    set({
      contextMenu: { visible: true, x, y, nodeId },
    })
  },

  hideContextMenu: () => {
    set((state) => ({
      contextMenu: { ...state.contextMenu, visible: false },
    }))
  },

  startSimulation: () => {
    const startNode = get().nodes.find((n) => n.type === 'start')
    if (!startNode) return

    set({
      isSimulating: true,
      simulationState: {
        isSimulating: true,
        currentNodeId: startNode.id,
        visitedNodeIds: [startNode.id],
        currentEdgeId: null,
        history: [],
      },
    })
  },

  stopSimulation: () => {
    set({
      isSimulating: false,
      simulationState: {
        isSimulating: false,
        currentNodeId: null,
        visitedNodeIds: [],
        currentEdgeId: null,
        history: [],
      },
    })
  },

  goToNextNode: (nodeId, edgeId) => {
    set((state) => ({
      simulationState: {
        ...state.simulationState,
        currentNodeId: nodeId,
        currentEdgeId: edgeId,
        visitedNodeIds: [...state.simulationState.visitedNodeIds, nodeId],
        history: [
          ...state.simulationState.history,
          { nodeId: state.simulationState.currentNodeId!, edgeId },
        ],
      },
    }))
  },

  resetSimulation: () => {
    const startNode = get().nodes.find((n) => n.type === 'start')
    if (!startNode) return

    set({
      simulationState: {
        isSimulating: true,
        currentNodeId: startNode.id,
        visitedNodeIds: [startNode.id],
        currentEdgeId: null,
        history: [],
      },
    })
  },

  getNodeById: (id) => get().nodes.find((n) => n.id === id),
  getOutgoingEdges: (nodeId) => get().edges.filter((e) => e.source === nodeId),
  getIncomingEdges: (nodeId) => get().edges.filter((e) => e.target === nodeId),
}))
