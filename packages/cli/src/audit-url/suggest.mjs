/**
 * Which Hoverlab artifact answers which finding.
 *
 * A STATIC TABLE, ON PURPOSE
 *
 * No network, no search, no ranking. The audit runs against somebody's
 * staging site, often in CI, and a suggestion that costs a request (or that
 * changes between runs because the catalog was re-ranked) is a suggestion a
 * report cannot be diffed on. The cost of that choice is that every target
 * here is a hand-typed id, and a hand-typed id is a promise. The test in
 * `test/audit-url-suggest.test.mjs` keeps the promise: it resolves every
 * target against the site's own registries (tools, primitives, blocks) and
 * the CLI's own command list, and fails when one has gone.
 *
 * Targets are data, not strings, so the same table renders as a URL in a
 * terminal, a link in a pull-request comment and an object in --json.
 *
 *   tool       a designer tool, /tools/<id>
 *   primitive  a one-control component, `npx hoverlab add <id>`
 *   block      a section, `npx hoverlab add <id>`
 *   page       a route on the site that is not a tool, e.g. the design-system export
 *   command    a `hoverlab` command line; the first word after `hoverlab` must be a real command
 */

import { SITE_URL } from '../api.mjs'

const tool = (id, why) => ({ kind: 'tool', id, why })
const primitive = (id, why) => ({ kind: 'primitive', id, why })
const page = (path, why) => ({ kind: 'page', path, why })
const command = (line, why) => ({ kind: 'command', line, why })

const CONTRAST = [
  tool('contrast', 'check a pair and get a passing shade'),
  tool('palette', 'rebuild the palette from a base that clears AA'),
  page('/design-system', 'export a brand preset as tokens with contrast already worked out'),
]

const RTL_SOURCE = command(
  'npx hoverlab review --fix',
  'run it in the source repo: rewrites physical utilities (pl-, ml-, text-left, float-left) to logical ones',
)

/** Every rule the audit can emit, and what to reach for. */
export const SUGGESTIONS = {
  contrast: CONTRAST,
  'contrast-axe': CONTRAST,

  'page-overflow': [
    tool('flexbox', 'find the flex item that refuses to shrink (min-width: 0)'),
    tool('grid', 'minmax(0, 1fr) tracks stop content from widening the page'),
    command('npx hoverlab review', 'flags sr-only text escaping a scroll container, a common cause'),
  ],

  'spacing-off-grid': [
    tool('spacing', 'pick steps from a consistent scale'),
    tool('tokens', 'generate the spacing and radius tokens once, reference them everywhere'),
    page('/design-system', 'export the design system as tokens'),
  ],
  'radius-drift': [
    tool('border-radius', 'settle on a radius set'),
    tool('tokens', 'a --radius token every component derives from'),
  ],
  'type-drift': [
    tool('typography', 'build a type scale and use its steps'),
    tool('tokens', 'font-size tokens'),
  ],
  'color-near-duplicate': [
    tool('palette', 'one ramp instead of near-duplicate hand-picked values'),
    tool('tokens', 'name the colours once as CSS variables'),
  ],
  'grey-sprawl': [
    tool('palette', 'a single neutral ramp'),
    tool('tokens', 'map the ramp onto foreground, muted and border tokens'),
  ],
  'shadow-drift': [
    tool('shadow', 'a small elevation scale'),
    tool('tokens', 'shadow tokens'),
  ],

  'rtl-page-scroll': [
    RTL_SOURCE,
    tool('flexbox', 'flex rows reverse under dir=rtl; check the ones that overflow'),
  ],
  'rtl-overflow': [
    RTL_SOURCE,
    tool('flexbox', 'flex rows reverse under dir=rtl; check the ones that overflow'),
  ],
  'rtl-clipped-text': [
    RTL_SOURCE,
    tool('flexbox', 'give the text a shrinkable box (min-width: 0) instead of a fixed offset'),
  ],
  'rtl-clipped': [
    RTL_SOURCE,
    tool('flexbox', 'give the text a shrinkable box (min-width: 0) instead of a fixed offset'),
  ],
  'rtl-not-mirrored': [
    RTL_SOURCE,
    primitive('input-group', 'an icon-in-input built on logical properties (start-0, ps-9)'),
  ],
  'rtl-text-align': [RTL_SOURCE],
  'rtl-icon-not-mirrored': [
    command('npx hoverlab review', 'its icon ledger rules on which arrows mirror and which must not'),
    primitive('breadcrumbs', 'chevron separators that flip with the reading direction'),
    primitive('pagination', 'previous and next arrows that flip'),
  ],
}

/** The targets for a rule id, or an empty list for a rule with none. */
export function suggestionsFor(rule) {
  return SUGGESTIONS[rule] ?? []
}

/** A target as text: a URL for the site, a command line for the CLI. */
export function describeTarget(target, siteUrl = SITE_URL) {
  switch (target.kind) {
    case 'tool':
      return `${siteUrl}/tools/${target.id}`
    case 'page':
      return `${siteUrl}${target.path}`
    case 'primitive':
    case 'block':
      return `npx hoverlab add ${target.id}`
    case 'command':
      return target.line
    default:
      return String(target.id ?? target.line ?? '')
  }
}
