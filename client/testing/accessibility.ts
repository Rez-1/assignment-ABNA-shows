import axe from 'axe-core'

/**
 * Runs the axe accessibility checker over the rendered page and returns what it
 * found, as readable strings. jsdom does no layout or painting, so the rules
 * that need real rendering are switched off here; those are checked in a
 * browser instead (see the README).
 */
export async function accessibilityViolations(root: Element = document.body): Promise<string[]> {
  const results = await axe.run(root, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
    rules: {
      'color-contrast': { enabled: false },
      'link-in-text-block': { enabled: false },
      'scrollable-region-focusable': { enabled: false },
      'target-size': { enabled: false },
    },
  })
  return results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${violation.help} — ${node.html.slice(0, 120)}`),
  )
}
