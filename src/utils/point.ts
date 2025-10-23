import type { Point } from '@/types'

export const roundPoint = (point: Point) => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
})

export const ceilPoint = (point: Point) => ({
  x: Math.ceil(point.x),
  y: Math.ceil(point.y),
})

export const floorPoint = (point: Point) => ({
  x: Math.floor(point.x),
  y: Math.floor(point.y),
})

export const addPoints = (a: Point, b: Point) => ({
  x: a.x + b.x,
  y: a.y + b.y,
})

export const subtractPoints = (a: Point, b: Point) => ({
  x: a.x - b.x,
  y: a.y - b.y,
})

export const multiplyPoints = (a: Point, b: Point) => ({
  x: a.x * b.x,
  y: a.y * b.y,
})

export const dividePoints = (a: Point, b: Point) => ({
  x: a.x / b.x,
  y: a.y / b.y,
})

export const clonePoint = (point: Point) => ({
  x: point.x,
  y: point.y,
})

export const pointsAreEqual = (a: Point, b: Point) => a.x === b.x && a.y === b.y
