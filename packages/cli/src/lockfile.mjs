/**
 * `hoverlab.lock.json` — what this project installed, and at which revision.
 *
 * ── WHY A LOCKFILE AND NOT hoverlab.config.json ─────────────────────────
 *
 * `config.mjs` reads a file a human writes: the project's brand, edited by
 * hand and committed on purpose. This one is written by the CLI, and mixing
 * the two would mean every `add` rewrites a file the user hand-edits, with
 * their comments and key order at risk. Separate files, one owner each.
 *
 * ── WHAT IT IS FOR ──────────────────────────────────────────────────────
 *
 * Hoverlab installs source you own. That is the product, and it is also the
 * reason a fix to a shipped block could never reach anybody: once the file
 * is in your repo the catalog has no idea it exists. Pro sells a
 * twelve-month update window and had no mechanism behind it.
 *
 * This is the mechanism. `add` records the id and the revision it wrote;
 * `outdated` compares those against `/api/v1/revisions`.
 *
 * ── WHY THE FILE HASHES ARE HERE ────────────────────────────────────────
 *
 * `add` also records a SHA-256 of every file exactly as it was written.
 * That single field is what makes `hoverlab update` possible without it
 * being the destructive command `outdated`'s header rightly refuses to
 * build: with a hash, the CLI can *prove* a file has not been touched
 * since it was installed, and update only those. Without one it can only
 * guess, and guessing wrong means overwriting someone's work.
 *
 * A hash of content the catalog already published tells an attacker
 * nothing it did not already serve, and it is stable across machines and
 * line-ending settings only insofar as the file is — which is the point,
 * since a file normalised by a checkout genuinely is a different file from
 * the one we wrote, and `update` should say so rather than assume.
 *
 * ── WHAT IT DELIBERATELY DOES NOT HOLD ──────────────────────────────────
 *
 * No paths outside the project, no absolute paths, no user identity, no
 * timestamps beyond the install date, and nothing about the code the user
 * wrote around the artifact. It is meant to be committed and read in a pull
 * request — a lockfile that leaked a machine's directory layout would not
 * be, and then the feature would not work.
 *
 * ── ON CORRUPTION ───────────────────────────────────────────────────────
 *
 * Every read tolerates a malformed file by returning an empty lock rather
 * than throwing. The lockfile is an optimisation on a feature nobody asked
 * for at the moment they are running `add`; failing an install because a
 * JSON file got mangled by a bad merge would be a much worse trade than
 * quietly starting over.
 */

import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

export const LOCK_NAME = 'hoverlab.lock.json'

/**
 * The digest recorded per installed file, and recomputed by `update`.
 *
 * Content only — no path, no salt, nothing about the machine. Two projects
 * that installed the same artifact record the same hashes, which is what
 * makes a lockfile reviewable in a pull request rather than a diff full of
 * values nobody can check.
 */
export function fileDigest(contents) {
  return `sha256:${createHash('sha256').update(contents, 'utf8').digest('hex')}`
}

/** Bumped only if the shape changes incompatibly. */
const LOCK_VERSION = 1

function emptyLock() {
  return { lockfileVersion: LOCK_VERSION, artifacts: {} }
}

export function lockPath(cwd = process.cwd()) {
  return path.join(cwd, LOCK_NAME)
}

/**
 * Read the lockfile, or an empty one.
 *
 * Not walked upward the way `readProjectConfig` walks for a brand. A brand
 * is a property of the whole repo; installs are a property of the package
 * you ran the command in, and inheriting a parent's install list into a
 * sub-package would report artifacts as outdated that this project never
 * installed.
 */
export async function readLock(cwd = process.cwd()) {
  let raw
  try {
    raw = await fs.readFile(lockPath(cwd), 'utf8')
  } catch {
    return emptyLock()
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || typeof parsed.artifacts !== 'object') {
      return emptyLock()
    }
    return { lockfileVersion: parsed.lockfileVersion ?? LOCK_VERSION, artifacts: parsed.artifacts }
  } catch {
    return emptyLock()
  }
}

/**
 * Record one installed artifact.
 *
 * `files` are stored relative to the project root and POSIX-separated, so a
 * lockfile committed on Windows reads correctly on CI.
 *
 * Each file is hashed as it is recorded — read back off disk rather than
 * hashed from the string we meant to write, so what is stored is what is
 * actually there. Those two differ whenever anything sits between the CLI
 * and the filesystem (an editor's format-on-save, a git filter), and a hash
 * of the intention rather than the result would make `update` report a
 * freshly installed file as locally modified.
 *
 * A file that cannot be read back is recorded without a hash rather than
 * failing the install. `update` treats a missing hash as "cannot prove this
 * is untouched" and refuses it, which is the safe direction.
 */
export async function recordInstall(
  { id, level, revision, framework, files = [] },
  cwd = process.cwd(),
) {
  // No revision means the deployment predates `/api/v1/revisions`. Writing
  // the entry anyway would make `outdated` report it as changed forever;
  // skipping it means the next `add` picks it up once the server catches up.
  if (!revision) return null

  const lock = await readLock(cwd)

  const relatives = files
    .map((absolute) => ({
      absolute,
      relative: path.relative(cwd, absolute).split(path.sep).join('/'),
    }))
    .filter(({ relative }) => relative && !relative.startsWith('..'))

  const hashes = {}
  for (const { absolute, relative } of relatives) {
    try {
      hashes[relative] = fileDigest(await fs.readFile(absolute, 'utf8'))
    } catch {
      /* unreadable right after writing — `update` will decline to touch it */
    }
  }

  lock.artifacts[id] = {
    level,
    revision,
    /*
      Effects only, and it matters for `diff` and `update`: the catalog
      generates an effect's files per framework, so comparing a project
      that installed the React version against the CSS the API returns by
      default reports the whole file as changed. Blocks and above ship as
      written and carry no framework, so the key is omitted for them
      rather than recorded as a meaningless default.
    */
    ...(framework ? { framework } : {}),
    installedAt: new Date().toISOString().slice(0, 10),
    files: relatives.map(({ relative }) => relative),
    hashes,
  }

  await writeLock(lock, cwd)
  return lock
}

export async function removeFromLock(id, cwd = process.cwd()) {
  const lock = await readLock(cwd)
  if (!(id in lock.artifacts)) return false
  delete lock.artifacts[id]
  await writeLock(lock, cwd)
  return true
}

async function writeLock(lock, cwd) {
  // Sorted keys and two-space indent: this file is committed, so its diff
  // has to be readable by whoever reviews the pull request.
  const artifacts = Object.fromEntries(
    Object.entries(lock.artifacts).sort(([a], [b]) => a.localeCompare(b)),
  )

  await fs.writeFile(
    lockPath(cwd),
    `${JSON.stringify({ lockfileVersion: LOCK_VERSION, artifacts }, null, 2)}\n`,
    'utf8',
  )
}
