<script setup lang="ts">
import { useFont } from '@/stores/font'
const font = useFont()
</script>

<template>
  <svg class="defs">
    <defs>
      <g v-for="[code, glyph] of font.glyphs" :id="`glyph-${code}`">
        <rect
          v-for="pixel of glyph.pixels"
          :x="((pixel >> 8) & 0xff) - glyph.bounds.left"
          :y="pixel & 0xff"
          width="1"
          height="1"
          class="pixel"
        ></rect>
      </g>
    </defs>
  </svg>
</template>

<style scoped>
.defs {
  display: none;
}

.pixel {
  fill: var(--color-text);
}
</style>
