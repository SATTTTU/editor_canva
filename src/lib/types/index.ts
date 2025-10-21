export interface Layer {
  id: string
  name: string
  src: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipped: boolean // Can be horizontal, vertical, or none
  visible: boolean
}

export interface Design {
  id: string
  name: string
  createdAt: string
  baseImage: Layer
  layers: Layer[]
}