/**
 * The fingerprint that ties a stress result to the artifact it measured.
 *
 * Node only: it reads the generated source files from disk, which is why it
 * is a separate module from `report.ts` (that one is imported by pages).
 * The harness stamps a result with this hash when it measures, and the gate
 * recomputes it at build time: if the source changed since, the result is
 * about a different artifact and the gate says so.
 *
 * What it does NOT cover is a change outside the artifact that alters how
 * it looks (a design token, a shared primitive). That is the honest limit
 * of a build-time check with no browser, and it is why the report also
 * carries a date.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { StressLevel } from './conditions'
import { hashFiles } from './hash-files'

const FILES: Record<StressLevel, string> = {
  primitive: join('src', 'lib', 'primitives', 'generated-primitive-sources.json'),
  block: join('src', 'lib', 'blocks', 'generated-block-sources.json'),
  page: join('src', 'lib', 'pages', 'generated-page-sources.json'),
}

const cache = new Map<StressLevel, Record<string, unknown>>()

function sourcesFor(level: StressLevel): Record<string, unknown> {
  let sources = cache.get(level)
  if (!sources) {
    sources = JSON.parse(readFileSync(FILES[level], 'utf8')) as Record<string, unknown>
    cache.set(level, sources)
  }
  return sources
}

export function sourceHash(level: StressLevel, id: string): string {
  return hashFiles(sourcesFor(level)[id] ?? null)
}
