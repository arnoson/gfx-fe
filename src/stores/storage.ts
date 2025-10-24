import { downloadFile, stripExtension } from 'tool-toolkit'
import { parse, stringify } from 'superjson'
import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useFont } from './font'
import type { Glyph } from '@/types'
import sluggify from '@sindresorhus/slugify'

export const useStorage = defineStore('storage', () => {
  const font = useFont()

  const savedVersions = ref(new Map<Glyph['code'], Glyph['version']>())
  let fileHandle: FileSystemFileHandle | null = null
  const fileType: FilePickerAcceptType = {
    accept: { 'text/plain': '.h' },
    description: 'C++ header file',
  }

  const open = async (fileOrHandle: File | FileSystemFileHandle) => {
    clear()

    const isFileHandle = fileOrHandle instanceof FileSystemFileHandle
    const file = isFileHandle ? await fileOrHandle.getFile() : fileOrHandle
    const code = await file.text()
    if (isFileHandle) fileHandle = fileOrHandle

    font.fromCode(code)
    font.name = stripExtension(file.name)
    savedVersions.value = new Map(
      [...font.glyphs.values()].map((v) => [v.code, v.version]),
    )

    font.glyphsList.forEach(backupGlyph)
  }

  const save = async () => {
    const code = font.toCode()

    if ('showSaveFilePicker' in window) {
      fileHandle ??= await window.showSaveFilePicker({
        types: [fileType],
        id: `gfx-fe-${sluggify(font.name)}`,
        suggestedName: font.name,
      })

      const writable = await fileHandle.createWritable()
      await writable.write(new TextEncoder().encode(code))
      await writable.close()
    } else {
      downloadFile(`${font.name}.h`, code)
    }

    savedVersions.value = new Map(
      [...font.glyphs.values()].map((v) => [v.code, v.version]),
    )
  }

  const backupGlyph = (glyph: Glyph) => {
    localStorage.setItem(`gfxui:glyph-${glyph.code}`, stringify(glyph))
  }

  const backupGlyphDebounced = useDebounceFn(backupGlyph, 2000)

  const restoreBackup = () => {
    for (const [key, serialized] of Object.entries(localStorage)) {
      if (!key.startsWith('gfxui:glyph-')) continue
      if (!serialized) continue

      const glyph = parse<Glyph>(serialized)
      font.addGlyph(glyph)
    }
  }

  const clear = () => {
    fileHandle = null
    savedVersions.value.clear()

    // Only remove glyphs, we'll keep the settings.
    for (const key in localStorage) {
      if (!key.startsWith('gfxui:glyph-')) continue
      localStorage.removeItem(key)
    }
  }

  const hasUnsavedChanges = computed(() =>
    [...font.glyphs.values()].some(
      (v) => v.version !== (savedVersions.value.get(v.code) ?? 0),
    ),
  )

  return {
    fileType,
    hasUnsavedChanges,
    open,
    save,
    backupGlyph,
    backupGlyphDebounced,
    restoreBackup,
    clear,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useStorage, import.meta.hot))
