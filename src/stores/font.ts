import { getBit } from '@/utils/getBit'
import { parseFont } from '@/utils/parseFont'
import { packPixel, unpackPixel } from '@/utils/pixel'
import { useEventListener } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, readonly, ref, watch } from 'vue'

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
  const glyphs = ref(new Map<number, Glyph>())
  const height = ref(10)
  const width = computed(() => height.value)
  const baseline = ref(5)
  const activeGlyphCode = ref(getGlyphUrlParam())

  useEventListener(
    window,
    'hashchange',
    () => (activeGlyphCode.value = getGlyphUrlParam()),
  )

  const getGlyphBounds = (pixels: Set<number>) => {
    let left = width.value
    let right = 0
    let top = width.value
    let bottom = 0

    if (!pixels.size) return { left, right, top, bottom, width: 0, height: 0 }

    for (const pixel of pixels) {
      const { x, y } = unpackPixel(pixel)
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }

    return {
      left,
      right,
      top,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1,
    }
  }

  const addGlyph = (code: number, data: Partial<Glyph> = {}) => {
    const { pixels = new Set(), bearing = { left: 0, right: 0 } } = data
    const bounds = getGlyphBounds(pixels)
    glyphs.value.set(code, { pixels, bearing, bounds })
  }

  const setGlyphPixel = (code: number, pixel: number, value: boolean) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    if (value) glyph.pixels.add(pixel)
    else glyph.pixels.delete(pixel)

    glyph.bounds = getGlyphBounds(glyph.pixels)
  }

  const load = (code: string) => {
    glyphs.value.clear()
    const font = parseFont(code)
    let charCode = font.asciiStart

    baseline.value = 20
    height.value = font.yAdvance

    for (const glyph of font.glyphs) {
      const pixels = new Set<number>()
      // Center the glyph in the cell.
      const offset = Math.round((width.value - glyph.width) / 2)

      for (let y = 0; y < glyph.height; y++) {
        for (let x = 0; x < glyph.width; x++) {
          const i = y * glyph.width + x
          const byteIndex = Math.floor(i / 8)
          const bitIndex = 7 - (i % 8)
          const bit = getBit(font.bytes, glyph.byteOffset + byteIndex, bitIndex)

          if (bit) {
            const canvasX = x + offset
            const canvasY = y + (baseline.value + glyph.deltaY)
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

  return {
    glyphs,
    activeGlyphCode,
    height,
    baseline,
    addGlyph,
    setGlyphPixel,
    load,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
