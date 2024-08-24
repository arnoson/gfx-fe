<script setup lang="ts">
defineProps<{ unit: string }>()
</script>

<template>
  <div class="input-unit">
    <slot></slot>
    <span>{{ unit }}</span>
  </div>
</template>

<style scoped>
.input-unit {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 0.5rem;
  align-items: center;
}
</style>
