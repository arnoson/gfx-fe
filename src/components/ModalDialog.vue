<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'

const dialog = ref<HTMLDialogElement>()
const content = ref<HTMLDivElement>()

const open = () => dialog.value?.showModal()
const close = () => dialog.value?.close()
const prompt = () => {
  open()
  return new Promise((resolve) => {
    useEventListener(
      dialog,
      'close',
      () => resolve(dialog.value?.returnValue),
      { once: true },
    )
  })
}

const closeOnOutside = (e: MouseEvent) => {
  if (!content.value?.contains(e.target as Element)) close()
}

defineExpose({ open, close, prompt })
</script>

<template>
  <dialog ref="dialog" @mousedown="closeOnOutside">
    <div ref="content">
      <slot :open="open" :close="close"></slot>
    </div>
  </dialog>
</template>
