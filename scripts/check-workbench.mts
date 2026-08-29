/**
 * Guard: a designer tool that pairs a preview with controls must use
 * <ToolWorkbench>.
 *
 * Every tool page used to write the two-column shell by hand —
 *
 *   <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
 *
 * — and not one of the thirty-odd copies pinned anything. Measured on the
 * running app at 1440x900, the preview was 0% visible by the time you had
 * scrolled to the last control on 16 of 20 tools; at 390x844 the columns
 * stack, so it was 19 of 20. <ToolWorkbench> fixes that once for all of
 * them.
 *
 * Nothing stops the next tool from pasting the old shell back, though, and
 * the failure is invisible: the page looks right until you scroll it on a
 * phone. So this fails the build instead. Adding a tool is already a
 * several-file checklist; this is the part of it a script can hold.
 *
 * Run: npm run check:workbench
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const TOOLS_DIR = 'src/app/tools'
const SHARED_DIR = 'src/components/designer-tools'

/**
 * A two-column grid whose tracks are one flexible and one fixed — the
 * shape of "preview beside controls", in either order.
 */
const SHELL =
  /className="grid[^"]*\blg:grid-cols-\[(?:minmax\(0,\s*)?(?:\d+px|1fr)\)?_(?:minmax\(0,\s*)?(?:\d+px|1fr)\)?\]/g

/** Two flexible tracks: side-by-side panes, not a preview being driven. */
const EVEN_SPLIT = /lg:grid-cols-\[(?:minmax\(0,\s*)?1fr\)?_(?:minmax\(0,\s*)?1fr\)?\]/

/**
 * Shells that are deliberately not workbenches. Each needs a reason, and
 * the reason is the point: a new entry here should be an argument, not a
 * way to silence the check.
 */
const ALLOWED: Record<string, string> = {
  'src/app/tools/convert/page.tsx':
    'the shell is a footer row holding <UseInCatalog> and <ToolPresetsBar>, not a preview and its controls; the tool itself is two side-by-side panes',
  'src/app/tools/tailwind/page.tsx':
    'same footer row as convert — the converter proper is a two-pane lg:grid-cols-2 layout with input and output already side by side',
}

interface Violation {
  file: string
  line: number
  snippet: string
}

function sourceFiles(): string[] {
  const files: string[] = []

  if (existsSync(TOOLS_DIR)) {
    for (const entry of readdirSync(TOOLS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const page = join(TOOLS_DIR, entry.name, 'page.tsx')
      if (existsSync(page)) files.push(page.replace(/\\/g, '/'))
    }
  }

  // The shared studios (loader, palette) hold the shell for the thin pages
  // that render them, so they are subject to the same rule.
  if (existsSync(SHARED_DIR)) {
    for (const entry of readdirSync(SHARED_DIR)) {
      if (entry.endsWith('.tsx')) files.push(`${SHARED_DIR}/${entry}`.replace(/\\/g, '/'))
    }
  }

  return files
}

function check(): Violation[] {
  const violations: Violation[] = []

  for (const file of sourceFiles()) {
    const source = readFileSync(file, 'utf8')
    if (source.includes('ToolWorkbench')) continue
    if (file in ALLOWED) continue

    const lines = source.split(/\r?\n/)
    lines.forEach((line, i) => {
      SHELL.lastIndex = 0
      if (!SHELL.test(line)) return
      // Two 1fr tracks is a pane split — both halves are on screen together
      // and neither is driving the other.
      if (EVEN_SPLIT.test(line)) return
      violations.push({ file, line: i + 1, snippet: line.trim().slice(0, 90) })
    })
  }

  return violations
}

const violations = check()

if (violations.length === 0) {
  const n = sourceFiles().length
  console.log(`check:workbench — OK (${n} tool sources, no unpinned preview/controls shells)`)
  process.exit(0)
}

console.error('check:workbench — FAILED\n')
console.error(
  'These lay a preview out beside its controls without <ToolWorkbench>, so the\n' +
    'preview scrolls off screen while the controls are used:\n',
)
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`)
  console.error(`    ${v.snippet}\n`)
}
console.error(
  'Fix: replace the wrapping <div> with <ToolWorkbench> (preview child first,\n' +
    'or previewSide="right" if the controls come first) and pass the fixed track\n' +
    'as controlsWidth. See src/components/designer-tools/tool-workbench.tsx.\n\n' +
    'If the shell genuinely is not a preview being driven by controls, add it to\n' +
    'ALLOWED in this script with the reason.',
)
process.exit(1)
