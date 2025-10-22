"use client"

import { useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Upload, Plus, Download, RotateCw, RotateCcw, Save, Loader2, FlipHorizontal, FlipVertical, Crop } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import type { Layer } from '@/lib/types'
import { DesignManager } from "./design-manager"
import { setBaseImage, updateLayer, saveDesign, startCrop } from "@/lib/store/editorSlice"
import { exportDesign } from '@/lib/api'
import Button from "../ui/Button"

export function Toolbar({ onAddAsset }: { onAddAsset: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const dispatch = useDispatch<AppDispatch>()
  const { selectedLayerId, layers, baseImage, designId, status } = useSelector((state: RootState) => state.editor)
  const selectedLayer = baseImage?.id === selectedLayerId ? baseImage : layers.find((l) => l.id === selectedLayerId)

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Here you would typically upload the image to your backend to get a persistent URL
        // For simplicity, we'll use the data URL directly, but this won't work for saving/loading
        (async () => {
          try {
            // Try to persist the base image as an asset so saved designs reference it
            const res = await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalName: file.name, mimeType: file.type, url: event.target?.result as string, width: img.width, height: img.height, sizeBytes: file.size }) });
            if (res.ok) {
              const asset = await res.json();
              dispatch(setBaseImage({
                id: `base-${Date.now()}`,
                name: 'Base Image',
                src: asset.url,
                assetId: asset.id,
                asset: { id: asset.id, url: asset.url, originalName: file.name, mimeType: file.type },
                x: 0, y: 0,
                width: img.width, height: img.height,
                rotation: 0, visible: true,
                opacity: 1,
                zIndex: 0,
                flipX: false,
                flipY: false,
                locked: false,
              } as Layer));
            } else {
              dispatch(setBaseImage({
                id: `base-${Date.now()}`,
                name: 'Base Image',
                src: event.target?.result as string,
                x: 0, y: 0,
                width: img.width, height: img.height,
                rotation: 0, visible: true,
                opacity: 1,
                zIndex: 0,
                flipX: false,
                flipY: false,
                locked: false,
              } as Layer));
            }
          } catch (err) {
            dispatch(setBaseImage({
              id: `base-${Date.now()}`,
              name: 'Base Image',
              src: event.target?.result as string,
              x: 0, y: 0,
              width: img.width, height: img.height,
              rotation: 0, visible: true,
              opacity: 1,
              zIndex: 0,
              flipX: false,
              flipY: false,
              locked: false,
            } as Layer));
          }
        })();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (!selectedLayer) return;
    const updates = direction === 'horizontal' ? { flipX: !selectedLayer.flipX } : { flipY: !selectedLayer.flipY };
    dispatch(updateLayer({ id: selectedLayer.id, updates }));
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <input ref={fileInput} type="file" accept="image/*" onChange={handleBaseImageUpload} className="hidden" />
        <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} className="gap-2"><Upload className="w-4 h-4" /> Base Image</Button>
        <Button size="sm" variant="outline" onClick={onAddAsset} className="gap-2" disabled={!baseImage}><Plus className="w-4 h-4" /> Add Asset</Button>
        <DesignManager />
      </div>

      {selectedLayer && (
        <div className="flex items-center gap-1 border-l border-r px-3">
          <Button size="sm" variant="ghost" onClick={() => dispatch(updateLayer({ id: selectedLayer.id, updates: { rotation: (selectedLayer.rotation - 15) % 360 } }))} aria-label="Rotate Left"><RotateCcw className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => dispatch(updateLayer({ id: selectedLayer.id, updates: { rotation: (selectedLayer.rotation + 15) % 360 } }))} aria-label="Rotate Right"><RotateCw className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => handleFlip('horizontal')} aria-label="Flip Horizontal"><FlipHorizontal className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => handleFlip('vertical')} aria-label="Flip Vertical"><FlipVertical className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => dispatch(startCrop(selectedLayer.id))} aria-label="Crop Layer"><Crop className="w-4 h-4" /></Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={!designId} className="gap-2" onClick={async () => {
          if (!designId) return;
          try {
            await exportDesign(designId, 'png');
          } catch (err) {
            console.error('Failed to export PNG', err);
            alert('Export failed. Check console for details.');
          }
        }}> <Download className="w-4 h-4" /> PNG</Button>
        <Button size="sm" onClick={() => dispatch(saveDesign())} disabled={!baseImage || status === 'loading'} className="gap-2">
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </Button>
      </div>
    </div>
  )
}