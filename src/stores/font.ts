import { getBit } from '@/utils/getBit'
import { parseFont } from '@/utils/parseFont'
import { packPixel, unpackPixel } from '@/utils/pixel'
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
  const canvasWidth = ref(20)
  const canvasHeight = ref(20)
  const baseline = ref(5)
  const activeGlyphCode = ref(getGlyphUrlParam())
  const moveGlyphsWithBaseline = ref(true)

  const translateGlyph = (
    glyph: Glyph,
    translateX: number,
    translateY: number,
  ) => {
    const newPixels = new Set<number>()
    for (const pixel of glyph.pixels) {
      const { x, y } = unpackPixel(pixel)
      newPixels.add(packPixel(x + translateX, y + translateY))
    }
    glyph.pixels = newPixels
    glyph.bounds = getGlyphBounds(glyph)
  }

  watch(canvasWidth, () => {
    for (const [_, glyph] of glyphs.value) {
      const { left, width } = getGlyphBounds(glyph)
      const newLeft = Math.round((canvasWidth.value - width) / 2)
      translateGlyph(glyph, newLeft - left, 0)
    }
  })

  watch(baseline, (newBaseline, oldBaseline) => {
    if (!moveGlyphsWithBaseline.value) return
    const delta = newBaseline - oldBaseline
    for (const [_, glyph] of glyphs.value) translateGlyph(glyph, 0, delta)
  })

  useEventListener(
    window,
    'hashchange',
    () => (activeGlyphCode.value = getGlyphUrlParam()),
  )

  const getGlyphBounds = ({ pixels }: Pick<Glyph, 'pixels'>) => {
    let left = canvasWidth.value
    let top = canvasHeight.value
    let right = 0
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
    const bounds = getGlyphBounds({ pixels })
    glyphs.value.set(code, { pixels, bearing, bounds })
  }

  const setGlyphPixel = (code: number, pixel: number, value: boolean) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    if (value) glyph.pixels.add(pixel)
    else glyph.pixels.delete(pixel)

    glyph.bounds = getGlyphBounds(glyph)
  }

  const load = async (code: string) => {
    glyphs.value.clear()
    const font = parseFont(code)
    let charCode = font.asciiStart

    name.value = font.name
    lineHeight.value = font.yAdvance
    canvasWidth.value = font.yAdvance
    canvasHeight.value = font.yAdvance
    baseline.value = 20
    // Setting the canvas size and baseline will trigger watchers, so we wait
    // for the next tick and continue when the watchers have finished.
    await nextTick()

    for (const glyph of font.glyphs) {
      const pixels = new Set<number>()
      const left = Math.floor((canvasWidth.value - glyph.width) / 2)

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

  return {
    name,
    glyphs,
    activeGlyphCode,
    lineHeight,
    baseline,
    moveGlyphsWithBaseline,
    canvasWidth,
    canvasHeight,
    addGlyph,
    setGlyphPixel,
    load,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
