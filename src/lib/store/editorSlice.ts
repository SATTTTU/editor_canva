"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type Konva from "konva"
import type { Layer, Design } from "@/lib/types"

interface EditorState {
  baseImage: Layer | null
  layers: Layer[]
  selectedLayerId: string | null
  cropLayerId: string | null
  designs: Design[]
  stageRef: { current: any } | null
}

const initialState: EditorState = {
  baseImage: null,
  layers: [],
  selectedLayerId: null,
  cropLayerId: null,
  designs: [],
  stageRef: null,
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setBaseImage: (state, action: PayloadAction<Layer>) => {
      state.baseImage = action.payload
    },
    addLayer: (state, action: PayloadAction<Layer>) => {
      state.layers.push(action.payload)
      state.selectedLayerId = action.payload.id
    },
    deleteLayer: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.layers = state.layers.filter((l) => l.id !== id)
      if (state.selectedLayerId === id) {
        state.selectedLayerId = null
      }
    },
    updateLayer: (state, action: PayloadAction<{ id: string; updates: Partial<Layer> }>) => {
      const { id, updates } = action.payload
      const layer = state.layers.find((l) => l.id === id)
      if (layer) {
        Object.assign(layer, updates)
      }
      if (state.baseImage?.id === id) {
        state.baseImage = { ...state.baseImage, ...updates }
      }
    },
    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((l) => l.id === action.payload)
      if (layer) layer.visible = !layer.visible
    },
    reorderLayers: (state, action: PayloadAction<{ id: string; direction: "up" | "down" }>) => {
      const { id, direction } = action.payload
      const index = state.layers.findIndex((l) => l.id === id)
      if (index === -1) return

      if (direction === "up" && index > 0) {
        [state.layers[index], state.layers[index - 1]] = [state.layers[index - 1], state.layers[index]]
      } else if (direction === "down" && index < state.layers.length - 1) {
        [state.layers[index], state.layers[index + 1]] = [state.layers[index + 1], state.layers[index]]
      }
    },
    duplicateLayer: (state, action: PayloadAction<string>) => {
      const layerToDuplicate = state.layers.find((l) => l.id === action.payload)
      if (!layerToDuplicate) return

      const newLayer: Layer = {
        ...layerToDuplicate,
        id: `layer-${Date.now()}`,
        name: `${layerToDuplicate.name} copy`,
        x: layerToDuplicate.x + 10,
        y: layerToDuplicate.y + 10,
      }
      state.layers.push(newLayer)
      state.selectedLayerId = newLayer.id
    },
    setSelectedLayer: (state, action: PayloadAction<string | null>) => {
      state.selectedLayerId = action.payload
    },
    setCropLayer: (state, action: PayloadAction<string | null>) => {
      state.cropLayerId = action.payload
    },
    setStageRef: (state, action: PayloadAction<{ current: any }>) => {
      state.stageRef = action.payload
    },
    saveDesign: (state) => {
        if (!state.baseImage) return
        const newDesign: Design = {
            id: `design-${Date.now()}`,
            name: `Design - ${new Date().toLocaleDateString()}`,
            createdAt: new Date().toISOString(),
            baseImage: state.baseImage,
            layers: state.layers,
        }
        state.designs.push(newDesign)
    },
    loadDesign: (state, action: PayloadAction<string>) => {
        const design = state.designs.find(d => d.id === action.payload)
        if (design) {
            state.baseImage = design.baseImage
            state.layers = design.layers
            state.selectedLayerId = null
        }
    },
    deleteDesign: (state, action: PayloadAction<string>) => {
        state.designs = state.designs.filter(d => d.id !== action.payload)
    },
  },
})

export const {
  setBaseImage,
  addLayer,
  deleteLayer,
  updateLayer,
  toggleLayerVisibility,
  reorderLayers,
  duplicateLayer,
  setSelectedLayer,
  setCropLayer,
  setStageRef,
  saveDesign,
  loadDesign,
  deleteDesign,
} = editorSlice.actions

export default editorSlice.reducer