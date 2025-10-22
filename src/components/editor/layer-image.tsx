import React, { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from 'konva/lib/Node';
import type { Layer as AppLayer } from '@/lib/types';
import { Rect, Text } from 'react-konva';

// Enhanced image loader hook with error handling and loading state
function useHTMLImage(src: string | undefined | null) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setImg(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const i = new window.Image();
    
    // Handle CORS properly
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      i.crossOrigin = null; // Don't set crossOrigin for data/blob URLs
    } else {
      i.crossOrigin = 'anonymous';
    }

    const onLoad = () => {
      setImg(i);
      setIsLoading(false);
      setError(null);
    };

    const onError = (e: ErrorEvent) => {
      console.error('Image load error for URL', src, e);
      setError('Failed to load image');
      setIsLoading(false);
      setImg(null);
    };

    i.addEventListener('load', onLoad);
    i.addEventListener('error', onError);

    // Set src after attaching event listeners
    try {
      console.debug('Attempting to load image URL:', src)
      if (src.startsWith('http') || src.startsWith('https')) {
        i.src = src;
      } else if (src.startsWith('data:') || src.startsWith('blob:')) {
        i.src = src;
      } else {
        // For relative URLs, make them absolute
        const absoluteUrl = new URL(src, window.location.origin);
        i.src = absoluteUrl.toString();
      }
    } catch (err) {
      console.error('Invalid URL:', src, err);
      setError('Invalid image URL');
      setIsLoading(false);
    }

    return () => {
      i.removeEventListener('load', onLoad);
      i.removeEventListener('error', onError);
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(i.src);
      }
    };
  }, [src]);

  return [img, isLoading, error] as const;
}

// Layer type definition (exported so other modules import a single canonical type)
// Re-export a LayerType that's compatible with the app's Layer type
export type LayerType = AppLayer & {
  // optional fields used by the editor UI
  flipX?: boolean;
  flipY?: boolean;
  asset?: { url: string } | null;
  src?: string | null;
};

// Component props interface
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
  const [loadRetries, setLoadRetries] = useState(0);

  // Retry loading on error with exponential backoff
  useEffect(() => {
    if (error && loadRetries < 3) {
      const timer = setTimeout(() => {
        setLoadRetries(prev => prev + 1);
      }, 1000 * Math.pow(2, loadRetries));
      return () => clearTimeout(timer);
    }
  }, [error, loadRetries]);

  // Configure transformer on selection
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      try {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } catch (err) {
        console.error('Error configuring transformer:', err);
      }
    }
  }, [isSelected]);

  if (!img && !isLoading && !error) {
    return null;
  }

  return (
    <>
      {img ? (
        <KonvaImage
          image={img}
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          rotation={layer.rotation}
          scaleX={layer.flipX ? -1 : 1}
          scaleY={layer.flipY ? -1 : 1}
          draggable={!cropMode}
          opacity={isLoading ? 0.5 : 1}
          stroke={error ? "#ef5350" : isLoading ? "#bdbdbd" : "transparent"}
          strokeWidth={error || isLoading ? 2 : 0}
          shadowEnabled={isSelected}
          shadowBlur={10}
          shadowColor="rgba(0,0,0,0.3)"
          shadowOffset={{ x: 0, y: 3 }}
          onClick={onSelect}
          onTap={onSelect}
          ref={shapeRef}
          onDragEnd={(e: KonvaEventObject<DragEvent>) => {
            const target = e.target as Konva.Image;
            onChange({
              x: Math.round(target.x()),
              y: Math.round(target.y())
            });
          }}
          onTransformEnd={(_: KonvaEventObject<Event>) => {
            const node = shapeRef.current;
            if (!node) return;

            try {
              // node.scaleX/Y includes both flip and transform scale. Use sign to detect final flip state
              const rawScaleX = node.scaleX();
              const rawScaleY = node.scaleY();
              const absScaleX = Math.abs(rawScaleX);
              const absScaleY = Math.abs(rawScaleY);

              // Determine final flip state: if the resulting scale is negative, it's flipped
              const newFlipX = rawScaleX < 0;
              const newFlipY = rawScaleY < 0;

              // Reset visual scale to 1 to keep the node's width/height as the source of truth
              node.scaleX(1);
              node.scaleY(1);

              onChange({
                x: Math.round(node.x()),
                y: Math.round(node.y()),
                width: Math.max(5, Math.round(node.width() * absScaleX)),
                height: Math.max(5, Math.round(node.height() * absScaleY)),
                rotation: node.rotation(),
                flipX: newFlipX,
                flipY: newFlipY,
              });
            } catch (error) {
              console.error('Transform error:', error);
            }
          }}
        />
      ) : (
        // Placeholder box when no image available
        <>
          <Rect
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            fill="#f3f4f6"
            stroke="#e5e7eb"
            strokeWidth={1}
            onClick={onSelect}
            onTap={onSelect}
            draggable={!cropMode}
            ref={shapeRef}
            shadowEnabled={isSelected}
            shadowBlur={10}
            shadowColor="rgba(0,0,0,0.2)"
            shadowOffset={{ x: 0, y: 2 }}
            onDragEnd={(e: KonvaEventObject<DragEvent>) => {
              const target = e.target as Konva.Rect;
              onChange({ x: Math.round(target.x()), y: Math.round(target.y()) })
            }}
          />
          <Text text={"No image"} x={layer.x + 8} y={layer.y + 8} fontSize={12} fill="#9ca3af" />
        </>
      )}
      {isSelected && !cropMode && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          boundBoxFunc={(oldBox, newBox) => {
            return newBox.width < 5 || newBox.height < 5 ? oldBox : newBox;
          }}
          padding={8}
          keepRatio={false}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      )}
    </>
  );
}