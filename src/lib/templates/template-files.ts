/**
 * How a template's stored file paths map onto disk.
 *
 * Shared by the zip builder and the public API, because both hand a user a
 * project they are about to extract into a directory — and if the two
 * disagreed about a filename, `npx hoverlab init saas-starter` and the
 * download button would produce subtly different projects from the same
 * catalog entry.
 *
 * DATA-FREE and dependency-free, so the client-side file tree can use it too.
 */

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
 * The path this file takes on disk, or `null` if it could escape the root.
 *
 * Every path here is authored in this repo rather than supplied by a user,
 * so the traversal check is belt-and-braces — but these files are written
 * with the user's permissions, and "the inputs are all trusted" is the
 * assumption every path-traversal advisory starts by quoting.
 */
export function toDiskPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/')
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) return null
  if (/^[a-zA-Z]:/.test(normalized)) return null
  return RENAME_ON_EXTRACT[normalized] ?? normalized
}
