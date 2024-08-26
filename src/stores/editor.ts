import { acceptHMRUpdate, defineStore } from 'pinia'
import { effect, markRaw, ref } from 'vue'

export const useEditor = defineStore('editor', () => {
  // An offscreen HTML canvas that we use to render stuff in.
  const offscreenCanvas = document.createElement('canvas')
  const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true })!

  const activeToolName = ref<'draw' | 'select'>('draw')
  const canvas = ref({
    width: 20,
    height: 20,
    ctx: markRaw(ctx),
  })

  effect(() => {
    offscreenCanvas.width = canvas.value.width
    offscreenCanvas.height = canvas.value.height
  })

  return { activeToolName, canvas }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useEditor, import.meta.hot))
