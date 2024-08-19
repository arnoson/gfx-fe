export const parseFont = (code: string) => {
  const font = code.match(
    /GFXfont\s+(\w+)[\s\S]+(\s+[0-9a-zA-Z]+,\s+[0-9a-zA-Z]+,\s+[0-9a-zA-Z]+)/
  )
  if (!font) throw new Error('No `GFXfont` found.')

  const [, name, characterInfo] = font
  const [asciiStart, asciiEnd, yAdvance] = characterInfo.split(',').map(Number)

  const bitmaps = code
    .match(/Bitmaps.*=\s+{([^}]+)/)?.[1]
    .split(',')
    .map(Number)

  if (!bitmaps) throw new Error('No bitmaps found.')
  const bytes = new Uint8Array(bitmaps)

  // Look for groups of 6 numbers: `{ 0, 0, 0, 0, 0, 0}`.
  const glyphs = code.match(/{(\s*-?[a-zA-Z0-9]+\s*,?){6}}/g)?.map((v) => {
    const [byteOffset, width, height, xAdvance, deltaX, deltaY] = v
      .replace(/[{}]/g, '')
      .split(',')
      .map(Number)
    return { byteOffset, width, height, xAdvance, deltaX, deltaY }
  })

  if (!glyphs) throw new Error('No glyphs found.')

  // xAdvance includes the glyph's width and bearings, so we use it instead if
  // just the glyphs width.
  const widestGlyph = glyphs.reduce((a, b) => (a.xAdvance > b.xAdvance ? a : b))
  const tallestGlyph = glyphs.reduce((a, b) => (a.height > b.height ? a : b))
  const cellSize = Math.max(widestGlyph.xAdvance, tallestGlyph.height)

  return {
    name,
    bytes,
    glyphs,
    asciiStart,
    asciiEnd,
    yAdvance,
    cellSize,
  }
}
