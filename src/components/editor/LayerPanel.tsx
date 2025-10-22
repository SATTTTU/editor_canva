"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Copy } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import { 
  updateLayer, 
  setSelectedLayer, 
  deleteLayer, 
  addLayer,
  duplicateLayer, // <-- Fixed: import missing action
  reorderLayer
} from "@/lib/store/editorSlice"
import useLayers from "@/hooks/useLayers"
import Button from "../ui/Button"

export function LayerPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const { baseImage, layers, selectedLayerId } = useSelector((state: RootState) => state.editor)
  const { 
    updateLayer: apiUpdateLayer, 
    deleteLayer: apiDeleteLayer, 
    createLayer: apiCreateLayer 
  } = useLayers(baseImage?.designId ?? undefined)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Sort layers by zIndex descending (top layer on canvas is top of list).
  const sortedLayers = [...(layers ?? [])].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  // The base image is always at the bottom of the visual list.
  const displayLayers = [...sortedLayers, ...(baseImage ? [baseImage] : [])];

  const handleToggleVisibility = async (layer: any) => {
    const newVisible = !layer.visible;
    dispatch(updateLayer({ id: layer.id, updates: { visible: newVisible } }));
    if (layer.id !== 'base-image' && !layer.id.startsWith('layer-')) {
      try {
        await apiUpdateLayer(layer.id, { visible: newVisible });
      } catch (err) {
        console.error("Failed to update visibility on server", err);
      }
    }
  };

  const handleDuplicate = async (layer: any) => {
    const designId = layer.designId ?? baseImage?.designId;
    if (!designId) {
      console.warn('Performing local duplicate: design has not been saved.');
      dispatch(duplicateLayer(layer.id));
      return;
    }
    const { id, ...rest } = layer;
    const duplicatePayload = { ...rest, designId, x: layer.x + 10, y: layer.y + 10 };
    try {
      const createdLayer = await apiCreateLayer(duplicatePayload);
      dispatch(addLayer(createdLayer));
    } catch (err) {
      console.error('Failed to duplicate layer on server, falling back to local.', err);
      dispatch(duplicateLayer(layer.id));
    }
  };

  const handleDelete = async (layerId: string) => {
    if (!confirm("Are you sure you want to delete this layer?")) return;
    dispatch(deleteLayer(layerId));
    try {
      await apiDeleteLayer(layerId);
    } catch (err) {
      console.error("Failed to delete layer on server", err);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      dispatch(updateLayer({ id, updates: { name: editingName.trim() } }));
      // TODO: Persist name change via apiUpdateLayer if needed
    }
    setEditingId(null);
  };
  
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Layers</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {displayLayers.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground p-4">No layers yet</div>
        ) : (
          displayLayers.map((layer) => {
            const isBaseImage = layer.id === baseImage?.id;
            const displayName = layer.name || (isBaseImage ? "Base Image" : `Layer ${layer.zIndex}`);
            
            return (
              <div
                key={layer.id}
                className={`flex items-center p-2 rounded border transition-colors ${selectedLayerId === layer.id ? "bg-primary/10 border-primary" : "bg-muted border-transparent hover:border-border"}`}
                onClick={() => dispatch(setSelectedLayer(layer.id))}
              >
                <div className="flex-1 min-w-0">
                  {editingId === layer.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveRename(layer.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveRename(layer.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-1 py-0.5 text-xs rounded bg-background border"
                    />
                  ) : (
                    <p className="text-xs font-medium truncate" onDoubleClick={() => { if (!isBaseImage) { setEditingId(layer.id); setEditingName(displayName); } }}>
                      {displayName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" title={layer.visible ? "Hide Layer" : "Show Layer"} onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer); }}>
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  
                  {!isBaseImage && (
                     <>
                      <Button variant="ghost" size="icon" title="Move Up" onClick={(e) => { e.stopPropagation(); dispatch(reorderLayer({ layerId: layer.id, direction: 'up' })); }}>
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Move Down" onClick={(e) => { e.stopPropagation(); dispatch(reorderLayer({ layerId: layer.id, direction: 'down' })); }}>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicate Layer" onClick={(e) => { e.stopPropagation(); handleDuplicate(layer); }}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Layer" onClick={(e) => { e.stopPropagation(); handleDelete(layer.id); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                     </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}