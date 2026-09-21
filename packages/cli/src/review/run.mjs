/**
 * Running a review: which files, which findings, in what scope.
 *
 * This used to live inside `commandReview`, welded to the terminal. It is
 * here because it now has three callers that want the same answer and none
 * of them should re-derive it: the CLI prints it, the GitHub Action posts it
 * as a comment, and the MCP `review_code` tool hands it to an agent that has
 * just written the component. If those three each collected files and
 * filtered by diff on their own, they would disagree about what "your
 * change" means — and a reviewer that contradicts itself between the
 * terminal and the pull request is one people stop believing.
 *
 * Nothing in this file prints, sets an exit code, or reads a flag object.
 * Callers pass plain options and get plain data back.
 */

import path from 'node:path'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'

import { REVIEWABLE, fixSource, reviewSource } from './index.mjs'
import { changedFiles, changedLines, mergeBase, repoRoot, touchedByDiff } from './git.mjs'

/**
 * Files to review when the user named paths rather than a diff.
 *
 * A directory is walked; a file is taken as given even when it does not
 * look reviewable, because someone who types a filename has said what they
 * mean and a silent skip would read as a clean bill of health.
 */
export async function collectPaths(inputs, cwd) {
  const found = []

  const visit = async (target, explicit) => {
    const absolute = path.resolve(cwd, target)
    let info
    try {
      info = await stat(absolute)
    } catch {
      throw new Error(`No such file or directory: ${target}`)
    }

    if (info.isDirectory()) {
      for (const entry of await readdir(absolute, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        await visit(path.join(absolute, entry.name), false)
      }
      return
    }

    if (explicit || REVIEWABLE.test(absolute)) found.push(absolute)
  }

  for (const input of inputs) await visit(input, true)
  return found
}

/** A path as the reader will type it: repo- or cwd-relative, forward slashes. */
function reviewPath(absolute, root, cwd, useRepoRoot) {
  let base
  if (useRepoRoot) {
    base = path.relative(root, absolute)
  } else {
    const relative = path.relative(cwd, absolute)
    base = relative && !relative.startsWith('..') ? relative : absolute
  }
  return base.split(path.sep).join('/')
}

/**
 * Review a set of paths, or a diff when no paths are named.
 *
 * THE DEFAULT IS A DIFF, NOT A CODEBASE
 *
 * Pointed at a mature repository these rules return hundreds of findings,
 * every one of which predates the change in front of you. That is a
 * backlog, not a review, and a reviewer that opens with a backlog gets
 * muted. So with no paths this reads the working tree's changes; with
 * `base` it reads what a branch proposes, measured from the merge base
 * rather than the tip, so commits other people landed on main are not
 * reported as yours.
 *
 * @param {object} options
 * @param {string[]} [options.paths]       files or directories; empty means "the diff"
 * @param {string}   [options.base]        a ref to diff against, from its merge base
 * @param {string}   [options.cwd]
 * @param {boolean}  [options.fix]         apply the safe spacing codemod first
 * @param {boolean}  [options.allLines]    keep findings the diff did not touch
 * @param {boolean}  [options.violationsOnly]
 * @returns {Promise<{
 *   findings: import('./index.mjs').Finding[],
 *   scope: string,
 *   fileCount: number,
 *   diffMode: boolean,
 *   fixed: { rewrites: number, files: number } | null,
 * }>}
 */
export async function runReview({
  paths = [],
  base,
  cwd = process.cwd(),
  fix = false,
  allLines = false,
  violationsOnly = false,
} = {}) {
  const root = repoRoot(cwd)
  const diffMode = paths.length === 0

  let absolutePaths
  let mergeBaseRef = null
  let scope

  if (!diffMode) {
    absolutePaths = await collectPaths(paths, cwd)
    scope = `${absolutePaths.length} file${absolutePaths.length === 1 ? '' : 's'} you named`
  } else {
    if (!root) {
      throw new Error(
        'Not a git repository, so there is no diff to review. Name the files or a ' +
          'directory instead: `hoverlab review src/components`.',
      )
    }
    mergeBaseRef = base ? mergeBase(String(base), root) : null
    absolutePaths = changedFiles(root, mergeBaseRef)
      .filter((file) => REVIEWABLE.test(file))
      .map((file) => path.resolve(root, file))
    scope = base ? `what this branch changes against ${base}` : 'your uncommitted changes'
  }

  if (absolutePaths.length === 0) {
    return { findings: [], scope, fileCount: 0, diffMode, fixed: null }
  }

  const files = []
  for (const absolute of absolutePaths) {
    files.push({ path: absolute, source: await readFile(absolute, 'utf8') })
  }

  let fixed = null
  if (fix) {
    fixed = { rewrites: 0, files: 0 }
    for (const file of files) {
      const result = fixSource(file)
      if (result.rewrites.length === 0) continue
      await writeFile(file.path, result.source, 'utf8')
      file.source = result.source
      fixed.files++
      fixed.rewrites += result.rewrites.length
    }
  }

  let findings = []
  for (const file of files) {
    const display = reviewPath(file.path, root, cwd, diffMode)
    let forFile = reviewSource({ path: display, source: file.source })

    /*
      In diff mode, keep only what the change is responsible for. A file
      with no hunks — reached because it is untracked, so every line of it
      is new — comes back with an empty set, and `touchedByDiff` treats that
      as "all of it", which is right.
    */
    if (diffMode && !allLines) {
      const lines = changedLines(root, mergeBaseRef, display)
      forFile = forFile.filter((finding) => touchedByDiff(finding, lines))
    }

    findings.push(...forFile)
  }

  if (violationsOnly) {
    findings = findings.filter((finding) => finding.severity === 'violation')
  }

  return { findings, scope, fileCount: files.length, diffMode, fixed }
}
