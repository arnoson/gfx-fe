import type { Tool } from '@/types'
import { EffectScope, effectScope } from '@vue/reactivity'

export const createTool = (name: string, fn: () => unknown): Tool => {
  let scope: EffectScope | undefined
  const tool = {
    name,
    activate() {
      scope = effectScope()
      scope.run(() => fn())
    },
    deactivate() {
      scope?.stop()
    },
  }
  return tool
}
