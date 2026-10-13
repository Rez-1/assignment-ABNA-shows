import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HorizontalScroller from './HorizontalScroller.vue'

/** jsdom does no layout, so the track's measurements are supplied by the test. */
async function mountScroller({ visible = 1000, content = 3000 } = {}) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(visible)
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(content)
  const scrollBy = vi.fn()
  HTMLElement.prototype.scrollBy = scrollBy as typeof HTMLElement.prototype.scrollBy

  const wrapper = mount(HorizontalScroller, {
    props: { label: 'Drama shows' },
    slots: { default: '<li>One</li><li>Two</li><li>Three</li>' },
  })
  // The buttons update after the scroller has measured itself.
  await flushPromises()
  const track = wrapper.get('ul')
  const scrollTo = async (left: number) => {
    Object.defineProperty(track.element, 'scrollLeft', { value: left, configurable: true })
    await track.trigger('scroll')
  }
  return {
    wrapper,
    track,
    scrollBy,
    scrollTo,
    back: wrapper.get('button[aria-label="Scroll Drama shows back"]'),
    forward: wrapper.get('button[aria-label="Scroll Drama shows forward"]'),
  }
}

describe('HorizontalScroller', () => {
  it('renders its items in a labelled list', async () => {
    const { track } = await mountScroller()

    expect(track.attributes('aria-label')).toBe('Drama shows')
    expect(track.findAll('li').map((item) => item.text())).toEqual(['One', 'Two', 'Three'])
  })

  it('pages forward and back by a bit less than its visible width', async () => {
    const { forward, back, scrollBy, scrollTo } = await mountScroller({ visible: 1000, content: 3000 })

    await forward.trigger('click')
    const [{ left: step }] = scrollBy.mock.lastCall as [{ left: number }]
    expect(step).toBeGreaterThan(500)
    expect(step).toBeLessThanOrEqual(1000)

    await scrollTo(1000)
    await back.trigger('click')
    expect(scrollBy.mock.lastCall).toEqual([{ left: -step }])
  })

  it('disables Back at the start and Forward at the end', async () => {
    const { forward, back, scrollTo } = await mountScroller({ visible: 1000, content: 3000 })
    const disabled = () => [back.attributes('disabled') !== undefined, forward.attributes('disabled') !== undefined]

    expect(disabled()).toEqual([true, false])

    await scrollTo(900)
    expect(disabled()).toEqual([false, false])

    await scrollTo(2000)
    expect(disabled()).toEqual([false, true])
  })

  it('disables both buttons when everything fits', async () => {
    const { forward, back } = await mountScroller({ visible: 1000, content: 1000 })

    expect(back.attributes('disabled')).toBeDefined()
    expect(forward.attributes('disabled')).toBeDefined()
  })
})
