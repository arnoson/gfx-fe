<script setup lang="ts">
import { useEditor } from '@/stores/editor'
import { useFont } from '@/stores/font'
import { computed, useTemplateRef } from 'vue'
import { FramesList } from 'vue-toolkit'
import AddGlyphsDialog from './AddGlyphsDialog.vue'
import ModalDialog from './ModalDialog.vue'

const font = useFont()
const editor = useEditor()

const frames = computed(() =>
  font.glyphsList
    .map((v) => ({ ...v, id: v.code, name: getCharName(v.code) }))
    .sort((a, b) => a.code - b.code),
)

const getCharName = (code: number) => {
  const char = String.fromCharCode(code)
  return char === ' ' ? 'Space' : char
}

const addGlyphsDialog = useTemplateRef('addGlyphsDialog')
const removeConfirmDialog = useTemplateRef('removeConfirmDialog')

const remove = async (code: number) => {
  const result = await removeConfirmDialog.value?.prompt()
  if (result !== 'submit') return
  font.removeGlyph(code)
}
</script>

<template>
  <FramesList
    class="glyphs"
    :model-value="frames"
    :selected="editor.activeGlyph?.code"
    size="small"
    @update:selected="$event !== undefined && editor.activateGlyph($event)"
    @add="addGlyphsDialog?.open()"
    @remove="remove($event.code)"
  >
    <template #preview="{ frame: glyph }">
      <svg
        style="background-color: var(--color-background)"
        :viewBox="`0 0 ${editor.canvas.width} ${editor.canvas.height}`"
      >
        <use :href="`#glyph-${glyph.code}`" :x="glyph.bounds.left" />
      </svg>
    </template>

    <template #heading>
      {{ font.glyphsList.length }}
      {{ font.glyphsList.length === 1 ? 'Glyph' : 'Glyphs' }}
    </template>
  </FramesList>

  <AddGlyphsDialog ref="addGlyphsDialog" />

  <ModalDialog ref="removeConfirmDialog" v-slot="{ close }">
    <form method="dialog">
      Are you sure?
      <menu>
        <button type="reset" @click="close">Cancel</button>
        <button type="submit" value="submit" autofocus>Remove</button>
      </menu>
    </form>
  </ModalDialog>
</template>

<style scoped>
.glyphs {
  flex: 1;
  overflow: hidden;
  anchor-name: --glyphs-panel;
}
</style>
