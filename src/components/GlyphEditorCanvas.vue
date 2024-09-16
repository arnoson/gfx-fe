<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { useDraw } from '@/tools/draw'
import { useSelect } from '@/tools/select'
import type { Glyph, Tool } from '@/types'
import { pixelIsCropped, unpackPixelX, unpackPixelY } from '@/utils/pixel'
import { useElementSize, useEventListener } from '@vueuse/core'
import { computed, ref, toRef, toRefs, watch } from 'vue'

const props = defineProps<{ glyph: Glyph }>()
const { glyph } = toRefs(props)

const font = useFont()
const editor = useEditor()

const char = computed(() => String.fromCharCode(glyph.value.code))
const canvasWidth = computed(() => editor.canvas.width)
const canvasHeight = computed(() => editor.canvas.height)
const maxPixelSize = 50

const glyphGuide = ref<SVGTextElement>()
const { width: glyphGuideWidth } = useElementSize(glyphGuide)

const container = ref<HTMLDivElement>()
const canvas = ref<HTMLElement>()
const { width: containerWidth, height: containerHeight } =
  useElementSize(container)

const scale = computed(() => {
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

const draw = useDraw({ glyph })
const select = useSelect({ glyph })
const { selectionPolygon, selectedPixels } = select
const tools = { draw, select }

const activeTool = ref<Tool>(draw)
const activeToolName = toRef(() => editor.activeToolName)
watch(activeToolName, (name) => (activeTool.value = tools[name]))

const mouseToCanvas = (
  e: Pick<MouseEvent, 'offsetX' | 'offsetY'>,
  rounding: 'floor' | 'round' | 'ceil' = 'floor',
) => {
  const inverseScale = 1 / scale.value
  const round = Math[rounding]
  let x = round(e.offsetX * inverseScale)
  let y = round(e.offsetY * inverseScale)
  let width = canvasWidth.value
  let height = canvasHeight.value
  if (rounding === 'floor') {
    width -= 1
    height -= 1
  }
  x = Math.max(0, Math.min(x, width))
  y = Math.max(0, Math.min(y, height))
  return { x, y }
}

// Forward canvas mouse and key events to the active tool.
useEventListener(canvas, 'mousedown', (e) => {
  const { onMouseDown, config } = activeTool.value
  onMouseDown?.(mouseToCanvas(e, config?.pointRounding))
})
useEventListener(canvas, 'mousemove', (e) => {
  const { onMouseMove, config } = activeTool.value
  onMouseMove?.(mouseToCanvas(e, config?.pointRounding))
})
useEventListener('mouseup', (e) => {
  if (!canvas.value) return
  const { left, top } = canvas.value?.getBoundingClientRect()
  // Since we listen for the mouseup on the window, we have to get the mouse
  // position relative to the canvas.
  const relativeMousePosition = {
    offsetX: e.clientX - left,
    offsetY: e.clientY - top,
  }
  const { onMouseUp, config } = activeTool.value
  onMouseUp?.(mouseToCanvas(relativeMousePosition, config?.pointRounding))
})
useEventListener('keydown', (e) => activeTool.value.onKeyDown?.(e))

watch(glyph, () => activeTool.value.onGlyphChange?.(glyph.value))
</script>

<template>
  <div
    class="container"
    ref="container"
    :data-selection="
      activeTool.name === 'select' && selectionPolygon.length > 2
    "
  >
    <svg
      :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`"
      class="canvas"
      ref="canvas"
    >
      <!-- Pixels  -->
      <g>
        <rect
          v-for="pixel of glyph.pixels"
          :x="unpackPixelX(pixel)"
          :y="unpackPixelY(pixel)"
          :data-cropped="pixelIsCropped(pixel, canvasWidth, canvasHeight)"
          :data-selected="selectedPixels?.has(pixel)"
          width="1"
          height="1"
          class="pixel"
        ></rect>
      </g>
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
        v-if="glyph.guide.enabled && font.basedOn.name && scale"
        ref="glyphGuide"
        class="glyph-guide"
        :x="(canvasWidth - glyphGuideWidth / scale) / 2"
        :y="font.baseline"
      >
        {{ char }}
      </text>
      <!-- Selection -->
      <polygon
        v-if="activeTool.name === 'select' && selectionPolygon.length > 2"
        class="selection"
        :points="selectionPolygon.map(({ x, y }) => `${x},${y}`).join(' ')"
      />
    </svg>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 100%;
  flex: 1;
}

.canvas {
  anchor-name: --canvas;
  display: block;
  width: calc(v-bind('canvasWidth') * v-bind(scale) * 1px);
  height: calc(v-bind('canvasHeight') * v-bind(scale) * 1px);
  overflow: visible;
}

.pixel {
  fill: var(--color-text);

  &[data-cropped='true'] {
    fill: var(--color-grid);
  }

  [data-selection='true'] &[data-selected='false'] {
    fill: var(--color-grid);
  }
}

.grid {
  fill: none;
  stroke: var(--color-grid);
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

  [data-selection='true'] & {
    display: none;
  }
}

.bounds {
  fill: none;
  stroke: var(--color-bounds);
  vector-effect: non-scaling-stroke;

  [data-selection='true'] & {
    display: none;
  }
}

.bearing {
  fill: var(--color-bounds);
  stroke: var(--color-bounds);
  vector-effect: non-scaling-stroke;

  [data-selection='true'] & {
    display: none;
  }
}

.selection {
  fill: none;
  stroke: var(--color-accent);
  stroke-dasharray: 6;
  vector-effect: non-scaling-stroke;
  animation: selection 0.3s linear infinite;
}

@keyframes selection {
  0% {
    stroke-dashoffset: 0;
  }

  100% {
    stroke-dashoffset: 12;
  }
}
</style>
