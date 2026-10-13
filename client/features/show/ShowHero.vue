<script setup lang="ts">
import { computed } from 'vue'
import type { ShowDetails } from '../../../shared/types.ts'
import AppIcon from '@/shared/components/AppIcon.vue'
import RatingBadge from '@/shared/components/RatingBadge.vue'
import { formatRuntime, formatYears } from '@/shared/utils/format'

/** The top of the detail page: title, key facts and summary. */
const props = defineProps<{ show: ShowDetails }>()

const facts = computed(() =>
  [
    formatYears(props.show.premiered, props.show.ended, props.show.status),
    formatRuntime(props.show.runtime),
    props.show.genres.join(', '),
    props.show.status,
    props.show.language,
  ].filter((fact): fact is string => Boolean(fact)),
)

const airing = computed(() => [props.show.network, props.show.schedule].filter(Boolean).join(' · '))
</script>

<template>
  <section class="hero">
    <div class="hero__content">
      <h1 class="page-title">{{ show.name }}</h1>

      <ul class="hero__facts" data-test="show-facts">
        <li><RatingBadge :rating="show.rating" class="hero__rating" /></li>
        <li v-for="fact in facts" :key="fact">{{ fact }}</li>
      </ul>

      <div v-if="show.summary.length" class="hero__summary" data-test="show-summary">
        <p v-for="paragraph in show.summary" :key="paragraph">{{ paragraph }}</p>
      </div>

      <div v-if="show.officialSite || airing" class="hero__actions">
        <!-- The server only passes on http(s) links; noopener/noreferrer keep the other site from reaching back. -->
        <a
          v-if="show.officialSite"
          :href="show.officialSite"
          class="hero__site"
          target="_blank"
          rel="noopener noreferrer"
          data-test="official-site"
        >
          Official site <AppIcon name="external" />
        </a>
        <p v-if="airing" class="muted hero__airing" data-test="show-airing">{{ airing }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero__content {
  display: grid;
  gap: var(--space-4);
  max-width: var(--prose-width);
}

.hero__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.hero__rating {
  font-size: var(--text-md);
}

.hero__summary {
  display: grid;
  gap: var(--space-3);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-4);
}

.hero__site {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  transition: background-color var(--duration-fast) var(--ease-out);
}

.hero__site:hover {
  background: var(--color-accent-hover);
  color: var(--color-on-accent);
}

.hero__airing {
  font-size: var(--text-sm);
}
</style>
