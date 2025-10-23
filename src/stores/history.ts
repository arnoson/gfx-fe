import { useStorage } from '@/stores/storage'
import type { Glyph } from '@/types'
import { getBounds } from '@/utils/pixel'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { toRaw } from 'vue'

// Right now, we only support undo/redo for glyphs.
type State = Omit<Glyph, 'code' | 'bounds' | 'guide'>

type History = {
  index: number
  stack: State[]
}

const clone = <T>(value: T): T => structuredClone(toRaw(value))

const glyphToState = (glyph: Glyph) => {
  // Discard irrelevant properties (bounds can be recalculated, code is redundant )
  const { bounds, code, ...state } = clone(glyph)
  return state
}

export const useHistory = defineStore('history', () => {
  const storage = useStorage()

  const histories = new Map<number, History>()
  const maxStackSize = 50

  const add = (glyph: Glyph) => {
    histories.set(glyph.code, { index: 0, stack: [] })
    const initialState = glyphToState(glyph)
    histories.set(glyph.code, { index: 0, stack: [initialState] })
  }
  const remove = (code: number) => histories.delete(code)

  const undo = (glyph: Glyph) => {
    const history = histories.get(glyph.code)
    if (!history || !history.stack.length || history.index < 1) return

    history.index--
    const state = history.stack.at(history.index)
    if (!state) return

    Object.assign(glyph, clone(state))
    glyph.bounds = getBounds(glyph.pixels)

    storage.backupGlyphDebounced(glyph)
  }

  const redo = (glyph: Glyph) => {
    const history = histories.get(glyph.code)
    if (!history || history.index >= history.stack.length - 1) return

    history.index++
    const state = history.stack.at(history.index)
    if (!state) return

    Object.assign(glyph, clone(state))
    glyph.bounds = getBounds(glyph.pixels)

    storage.backupGlyphDebounced(glyph)
  }

  const saveState = (glyph: Glyph) => {
    let history = histories.get(glyph.code)
    if (!history) return

    // We undo-ed into history and because we start a new future we have to
    // delete the existing future stack.
    if (history.index < history.stack.length - 1) {
      history.stack.splice(history.index + 1)
    }

    glyph.version++
    const state = clone(glyph)
    history.stack.push(state)
    storage.backupGlyphDebounced(state)

    if (history.stack.length > maxStackSize) history.stack.shift()
    history.index = history.stack.length - 1
  }

  const clear = () => histories.clear()

  return { add, remove, undo, redo, saveState, clear }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useHistory, import.meta.hot))
