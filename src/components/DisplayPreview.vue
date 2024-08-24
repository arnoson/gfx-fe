<script setup lang="ts">
import { useFont } from '@/stores/font'
import { computed, ref } from 'vue'

const font = useFont()
const text = ref('AAA')

const characters = computed(() => {
  const characters: { code: number; x: number; y: number }[] = []
  let x = 0
  let y = 0

  for (const char of text.value) {
    if (char === '\n') {
      x = 0
      y += font.lineHeight
      continue
    }

    const code = char.charCodeAt(0)
    const glyph = font.glyphs.get(code)
    if (!glyph) continue

    x += glyph.bearing.left
    characters.push({ code, x, y })
    x += glyph.bearing.right + glyph.bounds.width
  }
  return characters
})
</script>

<template>
  <div class="preview">
    <svg
      class="display"
      width="145"
      height="106"
      viewBox="0 0 145 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect class="board" width="144.427" height="105.943" rx="12" />
      <rect class="screen" x="8.21329" y="20.9715" width="128" height="64" />
      <svg x="8.21329" y="20.9715" width="128" height="64" viewBox="0 0 128 64">
        <use
          v-for="{ code, x, y } of characters"
          :x="x"
          :y="y"
          :href="`#glyph-${code}`"
        />
      </svg>
      <g class="holes">
        <circle cx="10.74" cy="10.74" r="4.73998" />
        <circle cx="58.5288" cy="6.73997" r="2.56151" />
        <circle cx="67.6518" cy="6.73997" r="2.56151" />
        <circle cx="76.7748" cy="6.73997" r="2.56151" />
        <circle cx="85.8978" cy="6.73997" r="2.56151" />
        <circle cx="10.74" cy="95.203" r="4.73998" />
        <circle cx="133.687" cy="10.74" r="4.73998" />
        <circle cx="133.687" cy="95.203" r="4.73998" />
      </g>
    </svg>
    <div class="text">
      <label for="preview-text-textarea">Preview Text:</label>
      <textarea id="preview-text-textarea" v-model="text" rows="3"></textarea>
    </div>
  </div>
</template>

<style scoped>
.preview {
  height: 100%;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
}

.display {
  width: auto;
  height: 100%;
}

.pixel {
  fill: white;
}

.board {
  fill: var(--color-accent);
}

.holes circle {
  fill: var(--color-background);
  stroke: var(--color-panel-background);
  stroke-width: 1px;
}

.screen {
  fill: var(--color-background);
}

.text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
