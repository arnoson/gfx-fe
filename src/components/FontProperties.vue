<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { useHistory } from '@/stores/history'
import { getBounds, translatePixels } from '@/utils/pixel'
import { computed, ref } from 'vue'
import FontInput from './FontInput.vue'
import MetricsField from './MetricsField.vue'
import NumberCheckField from './NumberCheckField.vue'
import NumberField from './NumberField.vue'
import SizeField from './SizeField.vue'
import TextField from './TextField.vue'

const font = useFont()
const editor = useEditor()
const history = useHistory()
const clearDialog = ref()

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
    <TextField label="Name" v-model="font.name" />
    <NumberField label="Line Height" :min="1" v-model="font.lineHeight" />
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
</style>
