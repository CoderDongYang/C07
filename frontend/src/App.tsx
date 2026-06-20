import { useEffect, useCallback, useRef } from 'react'
import { Toolbar } from './components/Toolbar'
import { Canvas } from './components/Canvas'
import { PropertyPanel } from './components/PropertyPanel'
import { StoryPanel } from './components/StoryPanel'
import { ContextMenu } from './components/ContextMenu'
import { useEditorStore } from './store/useEditorStore'
import { storyApi } from './api/storyApi'
import type { NodeType } from './types'
import { useGraph } from './hooks/useGraph'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isSimulating = useEditorStore((state) => state.isSimulating)
  const stopSimulation = useEditorStore((state) => state.stopSimulation)
  const nodes = useEditorStore((state) => state.nodes)
  const edges = useEditorStore((state) => state.edges)
  const storyTitle = useEditorStore((state) => state.storyTitle)
  const storyId = useEditorStore((state) => state.storyId)
  const setStory = useEditorStore((state) => state.setStory)
  const setSaving = useEditorStore((state) => state.setSaving)
  const setLastSavedAt = useEditorStore((state) => state.setLastSavedAt)
  const setValidationResult = useEditorStore((state) => state.setValidationResult)
  const addNode = useEditorStore((state) => state.addNode)

  const saveTimeoutRef = useRef<number | null>(null)

  const {
    centerCanvas,
    zoomIn,
    zoomOut,
    zoomToFit,
    getGraphData,
    scrollTo,
  } = useGraph(containerRef)

  useEffect(() => {
    const initStory = async () => {
      try {
        const stories = await storyApi.list()
        if (stories.length > 0) {
          const story = stories[0]
          setStory(story.id, story.title, story.nodes, story.edges)
        } else {
          const newStory = await storyApi.create('我的第一个互动故事', '')
          setStory(newStory.id, newStory.title, newStory.nodes, newStory.edges)
        }
      } catch (error) {
        console.log('后端服务未启动，使用本地模式')
        const defaultNodes = [
          {
            id: 'start-node-default',
            type: 'start' as NodeType,
            x: 200,
            y: 250,
            width: 120,
            height: 60,
            data: {
              type: 'start' as NodeType,
              title: '开始',
            },
          },
        ]
        setStory('local-demo', '我的第一个互动故事', defaultNodes as any, [])
      }
    }

    initStory()
  }, [setStory])

  const debouncedSave = useCallback(() => {
    if (!storyId || storyId === 'local-demo') return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        setSaving(true)
        const result = await storyApi.save(storyId, {
          title: storyTitle,
          nodes,
          edges,
        })
        setValidationResult(result.validation)
        setLastSavedAt(new Date().toISOString())
      } catch (error: any) {
        if (error.response?.data?.errors) {
          setValidationResult(error.response.data)
        }
        console.error('保存失败:', error)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }, [storyId, storyTitle, nodes, edges, setSaving, setValidationResult, setLastSavedAt])

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      debouncedSave()
    }
  }, [nodes, edges, storyTitle, debouncedSave])

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const graphData = getGraphData()
      if (graphData) {
        const { canvas, zoom, translate } = graphData
        const centerX = (canvas.width / 2 - translate.x) / zoom - 100
        const centerY = (canvas.height / 2 - translate.y) / zoom - 70
        addNode(type, centerX + Math.random() * 100 - 50, centerY + Math.random() * 100 - 50)
      } else {
        addNode(type, 300, 300)
      }
    },
    [addNode, getGraphData],
  )

  const handleSave = useCallback(async () => {
    if (!storyId || storyId === 'local-demo') {
      alert('当前为演示模式，请启动后端服务后使用')
      return
    }

    try {
      setSaving(true)
      const result = await storyApi.save(storyId, {
        title: storyTitle,
        nodes,
        edges,
      })
      setValidationResult(result.validation)
      setLastSavedAt(new Date().toISOString())
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setValidationResult(error.response.data)
        alert(error.response.data.message || '保存失败')
      } else {
        alert('保存失败，请检查后端服务')
      }
    } finally {
      setSaving(false)
    }
  }, [storyId, storyTitle, nodes, edges, setSaving, setValidationResult, setLastSavedAt])

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <Toolbar
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomToFit={zoomToFit}
        onCenter={centerCanvas}
        onAddNode={handleAddNode}
        onSave={handleSave}
      />

      <div className="flex-1 flex overflow-hidden">
        <Canvas
          containerRef={containerRef}
          getGraphData={getGraphData}
          scrollTo={scrollTo}
        />

        {!isSimulating && <PropertyPanel />}

        {isSimulating && <StoryPanel onClose={stopSimulation} />}
      </div>

      <ContextMenu />
    </div>
  )
}

export default App
