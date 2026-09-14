import test from 'node:test'
import assert from 'node:assert/strict'

import { EFFECTS } from './effects'
import { customizeCss } from './customize'
import { namespaceKeyframes, scopeCss } from './scope-css'
import { supportsVariations, variationsFor } from './variations'

/**
 * Both functions here exist because a stylesheet that is correct on its own
 * stops being correct when a page renders several copies of it. The tests are
 * mostly about the concatenation, not the individual sheet.
 */

/* ── scoping ───────────────────────────────────────────────────────────── */

test('selectors get the wrapper, at-rule preludes do not', () => {
  const out = scopeCss('.a, .b { color: red; } @keyframes spin { to { transform: rotate(1turn); } }', 'w')
  assert.match(out, /\.w \.a, \.w \.b \{/)
  // The bug this function was extracted to prevent: `.w @keyframes spin`
  // is not a selector, so the browser drops the whole block and every
  // animated preview freezes.
  assert.match(out, /@keyframes spin \{/)
  assert.doesNotMatch(out, /\.w @keyframes/)
})

test('conditional groups keep their condition and scope one level in', () => {
  const out = scopeCss('@media (prefers-reduced-motion: reduce) { .a { animation: none; } }', 'w')
  assert.match(out, /@media \(prefers-reduced-motion: reduce\) \{/)
  assert.match(out, /\.w \.a \{/)
})

/* ── keyframe namespacing ──────────────────────────────────────────────── */

test('a declared keyframe and its references are renamed together', () => {
  const css = '@keyframes spin { to { transform: rotate(1turn); } } .a { animation: spin 1s linear infinite; }'
  const out = namespaceKeyframes(css, 'card1')
  assert.match(out, /@keyframes spin-card1 \{/)
  assert.match(out, /animation: spin-card1 1s linear infinite/)
})

test('animation-name and multi-value shorthands are both covered', () => {
  const css =
    '@keyframes a { to { opacity: 1; } } @keyframes b { to { opacity: 0; } } ' +
    '.x { animation-name: a; } .y { animation: a 1s, b 2s; }'
  const out = namespaceKeyframes(css, 's')
  assert.match(out, /animation-name: a-s;/)
  assert.match(out, /animation: a-s 1s, b-s 2s;/)
})

test('an animation this sheet does not declare is left alone', () => {
  // Referencing a global utility's keyframes is legitimate; renaming the
  // reference would point it at something that does not exist.
  const out = namespaceKeyframes('.x { animation: tw-pulse 2s infinite; }', 's')
  assert.equal(out, '.x { animation: tw-pulse 2s infinite; }')
})

test('a name that is a prefix of another is not partially renamed', () => {
  const css =
    '@keyframes fade { to { opacity: 1; } } @keyframes fade-out { to { opacity: 0; } } ' +
    '.a { animation: fade 1s; } .b { animation: fade-out 1s; }'
  const out = namespaceKeyframes(css, 's')
  assert.match(out, /@keyframes fade-s \{/)
  assert.match(out, /@keyframes fade-out-s \{/)
  assert.match(out, /\.a \{ animation: fade-s 1s; \}/)
  assert.match(out, /\.b \{ animation: fade-out-s 1s; \}/)
})

/* ── the reason both exist ─────────────────────────────────────────────── */

/** Every `@keyframes <name>` a stylesheet declares. */
function keyframeNames(css: string): string[] {
  return [...css.matchAll(/@(?:-[a-z]+-)?keyframes\s+([\w-]+)/gi)].map((m) => m[1])
}

test('no two variations of one effect declare the same keyframe name', () => {
  /*
   * The regression this is here for.
   *
   * Keyframe names are global and last-definition-wins. The variations rail
   * concatenates seven customized copies of one effect into a single <style>,
   * and 166 of the effects in this catalog animate through keyframes that
   * customization rewrites — different translate distances after a scale, or
   * different colours after a hue rotation. Without namespacing, all seven
   * cards resolved to whichever definition came last, and because the rail's
   * <style> is emitted after the page's own, the effect's MAIN preview higher
   * up the page adopted a variation's keyframes too.
   *
   * Nothing about a single sheet is wrong when this happens, which is why the
   * test has to build the concatenation the page actually renders.
   */
  let checked = 0
  for (const effect of EFFECTS) {
    if (!supportsVariations(effect.renderer)) continue
    if (!/@keyframes/i.test(effect.css)) continue
    checked++

    const seen = new Set<string>()
    for (const v of variationsFor(effect.id)) {
      const wrapper = `fx-var-${effect.id}-${v.id}`
      const sheet = scopeCss(namespaceKeyframes(customizeCss(effect.css, v.opts), wrapper), wrapper)
      for (const name of keyframeNames(sheet)) {
        assert.equal(
          seen.has(name),
          false,
          `${effect.id}: "${name}" is declared by more than one of its seven variations`,
        )
        seen.add(name)
      }
    }
  }
  assert.ok(checked > 100, `only ${checked} animated effects checked`)
})

test('every animation reference in a rendered sheet resolves inside that sheet', () => {
  // Renaming a declaration without its references is the other half of the
  // same bug, and produces an element that carries an animation-name pointing
  // at keyframes that no longer exist — it simply stops moving.
  for (const effect of EFFECTS.slice(0, 250)) {
    if (!supportsVariations(effect.renderer)) continue
    if (!/@keyframes/i.test(effect.css)) continue

    for (const v of variationsFor(effect.id)) {
      const wrapper = `fx-var-${effect.id}-${v.id}`
      const original = new Set(keyframeNames(effect.css))
      const sheet = namespaceKeyframes(customizeCss(effect.css, v.opts), wrapper)
      const declared = new Set(keyframeNames(sheet))

      for (const [, value] of sheet.matchAll(/animation(?:-name)?\s*:([^;}]*)/gi)) {
        for (const token of value.split(',')) {
          for (const word of token.trim().split(/\s+/)) {
            // Only assert on words that name one of THIS effect's animations;
            // durations, easings and `infinite` are not keyframe names.
            if (original.has(word)) {
              assert.fail(
                `${effect.id}/${v.id}: reference to un-namespaced "${word}" survived`,
              )
            }
            if (word.startsWith('fx-') && word.includes(wrapper)) {
              assert.ok(
                declared.has(word),
                `${effect.id}/${v.id}: "${word}" is referenced but not declared`,
              )
            }
          }
        }
      }
    }
  }
})
