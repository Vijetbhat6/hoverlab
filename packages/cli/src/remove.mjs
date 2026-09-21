/**
 * Working out what `hoverlab remove` may delete.
 *
 * `add` is the safe direction: it writes files and refuses to overwrite. A
 * remove is not, and the tool that installed the files is the wrong one to
 * be trusted with an `rm`. So this module does the opposite of clever. It
 * proves, file by file, that deleting is safe, and anything it cannot prove
 * is kept and named:
 *
 *   edited     the file no longer matches the hash recorded at install. It is
 *              the user's now — someone changed it on purpose.
 *   shared     another installed artifact lists the same file. A page brings
 *              its blocks, and the same block installed on its own has its own
 *              entry; removing the page must not pull the block out from
 *              under it.
 *   in use     a file OUTSIDE the removal set imports it. The most common way
 *              to break a build with a cleanup command, and the one that
 *              needs no `--force` to happen if it is not looked for.
 *   unhashed   the entry has no recorded hash, so "untouched" cannot be shown.
 *
 * `--force` overrides the first, third and fourth; never the second, because
 * a shared file is not this artifact's to delete however sure the user is.
 *
 * Pure planning here, no deletion: `planRemoval` reads and returns a plan, and
 * the command decides whether to apply it. That split is what makes the
 * dangerous half testable against a real directory without a prompt in the way.
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { fileDigest } from './lockfile.mjs'
import { safeRelativePath } from './write.mjs'

/** Directories that are never the user's own source, and can be enormous. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', '.svelte-kit', '.turbo', '.vercel', '.netlify',
  'dist', 'build', 'out', 'coverage', '.cache', '.parcel-cache', '.output',
])

/** Files that can import a component. */
const SOURCE = /\.(tsx?|jsx?|mjs|cjs|vue|svelte|astro|mdx?|css|scss|html)$/

/** A hard stop, so a monorepo root cannot turn a remove into a filesystem crawl. */
const MAX_FILES = 8000
const MAX_BYTES = 1_000_000

/**
 * Every project source file, as absolute paths.
 *
 * Hidden directories are skipped along with the build output: `.git` and the
 * tool caches are the bulk of a checkout and none of it is somebody's import.
 */
async function projectFiles(root) {
  const found = []

  const visit = async (dir) => {
    if (found.length >= MAX_FILES) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (found.length >= MAX_FILES) return
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
        await visit(path.join(dir, entry.name))
      } else if (SOURCE.test(entry.name)) {
        found.push(path.join(dir, entry.name))
      }
    }
  }

  await visit(root)
  return found
}

/** `pricing-tiers` from `components/pricing-tiers.tsx`. */
const stemOf = (file) => path.basename(file).replace(/\.[^.]+$/, '')

/** RegExp-safe. */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Which outside files import which of these targets.
 *
 * Matched by module specifier ending in the target's stem — `'@/components/
 * pricing-tiers'`, `'./pricing-tiers'`, `'../hoverlab/btn-gradient.css'`. It
 * is a string match, not a resolver, and errs toward finding a reference: a
 * false "in use" keeps a file the user can delete by hand, a false "unused"
 * breaks their build. Extensionless index files are not a case here — every
 * artifact this CLI installs is a named file.
 *
 * @param {string} root
 * @param {string[]} targets    absolute paths about to be deleted
 * @param {Set<string>} exclude absolute paths that are part of the removal
 * @returns {Promise<Map<string, string[]>>} target -> files that import it
 */
export async function findReferences(root, targets, exclude) {
  const patterns = targets.map((target) => ({
    target,
    // A quote, any path prefix ending in a slash, the stem, an optional
    // extension, a quote. The stem is bounded on the left by `/` or the
    // quote so `pricing-tiers` does not match `enterprise-pricing-tiers`.
    re: new RegExp(`['"\`](?:[^'"\`\\n]*/)?${escapeRegex(stemOf(target))}(?:\\.\\w+)?['"\`]`),
  }))

  const references = new Map()

  for (const file of await projectFiles(root)) {
    if (exclude.has(file)) continue
    let text
    try {
      if ((await stat(file)).size > MAX_BYTES) continue
      text = await readFile(file, 'utf8')
    } catch {
      continue
    }
    for (const { target, re } of patterns) {
      if (re.test(text)) {
        if (!references.has(target)) references.set(target, [])
        references.get(target).push(file)
      }
    }
  }

  return references
}

/**
 * @typedef {object} RemovalPlan
 * @property {string} id
 * @property {string[]} remove   absolute paths that are safe to delete
 * @property {{ file: string, why: string, detail?: string }[]} keep
 * @property {string[]} missing  recorded files already gone from disk
 * @property {string[]} unsafe   recorded paths that would leave the project
 */

/**
 * Decide, for one installed artifact, what may be deleted.
 *
 * @param {object} options
 * @param {string} options.id
 * @param {{ files: string[], hashes?: Record<string,string> }} options.entry  its lockfile entry
 * @param {Record<string, { files: string[] }>} options.artifacts  the whole lockfile, for sharing
 * @param {string} options.cwd     the directory the lockfile's paths are relative to
 * @param {boolean} [options.force]
 * @returns {Promise<RemovalPlan>}
 */
export async function planRemoval({ id, entry, artifacts, cwd, force = false }) {
  const plan = { id, remove: [], keep: [], missing: [], unsafe: [] }

  // What other artifacts still claim.
  const claimed = new Map()
  for (const [otherId, other] of Object.entries(artifacts)) {
    if (otherId === id) continue
    for (const file of other.files ?? []) claimed.set(file, otherId)
  }

  const candidates = []
  for (const relative of entry.files ?? []) {
    // A lockfile is committed and hand-editable; a `../` in one must never
    // reach an unlink.
    const safe = safeRelativePath(relative)
    if (!safe) {
      plan.unsafe.push(relative)
      continue
    }
    const absolute = path.resolve(cwd, ...safe.split('/'))

    if (claimed.has(safe)) {
      plan.keep.push({ file: absolute, why: 'shared', detail: `${claimed.get(safe)} is installed and uses it` })
      continue
    }

    let contents
    try {
      contents = await readFile(absolute, 'utf8')
    } catch {
      plan.missing.push(absolute)
      continue
    }

    const recorded = entry.hashes?.[safe]
    if (!recorded) {
      if (!force) {
        plan.keep.push({ file: absolute, why: 'unhashed', detail: 'no recorded hash, so it cannot be shown to be untouched' })
        continue
      }
    } else if (fileDigest(contents) !== recorded) {
      if (!force) {
        plan.keep.push({ file: absolute, why: 'edited', detail: 'changed since it was installed' })
        continue
      }
    }

    candidates.push(absolute)
  }

  // References are only worth looking for on files that would otherwise go.
  const removalSet = new Set(candidates)
  const referenced = candidates.length
    ? await findReferences(cwd, candidates, removalSet)
    : new Map()

  for (const file of candidates) {
    const importers = referenced.get(file)
    if (importers?.length && !force) {
      const shown = importers.slice(0, 3).map((f) => path.relative(cwd, f).split(path.sep).join('/'))
      plan.keep.push({
        file,
        why: 'in use',
        detail: `imported by ${shown.join(', ')}${importers.length > 3 ? ` and ${importers.length - 3} more` : ''}`,
      })
    } else {
      plan.remove.push(file)
    }
  }

  return plan
}
