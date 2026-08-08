/**
 * Scaffold a template into a new project directory.
 *
 * `npx hoverlab init saas-starter` is the top of the ladder arriving on
 * disk: forty-odd files, eight routes, one dependency, and a project that
 * runs on `npm install && npm run dev`. Everything below it — the pages,
 * the blocks inside them — is assembled server-side, so this file's whole
 * job is to put a JSON file list somewhere safe and refuse when it isn't.
 *
 * JSON rather than the zip at `/api/templates/{id}/download`: unzipping
 * would mean a dependency, and this package is dependency-free so that
 * `npx hoverlab` is one round-trip to npm rather than a tree install.
 */

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getTemplate } from './api.mjs'
import { safeRelativePath, WriteError } from './write.mjs'

/** Entries that do not make a directory "occupied" for our purposes. */
const IGNORABLE = new Set(['.git', '.DS_Store', 'Thumbs.db'])

/**
 * Is this directory safe to scaffold into?
 *
 * Returns the entries that would be sat alongside, or `null` if the
 * directory does not exist yet. An empty array means it exists and is
 * empty, which is the common case of someone having run `mkdir` first.
 */
async function occupants(dir) {
  try {
    const entries = await readdir(dir)
    return entries.filter((e) => !IGNORABLE.has(e))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

/**
 * @param {object} options
 * @param {string} options.id             template id
 * @param {string} [options.directory]    destination; defaults to ./<id>
 * @param {boolean} [options.force]       scaffold into a non-empty directory
 * @param {string} [options.cwd]
 * @param {boolean} [options.dryRun]      resolve everything but write nothing
 */
export async function initTemplate({
  id,
  directory,
  force = false,
  cwd = process.cwd(),
  dryRun = false,
}) {
  const data = await getTemplate(id)

  // Default to a folder named after the template rather than the current
  // directory. `npx hoverlab init storefront` in ~/code should not turn
  // ~/code into a Next app, and someone who meant that can say `--dir .`.
  const target = path.resolve(cwd, directory ?? data.artifact.id)

  const existing = await occupants(target)
  if (existing && existing.length && !force) {
    throw new WriteError(
      `${target} is not empty (${existing.length} entr${existing.length === 1 ? 'y' : 'ies'}: ` +
        `${existing.slice(0, 4).join(', ')}${existing.length > 4 ? ', …' : ''}).\n` +
        'Pass a different directory, or --force to write into it anyway.',
    )
  }

  const skipped = []
  const planned = []

  for (const file of data.files) {
    const relative = safeRelativePath(file.path)
    if (!relative) {
      skipped.push(file.path)
      continue
    }
    planned.push({
      relative,
      absolute: path.join(target, ...relative.split('/')),
      source: file.source,
    })
  }

  if (!planned.length) {
    throw new WriteError(`${id} returned no files that were safe to write.`)
  }

  if (!dryRun) {
    // Directories first, deduped: forty files across eight route folders is
    // otherwise forty redundant recursive mkdirs.
    const dirs = [...new Set(planned.map((f) => path.dirname(f.absolute)))]
    for (const dir of dirs) await mkdir(dir, { recursive: true })
    for (const file of planned) await writeFile(file.absolute, file.source, 'utf8')
  }

  return {
    template: data.artifact,
    routes: data.artifact.routes ?? [],
    deps: data.deps ?? [],
    notes: data.notes ?? [],
    directory: target,
    files: planned.map((f) => f.relative),
    skipped,
    dryRun,
  }
}
