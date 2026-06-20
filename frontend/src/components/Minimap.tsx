import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store/useEditorStore'

interface MinimapProps {
  getGraphData: () => {
    zoom: number
    translate: { x: number; y: number }
    canvas: { width: number; height: number }
    content: { x: number; y: number; width: number; height: number }
  } | null
  onScrollTo: (x: number, y: number) => void
}

export function Minimap({ getGraphData, onScrollTo }: MinimapProps) {
  const nodes = useEditorStore((state) => state.nodes)
  const zoom = useEditorStore((state) => state.zoom)
  const pan = useEditorStore((state) => state.pan)
  const minimapRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const [, forceUpdate] = useState(0)

  const minimapWidth = 200
  const minimapHeight = 150
  const padding = 10

  const showMinimap = nodes.length > 10

  const calculateBounds = useCallback(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const node of nodes) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + node.width)
      maxY = Math.max(maxY, node.y + node.height)
    }

    const paddingBounds = 50
    minX -= paddingBounds
    minY -= paddingBounds
    maxX += paddingBounds
    maxY += paddingBounds

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }, [nodes])

  const bounds = calculateBounds()

  const scale = Math.min(
    (minimapWidth - padding * 2) / bounds.width,
    (minimapHeight - padding * 2) / bounds.height,
  )

  const toMinimapX = (x: number) => padding + (x - bounds.minX) * scale
  const toMinimapY = (y: number) => padding + (y - bounds.minY) * scale
  const fromMinimapX = (x: number) => (x - padding) / scale + bounds.minX
  const fromMinimapY = (y: number) => (y - padding) / scale + bounds.minY

  const viewportX = toMinimapX(-pan.x / zoom)
  const viewportY = toMinimapY(-pan.y / zoom)
  
  const graphData = getGraphData?.()
  const canvasWidth = graphData?.canvas.width || 800
  const canvasHeight = graphData?.canvas.height || 600
  
  const viewportWidth = (canvasWidth / zoom) * scale
  const viewportHeight = (canvasHeight / zoom) * scale

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX - viewportX,
      y: e.clientY - viewportY,
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return

    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y

    const centerX = fromMinimapX(newX + viewportWidth / 2)
    const centerY = fromMinimapY(newY + viewportHeight / 2)

    onScrollTo(centerX, centerY)
    forceUpdate((n) => n + 1)
  }, [viewportWidth, viewportHeight, fromMinimapX, fromMinimapY, onScrollTo])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMinimapClick = (e: React.MouseEvent) => {
    const rect = minimapRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const centerX = fromMinimapX(clickX)
    const centerY = fromMinimapY(clickY)

    onScrollTo(centerX, centerY)
  }

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  if (!showMinimap) return null

  return (
    <div
      ref={minimapRef}
      onClick={handleMinimapClick}
      className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 cursor-crosshair z-10"
      style={{ width: minimapWidth, height: minimapHeight }}
    >
      <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none">
        导航
      </div>

      <svg
        width={minimapWidth}
        height={minimapHeight}
        className="pointer-events-none"
      >
        {nodes.map((node) => {
        const x = toMinimapX(node.x)
        const y = toMinimapY(node.y)
        const w = node.width * scale
        const h = node.height * scale

        const fillColor =
          node.type === 'start'
            ? '#22c55e'
            : node.type === 'ending'
            ? '#ef4444'
            : '#3b82f6'

        return (
          <rect
            key={node.id}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={fillColor}
            opacity={0.6}
            rx={2}
          />
        )
      })}
      </svg>

      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 cursor-move rounded"
        style={{
          left: Math.max(0, viewportX),
          top: Math.max(0, viewportY),
          width: Math.min(viewportWidth, minimapWidth),
          height: Math.min(viewportHeight, minimapHeight),
        }}
      />
    </div>
  )
}
