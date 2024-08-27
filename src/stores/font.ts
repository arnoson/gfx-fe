import type { Glyph, Metrics } from '@/types'
import { getBounds, translatePixels, type Pixels } from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useEditor } from './editor'
import { useHistory } from './history'

export const useFont = defineStore('font', () => {
  const name = ref('New Font')
  const lineHeight = ref(10)
  const baseline = ref(17)
  const moveGlyphsWithBaseline = ref(true)
  const metrics = ref<Metrics>({})
  const basedOn = ref({
    name: 'Vevey Positive',
    size: 17,
    guides: true,
    threshold: 125,
  })

  const glyphs = ref(new Map<number, Glyph>())
  const activeGlyphCode = ref<number | undefined>()
  const activeGlyph = computed(() => {
    const code = activeGlyphCode.value
    return code ? glyphs.value.get(code) : undefined
  })

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

  watch(baseline, (newBaseline, oldBaseline) => {
    if (!moveGlyphsWithBaseline.value) return
    const delta = newBaseline - oldBaseline
    for (const [_, glyph] of glyphs.value) {
      glyph.pixels = translatePixels(glyph.pixels, 0, delta)
      glyph.bounds = getBounds(glyph.pixels)
    }
  })

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
    history.saveState(glyph)
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

  const clearGlyph = (code: number) => {
    const glyph = glyphs.value.get(code)
    if (!glyph) return

    glyph.pixels.clear()
    glyph.bounds = getBounds(glyph.pixels)
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
    setGlyphPixel,
    setGlyphPixels,
    clearGlyph,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useFont, import.meta.hot))
