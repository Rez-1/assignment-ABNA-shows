<script setup lang="ts">
import BrowseGenresLink from '@/shared/components/BrowseGenresLink.vue'
import { usePageName } from '@/shared/composables/usePageName'

usePageName(() => 'Page not found')
</script>

<template>
  <div class="page not-found">
    <h1 class="page-title">Page not found</h1>
    <p class="muted">There is nothing at this address.</p>
    <BrowseGenresLink />
  </div>
</template>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding-block: var(--space-16);
  text-align: center;
}
</style>
