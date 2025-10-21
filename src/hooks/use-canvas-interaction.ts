import { useDispatch } from "react-redux"
import { updateLayer } from "@/lib/store/editorSlice"
import { AppDispatch } from "@/lib/store/store"

export function useCanvasInteraction() {
  const dispatch = useDispatch<AppDispatch>()

  const handleLayerDrag = (layerId: string, e: any) => {
    const node = e.target
    dispatch(updateLayer({ id: layerId, updates: { x: node.x(), y: node.y() } }))
    // don't attempt to persist if this is a local-only synthetic id
    if (layerId === 'base-image' || layerId.startsWith('layer-')) return
  }

  const handleLayerTransform = (layerId: string, e: any) => {
    const node = e.target
    dispatch(updateLayer({ id: layerId, updates: { x: node.x(), y: node.y(), width: node.width() * node.scaleX(), height: node.height() * node.scaleY(), rotation: node.rotation() } }))
    // avoid server calls for local synthetic layers
    if (layerId === 'base-image' || layerId.startsWith('layer-')) return
  }

  return {
    handleLayerDrag,
    handleLayerTransform,
  }
}
