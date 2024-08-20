<script setup lang="ts">
import { useFont } from '@/stores/font'
import { useDropzone } from 'vue3-dropzone'

const font = useFont()

const onDrop = async ([file]: File[]) => {
  const code = await file.text()
  font.load(code)
}

const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
  onDrop,
})
</script>

<template>
  <div
    v-bind="getRootProps()"
    class="drop-zone"
    :data-drag-active="isDragActive"
  >
    <input v-bind="getInputProps()" />
    <button @click="open">Import</button>or drop file
  </div>
</template>

<style scoped>
.drop-zone {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  color: var(--color-panel-background);

  margin-inline: -0.1rem;

  padding: 0.75rem;
  border: 1px solid var(--color-grid);
  border-radius: 4px;

  &[data-drag-active='true'] {
    color: var(--color-text);
    background-color: var(--color-highlight);
    border-color: var(--color-highlight);
  }
}
</style>
