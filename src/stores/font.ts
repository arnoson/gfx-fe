import type { Glyph, Metrics } from '@/types'
import { getBounds, translatePixels, type Pixels } from '@/utils/pixel'
import { useStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { parse, stringify } from 'superjson'
import { computed, ref, watch } from 'vue'
import { useEditor } from './editor'
import { useHistory } from './history'

const defaults = {
  basedOn: { name: '', size: 12, guides: true, threshold: 125 },
  name: 'New Font',
}

export const useFont = defineStore(
  'font',
  () => {
    const name = ref(defaults.name)
    const lineHeight = ref(10)
    const baseline = ref(17)
    const moveGlyphsWithBaseline = ref(true)
    const metrics = ref<Metrics>({})
    const basedOn = ref(structuredClone(defaults.basedOn))

    const glyphs = ref(new Map<number, Glyph>())
    const glyphCodes = computed(() => Array.from(glyphs.value.keys()))
    const activeGlyphCode = ref<number | undefined>()
    const activeGlyph = computed(() => {
      const code = activeGlyphCode.value
      return code ? glyphs.value.get(code) : undefined
    })

    const editor = useEditor()
    const history = useHistory()

    const persistedGlyphCodes = useStorage<number[]>('glyph-codes', [])
    watch(
      glyphCodes,
      () => (persistedGlyphCodes.value = Array.from(glyphs.value.keys())),
    )

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
      const { code, pixels = new Set(), bearing = { left: 0, right: 0 } } = data
      const glyph = {
        code,
        pixels,
        bearing,
        bounds: getBounds(pixels),
        guide: { enabled: true },
      }
      glyphs.value.set(code, glyph)
      history.add(code)
      saveGlyphState(glyph)
    }

    const removeGlyph = (code: number) => {
      glyphs.value.delete(code)
      history.remove(code)
    }

    const saveGlyphState = (glyph: Glyph) => {
      history.saveState(glyph)
      localStorage.setItem(`glyph-${glyph.code}`, stringify(glyph))
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

    const clearGlyph = (code: number) => {
      const glyph = glyphs.value.get(code)
      if (!glyph) return

      glyph.pixels.clear()
      glyph.bounds = getBounds(glyph.pixels)
    }

    const clear = () => {
      glyphs.value.clear()
      activeGlyphCode.value = undefined
      name.value = defaults.name
      basedOn.value = structuredClone(defaults.basedOn)
    }

    // Restore the glyphs from local storage
    for (const code of persistedGlyphCodes.value) {
      const glyphSerialized = localStorage.getItem(`glyph-${code}`)
      if (!glyphSerialized) continue
      addGlyph(parse<Glyph>(glyphSerialized))
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
      addGlyph,
      removeGlyph,
      saveGlyphState,
      setGlyphPixel,
      setGlyphPixels,
      clearGlyph,
      clear,
    }
  },
  { persist: { omit: ['glyphs'] } },
)

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
