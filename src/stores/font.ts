import { getBit, setBit } from '@/utils/bit'
import { downloadFile } from '@/utils/file'
import { parseFont, serializeFont, type GfxGlyph } from '@/utils/font'
import {
  cropPixels,
  getBounds,
  packPixel,
  pixelIsCropped,
  translatePixels,
  unpackPixel,
} from '@/utils/pixel'
import { useEventListener } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, nextTick, readonly, ref, watch } from 'vue'

export type Glyph = {
  pixels: Set<number>
  bounds: {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
  }
  bearing: { left: number; right: number }
}

const getGlyphUrlParam = () => {
  const { hash } = window.location
  if (!hash.startsWith('#/glyph/')) return
  const param = hash.split('/').at(-1)
  return param ? +param : undefined
}

export const useFont = defineStore('font', () => {
  const name = ref('New Font')
  const glyphs = ref(new Map<number, Glyph>())
  const lineHeight = ref(10)
  const canvas = ref({ width: 16, height: 16 })
  const baseline = ref(5)
  const activeGlyphCode = ref(getGlyphUrlParam())
  const moveGlyphsWithBaseline = ref(true)

  watch(
    () => canvas.value.width,
    (canvasWidth) => {
      for (const [_, glyph] of glyphs.value) {
        const { left, width } = getBounds(glyph.pixels)
        const newLeft = Math.round((canvasWidth - width) / 2)
        glyph.pixels = translatePixels(glyph.pixels, newLeft - left, 0)
        glyph.bounds = getBounds(glyph.pixels)
      }
    },
  )

  watch(baseline, (newBaseline, oldBaseline) => {
    if (!moveGlyphsWithBaseline.value) return
    const delta = newBaseline - oldBaseline
    for (const [_, glyph] of glyphs.value) {
      glyph.pixels = translatePixels(glyph.pixels, 0, delta)
      glyph.bounds = getBounds(glyph.pixels)
    }
  })

  useEventListener(
    window,
    'hashchange',
    () => (activeGlyphCode.value = getGlyphUrlParam()),
  )

  const addGlyph = (code: number, data: Partial<Glyph> = {}) => {
    const { pixels = new Set(), bearing = { left: 0, right: 0 } } = data
    glyphs.value.set(code, { pixels, bearing, bounds: getBounds(pixels) })
  }

  const setGlyphPixel = (code: number, pixel: number, value: boolean) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    if (value) glyph.pixels.add(pixel)
    else glyph.pixels.delete(pixel)

    glyph.bounds = getBounds(glyph.pixels)
  }

  const load = async (code: string) => {
    glyphs.value.clear()
    const font = parseFont(code)
    let charCode = font.asciiStart

    name.value = font.name
    lineHeight.value = font.yAdvance
    canvas.value = { width: font.yAdvance, height: font.yAdvance }
    baseline.value = 20
    // Setting the canvas size and baseline will trigger watchers, so we wait
    // for the next tick and continue when the watchers have finished.
    await nextTick()

    for (const glyph of font.glyphs) {
      const pixels = new Set<number>()
      const left = Math.floor((canvas.value.width - glyph.width) / 2)

      for (let y = 0; y < glyph.height; y++) {
        for (let x = 0; x < glyph.width; x++) {
          const i = y * glyph.width + x
          const byteIndex = Math.floor(i / 8)
          const bitIndex = 7 - (i % 8)
          const bit = getBit(font.bytes, glyph.byteOffset + byteIndex, bitIndex)

          if (bit) {
            const canvasX = x + left
            const canvasY = y + (baseline.value - 1 + glyph.deltaY)
            const pixel = packPixel(canvasX, canvasY)
            pixels.add(pixel)
          }
        }
      }

      const bearing = {
        left: glyph.deltaX,
        right: glyph.xAdvance - glyph.width - glyph.deltaX,
      }
      addGlyph(charCode++, { pixels, bearing })
    }
  }

  const save = () => {
    const { width: canvasWidth, height: canvasHeight } = canvas.value

    const croppedGlyphs = new Map(
      Array.from(glyphs.value.entries()).map(([code, glyph]) => {
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
        deltaY: bounds.top - (baseline.value - 1),
      })

      if (bounds.width && bounds.height) byteOffset += byteIndex + 1
    }

    downloadFile(
      `${name.value}.h`,
      serializeFont({
        name: name.value,
        bytes,
        glyphs: gfxGlyphs,
        asciiStart,
        asciiEnd,
        yAdvance: lineHeight.value,
      }),
    )
  }

  return {
    name,
    glyphs,
    activeGlyphCode,
    lineHeight,
    baseline,
    moveGlyphsWithBaseline,
    canvas,
    addGlyph,
    setGlyphPixel,
    load,
    save,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
