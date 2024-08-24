<script setup lang="ts">
import { getInputId } from '@/utils/id'

defineProps<{
  label: string
  unit?: string
  min?: number
  max?: number
  step?: number
}>()
const model = defineModel<number>({ required: true })
const id = getInputId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="input-unit">
      <input
        :id="id"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        v-model="model"
      />
      <div class="unit" v-if="unit">{{ unit }}</div>
    </div>
  </div>
</template>

<style scoped>
.input-unit {
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  gap: 0.5rem;

  input {
    flex: 1;
  }
}
</style>
