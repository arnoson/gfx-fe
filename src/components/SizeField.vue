<script setup lang="ts">
import type { Size } from '@/types'
import { getInputId } from '@/utils/id'

defineProps<{ label: string; min?: number; max?: number; step?: number }>()
const model = defineModel<Size>({ required: true })
const id = getInputId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="inputs">
      <input
        type="number"
        :min="min"
        :max="max"
        :step="step"
        v-model="model.width"
      />×
      <input
        type="number"
        :min="min"
        :max="max"
        :step="step"
        v-model="model.height"
      />
    </div>
  </div>
</template>

<style scoped>
.inputs {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr min-content 1fr;
}
</style>
