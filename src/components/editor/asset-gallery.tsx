"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { X, Upload } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import { addLayer } from "@/lib/store/editorSlice"
import type { Layer, AssetRef } from '@/lib/types'
import Button from "../ui/Button"

interface AssetGalleryProps {
  onClose: () => void
}

export function AssetGallery({ onClose }: AssetGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [assets, setAssets] = useState<Array<{ id: string; src: string }>>([])
  const dispatch = useDispatch<AppDispatch>()
  const { baseImage, selectedLayerId, designId } = useSelector((state: RootState) => state.editor)

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const src = event.target?.result as string
      // persist asset to backend
      try {
        const res = await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ originalName: file.name, mimeType: file.type, url: src, width: null, height: null, sizeBytes: file.size }) })
        if (res.ok) {
          const asset = await res.json()
          // asset returned from API should conform to AssetRef-ish shape
          setAssets(prev => [...prev, { id: asset.id as string, src: asset.url as string }])
        } else {
          setAssets(prev => [...prev, { id: `asset-${Date.now()}`, src }])
        }
      } catch (err) {
        setAssets(prev => [...prev, { id: `asset-${Date.now()}`, src }])
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddAsset = async (asset: { id: string; src: string }) => {
    const img = new window.Image()
    img.onload = async () => {
      try {
        // Prefer persisted designId from store; as a fallback use baseImage.id when it
        // appears to be a persisted id. If we don't have a persisted design id, avoid
        // calling the API (which would violate FK constraints) and create a local-only
        // layer instead.
        const designIdToUse = designId ?? (baseImage as Layer | null)?.designId ?? undefined;

        const localLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: `Asset ${assets.length + 1}`,
          type: 'IMAGE',
          designId: designIdToUse ?? undefined,
          assetId: asset.id,
          asset: { id: asset.id, url: asset.src, originalName: '', mimeType: '' } as AssetRef,
          x: 50,
          y: 50,
          width: Math.min(img.width, 200),
          height: Math.min(img.height, 200),
          rotation: 0,
          flipX: false,
          flipY: false,
          flipped: false,
          opacity: 1,
          zIndex: 0,
          visible: true,
        };

        // If we don't have a persisted designId, create a local-only layer and
        // avoid calling the server which would return a FK error.
        if (!designIdToUse) {
          // No persisted design available — create local-only layer
          dispatch(addLayer(localLayer));
        } else {
          const payload = {
            type: 'IMAGE',
            designId: designIdToUse,
            assetId: asset.id,
            x: 50,
            y: 50,
            width: Math.min(img.width, 200),
            height: Math.min(img.height, 200),
            rotation: 0,
            flipX: false,
            flipY: false,
            opacity: 1,
            zIndex: 0,
            visible: true,
            locked: false,
          } as const;

          try {
            const res = await fetch('/api/layers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            if (res.ok) {
              const created = await res.json()
              // API created layer should be compatible with Layer; cast safely
              dispatch(addLayer(created as Layer))
            } else {
              // fallback to local-only layer
              dispatch(addLayer(localLayer))
            }
          } catch (err) {
            dispatch(addLayer(localLayer))
          }
        }
      } catch (err) {
        // Fallback: create a minimal Layer when something goes wrong
        const fallbackLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: `Asset ${assets.length + 1}`,
          type: 'IMAGE',
          x: 50,
          y: 50,
          width: Math.min(img.width, 200),
          height: Math.min(img.height, 200),
          rotation: 0,
          flipX: false,
          flipY: false,
          flipped: false,
          opacity: 1,
          zIndex: 0,
          visible: true,
        }
        dispatch(addLayer(fallbackLayer))
      }
      onClose()
    }
    img.src = asset.src
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[500px] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Asset Gallery</h2>
          <Button variant="primary" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">No assets uploaded</p>
              <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" /> Upload Asset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="aspect-square rounded border overflow-hidden cursor-pointer group" onClick={() => handleAddAsset(asset)}>
                  <img src={asset.src} alt="Asset" className="w-full h-full object-cover group-hover:opacity-75" />
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="border-t p-4 flex justify-between items-center">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="w-4 h-4" /> Upload New
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
        </footer>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAssetUpload} className="hidden" />
      </div>
    </div>
  )
}