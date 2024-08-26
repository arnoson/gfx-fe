import type { Tool, ToolContext } from '@/types'

// Just for the types, since all properties in Tool are optional, we can safely
// cast.
export const defineTool = <R>(fn: (ctx: ToolContext) => R) =>
  fn as (ctx: ToolContext) => Tool & R
