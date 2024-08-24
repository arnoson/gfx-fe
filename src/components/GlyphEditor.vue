<script setup lang="ts">
import { useFont } from '@/stores/font'
import {
  packPixel,
  pixelIsCropped,
  unpackPixelX,
  unpackPixelY,
} from '@/utils/pixel'
import {
  useActiveElement,
  useElementSize,
  useMagicKeys,
  whenever,
} from '@vueuse/core'
import { computed, ref } from 'vue'
import GlyphEditorTools from './GlyphEditorTools.vue'
import { logicAnd } from '@vueuse/math'

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

const glyphGuide = ref<SVGTextElement>()
const { width: glyphGuideWidth } = useElementSize(glyphGuide)

const canvasWidth = computed(() => font.canvas.width)
const canvasHeight = computed(() => font.canvas.height)
const maxPixelSize = 50

const container = ref<HTMLDivElement>()
const { width: containerWidth, height: containerHeight } =
  useElementSize(container)
const glyphScale = computed(() => {
  // Scale factors to fit the canvas within the container.
  const scaleWidth = containerWidth.value / canvasWidth.value
  const scaleHeight = containerHeight.value / canvasHeight.value

  // Scale factors to fit within the canvas' max dimensions.
  const scaleMaxWidth = (canvasWidth.value * maxPixelSize) / canvasWidth.value
  const scaleMaxHeight =
    (canvasHeight.value * maxPixelSize) / canvasHeight.value

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

const endDraw = () => {
  isDrawing = false
  font.addHistoryEntry()
}

const mouseToPixel = ({ offsetX, offsetY }: MouseEvent) => {
  const scale = 1 / glyphScale.value
  let x = Math.floor(offsetX * scale)
  let y = Math.floor(offsetY * scale)
  x = Math.max(0, Math.min(x, font.canvas.width - 1))
  y = Math.max(0, Math.min(y, font.canvas.height - 1))
  return packPixel(x, y)
}

const { Ctrl_z, Ctrl_y } = useMagicKeys()
const activeElement = useActiveElement()
const notUsingInput = computed(
  () =>
    activeElement.value?.tagName !== 'INPUT' &&
    activeElement.value?.tagName !== 'TEXTAREA',
)
whenever(logicAnd(Ctrl_z, notUsingInput), () => font.undo())
whenever(logicAnd(Ctrl_y, notUsingInput), () => font.redo())
</script>

<template>
  <div class="editor" v-if="font.activeGlyphCode !== undefined && glyph">
    <div class="canvas-container" ref="container">
      <svg
        :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
        class="canvas"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
      >
        <!-- Pixels  -->
        <rect
          v-for="pixel of glyph.pixels"
          :x="unpackPixelX(pixel)"
          :y="unpackPixelY(pixel)"
          :data-cropped="pixelIsCropped(pixel, canvasWidth, canvasHeight)"
          width="1"
          height="1"
          class="pixel"
        ></rect>
        <!-- Grid -->
        <g>
          <rect
            :x="0"
            :y="0"
            :width="canvasWidth"
            :height="canvasHeight"
            class="grid"
          />
          <line
            v-for="row in canvasHeight - 1"
            :hidden="row === font.baseline ? true : undefined"
            :x1="0"
            :y1="row"
            :x2="canvasWidth"
            :y2="row"
            class="grid"
          />
          <line
            v-for="column in canvasWidth - 1"
            :x1="column"
            :y1="0"
            :x2="column"
            :y2="canvasHeight"
            class="grid"
          />
        </g>
        <!-- Baseline -->
        <line
          :x1="0"
          :y1="font.baseline"
          :x2="canvasWidth"
          :y2="font.baseline"
          class="baseline"
        />
        <g>
          <!-- Metrics Guides -->
          <line
            v-if="font.metrics.ascender"
            :x1="0"
            :y1="font.baseline + font.metrics.ascender"
            :x2="canvasWidth"
            :y2="font.baseline + font.metrics.ascender"
            class="metrics-guide"
          />
          <line
            v-if="font.metrics.capHeight"
            :x1="0"
            :y1="font.baseline + font.metrics.capHeight"
            :x2="canvasWidth"
            :y2="font.baseline + font.metrics.capHeight"
            class="metrics-guide"
          />
          <line
            v-if="font.metrics.xHeight"
            :x1="0"
            :y1="font.baseline + font.metrics.xHeight"
            :x2="canvasWidth"
            :y2="font.baseline + font.metrics.xHeight"
            class="metrics-guide"
          />
          <line
            v-if="font.metrics.descender"
            :x1="0"
            :y1="font.baseline + font.metrics.descender"
            :x2="canvasWidth"
            :y2="font.baseline + font.metrics.descender"
            class="metrics-guide"
          />
        </g>
        <!-- Bounds -->
        <rect
          :x="glyph.bounds.left"
          :y="glyph.bounds.top"
          :width="glyph.bounds.width"
          :height="glyph.bounds.height"
          class="bounds"
        />
        <!-- Bearings -->
        <g>
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
        </g>
        <!-- Glyph Guide -->
        <text
          v-if="glyph.guide.enabled && font.basedOn.name"
          ref="glyphGuide"
          class="glyph-guide"
          :x="(canvasWidth - glyphGuideWidth / glyphScale) / 2"
          :y="font.baseline"
        >
          {{ String.fromCharCode(font.activeGlyphCode) }}
        </text>
      </svg>
    </div>
    <div class="panel properties">
      <input type="number" v-model="glyph.bearing.left" min="0" />
      <header>{{ char }}</header>
      <input type="number" v-model="glyph.bearing.right" min="0" />
    </div>
    <GlyphEditorTools />
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  height: 100%;

  /* properties menu size + block margin */
  --properties-height: calc(1.68rem + 2rem);
  @supports (position-anchor: --canvas) {
    /* Make room for the floating properties menu. */
    padding-bottom: var(--properties-height);
  }
}

.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 100%;
  flex: 1;
}

.canvas {
  anchor-name: --canvas;
  display: block;
  width: calc(v-bind('canvasWidth') * v-bind('glyphScale') * 1px);
  height: calc(v-bind('canvasHeight') * v-bind('glyphScale') * 1px);
  overflow: visible;

  .pixel {
    fill: var(--color-text);
    &[data-cropped='true'] {
      fill: var(--color-grid);
    }
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

  .metrics-guide {
    stroke: var(--color-guide);
    stroke-dasharray: 3;
    vector-effect: non-scaling-stroke;
  }

  .glyph-guide {
    fill: none;
    stroke: var(--color-guide);
    /* For some reason non-scaling-stroke affects dash-array different on text,
    so we have to make it a bit bigger to optically match the metrics-guide. */
    stroke-dasharray: 6;
    vector-effect: non-scaling-stroke;
    font-size: 18pt;
    mix-blend-mode: difference;
    /* Increase the stroke slightly, otherwise parts will get lost with the blend mode. */
    stroke-width: 1.5;
    font-family: v-bind('font.basedOn.name');
    font-size: v-bind('`${font.basedOn.size}pt`');
    pointer-events: none;
    user-select: none;
  }

  .bearing {
    fill: var(--color-bounds);
    stroke: var(--color-bounds);
    vector-effect: non-scaling-stroke;
  }
}

.properties {
  @supports (position-anchor: --canvas) {
    right: anchor(center);
    position: fixed;
    bottom: calc(anchor(bottom) - var(--properties-height));
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
