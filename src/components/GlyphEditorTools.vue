<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import type { Glyph } from '@/types'
import { translatePixels } from '@/utils/pixel'
import { measureGlyph, renderGlyph } from '@/utils/text'
import { toRefs } from 'vue'

const props = defineProps<{ glyph: Glyph }>()
const { glyph } = toRefs(props)

const font = useFont()
const history = useHistory()
const editor = useEditor()

const fill = () => {
  const { bearing } = measureGlyph(glyph.value.code)
  glyph.value.bearing = bearing

  const pixels = renderGlyph(glyph.value.code)
  font.setGlyphPixels(glyph.value, pixels)

  const { left, width } = glyph.value.bounds
  const centeredLeft = Math.round((editor.canvas.width - width) / 2)
  const centeredPixels = translatePixels(pixels, centeredLeft - left, 0)
  font.setGlyphPixels(glyph.value, centeredPixels)

  history.saveState(glyph.value)
}
</script>

<template>
  <menu class="tools panel">
    <button @click="editor.activeToolName = 'draw'">D</button>
    <button @click="editor.activeToolName = 'select'">S</button>
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
