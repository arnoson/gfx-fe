import type { Point } from '@/types'
import { type Pixels } from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { effect, ref } from 'vue'

type Selection = { pixels: Pixels; polygon: Point[] }

// An offscreen HTML canvas that we use to render stuff in.
export const offscreenCanvas = document.createElement('canvas')
export const offscreenCanvasCtx = offscreenCanvas.getContext('2d', {
  willReadFrequently: true,
})!

export const useEditor = defineStore('editor', () => {
    const activeToolName = ref<'draw' | 'select'>('draw')
    const canvas = ref({
      width: 20,
      height: 20,
    })

    effect(() => {
      offscreenCanvas.width = canvas.value.width
      offscreenCanvas.height = canvas.value.height
    })

    const selectionClipboard = ref<Selection>()

    return { activeToolName, canvas, selectionClipboard }
  },

)

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useEditor, import.meta.hot))
