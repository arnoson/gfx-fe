import { useFont } from '@/stores/font'
import { Font, Glyph, Path } from 'opentype.js'
import { unpackPixel } from './pixel'

export const fontToOtf = () => {
  const font = useFont()

  const notdefGlyph = new Glyph({
    name: '.notdef',
    unicode: undefined,
    advanceWidth: 500,
    path: new Path(),
  })

  const glyphs: Glyph[] = [notdefGlyph]
  const unitsPerEm = 1000
  const scale = unitsPerEm / font.lineHeight

  for (const [code, { pixels, bounds, bearing }] of font.glyphs) {
    const path = new Path()

    for (const pixel of pixels) {
      const coords = unpackPixel(pixel)
      const x = (coords.x - bounds.left + bearing.left) * scale
      const y = (font.baseline - coords.y) * scale

      path.moveTo(x, y)
      path.lineTo(x + scale, y)
      path.lineTo(x + scale, y + scale)
      path.lineTo(x, y + scale)
      path.closePath()
    }

    const glyph = new Glyph({
      name: getGlyphName(code),
      unicode: code,
      advanceWidth: (bearing.left + bounds.width + bearing.right) * scale,
      leftSideBearing: bearing.left * scale,
      path,
    })
    glyphs.push(glyph)
  }

  const {
    ascender = font.lineHeight * 0.8,
    descender = font.lineHeight * 0.2,
  } = font.metrics

  return new Font({
    familyName: font.name,
    styleName: 'Regular',
    unitsPerEm,
    ascender: ascender * scale,
    descender: descender * scale,
    glyphs,
  })
}

const getGlyphName = (code: number): string => {
  const char = String.fromCharCode(code)

  // Common character name mappings
  const nameMap: Record<number, string> = {
    32: 'space',
    33: 'exclam',
    34: 'quotedbl',
    35: 'numbersign',
    36: 'dollar',
    37: 'percent',
    38: 'ampersand',
    39: 'quotesingle',
    40: 'parenleft',
    41: 'parenright',
    42: 'asterisk',
    43: 'plus',
    44: 'comma',
    45: 'hyphen',
    46: 'period',
    47: 'slash',
    58: 'colon',
    59: 'semicolon',
    60: 'less',
    61: 'equal',
    62: 'greater',
    63: 'question',
    64: 'at',
    91: 'bracketleft',
    92: 'backslash',
    93: 'bracketright',
    94: 'asciicircum',
    95: 'underscore',
    96: 'grave',
    123: 'braceleft',
    124: 'bar',
    125: 'braceright',
    126: 'asciitilde',
  }

  if (nameMap[code]) {
    return nameMap[code]
  }

  // For alphanumeric characters
  if (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  ) {
    return char
  }

  // Fallback: use unicode codepoint
  return `uni${code.toString(16).toUpperCase().padStart(4, '0')}`
}
