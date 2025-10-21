"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Copy } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import Button from "../ui/Button"
import { updateLayer, setSelectedLayer, toggleLayerVisibility, duplicateLayer, deleteLayer, addLayer } from "@/lib/store/editorSlice"
import useLayers from "@/hooks/useLayers"

export function LayerPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const { baseImage, selectedLayerId } = useSelector((state: RootState) => state.editor)
  const { layers, loading, error, updateLayer: apiUpdateLayer, deleteLayer: apiDeleteLayer, createLayer: apiCreateLayer } = useLayers(baseImage?.id ?? undefined)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Reverse layers for intuitive display (top layer on top)
  const allLayers = layers ? (baseImage ? [ ...layers.slice().reverse(), baseImage] : layers.slice().reverse()) : []

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      dispatch(updateLayer({ id, updates: { name: editingName.trim() } }))
    }
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b"><h3 className="font-semibold text-sm">Layers</h3></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allLayers.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground p-4">No layers yet</div>
        ) : (
          allLayers.map((layer) => (
            <div key={layer.id} className={`p-2 rounded border cursor-pointer ${selectedLayerId === layer.id ? "bg-primary/10 border-primary" : "bg-muted border-transparent hover:border-border"}`} onClick={() => dispatch(setSelectedLayer(layer.id))}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {editingId === layer.id ? (
                    <input autoFocus type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={() => handleSaveRename(layer.id)} onKeyDown={(e) => e.key === "Enter" && handleSaveRename(layer.id)} onClick={(e) => e.stopPropagation()} className="w-full px-1 py-0.5 text-xs rounded bg-background border"/>
                  ) : (
                    (() => {
                      const displayName = (layer as any).name ?? (layer as any).asset?.originalName ?? (layer as any).type ?? "Layer"
                      return <p className="text-xs font-medium truncate" onDoubleClick={() => { setEditingId(layer.id); setEditingName(displayName); }}>{displayName}</p>
                    })()
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="primary" size="sm" onClick={async (e) => { e.stopPropagation(); const newVisible = !layer.visible; dispatch(updateLayer({ id: layer.id, updates: { visible: newVisible } })); try {
                      // Skip server update for local-only synthetic ids
                      if (layer.id === 'base-image' || layer.id.startsWith('layer-')) {
                        console.warn('Skipping API visibility toggle for local-only id', layer.id)
                      } else {
                        await apiUpdateLayer(layer.id, { visible: newVisible })
                      }
                    } catch (err) { /* ignore */ } }}>
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  {layer.id !== "base-image" && (
                     <>
                      <Button variant="ghost" size="sm" onClick={async (e) => { e.stopPropagation();
                          try {
                            // create a duplicate on the server and add to local store
                            const payload = {
                              type: (layer as any).type ?? 'IMAGE',
                              designId: (layer as any).designId ?? (baseImage ? (baseImage as any).designId : undefined),
                              assetId: (layer as any).assetId ?? null,
                              x: (layer as any).x ?? 0,
                              y: (layer as any).y ?? 0,
                              width: (layer as any).width ?? 100,
                              height: (layer as any).height ?? 100,
                              rotation: (layer as any).rotation ?? 0,
                              flipX: (layer as any).flipX ?? false,
                              flipY: (layer as any).flipY ?? false,
                              opacity: (layer as any).opacity ?? 1,
                              zIndex: (layer as any).zIndex ?? 0,
                              visible: (layer as any).visible ?? true,
                              locked: (layer as any).locked ?? false,
                            }
                            const created = await apiCreateLayer(payload as any)
                            // add the created layer to redux so canvas updates
                            dispatch(addLayer(created as any))
                          } catch (err) {
                            console.error('Failed to duplicate layer', err)
                            // fallback to local duplicate
                            dispatch(duplicateLayer(layer.id))
                          }
                      }}><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={async (e) => { e.stopPropagation(); if (!confirm("Delete layer?")) return; try { await apiDeleteLayer(layer.id); dispatch(deleteLayer(layer.id)); } catch { /* ignore */ } }}><Trash2 className="w-4 h-4" /></Button>
                     </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}