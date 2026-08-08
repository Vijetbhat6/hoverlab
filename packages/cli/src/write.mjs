/**
 * Fetch an artifact and write it into a project.
 *
 * Shared by the `add` command and the MCP `install_*` tools so the two
 * cannot drift — an agent installing a block gets byte-identical output to
 * a human running the CLI.
 *
 * Two shapes land here, and the difference is real:
 *
 *   effects   one or two generated files with no meaningful path. They go
 *             into a detected `hoverlab/` folder, flattened, because
 *             `btn-gradient.css` has no opinion about where it lives.
 *
 *   blocks,   a file tree with paths that mean something —
 *   pages     `components/product-grid.tsx` is where every page source
 *             imports it from. Flattening those would break the imports, so
 *             the tree is preserved and only its root is chosen.
 */

import { mkdir, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

import { getArtifact, getEffect } from './api.mjs'
import {
  detectArtifactRoot,
  detectFramework,
  detectOutputDir,
  detectReactSupport,
  missingDeps,
} from './detect.mjs'

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Reduce an API-supplied path to a bare filename.
 *
 * The API is trusted in practice, but `HOVERLAB_API_URL` lets a user point
 * this CLI at an arbitrary host — and that host supplies `file.path`.
 * Without this, a response containing `../../.bashrc` would write outside
 * the destination directory.
 */
function safeFileName(candidate, fallback) {
  const base = path.basename(String(candidate ?? '').replace(/\\/g, '/'))
  if (!base || base === '.' || base === '..') return fallback
  // Strip anything a filesystem would object to, keeping the extension.
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, '-')
  return cleaned || fallback
}

/**
 * Same guarantee as `safeFileName`, but for paths that must keep their
 * directories: reject rather than repair.
 *
 * A block's path carries meaning — repairing `../../etc/passwd` into
 * `etc-passwd.tsx` would silently install a file nobody asked for. Anything
 * that could escape the destination root is dropped and reported instead.
 */
export function safeRelativePath(candidate) {
  const normalized = String(candidate ?? '').replace(/\\/g, '/').trim()
  if (!normalized) return null
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) return null

  const segments = normalized.split('/').filter((s) => s && s !== '.')
  if (!segments.length || segments.includes('..')) return null

  return segments.join('/')
}

export class WriteError extends Error {
  constructor(message) {
    super(message)
    this.name = 'WriteError'
  }
}

/**
 * Write a resolved file plan, refusing to clobber unless told to.
 *
 * The existence check runs over the whole plan before anything is written.
 * A partial install — four files of a page on disk and the fifth refused —
 * is worse than no install, because the user now has to work out which four.
 */
async function commit(planned, { force, dryRun }) {
  if (!force) {
    const clashes = []
    for (const file of planned) {
      if (await exists(file.absolute)) clashes.push(file.absolute)
    }
    if (clashes.length) {
      throw new WriteError(
        `${clashes.length === 1 ? 'This file already exists' : 'These files already exist'}:\n` +
          clashes.map((c) => `  ${c}`).join('\n') +
          '\nRe-run with --force to overwrite.',
      )
    }
  }

  if (dryRun) return

  for (const file of planned) {
    await mkdir(path.dirname(file.absolute), { recursive: true })
    await writeFile(file.absolute, file.code, 'utf8')
  }
}

/* ------------------------------------------------------------------ *
 *  Effects
 * ------------------------------------------------------------------ */

/** Turn an effect detail payload into files on disk. */
async function emitEffect(data, { directory, force, dryRun, cwd, frameworkReason }) {
  const outDir = directory
    ? path.resolve(cwd, directory)
    : await detectOutputDir(data.framework, cwd)

  const planned = data.files.map((file, index) => ({
    absolute: path.join(outDir, safeFileName(file.path, `${data.effect.id}-${index}`)),
    code: file.code,
  }))

  await commit(planned, { force, dryRun })

  return {
    level: 'effect',
    artifact: data.effect,
    /** Kept for the effect-shaped callers that predate the other tiers. */
    effect: data.effect,
    framework: data.framework,
    frameworkReason,
    notes: data.notes ?? [],
    deps: [],
    missingDeps: [],
    directory: outDir,
    files: planned.map((f) => f.absolute),
    included: [],
    dryRun,
  }
}

/**
 * @param {object} options
 * @param {string} options.id            effect id
 * @param {string} [options.framework]   output target; auto-detected when absent
 * @param {string} [options.directory]   destination; auto-detected when absent
 * @param {boolean} [options.force]      overwrite existing files
 * @param {object} [options.customization] { hue, sat, scale, speed }
 * @param {string} [options.cwd]         project root to detect from
 * @param {boolean} [options.dryRun]     resolve everything but write nothing
 */
export async function writeEffectFiles({
  id,
  framework,
  directory,
  force = false,
  customization = {},
  cwd = process.cwd(),
  dryRun = false,
}) {
  let frameworkReason = null
  let target = framework

  if (!target) {
    const detected = await detectFramework(cwd)
    target = detected.framework
    frameworkReason = detected.reason
  }

  const data = await getEffect(id, { framework: target, customization })
  return emitEffect(data, { directory, force, dryRun, cwd, frameworkReason })
}

/* ------------------------------------------------------------------ *
 *  Blocks and pages
 * ------------------------------------------------------------------ */

/** Turn a block/page detail payload into files on disk. */
async function emitFileArtifact(data, { directory, force, dryRun, cwd }) {
  let outDir
  let rootReason = null

  if (directory) {
    outDir = path.resolve(cwd, directory)
  } else {
    const detected = await detectArtifactRoot(cwd)
    outDir = detected.root
    rootReason = detected.reason
  }

  const notes = [...(data.notes ?? [])]
  const planned = []

  for (const file of data.files) {
    const relative = safeRelativePath(file.path)
    if (!relative) {
      notes.push(`Skipped a file with an unsafe path: ${file.path}`)
      continue
    }
    planned.push({ absolute: path.join(outDir, ...relative.split('/')), code: file.source })
  }

  if (!planned.length) {
    throw new WriteError(`${data.artifact.id} returned no files that were safe to write.`)
  }

  const react = await detectReactSupport(cwd)
  if (!react.react) {
    notes.push(
      `${data.artifact.name} is a React component and ships as written — ${react.reason}.`,
    )
  }

  await commit(planned, { force, dryRun })

  return {
    level: data.level,
    artifact: data.artifact,
    framework: 'react',
    frameworkReason: rootReason,
    notes,
    deps: data.deps ?? [],
    missingDeps: await missingDeps(data.deps ?? [], cwd),
    directory: outDir,
    files: planned.map((f) => f.absolute),
    included: data.included ?? [],
    dryRun,
  }
}

/* ------------------------------------------------------------------ *
 *  The dispatcher
 * ------------------------------------------------------------------ */

/**
 * Install any artifact by id, resolving its tier server-side.
 *
 * One request decides everything. The alternative — guess a tier, retry on
 * 404 — costs three round-trips on a miss and produces an error message
 * that names the wrong tier.
 *
 * Templates are rejected here rather than installed. A template is not a
 * component you drop into an existing project; it *is* a project, with its
 * own package.json and tsconfig, and writing those over someone's app would
 * be the single most destructive thing this CLI could do. `init` handles
 * them, into a directory of their own.
 */
export async function addArtifact({
  id,
  framework,
  directory,
  force = false,
  customization = {},
  cwd = process.cwd(),
  dryRun = false,
}) {
  let frameworkReason = null
  let target = framework

  // Resolved before the request because the effect codegen happens server
  // side, and asking for the wrong framework would mean a second fetch.
  if (!target) {
    const detected = await detectFramework(cwd)
    target = detected.framework
    frameworkReason = detected.reason
  }

  const data = await getArtifact(id, { framework: target, customization, deep: true })

  if (data.level === 'effect') {
    return emitEffect(data, { directory, force, dryRun, cwd, frameworkReason })
  }

  if (data.level === 'template') {
    const err = new WriteError(
      `${data.artifact.name} is a template — a whole project, not a component.\n` +
        `  Run: npx hoverlab init ${data.artifact.id}`,
    )
    err.suggestInit = data.artifact.id
    throw err
  }

  return emitFileArtifact(data, { directory, force, dryRun, cwd })
}
