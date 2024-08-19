<script setup lang="ts">
import { useFont } from '@/stores/font'
import { computed, ref } from 'vue'

const font = useFont()

const char = computed(() =>
  font.activeGlyphCode ? String.fromCharCode(font.activeGlyphCode) : undefined,
)

const glyph = computed(
  () => font.activeGlyphCode && font.glyphs.get(font.activeGlyphCode),
)

const width = computed(() => font.height)
const height = width

const maxPixelSize = 50
const maxSvgSize = computed(() => `${width.value * maxPixelSize}px`)

const svg = ref<SVGSVGElement>()

let scale = 1
const updateScale = () => {
  if (!svg.value) return
  const bounds = svg.value.getBoundingClientRect()
  scale = width.value / bounds.width
}

let isDrawing = false
let value = true
const startDraw = (e: MouseEvent) => {
  if (!font.activeGlyphCode || !glyph.value) return

  isDrawing = true
  updateScale()
  const pixel = mouseToPixel(e)
  // Toggle the color.
  value = !glyph.value.pixels.has(pixel)
  font.setGlyphPixel(font.activeGlyphCode, pixel, value)
}

const draw = (e: MouseEvent) => {
  if (!font.activeGlyphCode || !isDrawing) return
  const pixel = mouseToPixel(e)
  font.setGlyphPixel(font.activeGlyphCode, pixel, value)
}

const endDraw = () => (isDrawing = false)

const mouseToPixel = ({ offsetX, offsetY }: MouseEvent) => {
  let x = Math.floor(offsetX * scale)
  let y = Math.floor(offsetY * scale)
  x = Math.max(0, Math.min(x, width.value - 1))
  y = Math.max(0, Math.min(y, height.value - 1))
  return (x << 8) | y
}
</script>

<template>
  <div class="editor" v-if="glyph">
    <div class="glyph">
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        ref="svg"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
      >
        <rect
          v-for="pixel of glyph.pixels"
          :x="(pixel >> 8) & 0xff"
          :y="pixel & 0xff"
          width="1"
          height="1"
          class="pixel"
        ></rect>
        <!-- Grid -->
        <rect :x="0" :y="0" :width="width" :height="height" class="grid" />
        <line
          v-for="row in height - 1"
          :hidden="row === font.baseline ? true : undefined"
          :x1="0"
          :y1="row"
          :x2="width"
          :y2="row"
          class="grid"
        />
        <line
          v-for="column in width - 1"
          :x1="column"
          :y1="0"
          :x2="column"
          :y2="height"
          class="grid"
        />
        <!-- Bearings -->
        <rect
          v-if="!!glyph.pixels.size"
          class="bearing"
          :x="glyph.bounds.left - glyph.bearing.left"
          :y="glyph.bounds.top"
          :width="glyph.bearing.left"
          :height="glyph.bounds.height"
        />
        <rect
          v-if="!!glyph.pixels.size"
          class="bearing"
          :x="glyph.bounds.left + glyph.bounds.width"
          :y="glyph.bounds.top"
          :width="glyph.bearing.right"
          :height="glyph.bounds.height"
        />
        <!-- Bounds -->
        <rect
          :x="glyph.bounds.left"
          :y="glyph.bounds.top"
          :width="glyph.bounds.width"
          :height="glyph.bounds.height"
          class="bounds"
        />
        <!-- Baseline -->
        <line
          :x1="0"
          :y1="font.baseline"
          :x2="width"
          :y2="font.baseline"
          class="baseline"
        />
      </svg>
    </div>
    <div class="panel properties">
      <input type="number" v-model="glyph.bearing.left" />
      <header>{{ char }}</header>
      <input type="number" v-model="glyph.bearing.right" />
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: grid;
  grid-template-rows: 1fr max-content;
  height: 100%;
  overflow: hidden;

  @supports (position-anchor: --preview) {
    padding-bottom: 2.7rem;
  }
}
.glyph {
  display: grid;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
svg {
  anchor-name: --glyph;
  display: block;
  width: auto;
  max-width: 100%;
  max-width: min(100%, v-bind(maxSvgSize));
  height: 100%;
  max-height: 100%;
  max-height: min(100%, v-bind(maxSvgSize));
  overflow: visible;
}
.pixel {
  fill: white;
}
.grid {
  fill: none;
  stroke: var(--color-grid);
  vector-effect: non-scaling-stroke;
}
.bounds {
  fill: none;
  stroke: var(--color-bounds);
  vector-effect: non-scaling-stroke;
}
.baseline {
  stroke: var(--color-guide);
  vector-effect: non-scaling-stroke;
}
.bearing {
  fill: var(--color-bounds);
  stroke: var(--color-bounds);
  vector-effect: non-scaling-stroke;
}
.properties {
  right: anchor(center);
  position: fixed;
  bottom: calc(anchor(bottom) - 2.7rem);
  transform: translateX(50%);
  position-anchor: --glyph;

  display: flex;
  gap: 1rem;
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
