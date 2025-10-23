import { offscreenCanvasCtx, useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import type { Pixels, Point } from '@/types'
import { packPixel, translatePixels, getBounds } from '@/utils/pixel'
import { ctxToPixels } from '@/utils/text'
import { computed, ref, toRaw, watch } from 'vue'
import icon from '@/assets/icons/icon-select.svg'
import { defineTool } from './tool'
import { useHistory } from '@/stores/history'
import { pointsAreEqual } from '@/utils/point'

export const useSelect = defineTool('select', {
  icon,
  shortcut: 'l', // Like PS lasso / free-hand selection tool
  pointRounding: 'round',
  setup: () => {
    const font = useFont()
    const editor = useEditor()
    const history = useHistory()
    const glyph = computed(() => editor.activeGlyph)
    const ctx = offscreenCanvasCtx

    let mode: 'select' | 'move' | 'idle' = 'idle'

    // The state of the glyph's pixels at the start of a select or move action.
    const glyphStartPixels = ref<Pixels>(new Set())
    // The pixels of the glyph that are selected by the selection polygon.
    const selectedPixels = ref<Pixels>(new Set())
    // The points forming the selection polygon.
    const selectionPolygon = ref<Point[]>([])

    // The pixels of the rendered selection polygon.
    const selectionPixels = computed((): Pixels => {
      if (!selectionPolygon.value.length) return new Set()

      // Clear
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, editor.canvas.width, editor.canvas.height)

      // Draw the selection polygon.
      ctx.beginPath()
      ctx.moveTo(selectionPolygon.value[0]!.x, selectionPolygon.value[0]!.y)
      for (let i = 1; i < selectionPolygon.value.length; i++) {
        ctx.lineTo(selectionPolygon.value[i]!.x, selectionPolygon.value[i]!.y)
      }
      ctx.closePath()
      ctx.fillStyle = 'black'
      ctx.fill()

      return ctxToPixels(ctx, 50)
    })

    // Select Mode
    const startSelect = (point: Point) => {
      if (!glyph.value) return
      glyphStartPixels.value = new Set(glyph.value.pixels)
      selectionPolygon.value = [point]
    }

    const select = (point: Point) => {
      const lastPoint = selectionPolygon.value.at(-1)
      if (point.x === lastPoint?.x && point.y === lastPoint.y) return

      selectionPolygon.value.push(point)
      selectedPixels.value = selectionPixels.value.intersection(
        glyphStartPixels.value,
      )
    }

    const endSelect = () => {
      // When we end (stop drawing) a selection, we remove the selected pixels
      // from `glyphStartPixels`. If a move action follows, the selected pixels
      // are cut from the glyph, which is the behavior we want.
      glyphStartPixels.value = toRaw(glyphStartPixels.value).difference(
        selectedPixels.value,
      )
    }

    const selectAll = () => {
      if (!glyph.value || !glyph.value.pixels.size) return

      const bounds = getBounds(glyph.value.pixels)
      selectionPolygon.value = [
        { x: bounds.left, y: bounds.top },
        { x: bounds.right + 1, y: bounds.top },
        { x: bounds.right + 1, y: bounds.bottom + 1 },
        { x: bounds.left, y: bounds.bottom + 1 },
      ]

      glyphStartPixels.value = new Set()
      selectedPixels.value = new Set(glyph.value.pixels)
    }

    const removeSelection = () => {
      selectionPolygon.value = []
      selectedPixels.value = new Set()
    }

    // Move Mode
    let lastMovePoint = { x: 0, y: 0 }
    let startMovePoint = { x: 0, y: 0 }

    const startMove = (point: Point) => {
      startMovePoint = lastMovePoint = point
    }

    const move = (point: Point) => {
      if (!glyph.value) return

      const deltaX = point.x - lastMovePoint.x
      const deltaY = point.y - lastMovePoint.y

      selectionPolygon.value = selectionPolygon.value.map(({ x, y }) => ({
        x: x + deltaX,
        y: y + deltaY,
      }))

      selectedPixels.value = translatePixels(
        selectedPixels.value,
        deltaX,
        deltaY,
      )

      // Without converting to raw, Set.difference() won't work.
      glyph.value.pixels = toRaw(glyphStartPixels.value).union(
        selectedPixels.value,
      )

      lastMovePoint = point
    }

    const endMove = () => {
      if (!glyph.value) return

      const hasMoved = !pointsAreEqual(startMovePoint, lastMovePoint)
      if (!hasMoved) return

      font.updateGlyphBounds(glyph.value)
      history.saveState(glyph.value)
    }

    // Copy & Paste

    const copy = () => {
      editor.selectionClipboard = {
        pixels: new Set(selectedPixels.value),
        polygon: [...selectionPolygon.value],
      }
    }

    const cut = () => {
      if (!glyph.value) return
      editor.selectionClipboard = {
        pixels: new Set(selectedPixels.value),
        polygon: [...selectionPolygon.value],
      }
      const pixels = toRaw(glyph.value.pixels) // Without converting to raw, Set.difference() won't work.
      const pixelsWithoutSelection = pixels.difference(selectedPixels.value)
      font.setGlyphPixels(glyph.value, pixelsWithoutSelection)
      selectedPixels.value = new Set()
      selectionPolygon.value = []
      history.saveState(glyph.value)
    }

    const paste = () => {
      if (!glyph.value || !editor.selectionClipboard) return
      selectionPolygon.value = editor.selectionClipboard.polygon
      selectedPixels.value = editor.selectionClipboard.pixels
      glyphStartPixels.value = new Set(glyph.value.pixels)
      const pixels = toRaw(glyphStartPixels.value) // Without converting to raw, Set.difference() won't work.
      const pixelsWithSelection = pixels.union(selectedPixels.value)
      font.setGlyphPixels(glyph.value, pixelsWithSelection)
    }

    // Events
    watch(glyph, () => {
      removeSelection()
      if (glyph.value) glyphStartPixels.value = new Set(glyph.value.pixels)
    })

    const onMouseDown = (point: Point) => {
      const pixel = packPixel(point.x, point.y)
      const clickIsInSelection = selectionPixels.value?.has(pixel)

      // The user can click and move the selection as often as desired.
      // Only when the selection is stopped by clicking outside the selection
      // we consider the move to be finished.
      if (!clickIsInSelection && selectionPolygon.value.length > 1) endMove()

      // If we click on a selection, we can move it. Otherwise we start a new
      // selection.
      mode = clickIsInSelection ? 'move' : 'select'
      if (mode === 'select') startSelect(point)
      else if (mode === 'move') startMove(point)
    }

    const onMouseMove = (point: Point) => {
      if (mode === 'select') select(point)
      else if (mode === 'move') move(point)
    }

    const onMouseUp = () => {
      if (mode === 'select' && selectionPolygon.value.length) endSelect()
      mode = 'idle'
    }

    const remove = () => {
      if (!selectedPixels.value) return
      if (!glyph.value) return

      font.setGlyphPixels(
        glyph.value,
        // Without converting to raw, Set.difference() won't work.
        toRaw(glyphStartPixels.value).difference(selectedPixels.value),
      )
      history.saveState(glyph.value)

      selectionPolygon.value = []
      mode = 'idle'
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const { key, ctrlKey } = e
      if (key === 'Delete') remove()
      else if (key === 'Escape') {
        mode = 'idle'
        selectionPolygon.value = []
      } else if (key === 'c' && ctrlKey) {
        copy()
      } else if (key === 'x' && ctrlKey) {
        cut()
      } else if (key === 'v' && ctrlKey) {
        paste()
      } else if (key === 'a' && ctrlKey) {
        e.preventDefault()
        selectAll()
      }
    }

    return {
      name: 'select',
      selectionPolygon,
      selectedPixels,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onKeyDown,
    }
  },
})
