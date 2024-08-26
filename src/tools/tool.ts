import type { Tool, ToolContext } from '@/types'

export const defineTool =
  <R>(name: string, fn: (ctx: ToolContext) => R) =>
  (ctx: ToolContext): Tool & R => {
    const result = fn(ctx)
    return { name, ...result }
  }
