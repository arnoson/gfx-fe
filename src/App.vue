<script setup lang="ts">
import { useEventListener, useWindowSize } from '@vueuse/core'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'radix-vue'
import DisplayPreview from './components/DisplayPreview.vue'
import FontProperties from './components/FontProperties.vue'
import GlyphDefs from './components/GlyphDefs.vue'
import GlyphEditor from './components/GlyphEditor.vue'
import GlyphList from './components/GlyphList.vue'
import { useFont } from './stores/font'
import { useStorage } from './stores/storage'
import { ProjectProperties } from 'vue-toolkit'

const { height } = useWindowSize()
const font = useFont()
const storage = useStorage()

const clear = () => {
  font.clear()
  storage.clear()
}
</script>

<template>
  <GlyphDefs />

  <SplitterGroup direction="horizontal">
    <SplitterPanel id="panel-sidebar" :default-size="25">
      <ProjectProperties
        v-model:name="font.name"
        :has-unsaved-changes="storage.hasUnsavedChanges"
        :file-type="storage.fileType"
        @clear="clear()"
        @save="storage.save()"
        @open="storage.open($event)"
      >
        <template #clear>
          <p>Are you sure? This will remove all glyphs.</p>
        </template>
      </ProjectProperties>
      <FontProperties />
      <GlyphList />
    </SplitterPanel>
    <SplitterResizeHandle
      id="panel-sidebar:panel-content"
      class="resize-handle"
    />
    <SplitterPanel id="panel-content">
      <SplitterGroup direction="vertical">
        <SplitterPanel id="panel-editor">
          <GlyphEditor v-if="font.activeGlyph" :glyph="font.activeGlyph" />
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
  gap: 0.5rem;
}
</style>
