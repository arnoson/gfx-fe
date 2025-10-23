import {
  SettingsSchema,
  type Glyph,
  type Metrics,
  type Settings,
} from '@/types'
import {
  cropPixels,
  getBounds,
  packPixel,
  translatePixels,
  type Pixels,
} from '@/utils/pixel'
import { useStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { parse, stringify } from 'superjson'
import { computed, nextTick, ref, version, watch } from 'vue'
import { useEditor } from './editor'
import { useHistory } from './history'
import {
  glyphIsEmpty,
  parseFont,
  serializeFont,
  type GfxGlyph,
} from '@/utils/font'
import { getBit, setBit } from '@/utils/bit'
import { parse as parseSchema } from 'valibot'

const defaults = {
  basedOn: { name: '', size: 12, guides: true, threshold: 125 },
  name: 'New Font',
}

export const useFont = defineStore('font', () => {
  const name = ref(defaults.name)
  const lineHeight = ref(10)
  const baseline = ref(17)
  const moveGlyphsWithBaseline = ref(true)
  const metrics = ref<Metrics>({})
  const basedOn = ref(structuredClone(defaults.basedOn))

  const glyphs = ref(new Map<number, Glyph>())
  const glyphsList = computed(() => [...glyphs.value.values()])

  const editor = useEditor()
  const history = useHistory()

  watch(
    () => editor.canvas.width,
    (canvasWidth) => {
      for (const [_, glyph] of glyphs.value) {
        const { left, width } = getBounds(glyph.pixels)
        const newLeft = Math.round((canvasWidth - width) / 2)
        glyph.pixels = translatePixels(glyph.pixels, newLeft - left, 0)
        glyph.bounds = getBounds(glyph.pixels)
      }
    },
  )

  const addGlyph = (data: Partial<Glyph> & Required<Pick<Glyph, 'code'>>) => {
    const {
      code,
      pixels = new Set(),
      bearing = { left: 0, right: 0 },
      version = 0,
    } = data
    const glyph = {
      code,
      pixels,
      bearing,
      version,
      bounds: getBounds(pixels),
    }
    glyphs.value.set(code, glyph)
    history.add(glyph)
  }

  const removeGlyph = (code: number) => {
    glyphs.value.delete(code)
    history.remove(code)
  }

  const setGlyphPixel = (glyph: Glyph, pixel: number, value: boolean) => {
    if (value) glyph.pixels.add(pixel)
    else glyph.pixels.delete(pixel)
    glyph.bounds = getBounds(glyph.pixels)
  }

  const setGlyphPixels = (glyph: Glyph, pixels: Pixels) => {
    glyph.pixels = pixels
    glyph.bounds = getBounds(glyph.pixels)
  }

  const updateGlyphBounds = (glyph: Glyph) => {
    glyph.bounds = getBounds(glyph.pixels)
  }

  const clearGlyph = (code: number) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    glyph.pixels.clear()
    glyph.bounds = getBounds(glyph.pixels)
  }

  const clear = () => {
    glyphs.value.clear()
    name.value = defaults.name
    basedOn.value = structuredClone(defaults.basedOn)
  }

  const toCode = () => {
    const { width: canvasWidth, height: canvasHeight } = editor.canvas

    const croppedGlyphs = new Map(
      Array.from(glyphs.value.entries()).map(([code, glyph]) => {
        const pixels = cropPixels(glyph.pixels, canvasWidth, canvasHeight)
        const bounds = getBounds(pixels)
        const croppedGlyph: Glyph = { ...glyph, pixels, bounds }
        return [code, croppedGlyph]
      }),
    )

    const charCodes = Array.from(croppedGlyphs.keys()).sort((a, b) => a - b)
    const asciiStart = charCodes[0] ?? 0
    const asciiEnd = charCodes.at(-1) ?? asciiStart

    let bytesCount = 0
    for (const [_, { bounds }] of croppedGlyphs) {
      bytesCount += Math.ceil((bounds.width * bounds.height) / 8)
    }

    const gfxGlyphs: GfxGlyph[] = []
    const bytes = new Uint8Array(bytesCount)
    let byteOffset = 0
    for (let code = asciiStart; code <= asciiEnd; code++) {
      const glyph = croppedGlyphs.get(code)
      if (!glyph) {
        // Add an empty placeholder.
        // prettier-ignore
        gfxGlyphs.push({ byteOffset: 0, width: 0, height: 0, xAdvance: 0, deltaX: 0, deltaY: 0 })
        continue
      }

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

    let code = `/**
 * Created with gfx-fe (github.com/arnoson/gfx-fe): a web based editor for gfx fonts.
 * Editor Settings: ${serializeSettings()}
 */\n\n`
    code += serializeFont({
      name: name.value,
      bytes,
      glyphs: gfxGlyphs,
      asciiStart,
      asciiEnd,
      yAdvance: lineHeight.value,
    })

    return code
  }

  const fromCode = async (code: string) => {
    clear()
    history.clear()

    const gfxFont = parseFont(code)
    const settings = parseSettings(code)

    name.value = gfxFont.name
    lineHeight.value = gfxFont.yAdvance
    baseline.value = settings.baseline ?? Math.round(lineHeight.value * 0.66)
    metrics.value = settings.metrics ?? {}
    if (settings.basedOn) basedOn.value = settings.basedOn

    editor.canvas.width = settings.canvas?.width ?? gfxFont.yAdvance
    editor.canvas.height = settings.canvas?.height ?? gfxFont.yAdvance

    // Setting the canvas size and baseline will trigger watchers, so we wait
    // for the next tick and continue when the watchers have finished.
    await nextTick()

    for (const [i, glyph] of gfxFont.glyphs.entries()) {
      if (glyphIsEmpty(glyph)) continue

      const pixels = new Set<number>()
      const left = Math.floor((editor.canvas.width - glyph.width) / 2)

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
      addGlyph({ code: i + gfxFont.asciiStart, pixels, bearing })
    }
  }

  const parseSettings = (code: string): Settings => {
    const match = code.match(/\* Editor Settings: (\{.+\})/)
    if (!match) return {}

    const [, settings] = match
    if (!settings) return {}

    return parseSchema(SettingsSchema, JSON.parse(settings))
  }

  const serializeSettings = () => {
    const settings: Settings = {
      canvas: { width: editor.canvas.width, height: editor.canvas.height },
      metrics: metrics.value,
      baseline: baseline.value,
      basedOn: basedOn.value,
    }
    return JSON.stringify(settings)
  }

  // // Restore the glyphs from local storage
  // for (const code of persistedGlyphCodes.value) {
  //   const glyphSerialized = localStorage.getItem(`glyph-${code}`)
  //   if (!glyphSerialized) continue
  //   addGlyph(parse<Glyph>(glyphSerialized))
  // }

  return {
    name,
    glyphs,
    glyphsList,
    lineHeight,
    baseline,
    metrics,
    basedOn,
    moveGlyphsWithBaseline,
    addGlyph,
    removeGlyph,
    setGlyphPixel,
    setGlyphPixels,
    updateGlyphBounds,
    clearGlyph,
    clear,
    toCode,
    fromCode,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
