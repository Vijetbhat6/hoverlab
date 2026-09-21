import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  MARKER_END,
  MARKER_START,
  RULE_TARGETS,
  mergeManagedSection,
  removeManagedSection,
  renderRules,
} from '../src/rules.mjs'

/* ------------------------------------------------------------------ *
 *  Fixtures
 * ------------------------------------------------------------------ */

/**
 * The real skill, when this test runs inside the repo (it always does; the
 * CLI package is tested from a checkout). Shaped like the API returns it:
 * `markdown` and no `body`.
 */
function realSkill() {
  try {
    const markdown = readFileSync(
      fileURLToPath(new URL('../../../skills/hoverlab/SKILL.md', import.meta.url)),
      'utf8',
    )
    const front = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(markdown)
    const field = (key) => new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(front[1])[1].trim()
    return { id: 'hoverlab', name: field('name'), description: field('description'), markdown }
  } catch {
    return null
  }
}

const REAL = realSkill()

const SMALL = {
  id: 'demo',
  name: 'demo',
  description: 'Build things from the demo catalog. Use when asked to add a widget.',
  body: [
    '# Demo',
    '',
    'A catalog you install.',
    '',
    '## The rungs',
    '',
    '| Rung | What |',
    '| --- | --- |',
    '| `one` | first |',
    '',
    '## How to use it',
    '',
    '### MCP tools',
    '',
    '- `search` - find things.',
    '',
    '```bash',
    '## this is a shell comment, not a heading',
    'npx demo search x',
    '```',
    '',
    '## Working rules',
    '',
    '**Search first.** Then install.',
    '',
    '## What to reach for',
    '',
    '- "nicer button" -> effect.',
    '',
    '## Not in scope',
    '',
    'Data layer.',
  ].join('\n'),
}
SMALL.markdown = `---\nname: demo\ndescription: ${SMALL.description}\n---\n\n${SMALL.body}\n`

const skills = [['small fixture', SMALL]]
if (REAL) skills.push(['skills/hoverlab/SKILL.md', REAL])

/** A tiny front-matter reader: flat `key: value`, JSON-quoted strings allowed. */
function parseFront(content) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content)
  assert.ok(match, 'file must start with front matter')
  const fields = {}
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z]+):(?: (.*))?$/.exec(line)
    assert.ok(kv, `unparseable front matter line: ${line}`)
    const raw = (kv[2] ?? '').trim()
    fields[kv[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw
  }
  return { fields, rest: content.slice(match[0].length) }
}

/* ------------------------------------------------------------------ *
 *  Targets
 * ------------------------------------------------------------------ */

test('the four targets exist with the agreed paths', () => {
  assert.deepEqual(Object.keys(RULE_TARGETS).sort(), ['agents', 'claude', 'cursor', 'windsurf'])
  assert.equal(RULE_TARGETS.cursor.path, '.cursor/rules/hoverlab.mdc')
  assert.equal(RULE_TARGETS.windsurf.path, '.windsurf/rules/hoverlab.md')
  assert.equal(RULE_TARGETS.agents.path, 'AGENTS.md')
  assert.equal(RULE_TARGETS.claude.path, 'CLAUDE.md')
  assert.equal(RULE_TARGETS.cursor.managed, false)
  assert.equal(RULE_TARGETS.agents.managed, true)
})

for (const [label, skill] of skills) {
  for (const id of Object.keys(RULE_TARGETS)) {
    test(`${id} renders from ${label}`, () => {
      const out = renderRules(id, skill)
      assert.equal(out.path, RULE_TARGETS[id].path)
      assert.equal(out.managed, RULE_TARGETS[id].managed)
      assert.ok(out.content.endsWith('\n'))
      assert.ok(out.content.includes('The rung') || out.content.includes('rung'), 'keeps the skill body')
      if (id !== 'windsurf' || label === 'small fixture') assert.deepEqual(out.dropped, [])
      assert.equal(out.size.chars, out.content.length)
    })
  }
}

test('an unknown target lists the valid ones', () => {
  assert.throws(() => renderRules('emacs', SMALL), /Pick one of: cursor, windsurf, agents, claude/)
})

test('a skill with no body or no description is refused, not rendered empty', () => {
  assert.throws(() => renderRules('cursor', { name: 'x', description: 'd', markdown: '---\nname: x\n---\n' }), /no body/)
  assert.throws(() => renderRules('cursor', { name: 'x', body: 'b' }), /no description/)
  assert.throws(() => renderRules('cursor', null), /skill object/)
})

test('renders from `markdown` alone, and from `body`, identically', () => {
  const fromMarkdown = renderRules('windsurf', { name: SMALL.name, description: SMALL.description, markdown: SMALL.markdown })
  const fromBody = renderRules('windsurf', { name: SMALL.name, description: SMALL.description, body: SMALL.body })
  assert.equal(fromMarkdown.content, fromBody.content)
})

test('CRLF input renders the same as LF input', () => {
  const crlf = { ...SMALL, body: SMALL.body.replace(/\n/g, '\r\n') }
  for (const id of Object.keys(RULE_TARGETS)) {
    assert.equal(renderRules(id, crlf).content, renderRules(id, SMALL).content)
  }
})

/* ------------------------------------------------------------------ *
 *  Cursor + Windsurf front matter
 * ------------------------------------------------------------------ */

for (const [label, skill] of skills) {
  test(`cursor front matter is description + empty globs + alwaysApply false (${label})`, () => {
    const { content } = renderRules('cursor', skill)
    const { fields, rest } = parseFront(content)
    assert.deepEqual(Object.keys(fields), ['description', 'globs', 'alwaysApply'])
    assert.equal(fields.description, skill.description.replace(/\s+/g, ' ').trim())
    assert.equal(fields.globs, '')
    assert.equal(fields.alwaysApply, 'false')
    assert.match(rest.trimStart(), /^<!-- Generated by `npx hoverlab rules cursor`/)
  })

  test(`windsurf front matter is trigger model_decision + description (${label})`, () => {
    const { content } = renderRules('windsurf', skill)
    const { fields } = parseFront(content)
    assert.deepEqual(Object.keys(fields), ['trigger', 'description'])
    assert.equal(fields.trigger, 'model_decision')
    assert.equal(fields.description, skill.description.replace(/\s+/g, ' ').trim())
  })
}

test('a description containing ": " or a leading symbol is quoted so the YAML stays valid', () => {
  for (const description of ['Use when: asked to add a thing', '# looks like a comment', 'a #hash', 'true', "it's: fine"]) {
    const { content } = renderRules('windsurf', { ...SMALL, description })
    const { fields } = parseFront(content)
    assert.equal(fields.description, description, description)
    assert.match(content, /^---\ntrigger: model_decision\ndescription: "/, description)
  }
})

test('a multi-line description is collapsed to one line', () => {
  const { content } = renderRules('cursor', { ...SMALL, description: 'one\n  two\n\nthree' })
  assert.equal(parseFront(content).fields.description, 'one two three')
})

/* ------------------------------------------------------------------ *
 *  Size budgets
 * ------------------------------------------------------------------ */

test('windsurf output is at most 6000 characters for the real skill', { skip: !REAL }, () => {
  const out = renderRules('windsurf', REAL)
  assert.ok(out.content.length <= 6000, `windsurf output is ${out.content.length} characters`)
  // What was dropped is reported, not silent, and is never a leading section.
  for (const heading of out.dropped) {
    assert.ok(!out.content.includes(`## ${heading}\n`), heading)
  }
  // The other targets have no such cap and must carry the whole skill.
  for (const id of ['cursor', 'agents', 'claude']) {
    assert.deepEqual(renderRules(id, REAL).dropped, [], id)
  }
})

test('windsurf output stays at most 6000 characters when the skill grows, and says what it dropped', () => {
  const bulk = 'Filler sentence that takes room. '.repeat(60)
  const huge = {
    ...SMALL,
    body: SMALL.body + '\n\n' + ['## Extra one', bulk, '## Extra two', bulk, '## Extra three', bulk, '## Extra four', bulk].join('\n\n'),
  }
  const out = renderRules('windsurf', huge)
  assert.ok(out.content.length <= 6000, `windsurf output is ${out.content.length} characters`)
  assert.ok(out.dropped.length > 0)
  // Least load-bearing go first, and the leading sections are never dropped.
  assert.equal(out.dropped[0], 'Not in scope')
  assert.ok(out.content.includes('## The rungs'))
  assert.ok(out.content.includes('## How to use it'))
  for (const heading of out.dropped) assert.ok(!out.content.includes(`## ${heading}\n`), heading)
})

test('a skill that cannot fit even with everything optional dropped throws rather than truncating', () => {
  const bulk = 'x'.repeat(7000)
  assert.throws(
    () => renderRules('windsurf', { ...SMALL, body: `# T\n\n## One\n\n${bulk}\n\n## Two\n\nshort` }),
    /cannot fit its budget/,
  )
})

test('cursor is held to 500 lines', () => {
  const lines = Array.from({ length: 600 }, (_, i) => `line ${i}`).join('\n')
  const out = renderRules('cursor', { ...SMALL, body: `# T\n\n## One\n\nx\n\n## Two\n\ny\n\n## Extra\n\n${lines}` })
  assert.ok(out.size.lines <= 500)
  assert.deepEqual(out.dropped, ['Extra'])
})

/* ------------------------------------------------------------------ *
 *  Content fidelity
 * ------------------------------------------------------------------ */

test('code fences are respected: a "## " inside one is not a section boundary', () => {
  const { content } = renderRules('windsurf', SMALL)
  assert.ok(content.includes('```bash\n## this is a shell comment, not a heading\nnpx demo search x\n```'))
})

test('shared files demote headings one level under a single "## " title, and inside fences stay untouched', () => {
  const { content } = renderRules('agents', SMALL)
  assert.ok(content.includes('\n## Demo\n'))
  assert.ok(content.includes('\n### The rungs\n'))
  assert.ok(content.includes('\n#### MCP tools\n'))
  assert.ok(content.includes('\n## this is a shell comment, not a heading\n'), 'fenced text is not demoted')
  assert.ok(!/^# /m.test(content), 'no H1 in a file the user owns')
  assert.ok(content.includes(SMALL.description), 'the routing description leads the section')
})

test('the output invents no numbers: every digit run comes from the skill text', () => {
  for (const [, skill] of skills) {
    const source = `${skill.description}\n${skill.markdown ?? skill.body}`
    const known = new Set(source.match(/\d+/g) ?? [])
    for (const id of Object.keys(RULE_TARGETS)) {
      const { content } = renderRules(id, skill)
      // Front matter `alwaysApply: false` and the marker comments carry no digits.
      for (const digits of content.match(/\d+/g) ?? []) {
        assert.ok(known.has(digits), `${id}: "${digits}" is not in the skill`)
      }
    }
  }
})

test('the managed section is one marker pair, wrapping everything', () => {
  for (const id of ['agents', 'claude']) {
    const { content } = renderRules(id, SMALL)
    assert.ok(content.startsWith(`${MARKER_START}\n`))
    assert.ok(content.endsWith(`${MARKER_END}\n`))
    assert.equal(content.split(MARKER_START).length, 2)
    assert.equal(content.split(MARKER_END).length, 2)
    assert.match(content, new RegExp(`npx hoverlab rules ${id}`))
  }
})

/* ------------------------------------------------------------------ *
 *  mergeManagedSection
 * ------------------------------------------------------------------ */

const SECTION = renderRules('agents', SMALL).content
const USER = '# My project\n\nUse tabs.\n\n## Testing\n\nRun `npm test`.\n'

test('a new file becomes the section and a newline', () => {
  assert.equal(mergeManagedSection('', SECTION), SECTION)
  assert.equal(mergeManagedSection(null, SECTION), SECTION)
  assert.equal(mergeManagedSection(undefined, SECTION), SECTION)
})

test('with no markers the section is appended after a blank line', () => {
  const merged = mergeManagedSection(USER, SECTION)
  assert.equal(merged, `${USER}\n${SECTION}`)
})

test('merging twice is a byte-identical no-op', () => {
  const once = mergeManagedSection(USER, SECTION)
  const twice = mergeManagedSection(once, SECTION)
  assert.equal(twice, once)
  assert.ok(Buffer.from(twice).equals(Buffer.from(once)))
})

test('a changed section replaces only the marked region', () => {
  const first = mergeManagedSection(USER, SECTION)
  const newer = renderRules('agents', { ...SMALL, description: 'A different description. Use when asked.' }).content
  const second = mergeManagedSection(first, newer)
  assert.ok(second.includes('A different description.'))
  assert.ok(!second.includes(SMALL.description))
  assert.ok(second.startsWith(USER), 'text before the markers is byte-identical')
  assert.equal(second.split(MARKER_START).length, 2)
})

test('user text before and after the markers is byte-identical', () => {
  const before = '  # Hand written \t\n\n\n- odd   spacing\n\n'
  const after = '\n\n\n## Later notes\r\nmixed ending\r\n   trailing spaces   '
  const file = `${before}${MARKER_START}\nold body\n${MARKER_END}${after}`
  const merged = mergeManagedSection(file, SECTION)
  assert.ok(merged.startsWith(before))
  assert.ok(merged.endsWith(after))
  assert.equal(merged.slice(before.length, merged.length - after.length), SECTION.replace(/\n$/, ''))
})

test('LF files stay LF', () => {
  const merged = mergeManagedSection(USER, SECTION)
  assert.ok(!merged.includes('\r'))
})

test('CRLF files stay CRLF, on append and on replace', () => {
  const crlfUser = USER.replace(/\n/g, '\r\n')
  const appended = mergeManagedSection(crlfUser, SECTION)
  assert.ok(appended.startsWith(crlfUser))
  assert.ok(!/(?<!\r)\n/.test(appended), 'no bare LF anywhere in a CRLF file')

  const replaced = mergeManagedSection(appended, SECTION)
  assert.equal(replaced, appended, 'idempotent under CRLF')

  const newer = renderRules('agents', { ...SMALL, description: 'Changed. Use when asked.' }).content
  const edited = mergeManagedSection(appended, newer)
  assert.ok(!/(?<!\r)\n/.test(edited))
  assert.ok(edited.startsWith(crlfUser))
})

test('a file with mixed endings keeps its majority style', () => {
  const mostlyLf = 'a\nb\nc\r\nd\n'
  assert.ok(!/\r/.test(mergeManagedSection(mostlyLf, SECTION).slice(mostlyLf.length)))
  const mostlyCrlf = 'a\r\nb\r\nc\nd\r\n'
  assert.ok(!/(?<!\r)\n/.test(mergeManagedSection(mostlyCrlf, SECTION).slice(mostlyCrlf.length)))
})

test('a file without a final newline gets one blank line and no newline invented at the end', () => {
  const merged = mergeManagedSection('no newline', SECTION)
  assert.ok(merged.startsWith('no newline\n\n'))
  assert.ok(merged.endsWith(MARKER_END))
  assert.equal(mergeManagedSection(merged, SECTION), merged)
})

test('corrupt marker pairs throw a clear error and change nothing', () => {
  const cases = [
    [`${USER}${MARKER_START}\nhalf`, /no "<!-- hoverlab:end -->"/],
    [`${USER}${MARKER_END}\n`, /no "<!-- hoverlab:start -->"/],
    [`${MARKER_START}\na\n${MARKER_START}\nb\n${MARKER_END}\n`, /2 "<!-- hoverlab:start -->" markers/],
    [`${MARKER_START}\na\n${MARKER_END}\n${MARKER_END}\n`, /2 "<!-- hoverlab:end -->" markers/],
    [`${MARKER_END}\nx\n${MARKER_START}\n`, /wrong order/],
  ]
  for (const [file, pattern] of cases) {
    assert.throws(() => mergeManagedSection(file, SECTION), pattern)
    assert.throws(() => removeManagedSection(file), pattern)
  }
})

test('a malformed section is refused', () => {
  assert.throws(() => mergeManagedSection(USER, 'just text'), /exactly one/)
  assert.throws(() => mergeManagedSection(USER, `text before\n${SECTION}`), /exactly one/)
  assert.throws(() => mergeManagedSection(USER, ''), /rendered section/)
})

/* ------------------------------------------------------------------ *
 *  removeManagedSection
 * ------------------------------------------------------------------ */

test('remove returns a file that was only appended to to its original bytes', () => {
  const originals = [
    USER,
    'one line\n',
    'no trailing newline',
    USER.replace(/\n/g, '\r\n'),
    '﻿bom start\n',
    'tail\n\n\n',
  ]
  for (const original of originals) {
    const merged = mergeManagedSection(original, SECTION)
    const removed = removeManagedSection(merged)
    assert.equal(removed.found, true)
    assert.equal(removed.empty, false)
    assert.ok(
      Buffer.from(removed.text).equals(Buffer.from(original)),
      `round trip failed for ${JSON.stringify(original)} -> ${JSON.stringify(removed.text)}`,
    )
  }
})

test('remove on a file we created signals empty so the caller can delete it', () => {
  const created = mergeManagedSection('', SECTION)
  assert.deepEqual(removeManagedSection(created), { text: '', found: true, empty: true })
})

test('remove leaves a section in the middle with one blank line between its neighbours', () => {
  const file = `top\n\n${MARKER_START}\nx\n${MARKER_END}\n\nbottom\n`
  assert.deepEqual(removeManagedSection(file), { text: 'top\n\nbottom\n', found: true, empty: false })
})

test('remove with no markers reports not found and returns the text untouched', () => {
  assert.deepEqual(removeManagedSection(USER), { text: USER, found: false, empty: false })
  assert.deepEqual(removeManagedSection(''), { text: '', found: false, empty: false })
  assert.deepEqual(removeManagedSection(null), { text: '', found: false, empty: false })
})
