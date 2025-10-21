import { useEffect, useState, useCallback } from "react";

export type LayerDTO = {
  id: string;
  type: string;
  designId: string;
  assetId?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  opacity: number;
  zIndex: number;
  cropX?: number | null;
  cropY?: number | null;
  cropW?: number | null;
  cropH?: number | null;
  visible: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    url: string;
    originalName: string;
    mimeType: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

export default function useLayers(designId?: string) {
  const [layers, setLayers] = useState<LayerDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/layers");
      if (!res.ok) throw new Error("Failed to fetch layers");
      const data = await res.json();
      const forDesign = designId ? data.filter((d: any) => d.designId === designId) : data;
      setLayers(forDesign);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [designId]);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  const createLayer = async (payload: Partial<LayerDTO>) => {
    const res = await fetch("/api/layers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const text = await res.text();
    if (!res.ok) {
      console.error('createLayer failed', res.status, text);
      throw new Error(`Failed to create layer: ${res.status} ${text}`);
    }
    const created = JSON.parse(text);
    setLayers((prev) => (prev ? [created, ...prev] : [created]));
    return created;
  };

  const updateLayer = async (id: string, payload: Partial<LayerDTO>) => {
    // Protect against accidental persistence attempts for local-only synthetic ids
    if (id === 'base-image' || id.startsWith('layer-')) {
      console.warn('useLayers.updateLayer: skipping network update for local-only id', id)
      // Apply local-only change by mutating state without calling backend
      setLayers((prev) => prev?.map((l) => (l.id === id ? { ...l, ...payload } as LayerDTO : l)) ?? null)
      // Return a resolved value similar to the API response shape
      return { id, ...(payload as any) } as LayerDTO
    }
    const res = await fetch(`/api/layers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const text = await res.text();
    if (!res.ok) {
      console.error('updateLayer failed', id, res.status, text);
      throw new Error(`Failed to update layer: ${res.status} ${text}`);
    }
    const updated = JSON.parse(text);
    setLayers((prev) => prev?.map((l) => (l.id === id ? updated : l)) ?? null);
    return updated;
  };

  const deleteLayer = async (id: string) => {
    const res = await fetch(`/api/layers/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete layer");
    setLayers((prev) => prev?.filter((l) => l.id !== id) ?? null);
    return true;
  };

  return { layers, loading, error, fetchLayers, createLayer, updateLayer, deleteLayer };
}
