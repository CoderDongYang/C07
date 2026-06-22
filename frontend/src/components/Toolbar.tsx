import {
  Play,
  Square,
  PlusSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  AlertTriangle,
  Undo2,
  Redo2,
} from 'lucide-react'
import { useEditorStore } from '../store/useEditorStore'
import type { NodeType } from '../types'

interface ToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomToFit: () => void
  onCenter: () => void
  onAddNode: (type: NodeType) => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
}

export function Toolbar({
  onZoomIn,
  onZoomOut,
  onZoomToFit,
  onCenter,
  onAddNode,
  onSave,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const isSimulating = useEditorStore((state) => state.isSimulating)
  const startSimulation = useEditorStore((state) => state.startSimulation)
  const stopSimulation = useEditorStore((state) => state.stopSimulation)
  const storyTitle = useEditorStore((state) => state.storyTitle)
  const isSaving = useEditorStore((state) => state.isSaving)
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt)
  const validationResult = useEditorStore((state) => state.validationResult)
  const nodes = useEditorStore((state) => state.nodes)
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)

  const hasErrors = validationResult && !validationResult.valid
  const errorCount = validationResult?.errors.length || 0

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800 min-w-[150px] truncate">
          {storyTitle}
        </h1>

        {!isSimulating && (
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="重做 (Ctrl+Shift+Z)"
            >
              <Redo2 size={18} />
            </button>
          </div>
        )}

        {!isSimulating && (
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <button
              onClick={() => onAddNode('story')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              <PlusSquare size={16} />
              添加剧情节点
            </button>
            <button
              onClick={() => onAddNode('ending')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            >
              <PlusSquare size={16} />
              添加结局节点
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasErrors && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md text-sm">
            <AlertTriangle size={16} />
            <span>{errorCount} 个问题</span>
          </div>
        )}

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
          <button
            onClick={onZoomOut}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="缩小"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={onZoomIn}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={onZoomToFit}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="适应画布"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {!isSimulating ? (
          <button
            onClick={startSimulation}
            disabled={nodes.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            模拟运行
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Square size={16} />
            退出模拟
          </button>
        )}

        {!isSimulating && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? '保存中...' : '保存'}
          </button>
        )}

        {lastSavedAt && !isSaving && (
          <span className="text-xs text-gray-400">
            {formatTime(lastSavedAt)}
          </span>
        )}
      </div>
    </div>
  )
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return `已保存于 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
