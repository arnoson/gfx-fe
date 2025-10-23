<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle } from 'radix-vue'
import { ProjectProperties } from 'vue-toolkit'
import DisplayPreview from './components/DisplayPreview.vue'
import FontProperties from './components/FontProperties.vue'
import GlyphDefs from './components/GlyphDefs.vue'
import GlyphEditor from './components/GlyphEditor.vue'
import GlyphsPanel from './components/GlyphsPanel.vue'
import { useFont } from './stores/font'
import { useStorage } from './stores/storage'
import { useEditor } from './stores/editor'
import ToolBar from 'vue-toolkit/src/components/ToolBar.vue'
import { computed } from 'vue'

const font = useFont()
const editor = useEditor()
const storage = useStorage()

storage.restoreBackup()

const { width, height } = useWindowSize()
const sidebarDefaultSize = computed(() => (312 / width.value) * 100)
const sidebarMinSize = computed(() => (285 / width.value) * 100)
const previewDefaultSize = computed(() => (150 / height.value) * 100)
const previewMinSize = computed(() => (110 / height.value) * 100)

const clear = () => {
  font.clear()
  storage.clear()
  editor.activeGlyph = undefined
}
</script>

<template>
  <GlyphDefs />

  <SplitterGroup direction="horizontal">
    <SplitterPanel
      id="panel-sidebar"
      :default-size="sidebarDefaultSize"
      :min-size="sidebarMinSize"
    >
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
      <GlyphsPanel />
    </SplitterPanel>
    <SplitterResizeHandle
      id="panel-sidebar:panel-content"
      class="resize-handle"
    />
    <SplitterPanel id="panel-content">
      <SplitterGroup direction="vertical">
        <SplitterPanel id="panel-editor">
          <ToolBar
            :tools="editor.tools"
            :selected="editor.activeToolId"
            @select="editor.activateTool($event)"
          />
          <GlyphEditor v-if="editor.activeGlyph" :glyph="editor.activeGlyph" />
        </SplitterPanel>
        <SplitterResizeHandle
          id="panel-editor:panel-preview"
          class="resize-handle"
        />
        <SplitterPanel
          id="panel-preview"
          :default-size="previewDefaultSize"
          :min-size="previewMinSize"
        >
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
