<script setup lang="ts">
import { useFont } from '@/stores/font'
import TextField from './TextField.vue'
const font = useFont()
</script>

<template>
  <div class="font-info flow">
    <h2>Font:</h2>
    <div class="field">
      <label for="font-height-input">Height</label>
      <input type="number" id="font-height-input" v-model="font.height" />
    </div>
    <div class="field">
      <label for="font-baseline-input">Baseline</label>
      <input type="number" id="font-baseline-input" v-model="font.baseline" />
    </div>
    <div class="field">
      <label for="font-name"></label>
    </div>
  </div>
</template>
