import { useCallback } from 'react'
import { Minimap } from './Minimap'
import { useEditorStore } from '../store/useEditorStore'
import type { NodeType } from '../types'

interface CanvasProps {
  containerRef: React.RefObject<HTMLDivElement>
  getGraphData: () => {
    zoom: number
    translate: { x: number; y: number }
    canvas: { width: number; height: number }
    content: { x: number; y: number; width: number; height: number }
  } | null
  scrollTo: (x: number, y: number) => void
  onAddNode?: (type: NodeType, x: number, y: number) => void
}

export function Canvas({ containerRef, getGraphData, scrollTo, onAddNode }: CanvasProps) {
  const addNodeStore = useEditorStore((state) => state.addNode)
  const isSimulating = useEditorStore((state) => state.isSimulating)

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSimulating) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const graphData = getGraphData()
      if (!graphData) return

      const { zoom, translate } = graphData

      const x = (e.clientX - rect.left - translate.x) / zoom
      const y = (e.clientY - rect.top - translate.y) / zoom

      if (onAddNode) {
        onAddNode('story' as NodeType, x, y)
      } else {
        addNodeStore('story' as NodeType, x, y)
      }
    },
    [isSimulating, containerRef, getGraphData, onAddNode, addNodeStore],
  )

  const handleScrollTo = useCallback(
    (x: number, y: number) => {
      const graphData = getGraphData()
      if (!graphData) return

      const { canvas, zoom } = graphData
      const tx = canvas.width / 2 - x * zoom
      const ty = canvas.height / 2 - y * zoom

      scrollTo(tx, ty)
    },
    [getGraphData, scrollTo],
  )

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={containerRef}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full"
      />

      {!isSimulating && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-400 pointer-events-none">
          <p>双击画布添加剧情节点</p>
          <p>右键拖拽移动画布</p>
          <p>左键拖拽移动节点</p>
          <p>滚轮缩放</p>
        </div>
      )}

      <Minimap getGraphData={getGraphData} onScrollTo={handleScrollTo} />
    </div>
  )
}
