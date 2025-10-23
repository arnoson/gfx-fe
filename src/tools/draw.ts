import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import type { Pixels, Point } from '@/types'
import { packPixel } from '@/utils/pixel'
import { useDebounceFn } from '@vueuse/core'
import { computed, toRaw } from 'vue'
import icon from '@/assets/icons/icon-draw.svg'
import { defineTool } from './tool'

export const useDraw = defineTool('draw', {
  icon,
  pointRounding: 'floor',
  shortcut: 'p',
  setup: () => {
    const editor = useEditor()
    const font = useFont()
    const history = useHistory()
    const glyph = computed(() => editor.activeGlyph)

    let mode: 'draw' | 'erase' | 'idle' = 'idle'
    let lastPoint: Point | null = null
    let pixelsStart: Pixels | null = null

    const pixelIsEmpty = (point: Point) =>
      !glyph.value?.pixels?.has(packPixel(point.x, point.y))

    const togglePixel = ({ x, y }: Point) => {
      if (!glyph.value) return
      const pixel = packPixel(x, y)
      font.setGlyphPixel(glyph.value, pixel, mode === 'draw')
    }

    // Prevent flickering when setting `isErasing` during mousemove (which
    // changes the draw tool icon).
    const setIsErasingDebounced = useDebounceFn(
      (v: boolean) => (editor.isErasing = v),
      10,
    )

    const onMouseDown = (point: Point) => {
      lastPoint = point
      pixelsStart = structuredClone(toRaw(glyph.value?.pixels)) ?? null
      mode = pixelIsEmpty(point) ? 'draw' : 'erase'
      editor.isErasing = mode === 'erase'
      togglePixel(point)
    }

    const onMouseMove = (point: Point) => {
      if (!glyph.value) return
      if (mode === 'idle') {
        setIsErasingDebounced(!pixelIsEmpty(point))
        return
      }

      drawLine({ from: lastPoint!, to: point, drawPixel: togglePixel })
      font.updateGlyphBounds(glyph.value)
      lastPoint = point
    }

    const onMouseUp = () => {
      if (glyph.value) {
        const { pixels } = glyph.value
        const hasDrawn = pixelsStart && pixelsStart.size !== pixels.size
        if (hasDrawn) history.saveState(glyph.value)
      }

      pixelsStart = null
      editor.isErasing = false
      mode = 'idle'
    }

    const deactivate = () => {
      editor.isErasing = false
    }

    return { onMouseDown, onMouseMove, onMouseUp, deactivate }
  },
})

// Based on https://github.com/adafruit/Adafruit-GFX-Library/blob/87e15509a9e16892e60947bc4231027882edbd34/Adafruit_GFX.cpp#L132
export const drawLine = ({
  from,
  to,
  drawPixel: fn,
}: {
  from: Point
  to: Point
  drawPixel: (pixel: Point) => void
}) => {
  let x0 = from.x
  let y0 = from.y
  let x1 = to.x
  let y1 = to.y

  const isSteep = Math.abs(y1 - y0) > Math.abs(x1 - x0)

  if (isSteep) {
    // Swap x0 with y0.
    let temp = x0
    x0 = y0
    y0 = temp
    // Swap x1 with y1.
    temp = x1
    x1 = y1
    y1 = temp
  }

  if (x0 > x1) {
    // Swap x0 with x1.
    let temp = x0
    x0 = x1
    x1 = temp
    // Swap y0 with y1.
    temp = y0
    y0 = y1
    y1 = temp
  }

  const dx = x1 - x0
  const dy = Math.abs(y1 - y0)

  let err = dx / 2
  let yStep

  if (y0 < y1) yStep = 1
  else yStep = -1

  for (; x0 <= x1; x0++) {
    if (isSteep) fn({ x: y0, y: x0 })
    else fn({ x: x0, y: y0 })

    err -= dy
    if (err < 0) {
      y0 += yStep
      err += dx
    }
  }
}
