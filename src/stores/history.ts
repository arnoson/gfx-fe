import type { Glyph } from '@/types'
import { getBounds } from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'

// Right now, we only support undo/redo for glyphs.
type GlyphState = {
  pixels?: Glyph['pixels']
  bearing?: Glyph['bearing']
}

type History = {
  index: number
  stack: GlyphState[]
}

const cloneState = ({ pixels, bearing }: GlyphState) => ({
  pixels: pixels ? new Set(pixels) : undefined,
  bearing: bearing ? { left: bearing.left, right: bearing.right } : undefined,
})

export const useHistory = defineStore('history', () => {
  const histories = new Map<number, History>()
  const maxStackSize = 50

  const add = (code: number) => histories.set(code, { index: 0, stack: [] })
  const remove = (code: number) => histories.delete(code)

  const undo = (glyph: Glyph) => {
    const history = histories.get(glyph.code)
    if (!history || !history.stack.length || history.index < 1) return

    history.index--
    const state = history.stack.at(history.index)
    if (!state) return

    const { pixels, bearing } = cloneState(state)
    if (pixels) {
      glyph.pixels = pixels
      glyph.bounds = getBounds(pixels)
    }
    if (bearing) glyph.bearing = bearing
  }

  const redo = (glyph: Glyph) => {
    const history = histories.get(glyph.code)
    if (!history || history.index >= history.stack.length - 1) return

    history.index++
    const state = history.stack.at(history.index)
    if (!state) return

    const { pixels, bearing } = cloneState(state)
    if (pixels) {
      glyph.pixels = new Set(pixels)
      glyph.bounds = getBounds(pixels)
    }
    if (bearing) glyph.bearing = bearing
  }

  const saveState = (glyph: Glyph) => {
    let history = histories.get(glyph.code)
    if (!history) return

    // We undo-ed into history and because we start a new future we have to
    // delete the existing future stack.
    if (history.index < history.stack.length - 1) {
      history.stack.splice(history.index + 1)
    }

    history.stack.push(cloneState(glyph))

    if (history.stack.length > maxStackSize) history.stack.shift()
    history.index = history.stack.length - 1
  }

  return { add, remove, undo, redo, saveState }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useHistory, import.meta.hot))
