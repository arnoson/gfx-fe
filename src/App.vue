<script setup lang="ts">
import { useEventListener, useWindowSize } from '@vueuse/core'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'radix-vue'
import DisplayPreview from './components/DisplayPreview.vue'
import FontInfo from './components/FontInfo.vue'
import GlyphDefs from './components/GlyphDefs.vue'
import GlyphEditor from './components/GlyphEditor.vue'
import GlyphList from './components/GlyphList.vue'
import { useFont } from './stores/font'
import { packPixel } from './utils/pixel'

const { height } = useWindowSize()
const font = useFont()

const getGlyphUrlParam = () => {
  const { hash } = window.location
  if (!hash.startsWith('#/glyph/')) return
  const param = hash.split('/').at(-1)
  return param ? +param : undefined
}

font.activeGlyphCode = getGlyphUrlParam()

useEventListener(
  window,
  'hashchange',
  () => (font.activeGlyphCode = getGlyphUrlParam()),
)

font.addGlyph(35, { pixels: new Set([packPixel(5, 5)]) })
font.activeGlyphCode = 35
font.addHistoryEntry()
</script>

<template>
  <GlyphDefs />

  <SplitterGroup direction="horizontal">
    <SplitterPanel id="panel-sidebar" :default-size="25">
      <FontInfo />
      <GlyphList />
    </SplitterPanel>
    <SplitterResizeHandle
      id="panel-sidebar:panel-content"
      class="resize-handle"
    />
    <SplitterPanel id="panel-content">
      <SplitterGroup direction="vertical">
        <SplitterPanel id="panel-editor">
          <GlyphEditor />
        </SplitterPanel>
        <SplitterResizeHandle
          id="panel-editor:panel-preview"
          class="resize-handle"
        />
        <SplitterPanel id="panel-preview" :default-size="(200 / height) * 100">
          <DisplayPreview />
        </SplitterPanel>
      </SplitterGroup>
    </SplitterPanel>
  </SplitterGroup>
</template>

<style>
.resize-handle {
  --size: 5px;
  --margin: 1rem;

  transition: opacity 200ms;

  &[data-state='inactive']:not(:focus) {
    opacity: 0.1;
  }

  background: var(--color-panel-background);
  border-radius: var(--size);

  &[data-orientation='vertical'] {
    height: var(--size);
    margin-inline: var(--margin);
  }

  &[data-orientation='horizontal'] {
    width: var(--size);
    margin-block: var(--margin);
  }
}

#panel-sidebar {
  display: grid;
  grid-template-rows: max-content 1fr;
  gap: 1rem;
  padding-block: 1rem;
}
</style>
