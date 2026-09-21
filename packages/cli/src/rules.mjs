/**
 * Rules files for the editors that read them: Cursor, Windsurf, and the
 * cross-tool `AGENTS.md` / `CLAUDE.md` convention.
 *
 * PURE. No filesystem, no network, no clock. `renderRules` turns a skill (the
 * object `getSkill` returns) into `{ path, content }`; the command layer does
 * the reading and writing. That split is deliberate: everything here can be
 * tested by comparing strings, and the one operation that can damage a user's
 * file (merging into an AGENTS.md they wrote by hand) is a function of two
 * strings and nothing else.
 *
 * WHERE THE WORDS COME FROM
 *
 * Nowhere in this file. The single source of truth for what an agent should
 * know about Hoverlab is `skills/hoverlab/SKILL.md`, and every sentence this
 * module emits is a sentence from that skill, re-shaped for the target. It
 * never states a count, a tool name or a flag of its own - the last time a
 * shipped file did that it said "121 blocks" for 183. The only text authored
 * here is the marker comment, which describes the file rather than the
 * catalog. Because the skill is fetched from the API at run time, running
 * `hoverlab rules` again is also how a stale rules file gets corrected.
 *
 * WHAT "CONDENSE" MEANS
 *
 * Whole sections are kept or dropped, never rewritten. When a target has a
 * size budget and the skill does not fit, sections are removed (the least
 * load-bearing first) and the result reports what was removed in `dropped`.
 * A rules file that quietly loses half a sentence is worse than one that
 * says nothing about a topic, so nothing is ever cut mid-section.
 *
 * TARGET FORMATS (checked against vendor docs, Sep 2026)
 *
 *   cursor    .cursor/rules/hoverlab.mdc - MDC front matter `description`,
 *             `globs`, `alwaysApply`. Rule type is decided by which are set:
 *             `alwaysApply: true` = always; `globs` + `alwaysApply: false` =
 *             auto-attached when a matching file is in context; `description`
 *             only = "Apply Intelligently" (the agent reads the description
 *             and pulls the rule in when relevant); nothing = manual.
 *             https://cursor.com/docs/context/rules
 *
 *             We ship description-only, with `globs` present but empty (the
 *             shape Cursor's own rule editor writes). The trigger for this
 *             skill is an INTENT - "add a pricing section", "make this
 *             nicer" - which is often said in a project with no .tsx open
 *             yet, and a glob rule cannot fire before a matching file is in
 *             context. Cursor does not document what a rule with both
 *             `description` and `globs` does, so the combination is avoided
 *             rather than guessed at.
 *
 *   windsurf  .windsurf/rules/hoverlab.md - front matter `trigger:` one of
 *             always_on | model_decision | glob | manual. We use
 *             `model_decision` (Cascade sees only the description until it
 *             decides the rule is relevant) for the same intent-not-file
 *             reason. Size: older docs give 6,000 characters per rule file
 *             and 12,000 in total; the current docs restate the per-file cap
 *             as 12,000 for workspace rules (6,000 for the global file). We
 *             stay under 6,000, which satisfies both readings. The current
 *             docs also prefer `.devin/rules/` and treat `.windsurf/rules/`
 *             as the legacy location that is still read.
 *             https://docs.devin.ai/desktop/cascade/memories
 *
 *   agents    AGENTS.md - plain markdown, no front matter, read by Codex,
 *             Cursor, Windsurf, Copilot, Zed, Jules and others. Users own
 *             this file, so we write a MANAGED SECTION between markers.
 *
 *   claude    CLAUDE.md - same shape, same markers.
 */

export const MARKER_START = '<!-- hoverlab:start -->'
export const MARKER_END = '<!-- hoverlab:end -->'

/**
 * Supported targets.
 *
 * `managed: true` means the file is shared with the user: `renderRules`
 * returns a marker-wrapped SECTION and the caller must run it through
 * `mergeManagedSection`. `managed: false` means the file is ours outright and
 * `content` is the whole file.
 *
 * `maxChars` / `maxLines` are the budgets `renderRules` fits the output into.
 * Only Windsurf's is a vendor limit (characters) and Cursor's is a vendor
 * recommendation (lines). The shared files' line budget is our own: those
 * files are loaded into every session, so what goes in them is a running cost
 * and the section stays a fraction of a typical AGENTS.md.
 */
export const RULE_TARGETS = Object.freeze({
  cursor: Object.freeze({
    id: 'cursor',
    label: 'Cursor',
    path: '.cursor/rules/hoverlab.mdc',
    managed: false,
    maxChars: null,
    maxLines: 500,
  }),
  windsurf: Object.freeze({
    id: 'windsurf',
    label: 'Windsurf',
    path: '.windsurf/rules/hoverlab.md',
    managed: false,
    maxChars: 6000,
    maxLines: null,
  }),
  agents: Object.freeze({
    id: 'agents',
    label: 'AGENTS.md',
    path: 'AGENTS.md',
    managed: true,
    maxChars: null,
    maxLines: 200,
  }),
  claude: Object.freeze({
    id: 'claude',
    label: 'CLAUDE.md',
    path: 'CLAUDE.md',
    managed: true,
    maxChars: null,
    maxLines: 200,
  }),
})

/**
 * Sections to give up first when a target's budget is too small, most
 * expendable first. Matched against the section heading. Anything not listed
 * is dropped last-to-first, and the first two sections are never dropped.
 */
const DROP_FIRST = [/^not in scope/i, /^what to reach for/i]

/** How many leading sections are never dropped. */
const PROTECTED_SECTIONS = 2

/* ------------------------------------------------------------------ *
 *  Skill parsing
 * ------------------------------------------------------------------ */

function collapse(text) {
  return String(text).replace(/\s+/g, ' ').trim()
}

function stripFrontMatter(markdown) {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(markdown)
  return match ? markdown.slice(match[0].length) : markdown
}

/**
 * Accept what the API returns (`markdown`, no `body`) as well as what the
 * site's generated JSON holds (`markdown` and `body`).
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'object') {
    throw new TypeError('renderRules needs a skill object: { name, description, markdown | body }.')
  }
  const name = typeof skill.name === 'string' ? skill.name.trim() : ''
  const description = typeof skill.description === 'string' ? collapse(skill.description) : ''
  let body = typeof skill.body === 'string' ? skill.body : null
  if (body === null && typeof skill.markdown === 'string') body = stripFrontMatter(skill.markdown)

  if (!name) throw new Error('The skill has no name.')
  if (!description) throw new Error(`The skill "${name}" has no description.`)
  if (!body || !body.trim()) throw new Error(`The skill "${name}" has no body.`)

  return { name, description, body: body.replace(/\r\n?/g, '\n').trim() }
}

/** Opening/closing fence tracking, so a `## ` inside a code block is not a heading. */
function makeFenceTracker() {
  let open = null
  return function inFence(line) {
    const match = /^\s*(`{3,}|~{3,})/.exec(line)
    if (match) {
      const marker = match[1]
      if (!open) {
        open = { char: marker[0], length: marker.length }
        return true
      }
      if (marker[0] === open.char && marker.length >= open.length) {
        open = null
        return true
      }
    }
    return open !== null
  }
}

function trimBlankLines(lines) {
  let start = 0
  let end = lines.length
  while (start < end && lines[start].trim() === '') start += 1
  while (end > start && lines[end - 1].trim() === '') end -= 1
  return lines.slice(start, end)
}

/**
 * Split a skill body into `{ title, preamble, sections[] }` on top-level
 * (`## `) headings. Sub-headings stay inside their section.
 */
function parseBody(body) {
  const inFence = makeFenceTracker()
  const preamble = []
  const sections = []
  let title = null
  let current = null

  for (const line of body.split('\n')) {
    const fenced = inFence(line)
    if (!fenced) {
      if (
        title === null &&
        current === null &&
        preamble.every((l) => l.trim() === '') &&
        /^# \S/.test(line)
      ) {
        title = line.slice(2).trim()
        continue
      }
      const heading = /^## +(.+?)\s*#*\s*$/.exec(line)
      if (heading) {
        current = { heading: heading[1], lines: [] }
        sections.push(current)
        continue
      }
    }
    ;(current ? current.lines : preamble).push(line)
  }

  return {
    title,
    preamble: trimBlankLines(preamble).join('\n'),
    sections: sections.map((s) => ({
      heading: s.heading,
      text: trimBlankLines(s.lines).join('\n'),
    })),
  }
}

/** Push every heading outside a code fence one level deeper. */
function demote(text) {
  const inFence = makeFenceTracker()
  return text
    .split('\n')
    .map((line) => (!inFence(line) && /^#{1,5} /.test(line) ? `#${line}` : line))
    .join('\n')
}

/* ------------------------------------------------------------------ *
 *  Front matter
 * ------------------------------------------------------------------ */

/**
 * A YAML scalar for a single-line value. Plain when that is unambiguous,
 * double-quoted (JSON string syntax is valid YAML) when it is not - a
 * description that ever contains `: ` would otherwise turn the whole rule
 * file into a parse error that the editor swallows without telling anyone.
 */
function yamlScalar(value) {
  const text = collapse(value)
  const risky =
    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(text) ||
    /:\s|\s#|:$/.test(text) ||
    /^(true|false|null|yes|no|on|off|~|-?\d[\d._]*)$/i.test(text)
  return risky ? JSON.stringify(text) : text
}

function frontMatter(fields) {
  const lines = Object.entries(fields).map(([key, value]) =>
    value === '' ? `${key}:` : `${key}: ${value}`,
  )
  return `---\n${lines.join('\n')}\n---`
}

/* ------------------------------------------------------------------ *
 *  Rendering
 * ------------------------------------------------------------------ */

function joinBlocks(blocks) {
  return blocks.filter((b) => b && b.length).join('\n\n')
}

function renderSections(sections, deeper) {
  return sections.map((s) => {
    const heading = deeper ? `### ${s.heading}` : `## ${s.heading}`
    return joinBlocks([heading, deeper ? demote(s.text) : s.text])
  })
}

function measure(content) {
  return { chars: content.length, lines: content.split('\n').length }
}

function overBudget(content, target) {
  const size = measure(content)
  if (target.maxChars !== null && size.chars > target.maxChars) return true
  if (target.maxLines !== null && size.lines > target.maxLines) return true
  return false
}

/**
 * Build the file, dropping whole sections until it fits the target's budget.
 * `assemble(sections, withNote)` returns the complete output for a set of
 * sections, with or without the provenance note.
 */
function fitToBudget(parsed, target, assemble) {
  const kept = parsed.sections.slice()
  const dropped = []

  /*
   * The provenance note is the first thing to go when space is short: it is
   * the one line here that is not the skill's own words, so losing it costs
   * the reader nothing the skill said.
   */
  let withNote = true
  let content = assemble(kept, withNote)
  while (overBudget(content, target)) {
    if (withNote) {
      withNote = false
      content = assemble(kept, withNote)
      continue
    }
    let index = -1
    for (const pattern of DROP_FIRST) {
      index = kept.findIndex((s) => pattern.test(s.heading))
      if (index !== -1) break
    }
    if (index === -1 && kept.length > PROTECTED_SECTIONS) index = kept.length - 1
    if (index === -1) {
      const size = measure(content)
      throw new Error(
        `The "${target.id}" rules file cannot fit its budget even with every optional section ` +
          `dropped (${size.chars} characters, ${size.lines} lines; limit ` +
          `${target.maxChars !== null ? `${target.maxChars} characters` : `${target.maxLines} lines`}).`,
      )
    }
    dropped.push(kept[index].heading)
    kept.splice(index, 1)
    content = assemble(kept, withNote)
  }

  return { content, dropped }
}

function generatedNote(target) {
  // Short on purpose: Windsurf's file budget is 6,000 characters and every
  // character of this line is one a skill section may need.
  return `Generated by \`npx hoverlab rules ${target.id}\`. Re-run to update; edits are overwritten.`
}

function renderOwnedFile(target, skill, parsed) {
  const fields =
    target.id === 'cursor'
      ? {
          description: yamlScalar(skill.description),
          globs: '',
          alwaysApply: 'false',
        }
      : {
          trigger: 'model_decision',
          description: yamlScalar(skill.description),
        }

  const assemble = (sections, withNote) =>
    joinBlocks([
      frontMatter(fields),
      withNote ? `<!-- ${generatedNote(target)} -->` : '',
      `# ${parsed.title ?? skill.name}`,
      parsed.preamble,
      ...renderSections(sections, false),
    ]) + '\n'

  return fitToBudget(parsed, target, assemble)
}

function renderManagedSection(target, skill, parsed) {
  const assemble = (sections, withNote) =>
    [
      MARKER_START,
      withNote
        ? `<!-- ${generatedNote(target)} Add your own notes outside these markers. -->`
        : '<!-- Managed by hoverlab. -->',
      '',
      joinBlocks([
        `## ${parsed.title ?? skill.name}`,
        skill.description,
        demote(parsed.preamble),
        ...renderSections(sections, true),
      ]),
      '',
      MARKER_END,
    ].join('\n') + '\n'

  return fitToBudget(parsed, target, assemble)
}

/**
 * Render one target.
 *
 * @param {'cursor'|'windsurf'|'agents'|'claude'} targetId
 * @param {{ name: string, description: string, markdown?: string, body?: string }} skill
 * @returns {{
 *   target: string,
 *   path: string,
 *   content: string,
 *   managed: boolean,
 *   dropped: string[],
 *   size: { chars: number, lines: number },
 * }}
 *   `path` is relative to the project root. When `managed` is true, `content`
 *   is a marker-wrapped section: pass it to `mergeManagedSection` with the
 *   file's existing text (or '' when there is none), do not write it as-is
 *   over an existing file. `dropped` lists sections omitted to fit the
 *   target's budget - empty in the normal case, worth printing when not.
 */
export function renderRules(targetId, skill) {
  const target = RULE_TARGETS[targetId]
  if (!target) {
    throw new Error(
      `Unknown rules target "${targetId}". Pick one of: ${Object.keys(RULE_TARGETS).join(', ')}.`,
    )
  }

  const normalized = normalizeSkill(skill)
  const parsed = parseBody(normalized.body)
  const { content, dropped } = target.managed
    ? renderManagedSection(target, normalized, parsed)
    : renderOwnedFile(target, normalized, parsed)

  return {
    target: target.id,
    path: target.path,
    content,
    managed: target.managed,
    dropped,
    size: measure(content),
  }
}

/* ------------------------------------------------------------------ *
 *  The managed section
 * ------------------------------------------------------------------ */

function countOf(text, needle) {
  let count = 0
  let from = 0
  for (;;) {
    const at = text.indexOf(needle, from)
    if (at === -1) return count
    count += 1
    from = at + needle.length
  }
}

/**
 * Locate the marked region, or throw if the markers are not exactly one
 * well-ordered pair. Guessing which of two starts to honour would mean
 * deleting text the user wrote, so anything ambiguous is an error that names
 * the problem and what to do about it.
 *
 * @returns {{ start: number, end: number } | null} `end` is exclusive.
 */
function locate(text, fileLabel = 'the file') {
  const starts = countOf(text, MARKER_START)
  const ends = countOf(text, MARKER_END)

  if (starts === 0 && ends === 0) return null

  const fix = `Fix or delete the stray marker in ${fileLabel} by hand, then run this again.`
  if (starts > 1) {
    throw new Error(`${fileLabel} has ${starts} "${MARKER_START}" markers; expected one. ${fix}`)
  }
  if (ends > 1) {
    throw new Error(`${fileLabel} has ${ends} "${MARKER_END}" markers; expected one. ${fix}`)
  }
  if (starts === 1 && ends === 0) {
    throw new Error(`${fileLabel} has "${MARKER_START}" but no "${MARKER_END}". ${fix}`)
  }
  if (starts === 0 && ends === 1) {
    throw new Error(`${fileLabel} has "${MARKER_END}" but no "${MARKER_START}". ${fix}`)
  }

  const start = text.indexOf(MARKER_START)
  const end = text.indexOf(MARKER_END)
  if (end < start) {
    throw new Error(`${fileLabel} has its Hoverlab markers in the wrong order (end before start). ${fix}`)
  }
  return { start, end: end + MARKER_END.length }
}

/** CRLF if the file is mostly CRLF, else LF. A file with no newline at all gets LF. */
function detectEol(text) {
  const crlf = countOf(text, '\r\n')
  const lf = countOf(text, '\n') - crlf
  return crlf > lf ? '\r\n' : '\n'
}

function toEol(text, eol) {
  return text.replace(/\r\n?|\n/g, eol)
}

/**
 * Put `section` into `existing`.
 *
 * - No markers: appended after a blank line.
 * - One well-formed pair: only the text from the start marker to the end
 *   marker is replaced; every byte outside is untouched.
 * - Anything else: throws, and writes nothing.
 *
 * Idempotent: merging the same section twice gives the same bytes as merging
 * it once. The file's own line-ending style is kept - the section is
 * converted to match, never the reverse.
 *
 * @param {string | null | undefined} existing  current file text; '' or null for a new file
 * @param {string} section  what `renderRules` returned for a managed target
 * @returns {string} the new file text
 */
export function mergeManagedSection(existing, section) {
  const current = existing ?? ''
  if (typeof section !== 'string' || !section.trim()) {
    throw new TypeError('mergeManagedSection needs the rendered section as a string.')
  }

  const body = section.replace(/(\r?\n)+$/, '')
  const sectionRegion = locate(body, 'the rendered section')
  if (!sectionRegion || sectionRegion.start !== 0 || sectionRegion.end !== body.length) {
    throw new Error(
      `The rendered section must be exactly one "${MARKER_START}" ... "${MARKER_END}" block.`,
    )
  }

  const region = locate(current)
  const eol = detectEol(current)
  const text = toEol(body, eol)

  if (region) {
    return current.slice(0, region.start) + text + current.slice(region.end)
  }

  if (current.trim() === '') return text + eol

  if (/\n$/.test(current)) return current + eol + text + eol
  /*
   * The file does not end in a newline. Do not add one to the end of the
   * section either: it was not there before we arrived, and adding it would
   * make `removeManagedSection` unable to hand the file back byte for byte.
   */
  return current + eol + eol + text
}

/**
 * Take the managed section back out.
 *
 * Removes the marked region plus the one blank line `mergeManagedSection`
 * put in front of it, so a file that was only ever appended to comes back
 * byte for byte. Text outside the markers is never altered.
 *
 * @param {string} existing
 * @returns {{ text: string, found: boolean, empty: boolean }}
 *   `empty` is true when nothing but whitespace is left - the caller should
 *   delete the file rather than write an empty one, since the file only
 *   existed to hold this section.
 */
export function removeManagedSection(existing) {
  const current = existing ?? ''
  const region = locate(current)
  if (!region) return { text: current, found: false, empty: false }

  let before = current.slice(0, region.start)
  let after = current.slice(region.end)

  const afterEol = /^\r?\n/.exec(after)
  if (afterEol) {
    after = after.slice(afterEol[0].length)
    // The section had a line after it, so it was followed by a separator or
    // by the file's last newline: drop the one blank line in front of it.
    before = before.replace(/\r?\n(?=\r?\n$)/, '')
  } else if (after === '') {
    // Section at the very end with no trailing newline: the append path
    // added a blank line and nothing after.
    before = before.replace(/\r?\n\r?\n$/, '')
  }

  const text = before + after
  return { text: text.trim() === '' ? '' : text, found: true, empty: text.trim() === '' }
}
