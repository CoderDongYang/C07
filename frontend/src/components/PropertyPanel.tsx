import { useEditorStore } from '../store/useEditorStore'
import { generateId } from '../utils/graphUtils'
import { Plus, Trash2, AlertCircle } from 'lucide-react'

export function PropertyPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId)
  const nodes = useEditorStore((state) => state.nodes)
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const isSimulating = useEditorStore((state) => state.isSimulating)
  const edges = useEditorStore((state) => state.edges)
  const getOutgoingEdges = useEditorStore((state) => state.getOutgoingEdges)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (isSimulating) return null

  if (!selectedNode) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4 flex flex-col items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm">点击节点查看属性</p>
        </div>
      </div>
    )
  }

  const outgoingCount = getOutgoingEdges(selectedNode.id).length
  const expectedCount = getExpectedOptionCount(selectedNode)
  const hasWarning = selectedNode.type !== 'ending' && outgoingCount < expectedCount

  const typeColors: Record<string, string> = {
    start: 'text-green-600 bg-green-50',
    story: 'text-blue-600 bg-blue-50',
    ending: 'text-red-600 bg-red-50',
  }

  const typeLabels: Record<string, string> = {
    start: '开始节点',
    story: '剧情节点',
    ending: '结局节点',
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(selectedNode.id, { title: e.target.value })
  }

  const handleNarrationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(selectedNode.id, { narration: e.target.value })
  }

  const handleEndingTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(selectedNode.id, { endingText: e.target.value })
  }

  const handleOptionTextChange = (optionId: string, text: string) => {
    const options = selectedNode.data.options || []
    const newOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt,
    )
    updateNodeData(selectedNode.id, { options: newOptions })
  }

  const addOption = () => {
    const options = selectedNode.data.options || []
    if (options.length >= 5) return
    const newOptions = [...options, { id: generateId('opt'), text: `选项${options.length + 1}` }]
    updateNodeData(selectedNode.id, { options: newOptions })
  }

  const removeOption = (optionId: string) => {
    const options = selectedNode.data.options || []
    if (options.length <= 2) return
    const newOptions = options.filter((opt) => opt.id !== optionId)
    
    const outgoingEdges = edges.filter((e) => e.source === selectedNode.id)
    const portIndex = options.findIndex((o) => o.id === optionId)
    const edgeToRemove = outgoingEdges.find((e) => e.sourcePort === `out-${portIndex + 1}`)
    
    if (edgeToRemove) {
      const store = useEditorStore.getState()
      store.deleteEdge(edgeToRemove.id)
    }
    
    updateNodeData(selectedNode.id, { options: newOptions })
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs px-2 py-1 rounded-md font-medium ${typeColors[selectedNode.type]}`}
          >
            {typeLabels[selectedNode.type]}
          </span>
          {hasWarning && (
            <div className="flex items-center gap-1 text-amber-600 text-xs">
              <AlertCircle size={14} />
              <span>连线不完整</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">节点属性</h3>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            标题
          </label>
          <input
            type="text"
            value={selectedNode.data.title || ''}
            onChange={handleTitleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="输入节点标题"
          />
        </div>

        {selectedNode.type === 'story' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              旁白文本
            </label>
            <textarea
              value={selectedNode.data.narration || ''}
              onChange={handleNarrationChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="输入旁白文本内容..."
            />
          </div>
        )}

        {selectedNode.type === 'ending' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              结局描述
            </label>
            <textarea
              value={selectedNode.data.endingText || ''}
              onChange={handleEndingTextChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="输入结局描述..."
            />
          </div>
        )}

        {selectedNode.type === 'story' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                选项按钮
              </label>
              <button
                onClick={addOption}
                disabled={(selectedNode.data.options?.length || 0) >= 5}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                添加选项
              </button>
            </div>
            <div className="space-y-2">
              {selectedNode.data.options?.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={() => removeOption(option.id)}
                    disabled={(selectedNode.data.options?.length || 0) <= 2}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="删除选项"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              已连接 {outgoingCount}/{expectedCount} 条线
            </p>
          </div>
        )}

        {selectedNode.type === 'start' && (
          <div className="p-3 bg-green-50 rounded-md">
            <p className="text-xs text-green-700">
              开始节点是故事的起点，每个故事只能有一个开始节点，不可删除。
            </p>
          </div>
        )}

        {selectedNode.type === 'ending' && (
          <div className="p-3 bg-red-50 rounded-md">
            <p className="text-xs text-red-700">
              结局节点是故事的终点，没有出口连线。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getExpectedOptionCount(node: any): number {
  if (node.type === 'start') return 1
  if (node.type === 'ending') return 0
  return node.data.options?.length || 0
}
