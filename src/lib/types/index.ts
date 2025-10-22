export interface AssetRef {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}

export interface Layer {
  id: string;
  name?: string;
  type?: string;
  designId?: string;
  assetId?: string | null;
  asset?: AssetRef | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
  flipped?: boolean; // legacy prop used in some local-only layers
  opacity: number;
  zIndex?: number;
  cropX?: number | null;
  cropY?: number | null;
  cropW?: number | null;
  cropH?: number | null;
  visible: boolean;
  locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Design {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  width: number;
  height: number;
  thumbnail?: string | null;
  layers: Layer[];
}