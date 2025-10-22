"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { Stage, Layer as KonvaLayer } from "react-konva"
import { useSelector, useDispatch } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { setSelectedLayer, updateLayer, setStageRef } from "@/lib/store/editorSlice"
import { LayerImage } from "./layer-image"
import type { Layer } from "@/lib/types"

export function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<AppDispatch>()
  const { layers, baseImage, selectedLayerId, cropLayerId } = useSelector((state: RootState) => state.editor)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setStageSize({ width, height })
      }
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  useEffect(() => {
    if (stageRef.current) {
      dispatch(setStageRef({ current: stageRef.current }));
    }
  }, [stageRef, dispatch]);

  const allLayers = useMemo(() => {
    const sorted = [...layers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    return baseImage ? [baseImage, ...sorted] : sorted;
  }, [baseImage, layers]);

  const handleChange = (id: string, updates: Partial<Layer>) => {
    dispatch(updateLayer({ id, updates }));
    // TODO: Add debounced API call to persist changes
  };

  const handleStageClick = (e: any) => {
    // Deselect if clicked on the stage background
    if (e.target === e.target.getStage()) {
      dispatch(setSelectedLayer(null));
    }
  };

  return (
    <div ref={containerRef} className="flex-1 w-full h-full">
      <Stage 
        ref={stageRef} 
        width={stageSize.width} 
        height={stageSize.height}
        onClick={handleStageClick}
      >
        <KonvaLayer>
          {allLayers.map((layer) => (
            <LayerImage
              key={layer.id}
              layer={layer as Layer}
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