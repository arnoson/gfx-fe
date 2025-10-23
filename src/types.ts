import type { Component, Ref } from 'vue'
import {
  boolean,
  number,
  object,
  optional,
  parse,
  string,
  type InferOutput,
} from 'valibot'

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
  version: number
}

export type Metrics = {
  ascender?: number
  capHeight?: number
  xHeight?: number
  descender?: number
}

export type Size = { width: number; height: number }

export type ToolContext = {
  glyph: Ref<Glyph>
}

export type ToolConfig = {
  pointRounding?: 'floor' | 'round' | 'ceil'
}

export interface Tool {
  id: string
  icon: Component | string
  shortcut?: string
  pointRounding?: 'floor' | 'round' | 'ceil'
  onMouseDown?: (point: Point) => unknown
  onMouseMove?: (point: Point) => unknown
  onMouseUp?: (point: Point) => unknown
  onKeyDown?: (e: KeyboardEvent) => unknown
  activate?: (prevToolId: string) => void
  deactivate?: () => void
}

export type Point = {
  x: number
  y: number
}

export const SettingsSchema = object({
  canvas: optional(object({ width: number(), height: number() })),
  baseline: optional(number()),
  metrics: optional(
    object({
      ascender: optional(number()),
      capHeight: optional(number()),
      xHeight: optional(number()),
      descender: optional(number()),
    }),
  ),
  basedOn: optional(
    object({
      name: string(),
      size: number(),
      guides: boolean(),
      threshold: number(),
    }),
  ),
})

export type Settings = InferOutput<typeof SettingsSchema>
