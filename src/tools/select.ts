import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import type { Point, ToolContext } from '@/types'
import { packPixel, translatePixels, type Pixels } from '@/utils/pixel'
import { ctxToPixels } from '@/utils/text'
import { computed, ref, toRaw } from 'vue'
import { defineTool } from './tool'

export const useSelect = defineTool('select', ({ glyph }: ToolContext) => {
  const font = useFont()
  const editor = useEditor()
  const history = useHistory()
  const ctx = editor.canvas.ctx

  let mode: 'select' | 'move' | 'idle' = 'idle'
  let moveStartPoint = { x: 0, y: 0 }
  const glyphStartPixels = ref<Pixels>(new Set())
  const translate = ref({ x: 0, y: 0 })
  const selection = ref<{ x: number; y: number }[]>([])

  const selectionTranslated = computed(() => {
    const { x, y } = translate.value
    return x === 0 && y === 0
      ? selection.value
      : selection.value.map((point) => ({
          x: point.x + x,
          y: point.y + y,
        }))
  })

  // The pixels of the rendered selection polygon.
  const selectionPixels = computed((): Pixels => {
    if (!selection.value.length) return new Set()

    // Clear
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, editor.canvas.width, editor.canvas.height)

    // Draw the selection polygon.
    ctx.beginPath()
    ctx.moveTo(selection.value[0].x, selection.value[0].y)
    for (let i = 1; i < selection.value.length; i++) {
      ctx.lineTo(selection.value[i].x, selection.value[i].y)
    }
    ctx.closePath()
    ctx.fillStyle = 'black'
    ctx.fill()

    return ctxToPixels(ctx, 50)
  })

  const selectionPixelsTranslated = computed(() => {
    const { x, y } = translate.value
    return x === 0 && y === 0
      ? selectionPixels.value
      : translatePixels(selectionPixels.value, x, y)
  })

  // The pixels of the glyph that are selected by the selection polygon.
  const selectedPixels = computed((): Pixels => {
    if (!selection.value.length) return new Set()
    return selectionPixels.value.intersection(glyphStartPixels.value)
  })

  const selectedPixelsTranslated = computed(() => {
    const { x, y } = translate.value
    return x === 0 && y === 0
      ? selectedPixels.value
      : translatePixels(selectedPixels.value, x, y)
  })

  const startSelect = (point: Point) => {
    translate.value = { x: 0, y: 0 }
    glyphStartPixels.value = new Set(glyph.value.pixels)
    selection.value = [point]
  }

  const select = (point: Point) => {
    const lastPoint = selection.value.at(-1)
    if (point.x === lastPoint?.x && point.y === lastPoint.y) return
    selection.value.push(point)
  }

  const startMove = (point: Point) => {
    const { x, y } = translate.value
    moveStartPoint = { x: point.x - x, y: point.y - y }
  }

  const move = (point: Point) => {
    const { x, y } = moveStartPoint
    translate.value = { x: point.x - x, y: point.y - y }

    // Without converting to raw, Set.difference() won't work.
    glyph.value.pixels = toRaw(glyphStartPixels.value)
      .difference(selectedPixels.value)
      .union(selectedPixelsTranslated.value)
  }

  const onMouseDown = (point: Point) => {
    const pixel = packPixel(point.x, point.y)
    // If we click on a selection, we can move it. Otherwise we start a new
    // selection.
    mode = selectionPixelsTranslated.value?.has(pixel) ? 'move' : 'select'
    if (mode === 'select') startSelect(point)
    else if (mode === 'move') startMove(point)
  }

  const onMouseMove = (point: Point) => {
    if (mode === 'select') select(point)
    else if (mode === 'move') move(point)
  }

  const onMouseUp = () => (mode = 'idle')

  const remove = () => {
    if (!selectedPixels.value) return

    font.setGlyphPixels(
      glyph.value,
      // Without converting to raw, Set.difference() won't work.
      toRaw(glyphStartPixels.value).difference(selectedPixels.value),
    )
    history.saveState(glyph.value)

    selection.value = []
    mode = 'idle'
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete') remove()
    else if (e.key === 'Escape') {
      mode = 'idle'
      selection.value = []
    }
  }

  return {
    name: 'select',
    selection: selectionTranslated,
    selectedPixels: selectedPixelsTranslated,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown,
  }
})
