/**
 * The suggestion table is a set of hand-typed ids, and a suggestion that
 * points at something that does not exist is a bug that only a reader
 * following the link would ever find. So every target is resolved against
 * the registries it names:
 *
 *   tool       /tools/<id> in src/lib/designer-tools.ts
 *   primitive  an `id:` in src/lib/primitives/catalog.ts
 *   block      an `id:` in src/lib/blocks/catalog.ts
 *   page       src/app/<path>/page.tsx
 *   command    a `case` in bin/hoverlab.mjs
 *
 * The registries live in the site, not in this package, so when the tests
 * run from a checkout of the package alone the resolution tests are skipped
 * and the structural ones still run.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { RULE_ORDER } from '../src/audit-url/index.mjs'
import { SUGGESTIONS, describeTarget, suggestionsFor } from '../src/audit-url/suggest.mjs'

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = path.resolve(CLI, '..', '..')
const inSite = existsSync(path.join(SITE, 'src', 'lib', 'designer-tools.ts'))
const skip = inSite ? false : 'the site registries are not next to this package'

const read = (...parts) => readFileSync(path.join(SITE, ...parts), 'utf8')
const all = (source, pattern) => new Set([...source.matchAll(pattern)].map((m) => m[1]))

const targets = Object.entries(SUGGESTIONS).flatMap(([rule, list]) => list.map((target) => ({ rule, target })))

test('every rule the audit can emit has at least one suggestion, and no suggestion is for a rule that does not exist', () => {
  for (const rule of RULE_ORDER) {
    assert.ok(suggestionsFor(rule).length > 0, `${rule} has no suggestion`)
  }
  for (const rule of Object.keys(SUGGESTIONS)) {
    assert.ok(RULE_ORDER.includes(rule), `${rule} is in the table but the audit never emits it`)
  }
})

test('every target says why, and describes itself without the network', () => {
  for (const { rule, target } of targets) {
    assert.ok(target.why && target.why.length > 8, `${rule}: ${JSON.stringify(target)} has no reason`)
    const text = describeTarget(target, 'https://example.test')
    assert.ok(text && !/undefined/.test(text), `${rule}: ${text}`)
  }
  assert.equal(describeTarget({ kind: 'tool', id: 'contrast' }, 'https://example.test'), 'https://example.test/tools/contrast')
  assert.equal(describeTarget({ kind: 'primitive', id: 'button' }), 'npx hoverlab add button')
})

test('every tool target is a real designer tool', { skip }, () => {
  const tools = all(read('src', 'lib', 'designer-tools.ts'), /href:\s*'\/tools\/([a-z0-9-]+)'/g)
  assert.ok(tools.size > 10, 'failed to read the tools registry')
  for (const { rule, target } of targets.filter((t) => t.target.kind === 'tool')) {
    assert.ok(tools.has(target.id), `${rule}: no tool "${target.id}"`)
    assert.ok(existsSync(path.join(SITE, 'src', 'app', 'tools', target.id, 'page.tsx')), `${rule}: no route for tool "${target.id}"`)
  }
})

test('every primitive target is a real primitive, and every block target a real block', { skip }, () => {
  const primitives = all(read('src', 'lib', 'primitives', 'catalog.ts'), /^\s+id:\s*'([a-z0-9-]+)'/gm)
  const blocks = all(read('src', 'lib', 'blocks', 'catalog.ts'), /^\s+id:\s*'([a-z0-9-]+)'/gm)
  assert.ok(primitives.size > 10 && blocks.size > 10, 'failed to read the catalogs')
  for (const { rule, target } of targets) {
    if (target.kind === 'primitive') assert.ok(primitives.has(target.id), `${rule}: no primitive "${target.id}"`)
    if (target.kind === 'block') assert.ok(blocks.has(target.id), `${rule}: no block "${target.id}"`)
  }
})

test('every page target is a route that exists', { skip }, () => {
  for (const { rule, target } of targets.filter((t) => t.target.kind === 'page')) {
    assert.ok(existsSync(path.join(SITE, 'src', 'app', ...target.path.split('/').filter(Boolean), 'page.tsx')), `${rule}: no route ${target.path}`)
  }
})

test('every command target names a command the CLI actually dispatches', () => {
  const bin = readFileSync(path.join(CLI, 'bin', 'hoverlab.mjs'), 'utf8')
  const commands = all(bin, /case '([a-z-]+)':/g)
  assert.ok(commands.has('review') && commands.has('audit-url'))
  for (const { rule, target } of targets.filter((t) => t.target.kind === 'command')) {
    const match = /^npx hoverlab ([a-z-]+)/.exec(target.line)
    assert.ok(match, `${rule}: "${target.line}" is not an "npx hoverlab <command>" line`)
    assert.ok(commands.has(match[1]), `${rule}: hoverlab has no command "${match[1]}"`)
  }
})

test('a rule with no entry has no suggestions rather than throwing', () => {
  assert.deepEqual(suggestionsFor('not-a-rule'), [])
})
