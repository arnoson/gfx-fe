<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import SelectField from './SelectField.vue'
import TextField from './TextField.vue'
import NumberField from './NumberField.vue'
import SliderField from './SliderField.vue'

type Option = { value: string; label: string }
type OptionGroup = { label: string; options: Option[] }

const model = defineModel<{ name: string; size: number; threshold: number }>({
  required: true,
})

const useLocalFonts = ref(!!window.queryLocalFonts)
const localFonts = shallowRef<FontData[] | undefined>()

const queryFonts = async () => {
  localFonts.value = await window.queryLocalFonts?.()
  if (!localFonts.value) {
    useLocalFonts.value = false
    return
  }

  const styleSheet = new CSSStyleSheet()
  for (const font of localFonts.value) {
    styleSheet.insertRule(`
      @font-face {
        font-family: '${font.fullName}';
        src: local('${font.fullName}'),
          local('${font.postscriptName}');
      }`)
  }
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet]
}
</script>

<template>
  <SelectField
    v-if="useLocalFonts"
    label="Font"
    :options="
      localFonts?.map((font) => ({
        value: font.fullName,
        label: font.fullName,
      })) ?? []
    "
    :allow-empty="true"
    v-model="model.name"
    @click.once="queryFonts()"
  />
  <TextField v-else label="Font" v-model="model.name" />

  <NumberField label="Size" v-model="model.size" unit="px" />
  <SliderField
    label="Threshold"
    :min="1"
    :max="254"
    v-model="model.threshold"
  />
</template>
