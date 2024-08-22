// We could just store the pixels as an [x,y] array. But since we are
// manipulating them while drawing, we try to optimize as much as possible by
// packing x and y into a single number. We also allow negative numbers, so the
// pixels are never 'lost'. So if we move a glyph out of the canvas, we can move
// it back in at a later point in time.

export type Pixels = Set<number>

export const packPixel = (x: number, y: number) => {
  // Encode x and y with the sign bit in the MSB.
  const xPacked = ((x < 0 ? 0 : 1) << 7) | (Math.abs(x) & 0x7f)
  const yPacked = ((y < 0 ? 0 : 1) << 7) | (Math.abs(y) & 0x7f)
  // Combine into a single 16-bit number.
  return (xPacked << 8) | yPacked
}

export const unpackPixelX = (pixel: number) => {
  const xPacked = (pixel >> 8) & 0xff
  // Extract the sign from the MSB and the value form the remaining 7 bits.
  const xSign = xPacked & 0x80 ? 1 : -1
  const xValue = xPacked & 0x7f
  return xSign * xValue
}

export const unpackPixelY = (pixel: number) => {
  const yPacked = pixel & 0xff
  // Extract the sign from the MSB and the value form the remaining 7 bits.
  const ySign = yPacked & 0x80 ? 1 : -1
  const yValue = yPacked & 0x7f
  return ySign * yValue
}

export const unpackPixel = (pixel: number) => ({
  x: unpackPixelX(pixel),
  y: unpackPixelY(pixel),
})

export const pixelIsCropped = (
  pixel: number,
  width: number,
  height: number,
) => {
  const { x, y } = unpackPixel(pixel)
  return x < 0 || y < 0 || x > width - 1 || y > height - 1
}

export const translatePixels = (
  pixels: Pixels,
  translateX: number,
  translateY: number,
): Pixels => {
  const newPixels: Pixels = new Set()
  for (const pixel of pixels) {
    const { x, y } = unpackPixel(pixel)
    newPixels.add(packPixel(x + translateX, y + translateY))
  }
  return newPixels
}

export const cropPixels = (pixels: Pixels, width: number, height: number) =>
  new Set(
    Array.from(pixels.values()).filter(
      (pixel) => !pixelIsCropped(pixel, width, height),
    ),
  )

export const getBounds = (pixels: Pixels) => {
  let left = Infinity
  let top = Infinity
  let right = 0
  let bottom = 0

  if (!pixels.size)
    return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }

  for (const pixel of pixels) {
    const { x, y } = unpackPixel(pixel)
    if (x < left) left = x
    if (x > right) right = x
    if (y < top) top = y
    if (y > bottom) bottom = y
  }

  return {
    left,
    right,
    top,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
  }
}
