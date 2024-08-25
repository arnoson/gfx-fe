<script setup lang="ts">
import { getInputId } from '@/utils/id'

defineProps<{
  label: string
  labelCheck: string
  min?: number
  max?: number
  step?: number
}>()
const value = defineModel<number>('value', { required: true })
const check = defineModel<boolean>('check', { required: true })
const id = getInputId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="inputs">
      <input
        :id="id"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        v-model="value"
      />
      <label class="move-glyphs">
        <div class="label-text">{{ labelCheck }}</div>
        <input type="checkbox" v-model="check" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.inputs {
  display: flex;
  overflow: hidden;
  gap: 0.5rem;

  input {
    flex: 1;
  }
}

.move-glyphs {
  display: flex;
  align-items: center;

  .label-text {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
}
</style>
