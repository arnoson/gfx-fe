import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import type { Point } from '@/types'
import { packPixel } from '@/utils/pixel'
import { computed } from 'vue'
import icon from '@/assets/icons/icon-draw.svg'
import { defineTool } from './tool'

export const useDraw = defineTool('draw', {
  icon,
  shortcut: 'p',
  pointRounding: 'round',
  setup: () => {
    const font = useFont()
    const editor = useEditor()
    const glyph = computed(() => editor.activeGlyph)

    let isDrawing = false
    let pixelValue = true

    const onMouseDown = ({ x, y }: Point) => {
      if (!glyph.value) return
      isDrawing = true
      const pixel = packPixel(x, y)
      pixelValue = !glyph.value.pixels.has(pixel) // Toggle the color.
      font.setGlyphPixel(glyph.value, pixel, pixelValue)
    }

    const onMouseMove = ({ x, y }: Point) => {
      if (!glyph.value || !isDrawing) return
      const pixel = packPixel(x, y)
      font.setGlyphPixel(glyph.value, pixel, pixelValue)
    }

    const onMouseUp = () => {
      if (!glyph.value || !isDrawing) return
      isDrawing = false
      font.saveGlyphState(glyph.value)
    }

    return { name: 'draw', onMouseDown, onMouseMove, onMouseUp }
  },
})
