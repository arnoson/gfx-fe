<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { getBounds, translatePixels } from '@/utils/pixel'
import { computed } from 'vue'
import { NumberField, SizeField } from 'tool-toolkit'
import FontInput from './FontInput.vue'
import MetricsField from './MetricsField.vue'
import NumberCheckField from './NumberCheckField.vue'

const font = useFont()
const editor = useEditor()

const baseline = computed({
  get: () => font.baseline,
  set: (newBaseline: number) => {
    if (font.moveGlyphsWithBaseline) {
      const delta = newBaseline - font.baseline
      for (const [_, glyph] of font.glyphs) {
        glyph.pixels = translatePixels(glyph.pixels, 0, delta)
        glyph.bounds = getBounds(glyph.pixels)
      }
    }
    font.baseline = newBaseline
  },
})
</script>

<template>
  <div class="font-info flow">
    <NumberField label="Leading" :min="1" v-model="font.lineHeight" />
    <NumberCheckField
      label="Baseline"
      label-check="Move Glyphs"
      v-model:value="baseline"
      v-model:check="font.moveGlyphsWithBaseline"
    />
    <MetricsField label="Metrics" v-model="font.metrics" />
    <SizeField label="Canvas" v-model="editor.canvas" :min="1" :max="128" />

    <details class="flow">
      <summary>
        Based on <em>{{ font.basedOn.name }}</em>
      </summary>
      <FontInput v-model="font.basedOn" />
    </details>
  </div>
</template>

<style scoped>
.font-info {
  padding-top: 1rem;
  padding-inline: 1rem;
}

summary {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
