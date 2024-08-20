<script setup lang="ts">
import { useFont } from '@/stores/font'
import { packPixel, unpackPixelX, unpackPixelY } from '@/utils/pixel'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'

const font = useFont()

const char = computed(() => {
  const code = font.activeGlyphCode
  if (code === undefined) return

  const char = String.fromCharCode(code)
  return char === ' ' ? 'Space' : char
})

const glyph = computed(
  () => font.activeGlyphCode && font.glyphs.get(font.activeGlyphCode),
)

const width = computed(() => font.height)
const height = width

const maxPixelSize = 50

const container = ref<HTMLDivElement>()
const { width: containerWidth, height: containerHeight } =
  useElementSize(container)
const glyphScale = computed(() => {
  // Scale factors to fit the canvas within the container.
  const scaleWidth = containerWidth.value / width.value
  const scaleHeight = containerHeight.value / height.value

  // Scale factors to fit within the canvas' max dimensions.
  const scaleMaxWidth = (width.value * maxPixelSize) / width.value
  const scaleMaxHeight = (height.value * maxPixelSize) / height.value

  // Combine the scale factors to ensure the element fits within both
  // constraints.
  const scaleContainer = Math.min(scaleWidth, scaleHeight)
  const scaleMax = Math.min(scaleMaxWidth, scaleMaxHeight)
  return Math.min(scaleContainer, scaleMax)
})

let isDrawing = false
let drawingPixelValue = true
const startDraw = (e: MouseEvent) => {
  if (!font.activeGlyphCode || !glyph.value) return

  isDrawing = true
  const pixel = mouseToPixel(e)
  // Toggle the color.
  drawingPixelValue = !glyph.value.pixels.has(pixel)
  font.setGlyphPixel(font.activeGlyphCode, pixel, drawingPixelValue)
}

const draw = (e: MouseEvent) => {
  if (!font.activeGlyphCode || !isDrawing) return
  const pixel = mouseToPixel(e)
  font.setGlyphPixel(font.activeGlyphCode, pixel, drawingPixelValue)
}

const endDraw = () => (isDrawing = false)

const mouseToPixel = ({ offsetX, offsetY }: MouseEvent) => {
  const scale = 1 / glyphScale.value
  let x = Math.floor(offsetX * scale)
  let y = Math.floor(offsetY * scale)
  x = Math.max(0, Math.min(x, width.value - 1))
  y = Math.max(0, Math.min(y, height.value - 1))
  return packPixel(x, y)
}
</script>

<template>
  <div class="editor" v-if="glyph">
    <div class="canvas-container" ref="container">
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="canvas"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
      >
        <rect
          v-for="pixel of glyph.pixels"
          :x="unpackPixelX(pixel)"
          :y="unpackPixelY(pixel)"
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
      <input type="number" v-model="glyph.bearing.left" min="0" />
      <header>{{ char }}</header>
      <input type="number" v-model="glyph.bearing.right" min="0" />
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: grid;
  grid-template-rows: 1fr max-content;
  height: 100%;
  overflow: hidden;
  padding: 1rem;

  /* properties menu size + block margin */
  --properties-height: calc(1.68rem + 2rem);
  @supports (position-anchor: --preview) {
    /* Make room for the floating properties menu. */
    padding-bottom: var(--properties-height);
  }
}

.canvas-container {
  display: grid;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas {
  anchor-name: --glyph;
  display: block;
  width: calc(v-bind('width') * v-bind('glyphScale') * 1px);
  height: calc(v-bind('height') * v-bind('glyphScale') * 1px);
  overflow: visible;

  .pixel {
    fill: var(--color-text);
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
}

.properties {
  @supports (position-anchor: --preview) {
    right: anchor(center);
    position: fixed;
    bottom: calc(anchor(bottom) - var(--properties-height));
    transform: translateX(50%);
    position-anchor: --glyph;
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
