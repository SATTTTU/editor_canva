"use client"

import React, { useEffect, useRef, useState } from "react"
import { Image as KonvaImage, Transformer } from "react-konva"
import Konva from "konva"
import { KonvaEventObject } from "konva/lib/Node"

// Define the type for a single layer
export type LayerType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  asset?: { url: string };
  src?: string; // Allow src for base images
};

// Define the props for the LayerImage component
interface LayerImageProps {
  layer: LayerType;
  isSelected: boolean;
  cropMode: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<LayerType>) => void;
}

// Custom hook to load an HTMLImageElement with loading and error states
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
    image.crossOrigin = 'anonymous'; // Enable cross-origin loading for remote images

    const handleLoad = () => {
      setIsLoading(false);
      setImg(image);
    };

    const handleError = () => {
      setIsLoading(false);
      setError("Failed to load image.");
      console.error("Image load error:", src);
    };

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    image.src = src;

    return () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [src]);

  return [img, isLoading, error] as const;
}

export function LayerImage({ layer, isSelected, cropMode, onSelect, onChange }: LayerImageProps) {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [img, isLoading, error] = useHTMLImage(layer.asset?.url ?? layer.src);

  useEffect(() => {
    if (isSelected && !cropMode && trRef.current && shapeRef.current) {
      // Attach transformer to the selected image
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, cropMode]);

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
          // Apply flips using scale
          scaleX={layer.flipX ? -1 : 1}
          scaleY={layer.flipY ? -1 : 1}
          // Visual feedback
          opacity={isLoading ? 0.6 : 1}
          stroke={error ? "red" : undefined}
          strokeWidth={error ? 2 : 0}
          shadowEnabled={isSelected}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.5)"
          // Event handlers
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e: KonvaEventObject<DragEvent>) => {
            onChange({ x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={() => {
            const node = shapeRef.current;
            if (!node) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1); // Reset scale to avoid distortion
            node.scaleY(1);

            onChange({
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              rotation: node.rotation(),
            });
          }}
        />
      )}
      {isSelected && !cropMode && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Set a minimum size for the layer
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          keepRatio={false}
        />
      )}
    </>
  );
}