<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'

/**
 * The search field. It announces a search once typing pauses, so we do not
 * search on every keystroke, and immediately when the form is submitted.
 */
const props = withDefaults(defineProps<{ term?: string; delay?: number }>(), { term: '', delay: 300 })
const emit = defineEmits<{ search: [term: string] }>()

const text = ref(props.term)
// Follow the term from outside (for example the URL) without fighting the user's typing.
watch(
  () => props.term,
  (term) => {
    if (term !== text.value.trim()) text.value = term
  },
)

let timer: ReturnType<typeof setTimeout> | undefined

function searchSoon() {
  clearTimeout(timer)
  timer = setTimeout(searchNow, props.delay)
}

function searchNow() {
  clearTimeout(timer)
  emit('search', text.value.trim())
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <form class="search" role="search" @submit.prevent="searchNow">
    <label class="visually-hidden" for="show-search">Search shows by name</label>
    <AppIcon name="search" class="search__icon" />
    <input
      id="show-search"
      v-model="text"
      class="search__input"
      type="search"
      placeholder="Search shows"
      autocomplete="off"
      maxlength="100"
      @input="searchSoon"
    />
  </form>
</template>

<style scoped>
.search {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 28rem;
}

.search__icon {
  position: absolute;
  left: var(--space-4);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search__input {
  width: 100%;
  padding: var(--space-2) var(--space-4) var(--space-2) calc(var(--space-8) + var(--space-2));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
}

.search__input::placeholder {
  color: var(--color-text-muted);
}

.search__input:focus-visible {
  border-color: var(--color-accent);
  outline-offset: 0;
}
</style>
