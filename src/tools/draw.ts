import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import type { Point, ToolContext } from '@/types'
import { packPixel } from '@/utils/pixel'
import { defineTool } from './tool'

export const useDraw = defineTool('draw', ({ glyph }: ToolContext) => {
  const font = useFont()
  const history = useHistory()

  let isDrawing = false
  let pixelValue = true

  const onMouseDown = ({ x, y }: Point) => {
    isDrawing = true
    const pixel = packPixel(x, y)
    pixelValue = !glyph.value.pixels.has(pixel) // Toggle the color.
    font.setGlyphPixel(glyph.value, pixel, pixelValue)
  }

  const onMouseMove = ({ x, y }: Point) => {
    if (!isDrawing) return
    const pixel = packPixel(x, y)
    font.setGlyphPixel(glyph.value, pixel, pixelValue)
  }

  const onMouseUp = () => {
    if (!isDrawing) return
    isDrawing = false
    history.saveState(glyph.value)
  }

  return { name: 'draw', onMouseDown, onMouseMove, onMouseUp }
})
