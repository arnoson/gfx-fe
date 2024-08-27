import type { Tool, ToolContext, ToolConfig } from '@/types'

export const defineTool =
  <R>(name: string, fn: (ctx: ToolContext) => R, config: ToolConfig = {}) =>
  (ctx: ToolContext): Tool & R => {
    const result = fn(ctx)
    return { name, config, ...result }
  }
