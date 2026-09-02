import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  MARKUP_FRAMEWORKS,
  isMarkupFramework,
  wrapMarkup,
} from './markup-frameworks'

/**
 * What matters here is that each file is valid in its target and that the
 * caveat survives into the file. The markup itself is not ours to check —
 * it comes from `react-dom/server` and is asserted elsewhere.
 */

const MARKUP = '<section class="p-4">\n  <h2 class="text-lg">Hi</h2>\n</section>'

function wrap(framework: (typeof MARKUP_FRAMEWORKS)[number], isInteractive = false) {
  return wrapMarkup(MARKUP, {
    framework,
    id: 'pricing-tiers',
    name: 'Three-Plan Pricing Toggle',
    isInteractive,
  })
}

test('every framework produces its own extension', () => {
  assert.equal(wrap('html').filename, 'pricing-tiers.html')
  assert.equal(wrap('vue').filename, 'pricing-tiers.vue')
  assert.equal(wrap('svelte').filename, 'pricing-tiers.svelte')
  assert.equal(wrap('astro').filename, 'pricing-tiers.astro')
})

test('the markup is never altered', () => {
  // The entire safety argument for this module: it wraps, it does not
  // translate. A wrapper that reformatted the markup would be a second
  // rendering path able to disagree with the first.
  for (const framework of MARKUP_FRAMEWORKS) {
    const { code } = wrap(framework)
    const withoutIndent = code.replace(/^ {2}/gm, '')
    assert.ok(
      withoutIndent.includes('<h2 class="text-lg">Hi</h2>'),
      `${framework} lost or rewrote the markup`,
    )
  }
})

test('the vue file is a template-only single-file component', () => {
  const { code } = wrap('vue')
  assert.ok(code.includes('<template>'))
  assert.ok(code.trimEnd().endsWith('</template>'))
  // No script block: an empty one is noise, a populated one would be
  // inventing behaviour the rendered output does not have.
  assert.doesNotMatch(code, /<script/)
})

test('the astro file opens with a frontmatter fence', () => {
  const { code } = wrap('astro')
  assert.ok(code.startsWith('---\n'))
  assert.equal(code.split('---').length - 1, 2)
})

test('the caveat travels inside the file, not only in the UI', () => {
  // The file is what gets pasted into a repo and read six months later by
  // someone who never saw the page that offered it.
  for (const framework of MARKUP_FRAMEWORKS) {
    const { code } = wrap(framework)
    assert.match(code, /markup from the Hoverlab catalog/)
    assert.match(code, /not a port of the React source/)
  }
})

test('an interactive block says its handlers are missing', () => {
  const quiet = wrap('vue', false).code
  const interactive = wrap('vue', true).code

  assert.match(interactive, /handlers are NOT here/)
  assert.doesNotMatch(quiet, /handlers are NOT here/)
  assert.match(quiet, /no interactive behaviour/)
})

test('comment lines are prefixed once, not twice', () => {
  // The first version baked indentation into the caveat and then indented
  // it again, producing a comment indented twice in three of four formats.
  const { code } = wrap('html')
  const commentLines = code
    .split('\n')
    .slice(1)
    .filter((line) => line.trim() && !line.startsWith('-->'))
    .slice(0, 3)

  for (const line of commentLines) {
    assert.doesNotMatch(line, /^ {4}/, `over-indented: ${JSON.stringify(line)}`)
  }
})

test('astro comments use the frontmatter comment syntax throughout', () => {
  const { code } = wrap('astro')
  const frontmatter = code.split('---')[1]
  for (const line of frontmatter.split('\n').filter((l) => l.trim())) {
    assert.match(line, /^\/\//, `not a comment: ${JSON.stringify(line)}`)
  }
})

test('the framework guard accepts only what is offered', () => {
  assert.equal(isMarkupFramework('vue'), true)
  assert.equal(isMarkupFramework('react'), false)
  assert.equal(isMarkupFramework(''), false)
})
