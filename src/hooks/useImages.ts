import { useCallback, useEffect, useState } from "react";

export type AssetDTO = {
  id: string;
  originalName: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  url: string;
  sha256?: string | null;
  createdAt: string;
};

export default function useImages() {
  const [images, setImages] = useState<AssetDTO[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/images");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const createImage = async (payload: Partial<AssetDTO>) => {
    const res = await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Failed to create image");
    const created = await res.json();
    setImages((prev) => (prev ? [created, ...prev] : [created]));
    return created;
  };

  const deleteImage = async (id: string) => {
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete image");
    setImages((prev) => prev?.filter((i) => i.id !== id) ?? null);
    return true;
  };

  return { images, loading, error, fetchImages, createImage, deleteImage };
}
