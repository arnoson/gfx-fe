<script setup lang="ts">
import DisplayPreview from './components/DisplayPreview.vue'
import GlyphDefs from './components/GlyphDefs.vue'
import GlyphEditor from './components/GlyphEditor.vue'
import GlyphList from './components/GlyphList.vue'
import { ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'radix-vue'
import { useWindowSize } from '@vueuse/core'
import FontInfo from './components/FontInfo.vue'
import { useFont } from './stores/font'
import code from './assets/vevey_pixel_12pt.h?raw'

const { height } = useWindowSize()
const font = useFont()

font.load(code)
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

  &[data-state='inactive'] {
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
  padding: 1rem;
  display: grid;
  grid-template-rows: max-content 1fr;
}
</style>
