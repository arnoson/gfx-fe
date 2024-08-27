<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import FontUpload from './FontUpload.vue'
import MetricsField from './MetricsField.vue'
import NumberCheckField from './NumberCheckField.vue'
import NumberField from './NumberField.vue'
import SizeField from './SizeField.vue'
import SliderField from './SliderField.vue'
import TextField from './TextField.vue'

const font = useFont()
const editor = useEditor()
</script>

<template>
  <div class="font-info flow">
    <div class="load-save">
      <FontUpload />
      <button @click="editor.save()">Save</button>
    </div>

    <TextField label="Name" v-model="font.name" />
    <NumberField label="Line Height" :min="1" v-model="font.lineHeight" />
    <NumberCheckField
      label="Baseline"
      label-check="Move Glyphs"
      v-model:value="font.baseline"
      v-model:check="font.moveGlyphsWithBaseline"
    />
    <MetricsField label="Metrics" v-model="font.metrics" />
    <SizeField label="Canvas" v-model="editor.canvas" :min="1" :max="128" />

    <details class="flow">
      <summary>
        Based on <em>{{ font.basedOn.name }}</em>
      </summary>
      <TextField label="Font" v-model="font.basedOn.name" />
      <NumberField label="Size" v-model="font.basedOn.size" unit="px" />
      <SliderField
        label="Threshold"
        :min="1"
        :max="254"
        v-model="font.basedOn.threshold"
      />
    </details>
  </div>
</template>

<style scoped>
.font-info {
  padding-top: 1rem;
  padding-inline: 1rem;
}

.load-save {
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: baseline;
  gap: 0.75rem;
}
</style>
