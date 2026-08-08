/**
 * Package a template's assembled file tree into a downloadable zip.
 *
 * ⚠️  SERVER-ONLY. A template's files are ~200 KB of other people's source
 * that the browser has no reason to hold; the zip is built in the route
 * handler and streamed as an attachment.
 *
 * This is what makes Tier 4 usable at all. Without it a template is a file
 * tree you can look at and a README you can read — a visitor would have to
 * hand-copy forty files out of the block and page pages, which is exactly
 * the work a template exists to remove.
 */

import 'server-only'

import type { Template } from './template-types'

/**
 * Files whose stored name differs from the name they must have on disk.
 *
 * `.gitignore` cannot be stored under its real name inside this repo — a
 * dotfile there would apply to the directory it sits in and quietly change
 * what git tracks. npm has the same problem when publishing and solves it
 * the same way, so the file is authored as `gitignore` and renamed here.
 */
const RENAME_ON_EXTRACT: Record<string, string> = {
  gitignore: '.gitignore',
}

/**
 * Reject any path that could escape the archive root.
 *
 * Every path here is authored in this repo rather than supplied by a user,
 * so this is belt-and-braces — but a zip is extracted with the user's
 * permissions, and "the inputs are all trusted" is the assumption every
 * path-traversal advisory starts by quoting.
 */
function safePath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/')
  if (normalized.startsWith('/') || normalized.includes('..')) return null
  if (/^[a-zA-Z]:/.test(normalized)) return null
  return RENAME_ON_EXTRACT[normalized] ?? normalized
}

/**
 * Build the zip as a Buffer, ready to hand to a Response.
 *
 * `jszip` is imported dynamically so the library is only loaded when
 * someone actually downloads a template, rather than on every request that
 * touches this module.
 */
export async function buildTemplateZip(template: Template): Promise<Buffer> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Everything nests under a folder named after the template, so extracting
  // never scatters forty files across the user's Downloads directory.
  const root = zip.folder(template.id)
  if (!root) throw new Error(`Could not create archive root for ${template.id}`)

  // Everything comes from `template.files` — including GETTING-STARTED.md,
  // which is assembled in `templates.ts` rather than added here. Adding a
  // file at zip time would make the archive contain one more file than the
  // "What you get" tree and the download button both advertise, and a
  // user who counts is right to distrust the rest of the page after that.
  for (const file of template.files) {
    const path = safePath(file.path)
    if (!path) continue
    // Trailing newline: a file without one is a diff nobody asked for the
    // first time the user's editor saves it.
    root.file(path, `${file.source.trimEnd()}\n`)
  }

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}
