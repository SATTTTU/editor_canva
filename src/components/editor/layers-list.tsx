"use client";

import React from "react";
import useLayers from "@/hooks/useLayers";
import useImages from "@/hooks/useImages";

type Props = {
  designId?: string;
};

export default function LayersList({ designId }: Props) {
  const { layers, loading, error, updateLayer, deleteLayer } = useLayers(designId);
  const { images } = useImages();

  if (loading) return <div className="p-4">Loading layers…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!layers || layers.length === 0) return <div className="p-4 text-muted">No layers</div>;

  return (
    <div className="space-y-2 p-2">
      {layers
        .slice()
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer) => (
          <div key={layer.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
            <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {layer.asset?.url ? (
                <img src={layer.asset.url} alt={layer.asset.originalName} className="max-w-full max-h-full" />
              ) : (
                <div className="text-xs text-gray-500">No preview</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{layer.asset?.originalName ?? layer.type}</div>
              <div className="text-xs text-gray-500">{layer.width}×{layer.height}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                title={layer.visible ? "Hide" : "Show"}
                className={`px-2 py-1 rounded ${layer.visible ? "bg-primary/10" : "bg-muted"}`}
                onClick={async () => {
                  // Local toggle first (UI)
                  try {
                    // If this is a synthetic local-only id, avoid server call
                    if (layer.id === 'base-image' || layer.id.startsWith('layer-')) {
                      // call updateLayer to update local state via hook's setLayers behavior
                      await updateLayer(layer.id, { visible: !layer.visible })
                    } else {
                      await updateLayer(layer.id, { visible: !layer.visible })
                    }
                  } catch (err) {
                    console.warn('Toggle visibility failed', err)
                  }
                }}
              >
                {layer.visible ? "👁️" : "🚫"}
              </button>

              <button
                title="Delete"
                className="px-2 py-1 rounded bg-rose-50 text-rose-600"
                onClick={async () => {
                  /* eslint-disable no-restricted-globals */
                  if (!confirm("Delete layer?")) return;
                  await deleteLayer(layer.id);
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
