"use client"

import { useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Upload, Plus, Download, RotateCw, Save, Loader2 } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import { DesignManager } from "./design-manager"
import { saveDesign, setBaseImage, updateLayer } from "@/lib/store/editorSlice"
import Button from "../ui/Button"

interface ToolbarProps { onAddAsset: () => void }

export function Toolbar({ onAddAsset }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const { selectedLayerId, layers, baseImage, stageRef } = useSelector((state: RootState) => state.editor)
  const selectedLayer = layers.find((l: any) => l.id === selectedLayerId)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = async () => {
        // try to persist the uploaded asset to backend
        try {
          const res = await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalName: file.name, mimeType: file.type, url: event.target?.result, width: img.width, height: img.height, sizeBytes: file.size }) })
          if (res.ok) {
            const asset = await res.json()
            // create a persisted layer for the base image so it has a DB id
            try {
              const layerRes = await fetch('/api/layers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'IMAGE', designId: null, assetId: asset.id, x: 0, y: 0, width: img.width, height: img.height, rotation: 0, flipX: false, flipY: false, opacity: 1, zIndex: 0, visible: true, locked: false }) })
              if (layerRes.ok) {
                const createdLayer = await layerRes.json()
                dispatch(setBaseImage(createdLayer))
                return
              }
            } catch (err) {
              // fallthrough to local fallback
            }
          }
        } catch (err) {
          // ignore failure — still set base image locally
        }
        // fallback to local-only base image if persistence failed
        dispatch(setBaseImage({ id: 'base-image', name: 'Base Image', src: img.src, x: 0, y: 0, width: img.width, height: img.height, rotation: 0, flipped: false, visible: true }))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleExport = (format: "png" | "jpeg") => {
    if (!stageRef?.current) return
    setIsExporting(true)
    const uri = stageRef.current.toDataURL({ mimeType: `image/${format}`, quality: 0.95 })
    const link = document.createElement('a')
    link.download = `my-design.${format}`
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsExporting(false)
  }
  
  const rotateSelectedLayer = (rotation: number) => {
    if (!selectedLayer) return
    const updates = { rotation: (selectedLayer.rotation + rotation) % 360 }
    dispatch(updateLayer({ id: selectedLayer.id, updates }))
    // persist to backend
    ;(async () => {
      try {
        // Skip persisting for local-only synthetic ids
        if (selectedLayer.id === 'base-image' || selectedLayer.id.startsWith('layer-')) {
          console.warn('Skipping rotate persist for local-only id', selectedLayer.id)
          return
        }
        await fetch(`/api/layers/${selectedLayer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      } catch {}
    })()
  }

  const handleSave = async () => {
    if (!baseImage) return
    const thumbnail = stageRef?.current?.toDataURL({ mimeType: 'image/png', quality: 0.6 })
    const payload = {
      title: `Design - ${new Date().toLocaleDateString()}`,
      width: baseImage.width,
      height: baseImage.height,
      thumbnail,
      layers: layers.map((l: any) => ({
        type: l.type ?? 'IMAGE',
        assetId: l.assetId ?? null,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        rotation: l.rotation,
        flipX: l.flipX ?? false,
        flipY: l.flipY ?? false,
        opacity: l.opacity,
        zIndex: l.zIndex ?? 0,
        cropX: l.cropX ?? null,
        cropY: l.cropY ?? null,
        cropW: l.cropW ?? null,
        cropH: l.cropH ?? null,
        visible: l.visible,
        locked: l.locked ?? false,
      }))
    }
    try {
      const res = await fetch('/api/designs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        // optionally notify success
      }
    } catch (err) {
      // ignore
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload className="w-4 h-4" /> Base Image</Button>
        <Button size="sm" variant="outline" onClick={onAddAsset} className="gap-2"><Plus className="w-4 h-4" /> Add Asset</Button>
        <DesignManager />
      </div>
      {selectedLayer && (<div className="flex items-center gap-2 border-l border-r px-4"><Button size="sm" variant="ghost" onClick={() => rotateSelectedLayer(15)}><RotateCw className="w-4 h-4" /></Button></div>)}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => handleExport("png")} disabled={isExporting || !baseImage} className="gap-2">{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PNG</Button>
        <Button size="sm" variant="outline" onClick={() => handleExport("jpeg")} disabled={isExporting || !baseImage} className="gap-2">{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JPEG</Button>
  <Button size="sm" onClick={handleSave} disabled={!baseImage} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
      </div>
    </div>
  )
}