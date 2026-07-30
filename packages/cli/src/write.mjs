/**
 * Fetch an effect and write it into a project.
 *
 * Shared by the `add` command and the MCP `install_effect` tool so the two
 * cannot drift — an agent installing an effect gets byte-identical output
 * to a human running the CLI.
 */

import { mkdir, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

import { getEffect } from './api.mjs'
import { detectFramework, detectOutputDir } from './detect.mjs'

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

export class WriteError extends Error {
  constructor(message) {
    super(message)
    this.name = 'WriteError'
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

  const outDir = directory
    ? path.resolve(cwd, directory)
    : await detectOutputDir(target, cwd)

  const planned = data.files.map((file, index) => ({
    absolute: path.join(outDir, safeFileName(file.path, `${data.effect.id}-${index}`)),
    code: file.code,
  }))

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

  if (!dryRun) {
    await mkdir(outDir, { recursive: true })
    for (const file of planned) {
      await writeFile(file.absolute, file.code, 'utf8')
    }
  }

  return {
    effect: data.effect,
    framework: data.framework,
    frameworkReason,
    notes: data.notes ?? [],
    directory: outDir,
    files: planned.map((f) => f.absolute),
    dryRun,
  }
}
