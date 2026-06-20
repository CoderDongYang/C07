import { useEditorStore } from '../store/useEditorStore'
import {
  findNextNodeByOption,
  getEdgeIdByOption,
} from '../utils/graphUtils'
import { RotateCcw, X } from 'lucide-react'

interface StoryPanelProps {
  onClose: () => void
}

export function StoryPanel({ onClose }: StoryPanelProps) {
  const simulationState = useEditorStore((state) => state.simulationState)
  const nodes = useEditorStore((state) => state.nodes)
  const edges = useEditorStore((state) => state.edges)
  const goToNextNode = useEditorStore((state) => state.goToNextNode)
  const resetSimulation = useEditorStore((state) => state.resetSimulation)

  const currentNode = nodes.find((n) => n.id === simulationState.currentNodeId)

  if (!currentNode) return null

  const handleOptionClick = (optionIndex: number) => {
    const nextNode = findNextNodeByOption(currentNode.id, optionIndex, edges, nodes)
    const edgeId = getEdgeIdByOption(currentNode.id, optionIndex, edges)

    if (nextNode && edgeId) {
      goToNextNode(nextNode.id, edgeId)
    }
  }

  const isEnding = currentNode.type === 'ending'
  const isStart = currentNode.type === 'start'

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl animate-slide-in">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">🎮 剧情预览</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="重新开始"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div
            className={`inline-block px-2 py-1 text-xs rounded-md mb-2 ${
              isStart
                ? 'bg-green-100 text-green-700'
                : isEnding
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isStart ? '开始' : isEnding ? '结局' : '剧情'}
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            {currentNode.data.title || '未命名节点'}
          </h2>
        </div>

        <div className="prose prose-sm max-w-none">
          {currentNode.type === 'story' && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {currentNode.data.narration || '（暂无旁白）'}
            </p>
          )}

          {currentNode.type === 'ending' && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {currentNode.data.endingText || '（暂无结局描述）'}
              </p>
            </div>
          )}

          {currentNode.type === 'start' && (
            <p className="text-gray-500 italic">故事的起点，点击下方选项开始你的冒险...</p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 space-y-2">
        {isEnding ? (
          <button
            onClick={resetSimulation}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            🔄 重新开始
          </button>
        ) : (
          currentNode.data.options?.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(index)}
              className="w-full py-3 px-4 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center gap-3 group"
            >
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option.text}</span>
              <span className="text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          ))
        )}

        {isStart && (
          <button
            onClick={() => handleOptionClick(0)}
            className="w-full py-3 px-4 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center gap-3 group"
          >
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
              ▶
            </span>
            <span className="flex-1">开始故事</span>
            <span className="text-green-400 group-hover:text-green-600 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>已访问 {simulationState.visitedNodeIds.length} 个节点</span>
          <span>进度 {Math.round((simulationState.history.length / Math.max(nodes.length - 1, 1)) * 100)}%</span>
        </div>
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((simulationState.history.length / Math.max(nodes.length - 1, 1)) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
