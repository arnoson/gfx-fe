<script setup lang="ts">
import { useFont } from '@/stores/font'
import { computed, ref, watch } from 'vue'
import AddGlyphsDialog from './AddGlyphsDialog.vue'
import ModalDialog from './ModalDialog.vue'
import { useEditor } from '@/stores/editor'

const font = useFont()
const editor = useEditor()
const count = computed(() => font.glyphs.size)
const getCharName = (code: number) => {
  const char = String.fromCharCode(code)
  return char === ' ' ? 'Space' : char
}

const sortedGlyphs = computed(() =>
  Array.from(font.glyphs.entries()).sort(([codeA], [codeB]) => codeA - codeB),
)

const addGlyphsDialog = ref<InstanceType<typeof AddGlyphsDialog>>()
const grid = ref<HTMLElement>()

// Scroll the active glyph into view if needed.
watch(
  () => font.activeGlyphCode,
  async (code) => {
    if (!grid.value) return
    const glyph = document.querySelector(`.glyph[data-char-code="${code}"]`)
    if (!glyph) return

    const gridBounds = grid.value.getBoundingClientRect()
    const glyphBounds = glyph.getBoundingClientRect()

    const isCropped =
      glyphBounds.top < gridBounds.top || glyphBounds.bottom > gridBounds.bottom

    if (isCropped) glyph.scrollIntoView({ behavior: 'smooth' })
  },
)

const removeConfirmDialog = ref<InstanceType<typeof ModalDialog>>()
const remove = async (code: number) => {
  const result = await removeConfirmDialog.value?.prompt()
  if (result !== 'submit') return
  font.removeGlyph(code)
}
</script>

<template>
  <div class="glyph-list">
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

    <header class="header">
      <h2 v-if="count === 1">1 Glyph</h2>
      <h2 v-else-if="count">{{ count }} Glyphs</h2>
      <h2 v-else>No Glyphs yet</h2>
      <button class="add" @click="addGlyphsDialog?.open()">
        <svg
          class="icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </header>

    <div class="grid" ref="grid">
      <a
        v-for="[code, glyph] of sortedGlyphs"
        class="glyph"
        :href="`/#/glyph/${code}`"
        :data-active="font.activeGlyphCode === code"
        :data-char-code="code"
        @keydown.delete="remove(code)"
      >
        <svg :viewBox="`0 0 ${editor.canvas.width} ${editor.canvas.height}`">
          <use :href="`#glyph-${code}`" :x="glyph.bounds.left" />
        </svg>
        <header class="glyph-name">{{ getCharName(code) }}</header>
      </a>
    </div>
  </div>
</template>

<style scoped>
.header {
  padding-inline: 1rem;
  padding-bottom: 0.5rem;
  padding-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.glyph-list {
  overflow: hidden;
  display: grid;
  grid-template-rows: max-content 1fr;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
  grid-template-rows: max-content;
  align-items: start;

  gap: 0.5rem;
  padding-inline: 1rem;
  overflow-y: auto;
}

.glyph-name {
  text-align: center;
  margin-bottom: 0.25em;
}

.glyph {
  --radius: 4px;

  border: 1px solid var(--color-grid);
  border-radius: var(--radius);

  &:hover {
    background-color: var(--color-grid);
  }

  &[data-active='true'] {
    background-color: var(--color-accent);
    border-color: var(--color-accent);
  }

  &:focus {
    border-color: var(--color-text);
  }

  svg {
    border-top-left-radius: var(--radius);
    border-top-right-radius: var(--radius);
  }
}

.add {
  background: none;
  padding: 0;
  border-radius: 9999px;
  anchor-name: --add-glyph-button;

  .icon {
    display: block;
    height: 1.8em;
    width: auto;
  }

  .icon path {
    stroke: var(--color-panel-background);
    stroke-width: 1.5;
  }

  &:hover .icon path {
    stroke: var(--color-text);
  }
}
</style>
