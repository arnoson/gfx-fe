<script setup lang="ts">
import type { Metrics } from '@/types'
import { getInputId } from '@/utils/id'

defineProps<{ label: string }>()
const model = defineModel<Metrics>({ required: true })
const id = getInputId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="metrics">
      <input
        type="number"
        placeholder="Asc"
        title="Ascender"
        v-model="model.ascender"
      />
      <input
        type="number"
        placeholder="Cap"
        title="Cap-Height"
        v-model="model.capHeight"
      />
      <input
        type="number"
        placeholder="x"
        title="x-Height"
        v-model="model.xHeight"
      />
      <input
        type="number"
        placeholder="Des"
        title="Descender"
        v-model="model.descender"
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
