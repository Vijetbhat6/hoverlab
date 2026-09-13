/**
 * Reading a diff, so the reviewer can be pointed at a change rather than a
 * codebase.
 *
 * WHY THIS EXISTS AT ALL
 *
 * Run the rules over a mature repository and they will return hundreds of
 * findings, every one of which predates the pull request in front of you.
 * That is not a review, it is a backlog, and a bot that opens with a
 * backlog gets muted in a week. So the default is to review what changed:
 * the files a diff touched, and within them the findings that sit on or
 * beside a touched line.
 *
 * THE CONTEXT WINDOW, AND WHY IT IS NOT ZERO
 *
 * A finding is attributed to the line its opening tag starts on. An edit
 * three lines down — adding an `onClick` to a `<div>` whose tag began
 * earlier, or removing the `alt` from a multi-line `<img>` — is genuinely
 * caused by the diff but does not land on the tag's own line. A window of a
 * few lines either side catches those without opening the floodgates.
 *
 * It is a heuristic and it is stated as one. `--all-lines` turns it off and
 * reviews every finding in every touched file, which is the right mode for
 * a file someone has just written.
 */

import { execFileSync } from 'node:child_process'

/** How far from a touched line a finding may sit and still count. */
export const CONTEXT_LINES = 3

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

/** The repository root, or null when this is not a work tree. */
export function repoRoot(cwd = process.cwd()) {
  try {
    return git(['rev-parse', '--show-toplevel'], cwd).trim()
  } catch {
    return null
  }
}

/**
 * The merge base against which a branch should be reviewed.
 *
 * `git diff main` compares against the tip of main, which includes
 * everything that landed on main since the branch was cut — other people's
 * work, reported as this pull request's problem. The merge base is what a
 * pull request actually proposes, and getting this wrong is the classic way
 * a review bot blames the wrong author.
 */
export function mergeBase(base, cwd) {
  try {
    return git(['merge-base', 'HEAD', base], cwd).trim()
  } catch {
    return base
  }
}

/**
 * Files added or modified relative to a base.
 *
 * Deletions are excluded — there is nothing left to review — and so are
 * renames' old paths. With no base, this reads the working tree instead:
 * staged and unstaged changes plus untracked files, which is what someone
 * running the command by hand before committing means by "my changes".
 */
export function changedFiles(cwd, base) {
  if (base) {
    const out = git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`], cwd)
    return out.split('\n').map((l) => l.trim()).filter(Boolean)
  }

  const tracked = git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], cwd)
  const untracked = git(['ls-files', '--others', '--exclude-standard'], cwd)
  return [
    ...new Set(
      [...tracked.split('\n'), ...untracked.split('\n')].map((l) => l.trim()).filter(Boolean),
    ),
  ]
}

/**
 * The line numbers a diff touched in one file, on the new side.
 *
 * Parsed from `-U0` hunk headers: `@@ -old,n +new,m @@`. A hunk with `m`
 * of zero is a pure deletion and contributes no new lines, which is right —
 * deleting code cannot introduce a finding in the code that remains.
 *
 * @returns {Set<number>}
 */
export function changedLines(cwd, base, path) {
  const args = base
    ? ['diff', '-U0', `${base}...HEAD`, '--', path]
    : ['diff', '-U0', 'HEAD', '--', path]

  let out
  try {
    out = git(args, cwd)
  } catch {
    return new Set()
  }

  const lines = new Set()
  for (const match of out.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(match[1])
    const count = match[2] === undefined ? 1 : Number(match[2])
    for (let i = 0; i < count; i++) lines.add(start + i)
  }
  return lines
}

/**
 * Whether a finding sits close enough to a touched line to be this diff's
 * problem.
 *
 * A finding with no line survives the filter. That is deliberate: an
 * unlocatable finding in a file the diff touched is more likely to be
 * relevant than not, and silently dropping it would make the reviewer
 * quietly less thorough on exactly the files it cannot read well.
 */
export function touchedByDiff(finding, lines) {
  if (lines.size === 0) return true
  if (finding.line === undefined) return true

  for (let offset = -CONTEXT_LINES; offset <= CONTEXT_LINES; offset++) {
    if (lines.has(finding.line + offset)) return true
  }
  return false
}
