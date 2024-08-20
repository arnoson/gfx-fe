// We could just store the pixels as an [x,y] array. But since we are
// manipulating them while drawing, we try to optimize as much as possible by
// packing x and y into a single number. We also allow negative numbers, so the
// pixels are never 'lost'. So if we move a glyph out of the canvas, we can move
// it back in at a later point in time.

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
