"use client"

import React, { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Transformer, Rect, Text } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from 'konva/lib/Node';
import type { Layer as AppLayer } from '@/lib/types';

// Custom hook to load an image with loading and error states
function useHTMLImage(src: string | undefined | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    const image = new window.Image();
    image.crossOrigin = 'anonymous'; // Important for images served from a different origin than the app

    image.onload = () => {
      setIsLoading(false);
      setImg(image);
    };
    image.onerror = () => {
      setIsLoading(false);
      setError("Failed to load image.");
      console.error("Image load error:", src);
    };
    image.src = src;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  return [img, isLoading, error] as const;
}

export type LayerType = AppLayer & {
  flipX?: boolean;
  flipY?: boolean;
  asset?: { url: string } | null;
  src?: string | null;
};

interface LayerImageProps {
  layer: LayerType;
  isSelected: boolean;
  cropMode: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<LayerType>) => void;
}

export function LayerImage({ layer, isSelected, onSelect, onChange, cropMode }: LayerImageProps) {
  const [img, isLoading, error] = useHTMLImage(layer.asset?.url ?? layer.src);
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && !cropMode && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, cropMode]);

  // Hide layer if visibility is false
  if (!layer.visible) {
    return null;
  }

  // ... (placeholder for loading/error states) ...

  return (
    <>
      {img && (
        <KonvaImage
          ref={shapeRef}
          image={img}
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          rotation={layer.rotation}
          draggable={!cropMode}
          scaleX={layer.flipX ? -1 : 1}
          scaleY={layer.flipY ? -1 : 1}
          // Apply crop properties directly to Konva Image
          cropX={layer.cropX ?? 0}
          cropY={layer.cropY ?? 0}
          cropWidth={layer.cropW ?? img.width}
          cropHeight={layer.cropH ?? img.height}
          // ... (event handlers and other props remain the same)
        />
      )}
      {isSelected && !cropMode && (
        <Transformer
          ref={trRef}
          // ... (transformer props)
        />
      )}
    </>
  );
}