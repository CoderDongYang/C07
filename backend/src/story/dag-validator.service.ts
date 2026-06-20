import { Injectable } from '@nestjs/common'
import { ValidationResult, ValidationError } from '../../../shared/types'

interface GraphNode {
  id: string
  type: string
  outgoing: string[]
  incoming: string[]
  optionsCount: number
}

@Injectable()
export class DagValidatorService {
  validate(nodes: any[], edges: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const graph = this.buildGraph(nodes, edges)

    const startNodeErrors = this.validateStartNode(graph)
    errors.push(...startNodeErrors)

    const cycleErrors = this.detectCycles(graph)
    errors.push(...cycleErrors)

    const connectionErrors = this.validateConnections(graph, edges)
    errors.push(...connectionErrors)

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private buildGraph(nodes: any[], edges: any[]): Map<string, GraphNode> {
    const graph = new Map<string, GraphNode>()

    for (const node of nodes) {
      graph.set(node.id, {
        id: node.id,
        type: node.type,
        outgoing: [],
        incoming: [],
        optionsCount: node.data?.options?.length || 0,
      })
    }

    for (const edge of edges) {
      const sourceNode = graph.get(edge.source)
      const targetNode = graph.get(edge.target)

      if (sourceNode) {
        sourceNode.outgoing.push(edge.target)
      }
      if (targetNode) {
        targetNode.incoming.push(edge.source)
      }
    }

    return graph
  }

  private validateStartNode(graph: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = []
    const startNodes: string[] = []

    for (const [id, node] of graph) {
      if (node.type === 'start') {
        startNodes.push(id)
      }
    }

    if (startNodes.length === 0) {
      errors.push({
        type: 'no_start',
        message: '故事必须包含一个开始节点',
      })
    } else if (startNodes.length > 1) {
      errors.push({
        type: 'multiple_starts',
        message: '故事只能有一个开始节点',
        nodeIds: startNodes,
      })
    }

    return errors
  }

  private detectCycles(graph: Map<string, GraphNode>): ValidationError[] {
    const errors: ValidationError[] = []
    const visited = new Set<string>()
    const recStack = new Set<string>()
    const cycleNodes = new Set<string>()

    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId)
      recStack.add(nodeId)
      path.push(nodeId)

      const node = graph.get(nodeId)
      if (!node) return false

      for (const neighbor of node.outgoing) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, path)) {
            return true
          }
        } else if (recStack.has(neighbor)) {
          const cycleStartIdx = path.indexOf(neighbor)
          if (cycleStartIdx !== -1) {
            for (let i = cycleStartIdx; i < path.length; i++) {
              cycleNodes.add(path[i])
            }
          }
          return true
        }
      }

      path.pop()
      recStack.delete(nodeId)
      return false
    }

    for (const [nodeId] of graph) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, [])
      }
    }

    if (cycleNodes.size > 0) {
      errors.push({
        type: 'cycle',
        message: '检测到死循环，请检查逻辑',
        nodeIds: Array.from(cycleNodes),
      })
    }

    return errors
  }

  private validateConnections(
    graph: Map<string, GraphNode>,
    edges: any[],
  ): ValidationError[] {
    const errors: ValidationError[] = []
    const incompleteNodes: string[] = []

    for (const [nodeId, node] of graph) {
      if (node.type === 'story') {
        const expectedOutgoing = node.optionsCount
        const actualOutgoing = node.outgoing.length

        if (actualOutgoing < expectedOutgoing) {
          incompleteNodes.push(nodeId)
        }
      }

      if (node.type === 'start') {
        if (node.outgoing.length === 0) {
          incompleteNodes.push(nodeId)
        }
      }
    }

    if (incompleteNodes.length > 0) {
      errors.push({
        type: 'missing_connection',
        message: '部分节点的出口连线数量不完整',
        nodeIds: incompleteNodes,
      })
    }

    return errors
  }
}
