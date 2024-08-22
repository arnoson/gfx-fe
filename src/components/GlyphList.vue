<script setup lang="ts">
import { useFont } from '@/stores/font'
import { computed } from 'vue'

const font = useFont()
const count = computed(() => font.glyphs.size)
const getCharName = (code: number) => {
  const char = String.fromCharCode(code)
  return char === ' ' ? 'Space' : char
}
</script>

<template>
  <div class="glyph-list">
    <header class="header">
      <h2 v-if="count">{{ count }} Glyphs:</h2>
      <h2 v-else>No Glyphs yet</h2>
    </header>

    <div class="grid">
      <a
        v-for="[code, glyph] of font.glyphs"
        :href="`/#/glyph/${code}`"
        :data-active="font.activeGlyphCode === code"
      >
        <article class="canvas">
          <svg :viewBox="`0 0 ${font.canvas.width} ${font.canvas.height}`">
            <use :href="`#glyph-${code}`" :x="glyph.bounds.left" />
          </svg>
          <header class="glyph-name">{{ getCharName(code) }}</header>
        </article>
      </a>
    </div>
  </div>
</template>

<style scoped>
.header {
  padding-inline: 1rem;
  padding-bottom: 0.5rem;
}

.glyph-list {
  overflow: hidden;
  display: grid;
  grid-template-rows: max-content 1fr;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  gap: 0.5rem;
  padding-inline: 1rem;
  overflow-y: auto;
}

.glyph-name {
  text-align: center;
  margin-bottom: 0.25em;
}

.canvas {
  border: 1px solid var(--color-grid);
  border-radius: 4px;

  &:hover {
    background-color: var(--color-grid);
  }

  [data-active='true'] > & {
    background-color: var(--color-highlight);
    border-color: var(--color-highlight);
  }
}
</style>
