import type { Glyph, Point } from '@/types'
import { type Pixels } from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, effect, ref } from 'vue'
import { useFont } from './font'
import { useDraw } from '@/tools/draw'
import { useSelect } from '@/tools/select'
import { useFill } from '@/tools/fill'

type Selection = { pixels: Pixels; polygon: Point[] }

// An offscreen HTML canvas that we use to render stuff in.
export const offscreenCanvas = document.createElement('canvas')
export const offscreenCanvasCtx = offscreenCanvas.getContext('2d', {
  willReadFrequently: true,
})!

export const useEditor = defineStore('editor', () => {
  const font = useFont()

  // Glyph
  const activeGlyph = ref<Glyph>()
  const activateGlyph = (code: Glyph['code']) => {
    activeGlyph.value = font.glyphs.get(code)
  }

  // Canvas
  const canvas = ref({ width: 20, height: 20 })
  effect(() => {
    offscreenCanvas.width = canvas.value.width
    offscreenCanvas.height = canvas.value.height
  })

  // Tools
  const draw = useDraw()
  const select = useSelect()
  const fill = useFill()
  const tools = ref({ draw, select, fill })
  type ToolId = keyof typeof tools.value

  const activeToolId = ref<ToolId>('draw')
  const activeTool = computed(() => tools.value[activeToolId.value])

  const activateTool = (id: ToolId) => {
    const prevToolId = activeTool.value.id
    activeTool.value.deactivate?.()
    activeToolId.value = id
    tools.value[id].activate?.(prevToolId)
  }
  activateTool(activeToolId.value)

  // Selection
  const selectionClipboard = ref<Selection>()

  // Draw
  const isErasing = ref(false)

  return {
    activeGlyph,
    activateGlyph,
    canvas,
    tools,
    activeTool,
    activeToolId,
    activateTool,
    selectionClipboard,
    isErasing,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useEditor, import.meta.hot))
