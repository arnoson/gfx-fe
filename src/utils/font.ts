export type GfxGlyph = {
  width: number
  height: number
  deltaX: number
  deltaY: number
  xAdvance: number
  byteOffset: number
}

export type GfxFont = {
  name: string
  bytes: Uint8Array
  glyphs: GfxGlyph[]
  asciiStart: number
  asciiEnd: number
  yAdvance: number
}

export const parseFont = (code: string): GfxFont => {
  const font = code.match(
    /GFXfont\s+(\w+)[\s\S]+(\s+[0-9a-zA-Z]+,\s+[0-9a-zA-Z]+,\s+[0-9a-zA-Z]+)/,
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

  return {
    name,
    bytes,
    glyphs,
    asciiStart,
    asciiEnd,
    yAdvance,
  }
}

export const serializeFont = ({
  name,
  bytes,
  glyphs,
  asciiStart,
  asciiEnd,
  yAdvance,
}: GfxFont): string => {
  return `const uint8_t ${name}Bitmaps[] PROGMEM = ${uint8ToString(bytes)};

const GFXglyph ${name}Glyphs[] PROGMEM = {
${glyphs
  .map((glyph, index) => `  ${glyphToString(asciiStart + index, glyph)}`)
  .join('\n')}
};

const GFXfont ${name} PROGMEM = {
  (uint8_t *)${name}Bitmaps,
  (GFXglyph *)${name}Glyphs,
  ${asciiStart}, ${asciiEnd}, ${yAdvance}
};
`
}

const arrayToChunks = (array: any[], size: number): any[][] =>
  array.length > size
    ? [array.slice(0, size), ...arrayToChunks(array.slice(size), size)]
    : [array]

const uint8ToString = (buffer: Uint8Array) => {
  const hexStrings: string[] = []

  for (let i = 0; i < buffer.length; i++) {
    hexStrings.push('0x' + buffer[i].toString(16).padStart(2, '0'))
  }

  // 12 hex strings fit nicely into a 80 characters line with 2 or 4 spaces
  // indent.
  const hexStringsPerRow = 12
  const innerString = arrayToChunks(hexStrings, hexStringsPerRow)
    .map((row: string[]) => '  ' + row.join(', '))
    .join(',\n')

  return `{\n${innerString}\n}`
}

const glyphToString = (charCode: number, glyph: GfxGlyph) => {
  const pad = (num: number) => num.toString().padStart(4, ' ')

  const str = `{ ${[
    pad(glyph.byteOffset ?? 0),
    pad(glyph.width),
    pad(glyph.height),
    pad(glyph.xAdvance),
    pad(glyph.deltaX),
    pad(glyph.deltaY),
  ].join(', ')} },`

  const char = String.fromCharCode(charCode)
  const isPrintable = !char.match(/[\x00-\x1F\x7F-\x9F\xAD]/g)
  const info = isPrintable ? `'${char}'` : '(non-printable)'

  return str + ` // 0x${charCode.toString(16)} ${info}`
}
