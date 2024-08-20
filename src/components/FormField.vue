<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <label class="field">
    {{ label }}
    <slot></slot>
  </label>
</template>
