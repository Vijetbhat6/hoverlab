import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Two functions decide whether a workspace still entitles anybody:
 * `subscriptionIsLive` in entitlements.ts, which gates features, and
 * `isLive` in workspace.ts, which gates the seat list and the invite code.
 * They are separate because they read different documents on different
 * paths, and they are supposed to be identical.
 *
 * When they disagree, nothing throws and nothing renders wrong on the page
 * that made the change. What happens is that a workspace is live on one
 * path and dead on the other: seats a customer paid for stop appearing
 * while the features stay on, or the reverse — features cut off while the
 * workspace still lists everyone. Both read as "the app is broken" to
 * somebody who has paid, and neither is a type error.
 *
 * The risk arrived with 'team-annual'. Every status before it was either
 * permanent ('active', 'lifetime') or a grace period on a subscription that
 * had already failed. An annual term is the first status that is fully paid,
 * fully valid, and expires on a date — so it is the first one where getting
 * the expiry check wrong in one file and not the other silently sells
 * something that stops working early, or keeps working for free.
 *
 * This reads the source text rather than calling the functions because both
 * are module-private, and exporting them purely to test them would widen an
 * API for no caller. The parse below is deliberately literal: if someone
 * reformats either function past what it understands, this test fails and
 * asks for a look at both. That is the intended outcome, not a false alarm.
 */

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

/** The body of a named function, from its signature to the closing brace. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`)
  assert.notEqual(start, -1, `${name} not found — was it renamed?`)
  const open = source.indexOf('{', start)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(open, i + 1)
    }
  }
  throw new Error(`unbalanced braces in ${name}`)
}

const STATUS = /status === '([a-z_]+)'/g

/**
 * Statuses split by how they are decided: those a single-line `return true`
 * accepts outright, and those whose branch has to consult an end date.
 */
function classify(body: string): { always: Set<string>; expiring: Set<string> } {
  const always = new Set<string>()
  const expiring = new Set<string>()
  for (const line of body.split('\n')) {
    const found = [...line.matchAll(STATUS)].map((m) => m[1])
    if (found.length === 0) continue
    const target = /return true\s*$/.test(line.trim()) ? always : expiring
    for (const s of found) target.add(s)
  }
  return { always, expiring }
}

const entitlements = classify(
  functionBody(read('./entitlements.ts'), 'subscriptionIsLive'),
)
const workspace = classify(functionBody(read('./workspace.ts'), 'isLive'))

const sorted = (s: Set<string>) => [...s].sort()

describe('workspace liveness', () => {
  test('both functions accept exactly the same statuses outright', () => {
    assert.deepEqual(
      sorted(entitlements.always),
      sorted(workspace.always),
      'a status is permanently live on one path and not the other',
    )
  })

  test('both functions expire exactly the same statuses', () => {
    assert.deepEqual(
      sorted(entitlements.expiring),
      sorted(workspace.expiring),
      'a status is expiry-checked on one path and not the other',
    )
  })

  test("'term' expires on both paths and is live outright on neither", () => {
    // The one that would cost money. 'term' is an annual licence bought
    // outright: treating it like 'lifetime' gives away every year after the
    // first, and omitting it entirely kills a workspace somebody has paid
    // for that day.
    for (const [name, seen] of [
      ['entitlements.ts', entitlements],
      ['workspace.ts', workspace],
    ] as const) {
      assert.ok(
        seen.expiring.has('term'),
        `${name} does not expire 'term' — an annual licence that never ends`,
      )
      assert.ok(
        !seen.always.has('term'),
        `${name} treats 'term' as permanent — twelve months sold, forever granted`,
      )
    }
  })

  test('every expiring branch actually reads the end date', () => {
    for (const [name, body] of [
      ['entitlements.ts', functionBody(read('./entitlements.ts'), 'subscriptionIsLive')],
      ['workspace.ts', functionBody(read('./workspace.ts'), 'isLive')],
    ] as const) {
      assert.match(
        body,
        /currentPeriodEnd/,
        `${name} classifies a status as expiring but never looks at a date`,
      )
    }
  })
})
