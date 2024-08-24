export type Bounds = {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export type Glyph = {
  code: number
  pixels: Set<number>
  bounds: Bounds
  bearing: { left: number; right: number }
  guide: { enabled: boolean }
}

export type Metrics = {
  ascender?: number
  capHeight?: number
  xHeight?: number
  descender?: number
}

export type Size = { width: number; height: number }
