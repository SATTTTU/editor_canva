"use client"

import { useState } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store/store"
import { EditorLayout } from "./editor-layout"
import { Toolbar } from "./toolbar"
import { CanvasEditor } from "./canvas-editor"
import { LayerPanel } from "./layer-panel"
import { AssetGallery } from "./asset-gallery"

// This is the main component that should be rendered on your page
export default function Editor() {
  const [isAssetGalleryOpen, setIsAssetGalleryOpen] = useState(false)

  return (
    <Provider store={store}>
      <EditorLayout
        toolbar={<Toolbar onAddAsset={() => setIsAssetGalleryOpen(true)} />}
        canvas={<CanvasEditor />}
        layers={<LayerPanel />}
        assetGallery={isAssetGalleryOpen ? <AssetGallery onClose={() => setIsAssetGalleryOpen(false)} /> : null}
      />
    </Provider>
  )
}