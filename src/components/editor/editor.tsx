"use client"

import { useState } from "react"
import { EditorLayout } from "./editor-layout"
import { Toolbar } from "./toolbar"
import { CanvasEditor } from "./canvas-editor"
import { LayerPanel } from "./layer-panel"
import { AssetGallery } from "./asset-gallery"

export default function Editor() {
  const [isAssetGalleryOpen, setIsAssetGalleryOpen] = useState(false)

  return (
    <EditorLayout
      toolbar={<Toolbar onAddAsset={() => setIsAssetGalleryOpen(true)} />}
      canvas={<CanvasEditor />}
      layers={<LayerPanel />}
      assetGallery={isAssetGalleryOpen ? <AssetGallery onClose={() => setIsAssetGalleryOpen(false)} /> : null}
    />
  )
}