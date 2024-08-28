<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import type { Glyph } from '@/types'
import { translatePixels } from '@/utils/pixel'
import { measureGlyph, renderGlyph } from '@/utils/text'
import { toRefs } from 'vue'

import DrawIcon from '@/assets/icons/icon-draw.svg'
import SelectIcon from '@/assets/icons/icon-select.svg'
import FillIcon from '@/assets/icons/icon-fill.svg'

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
    <button
      @click="editor.activeToolName = 'draw'"
      :data-active="editor.activeToolName === 'draw'"
    >
      <DrawIcon />
    </button>
    <button
      @click="editor.activeToolName = 'select'"
      :data-active="editor.activeToolName === 'select'"
    >
      <SelectIcon />
    </button>
    <button @click="fill">
      <FillIcon />
    </button>
  </menu>
</template>

<style scoped>
.tools {
  position: fixed;
  top: 1rem;
  right: 1rem;
  flex-direction: column;
  gap: 3px;
  padding: 2px;

  button {
    display: block;
    padding: 1px;

    &[data-active='true'] {
      color: var(--color-accent);
    }

    svg {
      display: block;
    }
  }
}
</style>
