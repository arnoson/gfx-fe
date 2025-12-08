<script setup lang="ts">
import type { Metrics } from '@/types'
import { getInputId } from 'tool-toolkit'

defineProps<{ label: string }>()
const model = defineModel<Metrics>({ required: true })
const id = getInputId()

const update = (e: InputEvent, key: keyof Metrics) => {
  let value = (e.target as any).value
  value = value === '' ? undefined : parseFloat(value)
  model.value[key] = value
}
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="metrics">
      <input
        type="number"
        placeholder="Asc"
        title="Ascender"
        :value="model.ascender"
        @input="update($event, 'ascender')"
      />
      <input
        type="number"
        placeholder="Cap"
        title="Cap-Height"
        :value="model.capHeight"
        @input="update($event, 'capHeight')"
      />
      <input
        type="number"
        placeholder="x"
        title="x-Height"
        :value="model.xHeight"
        @input="update($event, 'xHeight')"
      />
      <input
        type="number"
        placeholder="Des"
        title="Descender"
        :value="model.descender"
        max="0"
        @input="update($event, 'descender')"
      />
    </div>
  </div>
</template>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}
</style>
