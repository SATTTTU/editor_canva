"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Copy, Edit2 } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import {
  setSelectedLayer,
  updateLayer,
  deleteLayer,
  addLayer,
  duplicateLayer,
  reorderLayer, // Ensure this action exists in your editorSlice
} from "@/lib/store/editorSlice";
import useLayers from "@/hooks/useLayers"
import Button from "../ui/Button"

export function LayerPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const { baseImage, selectedLayerId } = useSelector((state: RootState) => state.editor)
  const { layers, updateLayer: apiUpdateLayer, deleteLayer: apiDeleteLayer, createLayer: apiCreateLayer } = useLayers(baseImage?.designId ?? undefined)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  // Sort layers by zIndex descending (top layer on canvas is top of list)
  // The base image is always at the bottom of the stack (rendered last in the list).
  const sortedLayers = [...(layers ?? [])].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
  const displayLayers = [...sortedLayers, ...(baseImage ? [baseImage] : [])];

  // Ensure there are no duplicate layers with the same id (e.g., baseImage also present
  // in the layers list). React requires unique keys for list children — dedupe by id,
  // keeping the first occurrence.
  const uniqueDisplayLayers = displayLayers.filter((layer, idx, arr) => arr.findIndex(l => l.id === layer.id) === idx);

  // --- Event Handlers for Clarity ---

  const handleToggleVisibility = async (layer: any) => {
    const newVisible = !layer.visible;
    dispatch(updateLayer({ id: layer.id, updates: { visible: newVisible } }));
    // Persist change to the backend if it's a saved layer
    if (layer.id !== 'base-image' && !layer.id.startsWith('layer-')) {
      try {
        await apiUpdateLayer(layer.id, { visible: newVisible });
      } catch (err) {
        console.error("Failed to update visibility on server", err);
        // Optional: Revert state change on failure
      }
    }
  };

  const handleDuplicate = async (layer: any) => {
    const designId = layer.designId ?? baseImage?.designId;

    // Fallback to local duplication if the design hasn't been saved yet
    if (!designId) {
      console.warn('Performing local duplicate: design has not been saved.');
      dispatch(duplicateLayer(layer.id));
      return;
    }

    const duplicatePayload = {
      ...layer,
      designId,
      zIndex: (layers?.length ?? 0), // Place on top
      x: layer.x + 10, // Offset duplicate slightly
      y: layer.y + 10,
    };
    delete duplicatePayload.id; // Remove ID to let the DB generate a new one

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
    
    // Optimistically remove from UI
    dispatch(deleteLayer(layerId));
    
    try {
      await apiDeleteLayer(layerId);
    } catch (err) {
      console.error("Failed to delete layer on server", err);
      // Optional: Re-add layer to UI on failure
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
        {uniqueDisplayLayers.length <= 1 && !baseImage ? (
          <div className="text-center text-xs text-muted-foreground p-4">No layers yet</div>
        ) : (
          uniqueDisplayLayers.map((layer) => {
            const isBaseImage = layer.id === baseImage?.id;
            const displayName = (layer as any).name ?? (isBaseImage ? "Base Image" : `Layer ${((layer as any).zIndex ?? 0)}`);
            
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
                    <p className="text-xs font-medium truncate" onDoubleClick={() => { setEditingId(layer.id); setEditingName(displayName); }}>
                      {displayName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Actions for all layers */}
                  <Button variant="ghost" size="icon" title={layer.visible ? "Hide Layer" : "Show Layer"} onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer); }}>
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                  
                  {/* Actions for non-base layers */}
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