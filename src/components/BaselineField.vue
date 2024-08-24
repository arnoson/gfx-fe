<script setup lang="ts">
import { getInputId } from '@/utils/id'

defineProps<{ label: string }>()
const value = defineModel<number>('value', { required: true })
const moveGlyphs = defineModel<boolean>('moveGlyphs', { required: true })
const id = getInputId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="inputs">
      <input :id="id" type="number" min="0" v-model="value" />
      <label class="move-glyphs">
        Move Glyphs
        <input type="checkbox" v-model="moveGlyphs" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.inputs {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 0.5rem;
}

.move-glyphs {
  display: flex;
  align-items: center;
}
</style>
