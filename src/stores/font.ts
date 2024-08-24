import { getBit, setBit } from '@/utils/bit'
import { downloadFile } from '@/utils/file'
import { parseFont, serializeFont, type GfxGlyph } from '@/utils/font'
import {
  cropPixels,
  getBounds,
  packPixel,
  translatePixels,
  unpackPixel,
  type Pixels,
} from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, nextTick, readonly, ref, watch } from 'vue'

export type Glyph = {
  code: number
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
  guide: { enabled: boolean }
}

export const useFont = defineStore('font', () => {
  const name = ref('New Font')
  const glyphs = ref(new Map<number, Glyph>())
  const lineHeight = ref(10)
  const canvas = ref({ width: 16, height: 16 })
  const baseline = ref(12)
  const metrics = ref({
    ascender: undefined,
    capHeight: undefined,
    xHeight: undefined,
    descender: undefined,
  })
  const activeGlyphCode = ref<number | undefined>()
  const activeGlyph = computed(() => {
    const code = activeGlyphCode.value
    return code ? glyphs.value.get(code) : undefined
  })
  const moveGlyphsWithBaseline = ref(true)
  const basedOn = ref({ name: 'Vevey Positive', size: 12, guides: true })

  const maxHistoryStack = 50
  const glyphHistory = new Map<number, { stack: Pixels[]; index: number }>()

  const undo = () => {
    if (!activeGlyphCode.value) return

    const history = glyphHistory.get(activeGlyphCode.value)
    if (!history || !history.stack.length || history.index < 1) return

    const activeGlyph = glyphs.value.get(activeGlyphCode.value)
    if (!activeGlyph) return

    history.index--
    activeGlyph.pixels = new Set(history.stack.at(history.index))
    activeGlyph.bounds = getBounds(activeGlyph.pixels)
  }

  const redo = () => {
    if (!activeGlyphCode.value) return
    const history = glyphHistory.get(activeGlyphCode.value)
    if (!history || history.index >= history.stack.length - 1) return

    const activeGlyph = glyphs.value.get(activeGlyphCode.value)
    if (!activeGlyph) return

    history.index++
    activeGlyph.pixels = new Set(history.stack.at(history.index))
    activeGlyph.bounds = getBounds(activeGlyph.pixels)
  }

  const addHistoryEntry = (code = activeGlyphCode.value) => {
    if (code === undefined) return
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    const history = glyphHistory.get(code)
    if (!history) return

    // We undo-ed into history and because we start a new future we have to
    // delete the existing future stack.
    if (history.index < history.stack.length - 1) {
      history.stack.splice(history.index + 1)
    }

    history.stack.push(new Set(glyph.pixels))
    if (history.stack.length > maxHistoryStack) history.stack.shift()
    history.index = history.stack.length - 1
  }

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

  const addGlyph = (code: number, data: Partial<Glyph> = {}) => {
    const { pixels = new Set(), bearing = { left: 0, right: 0 } } = data
    glyphs.value.set(code, {
      code,
      pixels,
      bearing,
      bounds: getBounds(pixels),
      guide: { enabled: true },
    })
    glyphHistory.set(code, { index: 0, stack: [] })
  }

  const removeGlyph = (code: number) => {
    glyphs.value.delete(code)
    glyphHistory.delete(code)
  }

  const setGlyphPixel = (code: number, pixel: number, value: boolean) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    // Break if the pixel already has the specified value.
    if (value && glyph.pixels.has(pixel)) return
    if (!value && !glyph.pixels.has(pixel)) return

    if (value) glyph.pixels.add(pixel)
    else glyph.pixels.delete(pixel)

    glyph.bounds = getBounds(glyph.pixels)
  }

  const clearGlyph = (code: number) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    glyph.pixels.clear()
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
      addGlyph(charCode, { pixels, bearing })
      addHistoryEntry(charCode)
      charCode++
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
    activeGlyph,
    lineHeight,
    baseline,
    metrics,
    basedOn,
    moveGlyphsWithBaseline,
    canvas,
    addGlyph,
    removeGlyph,
    setGlyphPixel,
    clearGlyph,
    addHistoryEntry,
    load,
    save,
    undo,
    redo,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
