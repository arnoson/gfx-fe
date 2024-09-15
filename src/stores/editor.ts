import type { Glyph, Point } from '@/types'
import { getBit, setBit } from '@/utils/bit'
import { downloadFile } from '@/utils/file'
import { parseFont, serializeFont, type GfxGlyph } from '@/utils/font'
import { cropPixels, getBounds, packPixel, type Pixels } from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { effect, markRaw, nextTick, ref } from 'vue'
import { useFont } from './font'
import {
  boolean,
  number,
  object,
  optional,
  parse,
  string,
  type InferOutput,
} from 'valibot'

const SettingsSchema = object({
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

type Settings = InferOutput<typeof SettingsSchema>

type Selection = { pixels: Pixels; polygon: Point[] }

// An offscreen HTML canvas that we use to render stuff in.
export const offscreenCanvas = document.createElement('canvas')
export const offscreenCanvasCtx = offscreenCanvas.getContext('2d', {
  willReadFrequently: true,
})!

export const useEditor = defineStore(
  'editor',
  () => {
    const font = useFont()

    const activeToolName = ref<'draw' | 'select'>('draw')
    const canvas = ref({
      width: 20,
      height: 20,
    })

    effect(() => {
      offscreenCanvas.width = canvas.value.width
      offscreenCanvas.height = canvas.value.height
    })

    const selectionClipboard = ref<Selection>()

    const parseSettings = (code: string) => {
      const match = code.match(/\* Editor Settings: (\{.+\})/)
      return match ? parse(SettingsSchema, JSON.parse(match[1])) : {}
    }

    const serializeSettings = () => {
      const settings: Settings = {
        canvas: { width: canvas.value.width, height: canvas.value.height },
        metrics: font.metrics,
        baseline: font.baseline,
        basedOn: font.basedOn,
      }
      return JSON.stringify(settings)
    }

    const load = async (code: string) => {
      font.glyphs.clear()
      const gfxFont = parseFont(code)
      let charCode = gfxFont.asciiStart

      const settings = parseSettings(code)

      font.name = gfxFont.name
      font.lineHeight = gfxFont.yAdvance
      font.baseline = settings.baseline ?? Math.round(font.lineHeight * 0.66)
      font.metrics = settings.metrics ?? {}
      canvas.value.width = settings.canvas?.width ?? gfxFont.yAdvance
      canvas.value.height = settings.canvas?.height ?? gfxFont.yAdvance
      // Setting the canvas size and baseline will trigger watchers, so we wait
      // for the next tick and continue when the watchers have finished.
      await nextTick()

      for (const glyph of gfxFont.glyphs) {
        const pixels = new Set<number>()
        const left = Math.floor((canvas.value.width - glyph.width) / 2)

        for (let y = 0; y < glyph.height; y++) {
          for (let x = 0; x < glyph.width; x++) {
            const i = y * glyph.width + x
            const byteIndex = Math.floor(i / 8)
            const bitIndex = 7 - (i % 8)
            const bit = getBit(
              gfxFont.bytes,
              glyph.byteOffset + byteIndex,
              bitIndex,
            )

            if (bit) {
              const canvasX = x + left
              const canvasY = y + (font.baseline - 1 + glyph.deltaY)
              const pixel = packPixel(canvasX, canvasY)
              pixels.add(pixel)
            }
          }
        }

        const bearing = {
          left: glyph.deltaX,
          right: glyph.xAdvance - glyph.width - glyph.deltaX,
        }
        font.addGlyph({ code: charCode, pixels, bearing })
        charCode++
      }
    }

    const save = () => {
      const { width: canvasWidth, height: canvasHeight } = canvas.value

      const croppedGlyphs = new Map(
        Array.from(font.glyphs.entries()).map(([code, glyph]) => {
          const pixels = cropPixels(glyph.pixels, canvasWidth, canvasHeight)
          const bounds = getBounds(pixels)
          const croppedGlyph: Glyph = { ...glyph, pixels, bounds }
          return [code, croppedGlyph]
        }),
      )

      const charCodes = Array.from(croppedGlyphs.keys())
      const asciiStart = Math.min(...charCodes)
      const asciiEnd = Math.max(...charCodes)

      let bytesCount = 0
      for (const [_, { bounds }] of croppedGlyphs) {
        bytesCount += Math.ceil((bounds.width * bounds.height) / 8)
      }

      const gfxGlyphs: GfxGlyph[] = []
      const bytes = new Uint8Array(bytesCount)
      let byteOffset = 0
      for (const [_, glyph] of croppedGlyphs) {
        const { bounds, bearing } = glyph

        let byteIndex = 0
        let bitIndex = 7

        for (let y = 0; y < bounds.height; y++) {
          for (let x = 0; x < bounds.width; x++) {
            const canvasX = x + bounds.left
            const canvasY = y + bounds.top

            const pixel = packPixel(canvasX, canvasY)
            // We use a positive value to indicate a filled (white) pixel, but
            // GFXFont seems to do it the other way round.
            const value = !glyph.pixels.has(pixel)

            if (bitIndex < 0) {
              byteIndex++
              bitIndex = 7
            }

            setBit(bytes, byteOffset + byteIndex, bitIndex, value)
            bitIndex--
          }
        }

        gfxGlyphs.push({
          byteOffset,
          width: bounds.width,
          height: bounds.height,
          xAdvance: bounds.width + bearing.left + bearing.right,
          deltaX: bearing.left,
          deltaY: bounds.top - (font.baseline - 1),
        })

        if (bounds.width && bounds.height) byteOffset += byteIndex + 1
      }

      let code = `/**
 * Created with gfx-fe (github.com/arnoson/gfx-fe): a web based editor for gfx fonts.
 * Editor Settings: ${serializeSettings()}
 */\n\n`
      code += serializeFont({
        name: font.name,
        bytes,
        glyphs: gfxGlyphs,
        asciiStart,
        asciiEnd,
        yAdvance: font.lineHeight,
      })

      downloadFile(`${font.name}.h`, code)
    }

    return { activeToolName, canvas, selectionClipboard, load, save }
  },
  { persist: true },
)

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useEditor, import.meta.hot))
