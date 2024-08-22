<script setup lang="ts">
import { useFont } from '@/stores/font'
import FormField from './FormField.vue'
import FontImport from './FontImport.vue'
const font = useFont()
</script>

<template>
  <div class="font-info flow">
    <div class="import-export">
      <FontImport />
      <button @click="font.save()">Save</button>
    </div>

    <FormField label="Name">
      <input v-model="font.name" />
    </FormField>

    <FormField label="Line Height">
      <input type="number" min="1" v-model="font.lineHeight" />
    </FormField>

    <FormField label="Baseline">
      <div class="baseline">
        <input type="number" min="1" v-model="font.baseline" />
        <label class="inline-checkbox">
          Move Glyphs
          <input type="checkbox" v-model="font.moveGlyphsWithBaseline" />
        </label>
      </div>
    </FormField>

    <FormField label="Canvas">
      <div class="size-input">
        <input type="number" min="1" max="128" v-model="font.canvas.width" />×
        <input type="number" min="1" max="128" v-model="font.canvas.height" />
      </div>
    </FormField>
  </div>
</template>

<style scoped>
.font-info {
  padding-inline: 1rem;
}

.import-export {
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: baseline;
  gap: 0.75rem;
}

.size-input {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr min-content 1fr;
}

.baseline {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 0.5rem;
}

.inline-checkbox {
  display: flex;
  align-items: center;
}
</style>
