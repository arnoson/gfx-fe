import { acceptHMRUpdate, defineStore } from 'pinia'
import { useFont } from './font'
import { getBounds } from '@/utils/pixel'
import type { Glyph } from '@/types'

// Right now, we only support undo/redo for glyphs.
type GlyphState = {
  pixels?: Glyph['pixels']
  bearing?: Glyph['bearing']
}

type History = {
  index: number
  stack: GlyphState[]
}

type Key = number

export const useHistory = defineStore('history', () => {
  const histories = new Map<Key, History>()
  const maxStackSize = 50
  const font = useFont()

  const add = (key: Key) => histories.set(key, { index: 0, stack: [] })
  const remove = (key: Key) => histories.delete(key)

  const undo = (key: Key) => {
    console.log('undo!')

    const history = histories.get(key)
    if (!history || !history.stack.length || history.index < 1) return

    const glyph = font.glyphs.get(key)
    if (!glyph) return

    history.index--
    const state = history.stack.at(history.index)
    if (!state) return

    const { pixels, bearing } = state
    if (pixels) {
      glyph.pixels = pixels
      glyph.bounds = getBounds(pixels)
    }
    if (bearing) glyph.bearing = bearing
  }

  const redo = (key: Key) => {
    const history = histories.get(key)
    if (!history || history.index >= history.stack.length - 1) return

    const glyph = font.glyphs.get(key)
    if (!glyph) return

    history.index++
    const state = history.stack.at(history.index)
    if (!state) return

    const { pixels, bearing } = state
    if (pixels) {
      glyph.pixels = pixels
      glyph.bounds = getBounds(pixels)
    }
    if (bearing) glyph.bearing = bearing
  }

  const saveState = (key: Key) => {
    let history = histories.get(key)
    if (!history) return

    const glyph = font.glyphs.get(key)
    if (!glyph) return

    // We undo-ed into history and because we start a new future we have to
    // delete the existing future stack.
    if (history.index < history.stack.length - 1) {
      history.stack.splice(history.index + 1)
    }

    const clonedState = {
      pixels: new Set(glyph.pixels),
      bearing: { left: glyph.bearing.left, right: glyph.bearing.right },
    }
    history.stack.push(clonedState)

    if (history.stack.length > maxStackSize) history.stack.shift()
    history.index = history.stack.length - 1
  }

  return { add, remove, undo, redo, saveState }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useHistory, import.meta.hot))
