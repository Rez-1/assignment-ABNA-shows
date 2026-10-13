// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

/** Resolves a custom property from tokens.css down to its hex value. */
function token(name: string): string {
  const value = new RegExp(`${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim()
  if (!value) throw new Error(`Unknown token ${name}`)
  const reference = /^var\((--[\w-]+)\)$/.exec(value)
  return reference ? token(reference[1]!) : value
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(token(foreground)), luminance(token(background))].sort((a, b) => b - a)
  return (light! + 0.05) / (dark! + 0.05)
}

describe('colour tokens meet WCAG AA', () => {
  it.each([
    ['--color-text', '--color-page'],
    ['--color-text', '--color-surface'],
    ['--color-text', '--color-surface-raised'],
    ['--color-text-muted', '--color-page'],
    ['--color-text-muted', '--color-surface'],
    ['--color-text-muted', '--color-surface-raised'],
    ['--color-accent', '--color-page'],
    ['--color-accent', '--color-surface-raised'],
    ['--color-on-accent', '--color-accent'],
    ['--color-on-accent', '--color-accent-hover'],
    ['--color-danger', '--color-page'],
  ])('%s on %s has at least 4.5:1 contrast for text', (foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })

  it('focus outlines have at least 3:1 contrast against every surface', () => {
    for (const surface of ['--color-page', '--color-surface', '--color-surface-raised']) {
      expect(contrast('--color-accent', surface)).toBeGreaterThanOrEqual(3)
    }
  })
})
