"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { Stage, Layer as KonvaLayer } from "react-konva"
import { useSelector, useDispatch } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { setSelectedLayer, updateLayer as localUpdateLayer } from "@/lib/store/editorSlice"
import useLayers from "@/hooks/useLayers"
import { GuideLine } from "./guide-line"
import { LayerType } from "./layerImage"
import { LayerImage } from "./layer-image"

export function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<AppDispatch>()
  const { layers, baseImage, selectedLayerId, cropLayerId } = useSelector((state: RootState) => state.editor)
  const { updateLayer: apiUpdateLayer } = useLayers(baseImage?.id ?? undefined)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [showGuides, setShowGuides] = useState(true)
  const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] })

  // Effect to handle canvas resizing
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setStageSize({ width, height })
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  
  // Effect to calculate guide lines for snapping
  useEffect(() => {
    const vertical = new Set<number>()
    const horizontal = new Set<number>()
    
    // Add center guides for the canvas
    vertical.add(stageSize.width / 2)
    horizontal.add(stageSize.height / 2)
    
    // Add guides based on other layers' positions and centers
    layers.forEach(layer => {
      if (layer.id === selectedLayerId) return // Don't snap to self
      vertical.add(layer.x)
      vertical.add(layer.x + layer.width)
      vertical.add(layer.x + layer.width / 2)
      horizontal.add(layer.y)
      horizontal.add(layer.y + layer.height)
      horizontal.add(layer.y + layer.height / 2)
    })
    
    setGuides({ vertical: Array.from(vertical), horizontal: Array.from(horizontal) })
  }, [layers, selectedLayerId, stageSize])

  // Memoize the combined list of all layers
  const allLayers = useMemo(() => (baseImage ? [baseImage, ...layers] : layers), [baseImage, layers])

  // Function to snap a value to the nearest guide
  const snapTo = (value: number, guideLines: number[], threshold = 6) => {
    for (const g of guideLines) {
      if (Math.abs(value - g) <= threshold) return g
    }
    return value
  }

  // Handle layer changes (e.g., drag, transform)
  const handleChange = async (id: string, updates: Partial<LayerType>) => {
    const layer = allLayers.find(l => l.id === id)
    if (!layer) return

    // Apply snapping logic if guides are shown
    if (showGuides) {
      if (updates.x !== undefined) {
        const centerX = updates.x + layer.width / 2
        const snappedX = snapTo(centerX, guides.vertical)
        updates.x = snappedX - layer.width / 2
      }
      if (updates.y !== undefined) {
        const centerY = updates.y + layer.height / 2
        const snappedY = snapTo(centerY, guides.horizontal)
        updates.y = snappedY - layer.height / 2
      }
    }

    // Update state locally
    dispatch(localUpdateLayer({ id, updates }))
    
    // Persist changes via API, skipping for local-only layers like the base image
    if (typeof id === 'string' && (id === 'base-image' || id.startsWith('layer-'))) return
    try {
      await apiUpdateLayer(id, updates)
    } catch (err) {
      console.error('Failed to save layer update:', err)
    }
  }

  // Effect for handling keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Toggle guides with Ctrl/Cmd + G
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setShowGuides(s => !s)
      }
      // Delete selected layer
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && selectedLayerId !== 'base-image') {
          // You would dispatch a 'removeLayer' action here
          // dispatch(removeLayer(selectedLayerId));
          dispatch(setSelectedLayer(null))
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedLayerId, dispatch])

  return (
    <div ref={containerRef} className="flex-1 w-full h-full">
      <Stage width={stageSize.width} height={stageSize.height}>
        <KonvaLayer>
          {/* Render Guide Lines */}
          {showGuides && guides.vertical.map((g, i) => (
            <GuideLine key={`v-${i}`} snapPoint={g} orientation="vertical" stageWidth={stageSize.width} stageHeight={stageSize.height} />
          ))}
          {showGuides && guides.horizontal.map((g, i) => (
            <GuideLine key={`h-${i}`} snapPoint={g} orientation="horizontal" stageWidth={stageSize.width} stageHeight={stageSize.height} />
          ))}

          {/* Render All Layers */}
          {allLayers.map((layer: LayerType) => (
            <LayerImage
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerId === layer.id}
              cropMode={cropLayerId === layer.id}
              onSelect={() => dispatch(setSelectedLayer(layer.id))}
              onChange={(updates) => handleChange(layer.id, updates)}
            />
          ))}
        </KonvaLayer>
      </Stage>
    </div>
  )
}