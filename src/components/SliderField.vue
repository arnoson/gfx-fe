<script setup lang="ts">
import { getInputId } from '@/utils/id'
import { useSlots } from 'vue'

defineProps<{ label: string; min?: number; max?: number; step?: number }>()
const model = defineModel<number>({ required: true })
const id = getInputId()
const infoId = `info-${id}`

const slots = useSlots()
const hasInfo = !!slots.info
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :aria-describedby="hasInfo ? infoId : undefined"
      :value="model"
      @input="model = +($event.target as HTMLInputElement).value"
    />
    <div class="info" v-if="hasInfo" :id="`info-${id}`">
      <slot name="info"></slot>
    </div>
  </div>
</template>

<style scoped>
.info {
  color: hsl(0 0% 50% / 1);
  padding-inline: 0.5rem;
  grid-column: span 2;
}
</style>
