/**
 * The conversion, run over every effect in the catalog.
 *
 *   npm test  →  node --import=tsx --test src/lib/registry/effects-css.test.ts
 *
 * The unit tests next door pin the edges one at a time. This is the one
 * that would actually catch a conversion bug, because it checks the thing
 * that matters — that no declaration is lost, gained or altered — against
 * all 771 generated effects rather than against fourteen samples somebody
 * thought of.
 *
 * It compares two independent walks of the same text: the converter's, and
 * a deliberately dumber brace-depth scan in the test file. Two
 * implementations agreeing is evidence; one implementation agreeing with
 * itself is not.
 *
 * Reads `generated-effects.json` directly rather than importing `effects.ts`,
 * which pulls the handcrafted set and the alias map in with it. The
 * generated file is what the registry converts, so it is what this checks.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cssToObject } from './css-to-object'
import { declarationsInSource, flattenCss } from './css-to-object.test'

interface GeneratedEffect {
  id: string
  css: string
}

const HERE = dirname(fileURLToPath(import.meta.url))
const EFFECTS = JSON.parse(
  readFileSync(join(HERE, '..', 'generated-effects.json'), 'utf8'),
) as GeneratedEffect[]

describe('effect CSS converts for the registry', () => {
  it('has effects to check', () => {
    assert.ok(EFFECTS.length > 500, `only ${EFFECTS.length} effects loaded`)
  })

  it('every effect converts with no unreadable input', () => {
    const problems: string[] = []

    for (const effect of EFFECTS) {
      const { warnings } = cssToObject(effect.css, effect.id)
      /*
        A repeated declaration is a known, documented fidelity loss and is
        allowed through; anything the converter could not read at all is
        not. The distinction is the point — one is a fallback the cascade
        would have discarded anyway, the other is CSS going missing.
      */
      const unreadable = warnings.filter((w) => w.includes('could not read'))
      if (unreadable.length) problems.push(`${effect.id}: ${unreadable[0]}`)
    }

    assert.deepEqual(problems, [], `${problems.length} effects have unreadable CSS`)
  })

  it('no declaration is lost, gained or altered', () => {
    const problems: string[] = []

    for (const effect of EFFECTS) {
      const converted = flattenCss(cssToObject(effect.css, effect.id).css)
      const direct = declarationsInSource(effect.css)

      for (const [path, value] of direct) {
        if (!converted.has(path)) {
          problems.push(`${effect.id}: lost "${path}"`)
        } else if (converted.get(path) !== value) {
          problems.push(
            `${effect.id}: "${path}" became "${converted.get(path)}" (was "${value}")`,
          )
        }
      }
      for (const path of converted.keys()) {
        if (!direct.has(path)) problems.push(`${effect.id}: invented "${path}"`)
      }
    }

    assert.deepEqual(problems.slice(0, 10), [], `${problems.length} declaration mismatches`)
  })

  it('every effect produces a non-empty object', () => {
    const empty = EFFECTS.filter((e) => Object.keys(cssToObject(e.css, e.id).css).length === 0)
    assert.deepEqual(
      empty.map((e) => e.id),
      [],
      'these effects convert to nothing at all',
    )
  })

  it('survives a JSON round trip, since that is how it ships', () => {
    for (const effect of EFFECTS.slice(0, 50)) {
      const { css } = cssToObject(effect.css, effect.id)
      assert.deepEqual(JSON.parse(JSON.stringify(css)), css, effect.id)
    }
  })
})
