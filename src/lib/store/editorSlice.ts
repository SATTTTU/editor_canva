// lib/store/editorSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Layer, Design } from '@/lib/types'; // Define these types in a central file

// Define a type for the stage reference
interface StageRef {
  current: any; // Using `any` for Konva Stage compatibility
}

interface EditorState {
  designId: string | null;
  baseImage: Layer | null;
  layers: Layer[];
  selectedLayerId: string | null;
  cropLayerId: string | null;
  stageRef: StageRef | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: EditorState = {
  designId: null,
  baseImage: null,
  layers: [],
  selectedLayerId: null,
  cropLayerId: null,
  stageRef: null,
  status: 'idle',
};

// --- Async Thunks (for API interactions) ---

export const saveDesign = createAsyncThunk('editor/saveDesign', async (_, { getState }) => {
    const state = (getState() as { editor: EditorState }).editor;
    const { designId, baseImage, layers } = state;
    if (!baseImage) throw new Error("A base image is required to save the design.");

    const allLayers = [baseImage, ...layers].map((l, index) => ({ ...l, zIndex: index }));

    // Normalize layers for the API: ensure we pass assetId (from layer.asset?.id when
    // available) and only the fields the designs API expects. This prevents saved
    // layers from losing their asset relation (which caused `asset: null` on reload).
    const layersPayload = allLayers.map((l) => ({
      type: (l as any).type ?? 'IMAGE',
      assetId: (l as any).assetId ?? (l as any).asset?.id ?? null,
      x: (l as any).x ?? 0,
      y: (l as any).y ?? 0,
      width: (l as any).width,
      height: (l as any).height,
      rotation: (l as any).rotation ?? 0,
      flipX: (l as any).flipX ?? false,
      flipY: (l as any).flipY ?? false,
      opacity: (l as any).opacity ?? 1,
      zIndex: (l as any).zIndex ?? 0,
      cropX: (l as any).cropX ?? null,
      cropY: (l as any).cropY ?? null,
      cropW: (l as any).cropW ?? null,
      cropH: (l as any).cropH ?? null,
      visible: (l as any).visible ?? true,
      locked: (l as any).locked ?? false,
    }));

    const designPayload = {
      title: `Design - ${new Date().toLocaleDateString()}`,
      width: baseImage.width,
      height: baseImage.height,
      layers: layersPayload,
    };
    
  const url = designId ? `/api/designs/${designId}` : '/api/designs';
  const method = designId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(designPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save design: ${errorText}`);
    }
    return await response.json();
});


// --- The Main Slice ---

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // Design and Asset Management
    loadDesign: (state, action: PayloadAction<Design>) => {
      const design = action.payload;
      const sortedLayers = [...design.layers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      const baseLayer = sortedLayers.shift() || null;

      state.designId = design.id;
      state.baseImage = baseLayer;
      state.layers = sortedLayers;
      state.selectedLayerId = null;
      state.cropLayerId = null;
      state.status = 'succeeded';
    },
    setBaseImage: (state, action: PayloadAction<Layer>) => {
      state.designId = null;
      state.baseImage = { ...action.payload, zIndex: 0 };
      state.layers = [];
      state.selectedLayerId = null;
    },
    setStageRef: (state, action: PayloadAction<StageRef>) => {
      state.stageRef = action.payload;
    },

    // Layer CRUD and State
    addLayer: (state, action: PayloadAction<Layer>) => {
      const topZIndex = Math.max(0, ...state.layers.map(l => l.zIndex ?? 0));
      const newLayer = { ...action.payload, zIndex: topZIndex + 1 };
      state.layers.push(newLayer);
      state.selectedLayerId = newLayer.id; // Auto-select new layer
    },
    deleteLayer: (state, action: PayloadAction<string>) => {
      state.layers = state.layers.filter(l => l.id !== action.payload);
      if (state.selectedLayerId === action.payload) {
        state.selectedLayerId = null;
      }
    },
    updateLayer: (state, action: PayloadAction<{ id: string; updates: Partial<Layer> }>) => {
      const isBase = action.payload.id === state.baseImage?.id;
      const layerToUpdate = isBase ? state.baseImage : state.layers.find(l => l.id === action.payload.id);

      if (layerToUpdate) {
        Object.assign(layerToUpdate, action.payload.updates);
      }
    },
    setSelectedLayer: (state, action: PayloadAction<string | null>) => {
      state.selectedLayerId = action.payload;
      state.cropLayerId = null; // Always exit crop mode when selecting a new layer
    },
    duplicateLayer: (state, action: PayloadAction<string>) => {
      const sourceLayer = state.layers.find(l => l.id === action.payload);
      if (!sourceLayer) return;

      const topZIndex = Math.max(0, ...state.layers.map(l => l.zIndex ?? 0));
      const newLayer: Layer = {
        ...JSON.parse(JSON.stringify(sourceLayer)),
        id: uuidv4(),
        x: (sourceLayer.x ?? 0) + 15,
        y: (sourceLayer.y ?? 0) + 15,
        zIndex: topZIndex + 1,
        name: `${sourceLayer.name || 'Layer'} (Copy)`,
      };
      state.layers.push(newLayer);
      state.selectedLayerId = newLayer.id;
    },
    reorderLayer: (state, action: PayloadAction<{ layerId: string; direction: 'up' | 'down' }>) => {
        const sortedLayers = [...state.layers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const currentIndex = sortedLayers.findIndex(l => l.id === action.payload.layerId);
        
        if (currentIndex === -1) return;

        const newIndex = action.payload.direction === 'up'
            ? Math.min(sortedLayers.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);

        if (newIndex === currentIndex) return;

        const [movedLayer] = sortedLayers.splice(currentIndex, 1);
        sortedLayers.splice(newIndex, 0, movedLayer);

        state.layers = sortedLayers.map((layer, index) => ({ ...layer, zIndex: index + 1 }));
    },

    // Cropping Actions
    startCrop: (state, action: PayloadAction<string>) => {
        state.cropLayerId = action.payload;
        state.selectedLayerId = null; // Deselect to hide transform controls
    },
    applyCrop: (state, action: PayloadAction<{ id: string, crop: { x: number, y: number, width: number, height: number } }>) => {
        const layer = state.layers.find(l => l.id === action.payload.id);
        if (layer) {
            layer.cropX = action.payload.crop.x;
            layer.cropY = action.payload.crop.y;
            layer.cropW = action.payload.crop.width;
            layer.cropH = action.payload.crop.height;
        }
        state.cropLayerId = null; // Exit crop mode
        state.selectedLayerId = action.payload.id; // Re-select the layer
    },
    // Clear the currently loaded design from editor state (used after deleting a design)
    clearDesign: (state) => {
      state.designId = null;
      state.baseImage = null;
      state.layers = [];
      state.selectedLayerId = null;
      state.cropLayerId = null;
      state.stageRef = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveDesign.pending, (state) => { state.status = 'loading'; })
      .addCase(saveDesign.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.designId = action.payload.id;
        const sortedLayers = [...action.payload.layers].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        state.baseImage = sortedLayers.shift() || null;
        state.layers = sortedLayers;
      })
      .addCase(saveDesign.rejected, (state) => { state.status = 'failed'; });
  }
});

export const {
  loadDesign,
  setBaseImage,
  setStageRef,
  addLayer,
  deleteLayer,
  updateLayer,
  setSelectedLayer,
  duplicateLayer,
  reorderLayer,
  startCrop,
  applyCrop,
  clearDesign,
} = editorSlice.actions;

export default editorSlice.reducer;