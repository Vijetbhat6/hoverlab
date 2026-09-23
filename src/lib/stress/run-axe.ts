/**
 * Run axe-core in a page and return violations as comparable keys.
 *
 * Shared by the harness and its self-test so both drive axe the same way.
 * The source is evaluated with `page.evaluate` rather than added as a
 * script tag: the site ships a Content-Security-Policy and an injected tag
 * would be blocked, while evaluation is not subject to it.
 *
 * A key is `rule::selector`. The frame never changes the element tree, so
 * the same element has the same selector in the baseline and the stressed
 * run, and a set difference is exactly "violations the stress added".
 */

import type { Page } from 'playwright'

interface AxeGlobal {
  run: (
    context: Element | Document,
    options: unknown,
  ) => Promise<{ violations: Array<{ id: string; nodes: Array<{ target: unknown[] }> }> }>
}

export async function runAxe(page: Page, source: string, rules: string[]): Promise<string[]> {
  return page.evaluate(
    async (args: { source: string; rules: string[] }) => {
      const w = window as unknown as { axe?: AxeGlobal }
      if (!w.axe) (0, eval)(args.source)
      const main = document.querySelector('main') ?? document
      const results = await w.axe!.run(main, { runOnly: { type: 'rule', values: args.rules } })
      return results.violations.flatMap((v) => v.nodes.map((n) => `${v.id}::${n.target.join(' > ')}`))
    },
    { source, rules },
  )
}
