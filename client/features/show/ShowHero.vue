<script setup lang="ts">
import { computed } from 'vue'
import type { ShowDetails } from '../../../shared/types.ts'
import AppIcon from '@/shared/components/AppIcon.vue'
import ArtworkImage from '@/shared/components/ArtworkImage.vue'
import RatingBadge from '@/shared/components/RatingBadge.vue'
import { formatRuntime, formatYears } from '@/shared/utils/format'

/**
 * The top of the detail page: artwork behind the title, key facts and summary.
 * Wide backdrop art is used when TVMaze has it. Many shows only have a poster;
 * that is then blurred into a backdrop, with the sharp poster next to the title.
 */
const props = defineProps<{ show: ShowDetails }>()

const artwork = computed(() => {
  if (props.show.backdrop) return { src: props.show.backdrop, source: 'backdrop' as const }
  if (props.show.poster) return { src: props.show.poster, source: 'poster' as const }
  return null
})

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
  <section class="hero" :class="{ 'hero--poster': artwork?.source === 'poster' }">
    <template v-if="artwork">
      <div class="hero__art">
        <img
          :src="artwork.src"
          alt=""
          class="hero__backdrop"
          :class="{ 'hero__backdrop--blurred': artwork.source === 'poster' }"
          :data-source="artwork.source"
          referrerpolicy="no-referrer"
          data-test="backdrop"
        />
        <div class="hero__shade" />
      </div>
    </template>

    <div class="hero__inner">
      <ArtworkImage
        v-if="artwork?.source === 'poster'"
        :src="artwork.src"
        :alt="`${show.name} poster`"
        class="hero__poster"
        data-test="hero-poster"
      />

      <div class="hero__content">
        <h1 class="page-title">{{ show.name }}</h1>

        <ul class="hero__facts" role="list" data-test="show-facts">
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
            Official site <span class="visually-hidden">(opens in a new tab)</span><AppIcon name="external" />
          </a>
          <p v-if="airing" class="hero__airing" data-test="show-airing">{{ airing }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.hero__art {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.hero__backdrop {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}

.hero__backdrop--blurred {
  filter: blur(40px) brightness(0.6);
  transform: scale(1.3);
}

/*
 * Keeps text readable whatever the artwork looks like: a solid scrim covers the
 * width the text can occupy and only then fades out. That width is set in rem
 * (gutter + text column, plus the poster when it is shown), so it also holds on
 * narrow windows. tokens.test.ts checks the scrim against pure white artwork.
 */
.hero {
  /* On very wide screens the content is centred, so the text starts further in. */
  --hero-inset: max(0px, (100vw - var(--page-max-width)) / 2);
  --hero-text-edge: calc(var(--hero-inset) + 46rem);
}

.hero--poster {
  --hero-text-edge: calc(var(--hero-inset) + 62rem);
}

.hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, var(--color-page), transparent 45%),
    linear-gradient(to right, var(--color-scrim) var(--hero-text-edge), transparent calc(var(--hero-text-edge) + 28rem));
}

.hero__inner {
  display: flex;
  align-items: flex-end;
  gap: var(--space-8);
  max-width: var(--page-max-width);
  min-height: min(32rem, 70vh);
  margin-inline: auto;
  padding: var(--space-16) var(--page-gutter) var(--space-8);
}

.hero__poster {
  flex: 0 0 clamp(9rem, 18vw, 14rem);
}

.hero__content {
  display: grid;
  gap: var(--space-4);
  /* In rem rather than ch so the scrim width above can be matched to it. */
  max-width: 40rem;
}

.hero__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
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

@media (max-width: 40rem) {
  /* On phones the artwork is a banner on top and the text sits beneath it on the plain page. */
  .hero__art {
    position: relative;
    aspect-ratio: 16 / 9;
  }

  .hero__shade {
    background: linear-gradient(to top, var(--color-page), transparent 40%);
  }

  .hero__inner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    min-height: 0;
    padding-top: var(--space-4);
  }

  .hero__poster {
    flex-basis: auto;
    width: 7.5rem;
  }
}
</style>
