<script setup lang="ts">
import { getInputId } from '@/utils/id'
import { useSlots } from 'vue'

defineProps<{ label: string }>()
const model = defineModel<string>({ required: true })
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
      type="text"
      v-model="model"
      :aria-describedby="hasInfo ? infoId : undefined"
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
