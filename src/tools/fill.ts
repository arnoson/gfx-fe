import { useEditor } from '@/stores/editor'
import { defineTool } from './tool'
import icon from '@/assets/icons/icon-fill.svg'
import { computed } from 'vue'
import { measureGlyph, renderGlyph } from '@/utils/text'
import { useFont } from '@/stores/font'
import { translatePixels } from '@/utils/pixel'
import { useHistory } from '@/stores/history'

export const useFill = defineTool('fill', {
  icon,
  shortcut: 'g', // Like PS bucket fill tool
  setup: () => {
    const editor = useEditor()
    const font = useFont()
    const history = useHistory()
    const glyph = computed(() => editor.activeGlyph)

    const fill = () => {
      if (!glyph.value) return

      const { bearing } = measureGlyph(glyph.value.code)
      glyph.value.bearing = bearing

      const pixels = renderGlyph(glyph.value.code)
      font.setGlyphPixels(glyph.value, pixels)

      const { left, width } = glyph.value.bounds
      const centeredLeft = Math.round((editor.canvas.width - width) / 2)
      const centeredPixels = translatePixels(pixels, centeredLeft - left, 0)
      font.setGlyphPixels(glyph.value, centeredPixels)

      history.saveState(glyph.value)
    }

    const activate = (prevToolId: string) => {
      fill()
      editor.activateTool(prevToolId as any)
    }

    return { name: 'fill', activate }
  },
})
