import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import { Trash2 } from 'lucide-react'

export function ContextMenu() {
  const contextMenu = useEditorStore((state) => state.contextMenu)
  const hideContextMenu = useEditorStore((state) => state.hideContextMenu)
  const deleteNode = useEditorStore((state) => state.deleteNode)
  const getNodeById = useEditorStore((state) => state.getNodeById)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu()
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.visible, hideContextMenu])

  const handleDelete = () => {
    if (contextMenu.nodeId) {
      const node = getNodeById(contextMenu.nodeId)
      if (node && node.type !== 'start') {
        if (window.confirm('确定要删除这个节点吗？相关连线也会被删除。')) {
          deleteNode(contextMenu.nodeId)
        }
      }
    }
    hideContextMenu()
  }

  if (!contextMenu.visible) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[140px]"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 size={14} />
        删除节点
      </button>
    </div>
  )
}
