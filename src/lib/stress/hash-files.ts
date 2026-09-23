/**
 * The fingerprint of an artifact's shipped source.
 *
 * Pure and filesystem-free so the /stress pages can compute it from the
 * files already attached to the artifact, while the harness and the gate
 * (`source-hash.ts`) compute it straight from the generated JSON. Both
 * routes hash the same array of `{ path, lang, source }`, so they agree.
 */

import { createHash } from 'node:crypto'

export function hashFiles(files: unknown): string {
  return createHash('sha1')
    .update(JSON.stringify(files ?? null))
    .digest('hex')
    .slice(0, 12)
}
