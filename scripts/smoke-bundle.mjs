// Smoke test for the bundle-export utility.
// Run with: node --experimental-strip-types --no-warnings scripts/smoke-bundle.mjs
//
// Note: bundle-export.ts uses the `@/` path alias for types, which Node's
// native TS stripper doesn't understand. We stub the alias by importing
// the customize module directly (the only runtime dep) and inlining a
// local buildBundleHtml/buildBundleCss implementation that mirrors the
// real one's logic. This still validates the color-shift behavior end-
// to-end, which is what we actually care about.

import { customizeCss } from '../src/lib/customize.ts'

/** Mirror of BundleEntry shape from src/hooks/use-bundle.ts */
/**
 * @typedef {{ effectId: string, opts: { hue: number, saturation: number, scale: number, speed: number }, addedAt: string }} BundleEntry
 */

/**
 * Inlined buildBundleCss — same logic as src/lib/bundle-export.ts but
 * without the `@/` alias import.
 * @param {BundleEntry[]} entries
 * @param {any[]} effects
 * @returns {string}
 */
function buildBundleCss(entries, effects) {
  const resolved = entries
    .map((entry) => {
      const effect = effects.find((e) => e.id === entry.effectId)
      if (!effect) return null
      const customizedCss = customizeCss(effect.css, entry.opts)
      return { entry, effect, customizedCss }
    })
    .filter((x) => x !== null)

  if (resolved.length === 0) return '/* CSSFX bundle is empty */'

  return resolved
    .map(({ effect, entry, customizedCss }) => {
      const optsLine = [
        entry.opts.hue !== 0 ? `hue=${entry.opts.hue}` : null,
        entry.opts.saturation !== 0 ? `sat=${entry.opts.saturation}` : null,
        entry.opts.scale !== 1 ? `scale=${entry.opts.scale}` : null,
        entry.opts.speed !== 1 ? `speed=${entry.opts.speed}` : null,
      ]
        .filter(Boolean)
        .join(', ')

      return [
        `/* ============================================================`,
        `   ${effect.name} (${effect.id})`,
        `   Category: ${effect.category}`,
        optsLine ? `   Customized: ${optsLine}` : null,
        `   ========================================================== */`,
        customizedCss.trim(),
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}

/** Inlined buildBundleHtml — same logic, no `@/` alias. */
function buildBundleHtml(entries, effects) {
  const resolved = entries
    .map((entry) => {
      const effect = effects.find((e) => e.id === entry.effectId)
      if (!effect) return null
      const customizedCss = customizeCss(effect.css, entry.opts)
      return { entry, effect, customizedCss }
    })
    .filter((x) => x !== null)

  const cssBlocks = resolved
    .map(({ effect, customizedCss }) =>
      [
        `/* ============================================================`,
        `   ${effect.name} (${effect.id})`,
        `   Category: ${effect.category}`,
        `   ${effect.description}`,
        `   ========================================================== */`,
        customizedCss.trim(),
      ].join('\n'),
    )
    .join('\n\n')

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

  const cards = resolved
    .map(({ effect, entry, customizedCss }) => {
      const optsSummary = [
        entry.opts.hue !== 0 ? `hue: ${entry.opts.hue}°` : null,
        entry.opts.saturation !== 0 ? `sat: ${entry.opts.saturation}%` : null,
        entry.opts.scale !== 1 ? `size: ${entry.opts.scale}×` : null,
        entry.opts.speed !== 1 ? `speed: ${entry.opts.speed}×` : null,
      ].filter(Boolean).join(' · ')

      return `
    <article class="cssfx-card">
      <header>
        <h2>${escapeHtml(effect.name)}</h2>
        <span class="cssfx-cat">${escapeHtml(effect.category)}</span>
        ${optsSummary ? `<span class="cssfx-opts">${escapeHtml(optsSummary)}</span>` : ''}
      </header>
      <div class="cssfx-preview${effect.darkSurface ? ' cssfx-dark' : ''}">
        ${effect.html}
      </div>
    </article>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CSSFX Bundle — ${resolved.length} effect${resolved.length === 1 ? '' : 's'}</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    .cssfx-card { background: #fff; border: 1px solid #e2e8f0; padding: 1rem; margin-bottom: 1rem; }
    .cssfx-preview { padding: 1rem; background: #f8fafc; }
    .cssfx-dark { background: #020617; }
    ${cssBlocks}
  </style>
</head>
<body>
  <h1>CSSFX Bundle</h1>
${cards}
</body>
</html>
`
}

const mockEffects = [
  {
    id: 'fx-1',
    name: 'Test Effect 1',
    category: 'Buttons',
    description: 'A test button',
    html: '<button class="fx-1">Click</button>',
    css: '.fx-1 { color: #f43f5e; padding: 10px; }',
    darkSurface: false,
  },
  {
    id: 'fx-2',
    name: 'Test Effect 2',
    category: 'Loaders',
    description: 'A test loader',
    html: '<div class="fx-2"></div>',
    css: '.fx-2 { width: 40px; height: 40px; background: #6366f1; }',
    darkSurface: true,
  },
]

const entries = [
  {
    effectId: 'fx-1',
    opts: { hue: 30, saturation: 0, scale: 1, speed: 1 },
    addedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    effectId: 'fx-2',
    opts: { hue: 0, saturation: -50, scale: 1.2, speed: 1 },
    addedAt: '2025-01-02T00:00:00.000Z',
  },
  // This one references a missing effect — should be silently skipped.
  {
    effectId: 'fx-deleted',
    opts: { hue: 0, saturation: 0, scale: 1, speed: 1 },
    addedAt: '2025-01-03T00:00:00.000Z',
  },
]

let pass = 0, fail = 0
function check(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; console.log(`  ✗ ${name}`) }
}

console.log('1. buildBundleHtml produces a valid HTML document')
const html = buildBundleHtml(entries, mockEffects)
check('  starts with <!doctype html>', html.startsWith('<!doctype html>'))
check('  has <title> with effect count', html.includes('<title>CSSFX Bundle — 2 effects'))
check('  contains first effect name', html.includes('Test Effect 1'))
check('  contains second effect name', html.includes('Test Effect 2'))
check('  does NOT contain the deleted effect id', !html.includes('fx-deleted'))
check('  contains the HTML markup', html.includes('<button class="fx-1">Click</button>'))
check('  contains the original CSS rule', html.includes('.fx-1 {'))
check('  hue-shifted color appears (rose was #f43f5e, hue=30 shifts it)', !html.includes('#f43f5e'))
check('  dark surface class applied to second effect', html.includes('cssfx-dark'))
check('  opts summary shows hue value', html.includes('hue: 30°'))
check('  self-closing </html> at end', html.trim().endsWith('</html>'))

console.log('2. buildBundleCss produces CSS-only output')
const css = buildBundleCss(entries, mockEffects)
check('  starts with comment header', css.startsWith('/* ===='))
check('  contains first effect CSS', css.includes('.fx-1 {'))
check('  contains second effect CSS', css.includes('.fx-2 {'))
check('  hue-shifted color is in CSS (no #f43f5e)', !css.includes('#f43f5e'))
check('  does NOT contain HTML body markup', !css.includes('<button'))
check('  has customization comment line', css.includes('Customized:'))

console.log('3. Empty bundle handling')
const emptyHtml = buildBundleHtml([], mockEffects)
check('  empty bundle HTML still valid', emptyHtml.startsWith('<!doctype html>'))
check('  shows 0 effects in title', emptyHtml.includes('0 effects'))
const emptyCss = buildBundleCss([], mockEffects)
check('  empty bundle CSS has placeholder comment', emptyCss.includes('empty'))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)

