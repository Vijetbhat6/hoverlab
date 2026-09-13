import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildAiHandoff, installCommandFor, SOURCE_BUDGET } from './ai-handoff'
import { GENERATED_UI_RULES } from './design-system-doc'

/**
 * What these guard is a document, not a component.
 *
 * Every failure below is silent in the browser: the button still copies,
 * the toast still says it worked, and what lands in the agent's context is
 * subtly wrong — the unmodified effect, half a component, a token block an
 * agent will "fix". Nobody finds those by looking at the page.
 */

const OPTIONS = { origin: 'https://example.test' }

const BLOCK = {
  level: 'block' as const,
  id: 'pricing-three-tier',
  name: 'Pricing, three tier',
  description: 'Three plans with a highlighted middle tier.',
  category: 'Pricing',
  file: { path: 'components/blocks/pricing-three-tier.tsx', source: 'export function Pricing() {}' },
  props: [
    {
      name: 'className',
      type: 'string',
      required: false,
      defaultValue: null,
      description: null,
    },
    {
      name: 'tiers',
      type: 'Tier[]',
      required: false,
      defaultValue: 'DEFAULT_TIERS',
      description: 'The plans to render.',
    },
  ],
  deps: ['lucide-react'],
}

test('the install command matches the rung', () => {
  assert.equal(installCommandFor('block', 'pricing-three-tier'), 'npx hoverlab add pricing-three-tier')
  assert.equal(installCommandFor('page', 'saas-landing'), 'npx hoverlab add saas-landing')
  // A template is a project, so it scaffolds rather than installing into
  // one. `add` on a template id is the wrong command and would fail.
  assert.equal(installCommandFor('template', 'saas-starter'), 'npx hoverlab init saas-starter ./my-app')
})

test('a block prompt carries the source, the API and the way to install it', () => {
  const out = buildAiHandoff(BLOCK, OPTIONS)

  assert.match(out, /npx hoverlab add pricing-three-tier/)
  assert.match(out, /export function Pricing\(\) \{\}/)
  assert.match(out, /components\/blocks\/pricing-three-tier\.tsx/)
  assert.match(out, /`tiers`/)
  assert.match(out, /lucide-react/)
  // The detail page it came from, so the reader can check the agent's work.
  assert.match(out, /https:\/\/example\.test\/block\/pricing-three-tier/)
})

test('className is not offered as a prop to configure', () => {
  const out = buildAiHandoff(BLOCK, OPTIONS)
  // Every block takes className and none is configured through it. Listing
  // it invites an agent to style with an override instead of with props,
  // which is the one habit the rules below spend five lines discouraging.
  assert.ok(!out.includes('`className`'), 'className should be filtered out of the props list')
})

test('a customised effect is not told to install the original', () => {
  const out = buildAiHandoff(
    {
      level: 'effect',
      id: 'glow-button',
      name: 'Glow button',
      description: 'A button with a soft outer glow.',
      category: 'Buttons',
      html: '<button class="glow">Go</button>',
      css: '.glow { box-shadow: 0 0 20px hotpink; }',
      customized: true,
    },
    OPTIONS,
  )

  // The failure this exists for: the visitor spends a minute on the sliders,
  // hands the prompt over, and the agent runs a command that installs the
  // stock hue — discarding the only reason they copied anything.
  assert.match(out, /carries edits made in the browser/)
  assert.match(out, /would install the unmodified original/)
  assert.match(out, /hotpink/)
  assert.ok(
    !/```bash\nnpx hoverlab add glow-button/.test(out),
    'the install command must not be presented as the way to get a customised effect',
  )
})

test('an uncustomised effect leads with the command', () => {
  const out = buildAiHandoff(
    {
      level: 'effect',
      id: 'glow-button',
      name: 'Glow button',
      description: 'A button with a soft outer glow.',
      category: 'Buttons',
      html: '<button class="glow">Go</button>',
      css: '.glow { box-shadow: 0 0 20px hotpink; }',
    },
    OPTIONS,
  )
  assert.match(out, /```bash\nnpx hoverlab add glow-button\n```/)
})

test('source over budget is linked, never truncated', () => {
  const out = buildAiHandoff(
    { ...BLOCK, file: { path: 'components/huge.tsx', source: 'x'.repeat(SOURCE_BUDGET + 1) } },
    OPTIONS,
  )
  // Half a component in a code fence is worse than none: the agent will
  // confidently finish it, and wrongly.
  assert.match(out, /too long to paste usefully/)
  assert.ok(!out.includes('```tsx'), 'an over-budget file must not open a code fence at all')
})

test('a template hands over the scaffold, not forty thousand lines', () => {
  const out = buildAiHandoff(
    {
      level: 'template',
      id: 'saas-starter',
      name: 'SaaS starter',
      description: 'A complete marketing site.',
      composedOf: ['saas-landing', 'pricing-page'],
    },
    OPTIONS,
  )
  assert.match(out, /npx hoverlab init saas-starter \.\/my-app/)
  assert.match(out, /`saas-landing`, `pricing-page`/)
  assert.match(out, /too many files to paste/)
})

test('the tokens go over as bare channels, with the reason', () => {
  const out = buildAiHandoff(BLOCK, OPTIONS)
  assert.match(out, /--background: \d/, 'tokens must be bare channels, not hsl() calls')
  assert.match(out, /--radius:/)
  assert.match(out, /\.dark \{/, 'both themes, or the dark one is invented')
  // Without the note, a tidy-minded agent wraps these in hsl() and every
  // `bg-primary/10` in the catalog silently stops being translucent.
  assert.match(out, /Keep the format\./)
})

test('the prompt teaches the same rules the DNA document does', async () => {
  // The drift this catches: someone edits the rules in one of the two
  // documents, both keep rendering, and half the agents on the site are
  // being taught a system the other half is not. They share a module
  // precisely so this assertion can hold.
  const out = buildAiHandoff(BLOCK, OPTIONS)
  const { buildDna } = await import('./dna')
  const dna = buildDna({ kind: 'catalog' }, { origin: OPTIONS.origin })

  assert.ok(dna)
  assert.ok(GENERATED_UI_RULES.length > 0)
  for (const rule of GENERATED_UI_RULES) {
    assert.ok(out.includes(rule), `prompt is missing a rule: ${rule.slice(0, 40)}…`)
    assert.ok(dna.markdown.includes(rule), `DNA is missing a rule: ${rule.slice(0, 40)}…`)
  }
})

test('an optional prop with no default is not described as having one', () => {
  const out = buildAiHandoff(
    {
      ...BLOCK,
      props: [
        { name: 'subheading', type: 'string', required: false, defaultValue: null, description: null },
        { name: 'items', type: 'Item[]', required: true, defaultValue: null, description: null },
      ],
    },
    OPTIONS,
  )
  // "default `undefined`" reads as a value, and an agent will pass the
  // string. The distinction between "leave it alone" and "you must supply
  // this" is the whole reason the props section is here.
  assert.ok(!out.includes('undefined'), 'undefined must never appear as a default')
  assert.match(out, /`subheading`: `string` \(optional, no default\)/)
  assert.match(out, /`items`: `Item\[\]` \(required\)/)
})

test('the DNA link does not depend on the id resolving', () => {
  // `/api/v1/dna/{id}` goes through `resolveArtifact`, which knows only the
  // rungs wired into it. When the primitive tier shipped, /primitive/button
  // rendered while /api/v1/dna/button 404'd — so every prompt copied from
  // that page handed an agent a dead link. `catalog` always resolves, and
  // the prompt already carries everything the per-id document would add.
  for (const level of ['effect', 'primitive', 'block', 'page', 'template'] as const) {
    const out = buildAiHandoff({ ...BLOCK, level, id: 'anything-at-all' }, OPTIONS)
    assert.match(out, /api\/v1\/dna\/catalog\?format=raw/)
    assert.ok(
      !out.includes('api/v1/dna/anything-at-all'),
      `${level} emitted an id-specific DNA link`,
    )
  }
})

test('every rung gets a working detail link and the right install verb', () => {
  for (const level of ['effect', 'primitive', 'block', 'page'] as const) {
    const out = buildAiHandoff({ ...BLOCK, level, id: 'thing' }, OPTIONS)
    assert.match(out, new RegExp(`https://example\.test/${level}/thing`))
    assert.match(out, /npx hoverlab add thing/)
  }
  // A template is a project, so it scaffolds rather than installing into one.
  const template = buildAiHandoff({ ...BLOCK, level: 'template', id: 'thing' }, OPTIONS)
  assert.match(template, /npx hoverlab init thing \.\/my-app/)
})
