<script setup lang="ts">
import { useFont } from '@/stores/font'
import { getBounds, translatePixels } from '@/utils/pixel'
import { measureGlyph, renderGlyph } from '@/utils/text'

const font = useFont()

const clear = () => {
  const code = font.activeGlyphCode
  if (code === undefined) return

  font.clearGlyph(code)
  font.addHistoryEntry(code)
}

const fill = () => {
  const glyph = font.activeGlyph
  if (!glyph) return

  const { bearing } = measureGlyph(glyph.code)
  glyph.bearing = bearing

  const pixels = renderGlyph(glyph.code)

  glyph.pixels = pixels
  glyph.bounds = getBounds(pixels)
  const { left, width } = glyph.bounds
  const centeredLeft = Math.round((font.canvas.width - width) / 2)
  glyph.pixels = translatePixels(pixels, centeredLeft - left, 0)
  glyph.bounds = getBounds(glyph.pixels)
  font.addHistoryEntry(glyph.code)
}
</script>

<template>
  <menu class="tools panel">
    <button @click="clear">C</button>
    <button @click="fill">A</button>
  </menu>
</template>

<style scoped>
.tools {
  position: fixed;
  top: 1rem;
  right: 1rem;
  flex-direction: column;
  gap: 0.2rem;

  button {
    display: block;
    height: 1lh;
    aspect-ratio: 1;
    padding: 0;
  }
}
</style>
