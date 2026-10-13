<script setup lang="ts">
import AppHeader from '@/app/AppHeader.vue'
</script>

<template>
  <a href="#main" class="skip-link">Skip to content</a>
  <AppHeader />
  <main id="main" tabindex="-1">
    <RouterView />
  </main>
  <footer class="footer">
    <!-- TVMaze licenses its data under CC BY-SA, which asks for this credit. -->
    Show data provided by
    <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer">TVMaze</a>
  </footer>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 20;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--weight-bold);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}

main {
  /* Keeps the footer at the bottom on short pages. */
  min-height: calc(100vh - var(--header-height) - 4rem);
}

main:focus {
  outline: none;
}

.footer {
  padding: var(--space-6) var(--page-gutter);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-align: center;
}
</style>
