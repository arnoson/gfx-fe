<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useDropzone } from 'vue3-dropzone'

const editor = useEditor()

const onDrop = async ([file]: File[]) => {
  const code = await file.text()
  editor.load(code)
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
    <button @click="open">Load</button>
    <div class="drop-hint">or drop file</div>
  </div>
</template>

<style scoped>
.drop-zone {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  color: var(--color-panel-background);
  overflow: hidden;

  /* Looks a bit better with the other font infos below. */
  margin-left: -0.1rem;

  padding: 0.75rem;
  border: 1px solid var(--color-grid);
  border-radius: 4px;

  &[data-drag-active='true'] {
    color: var(--color-text);
    background-color: var(--color-accent);
    border-color: var(--color-accent);
  }
}

.drop-hint {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
