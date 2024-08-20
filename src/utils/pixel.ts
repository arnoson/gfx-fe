export const packPixel = (x: number, y: number) => (x << 8) | y

export const unpackPixelX = (pixel: number) => (pixel >> 8) & 0xff
export const unpackPixelY = (pixel: number) => pixel & 0xff

export const unpackPixel = (pixel: number) => ({
  x: (pixel >> 8) & 0xff,
  y: pixel & 0xff,
})
