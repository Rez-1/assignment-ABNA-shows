<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUpdated, ref, useTemplateRef } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * A horizontally scrolling list. Swipe, trackpad and keyboard work natively;
 * the buttons add a way to page through with a mouse.
 * Pass the items as `<li>` elements in the default slot.
 */
defineProps<{ label: string }>()

const track = useTemplateRef('track')
const canGoBack = ref(false)
const canGoForward = ref(false)
// A scrolling area must be reachable by keyboard. Rows of links already are; rows of
// plain content (cast, episodes) get a tab stop of their own so arrow keys can scroll them.
const needsTabStop = ref(false)

function updateScrollEnds(element: HTMLElement) {
  // One pixel of slack absorbs sub-pixel rounding at either end.
  canGoBack.value = element.scrollLeft > 1
  canGoForward.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
}

function updateTabStop(element: HTMLElement) {
  needsTabStop.value = element.querySelector('a[href], button, input, select, textarea, [tabindex]') === null
}

/** Brings everything derived from the track up to date. */
function refresh() {
  if (!track.value) return
  updateScrollEnds(track.value)
  updateTabStop(track.value)
}

// Refresh when the box resizes and when the items in the slot change.
let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  refresh()
  if (typeof ResizeObserver !== 'undefined' && track.value) {
    resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(track.value)
  }
})
onUpdated(refresh)
onBeforeUnmount(() => resizeObserver?.disconnect())

/** How far one press of a button scrolls, as a share of the visible width. */
const PAGE_STEP = 0.85

/** Scrolls most of a page, leaving part of the last visible card on screen as a point of reference. */
function scrollByPage(direction: 1 | -1) {
  const element = track.value
  if (element) element.scrollBy({ left: direction * element.clientWidth * PAGE_STEP })
}
</script>

<template>
  <div class="scroller">
    <button type="button" class="scroller__button scroller__button--back" :aria-label="`Scroll ${label} back`" :disabled="!canGoBack" @click="scrollByPage(-1)">
      <AppIcon name="chevron-left" />
    </button>
    <ul
      ref="track"
      class="scroller__track"
      role="list"
      :aria-label="label"
      :tabindex="needsTabStop ? 0 : undefined"
      @scroll.passive="updateScrollEnds(track!)"
    >
      <slot />
    </ul>
    <button type="button" class="scroller__button scroller__button--forward" :aria-label="`Scroll ${label} forward`" :disabled="!canGoForward" @click="scrollByPage(1)">
      <AppIcon name="chevron-right" />
    </button>
  </div>
</template>

<style scoped>
.scroller {
  position: relative;
  min-width: 0;
}

.scroller__track {
  display: flex;
  gap: var(--space-4);
  /* Bleed to the screen edge so cards are not clipped at the page gutter. */
  margin-inline: calc(var(--page-gutter) * -1);
  padding: var(--space-2) var(--page-gutter);
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scroll-padding-inline: var(--page-gutter);
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.scroller__track:focus-visible {
  outline-offset: -2px;
}

.scroller__track::-webkit-scrollbar {
  display: none;
}

.scroller__track > :slotted(li) {
  flex: 0 0 var(--scroller-item-width, var(--card-width));
  min-width: 0;
  scroll-snap-align: start;
}

.scroller__button {
  position: absolute;
  top: 35%;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-scrim);
  font-size: 1.125rem;
  transform: translateY(-50%);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.scroller__button:hover {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.scroller__button--back {
  left: calc(var(--space-2) * -1);
}

.scroller__button--forward {
  right: calc(var(--space-2) * -1);
}

.scroller__button:disabled {
  visibility: hidden;
}

/* Touch screens scroll by swiping; the buttons would only cover the content. */
@media (hover: none) {
  .scroller__button {
    display: none;
  }
}
</style>
