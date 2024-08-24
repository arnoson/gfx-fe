<script setup lang="ts">
import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import type { Glyph } from '@/types'
import { onKeyStroke, useActiveElement } from '@vueuse/core'
import { computed, toRefs } from 'vue'
import GlyphEditorCanvas from './GlyphEditorCanvas.vue'
import GlyphEditorTools from './GlyphEditorTools.vue'

const props = defineProps<{ glyph: Glyph }>()
const { glyph } = toRefs(props)

const font = useFont()
const history = useHistory()

const char = computed(() => {
  const char = String.fromCharCode(glyph.value.code)
  return char === ' ' ? 'Space' : char
})

const activeElement = useActiveElement()
const activeElementIsInput = computed(() => {
  const tagName = activeElement.value?.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA'
})

onKeyStroke('z', (e) => {
  if (!e.ctrlKey || activeElementIsInput.value) return
  history.undo(glyph.value.code)
})

onKeyStroke('y', (e) => {
  if (!e.ctrlKey || activeElementIsInput.value) return
  history.redo(glyph.value.code)
})
</script>

<template>
  <div class="editor" v-if="font.activeGlyphCode !== undefined && glyph">
    <GlyphEditorCanvas :glyph="glyph" />
    <GlyphEditorTools :glyph="glyph" />
    <div class="panel info">
      <input type="number" v-model="glyph.bearing.left" min="0" />
      <header>{{ char }}</header>
      <input type="number" v-model="glyph.bearing.right" min="0" />
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  height: 100%;

  /* info size + block margin */
  --info-height: calc(1.68rem + 2rem);
  @supports (position-anchor: --canvas) {
    /* Make room for the floating properties menu. */
    padding-bottom: var(--info-height);
  }
}

.info {
  @supports (position-anchor: --canvas) {
    right: anchor(center);
    position: fixed;
    bottom: calc(anchor(bottom) - var(--info-height));
    transform: translateX(50%);
    position-anchor: --canvas;
  }

  display: flex;
  gap: 1rem;
  margin-block: 1rem;

  input {
    width: 2ch;
    background-color: var(--color-bounds);
    color: var(--color-text);
    &:first-of-type {
      text-align: right;
    }
  }
}
</style>
