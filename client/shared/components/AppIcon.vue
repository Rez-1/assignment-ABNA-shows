<script setup lang="ts">
/** Small inline icon set, so the app ships no icon font or image requests. */
const PATHS = {
  star: 'M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6-4.8-4.6 6.6-.9z',
  search: 'M10.5 3a7.5 7.5 0 015.9 12.1l4.3 4.2-1.5 1.5-4.2-4.3A7.5 7.5 0 1110.5 3zm0 2.2a5.3 5.3 0 100 10.6 5.3 5.3 0 000-10.6z',
  'chevron-left': 'M15.5 4.5L8 12l7.5 7.5-1.6 1.6L4.8 12l9.1-9.1z',
  'chevron-right': 'M8.5 4.5L16 12l-7.5 7.5 1.6 1.6 9.1-9.1-9.1-9.1z',
  external: 'M13 3h8v8h-2.2V6.8l-8.5 8.4-1.5-1.5 8.4-8.5H13zM5 5h5v2.2H7.2v9.6h9.6V14H19v5H5z',
  image: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm1.2 2.2v7.3l3.6-3.6 3.4 3.4 2.6-2.6 4 4V7.2zM15.5 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
} as const

export type IconName = keyof typeof PATHS

defineProps<{ name: IconName }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path :d="PATHS[name]" />
  </svg>
</template>

<style scoped>
.icon {
  width: 1em;
  height: 1em;
  flex: none;
  fill: currentColor;
}
</style>
