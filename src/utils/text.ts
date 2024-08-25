import { useFont } from '@/stores/font'
import { packPixel, type Pixels } from './pixel'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d', { willReadFrequently: true })!
canvas.width = 128
canvas.height = 128
canvas.style.background = 'white'

document.body.append(canvas)

export const measureGlyph = (code: number) => {
  const font = useFont()
  const { name, size } = font.basedOn

  // We are using very small font sizes for our pixels fonts. To get the
  // measurement more accurate we scale up the font.
  const scaleUp = 10

  const char = String.fromCharCode(code)
  ctx.font = `${size * scaleUp}pt '${name}'`
  const metrics = ctx.measureText(char)

  return {
    bearing: {
      left: Math.round(Math.abs(metrics.actualBoundingBoxLeft) / scaleUp),
      right: Math.round(
        Math.abs(metrics.width - metrics.actualBoundingBoxRight) / scaleUp,
      ),
    },
  }
}

export const renderGlyph = (code: number): Pixels => {
  const font = useFont()
  const { name, size, threshold } = font.basedOn

  const char = String.fromCharCode(code)

  canvas.width = font.canvas.width
  canvas.height = font.canvas.height

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'black'
  ctx.font = `${size}pt '${name}'`
  ctx.fillText(char, 0, font.baseline)

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // Threshold is between black and white, but we need it to be to other way
  // round, since we render our text black on white.
  const thresholdInverse = 255 - threshold

  console.log(threshold)

  const pixels = new Set<number>()
  for (var i = 0; i < data.length; i += 4) {
    const g = data[i + 1]
    const b = data[i + 2]
    const r = data[i]

    // Calculate grayscale value using luminance formula.
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    if (gray > thresholdInverse) continue

    const pixelIndex = i / 4
    const x = pixelIndex % canvas.width
    const y = Math.floor(pixelIndex / canvas.width)

    pixels.add(packPixel(x, y))
  }

  return pixels
}
