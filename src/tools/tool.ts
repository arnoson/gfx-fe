import { markRaw } from 'vue'
import type { Tool } from '@/types'

type Config<R> = Pick<Tool, 'icon' | 'shortcut' | 'pointRounding'> & {
  setup: () => R
}

export const defineTool =
  <R>(id: Tool['id'], config: Config<R>) =>
  (): Tool & R => {
    const { icon, shortcut, pointRounding, setup } = config
    const rawIcon = typeof icon === 'string' ? icon : markRaw(icon)
    return { id, icon: rawIcon, shortcut, pointRounding, ...setup() }
  }
