<script setup lang="ts">
import { getInputId } from '@/utils/id'
import { useSlots } from 'vue'

type Option = { value: string; label: string }
type OptionGroup = { label: string; options: Option[] }

defineProps<{
  label: string
  options: (Option | OptionGroup)[]
  allowEmpty?: boolean
}>()
const model = defineModel<string>({ required: true })
const id = getInputId()
const infoId = `info-${id}`

const slots = useSlots()
const hasInfo = !!slots.info

const isOptionsGroup = (v: any): v is OptionGroup => !!v.options
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      :aria-describedby="hasInfo ? infoId : undefined"
      @change="model = ($event.target as HTMLSelectElement).value"
    >
      <option v-if="allowEmpty" value="">–</option>
      <template v-for="option of options">
        <optgroup v-if="isOptionsGroup(option)" :label="option.label">
          <option v-for="{ value, label } of option.options" :value>
            {{ label }}
          </option>
        </optgroup>
        <option v-else :value="option.value">{{ option.label }}</option>
      </template>
    </select>
    <div class="info" v-if="hasInfo" :id="`info-${id}`">
      <slot name="info"></slot>
    </div>
  </div>
</template>

<style scoped>
.info {
  color: hsl(0 0% 50% / 1);
  padding-inline: 0.5rem;
  grid-column: span 2;
}

select {
  min-width: 0;
}
</style>
