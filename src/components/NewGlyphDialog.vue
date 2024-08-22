<script setup lang="ts">
import { useFont } from '@/stores/font'
import { ref } from 'vue'
import FormField from './FormField.vue'
import ModalDialog from './ModalDialog.vue'

const font = useFont()
const dialog = ref<InstanceType<typeof ModalDialog>>()
const errorDialog = ref<InstanceType<typeof ModalDialog>>()

const characters = ref('')

const characterToCode = (character: string) =>
  character.startsWith('\\u')
    ? Number(`0x${character.substring(2)}`)
    : character.charCodeAt(0)

const charactersToCode = (characters: string[]) => {
  const codes = []
  for (const character of characters) {
    if (character.match(/.+-.+/)) {
      const [from, to] = character.split('-')
      const fromCode = characterToCode(from)
      const toCode = characterToCode(to)
      for (let i = fromCode; i <= toCode; i++) codes.push(i)
    } else {
      codes.push(characterToCode(character))
    }
  }
  return codes
}

const alreadyExistingCodes = ref<number[]>([])

const add = async () => {
  const codes =
    characters.value === ' '
      ? // We use the space as a separator in a list of characters, but as a shorthand
        // we treat it as a space if no list is provided.
        [32]
      : charactersToCode(characters.value.split(' '))

  alreadyExistingCodes.value = Array.from(
    new Set(codes).intersection(new Set(font.glyphs.keys())).values(),
  )

  if (alreadyExistingCodes.value.length) {
    const result = await errorDialog.value?.prompt()
    if (result !== 'submit') return
  }

  codes.forEach((code) => font.addGlyph(code))
  font.activeGlyphCode = codes[0]
}

const open = () => dialog.value?.prompt()

defineExpose({ open })
</script>

<template>
  <!-- For some reasons the mousemove events are propagated to the resize
   handlers of the split pane. Stopping them here solves the problem. -->
  <ModalDialog ref="dialog" @mousemove.stop v-slot="{ close }">
    <form method="dialog">
      <FormField label="Glyphs" class="glyphs-field">
        <input v-model="characters" aria-describedby="input-characters-help" />
      </FormField>
      <div class="info" id="input-characters-help">
        Use multiple characters separated by spaces
        <span class="code">A B C</span>, unicode notation
        <span class="code">\u003F</span> and ranges
        <span class="code">a-z 0-9 \u0041-\u005A</span>.
      </div>
      <menu>
        <button type="reset" @click="close">Cancel</button>
        <button type="submit" value="submit" data-theme="positive" @click="add">
          Add
        </button>
      </menu>
    </form>
  </ModalDialog>

  <ModalDialog ref="errorDialog" v-slot="{ close }">
    <form method="dialog">
      <div v-if="alreadyExistingCodes.length === 1">
        The
        <span class="code">
          {{ String.fromCharCode(alreadyExistingCodes[0]) }}
        </span>
        glyph already exists.
      </div>
      <div v-else>
        These glyphs
        <span style="word-break: break-all">
          <span class="code" v-for="(code, index) of alreadyExistingCodes">
            {{ String.fromCharCode(code) }}
          </span>
        </span>
        already exist.
      </div>
      <menu>
        <button type="reset" @click="close">Keep existing</button>
        <button type="submit" value="submit" data-theme="positive">
          Replace
        </button>
      </menu>
    </form>
  </ModalDialog>
</template>

<style scoped>
dialog {
  line-height: 1.5;

  @supports (position-anchor: --add-glyph-button) {
    margin: 0;
    margin-left: 0.5rem;
    position-anchor: --add-glyph-button;
    left: anchor(right);
    /* Optically align the field label to the baseline of the add glyphs button */
    top: calc(anchor(top) - 0.6rem);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}

.glyphs-field {
  grid-template-columns: max-content 1fr;
}

.info {
  color: hsl(0 0% 50% / 1);
  padding-inline: 0.5rem;
}

.code {
  background-color: hsl(0 0% 45% / 1);
  color: black;
  padding-inline: 0.2em 0.3em;
  border-radius: 3px;
  white-space: pre;
  /* In case they overlap. */
  border: 1px solid var(--color-background);
}
</style>
