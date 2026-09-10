/**
 * Does the shipped Figma kit still describe the catalog?
 *
 * `build-figma-kit.mts` needs a browser and a running dev server, so it is
 * run by hand and its output is committed. That is the right trade for a
 * several-minute Playwright crawl, and it buys the failure mode this script
 * exists to catch: the kit is a snapshot, blocks keep being added, and
 * nothing about a stale snapshot looks broken. A designer downloads
 * `blocks-heroes.svg`, gets eleven of the fourteen heroes, and has no way to
 * know the file is three waves behind.
 *
 * Same class of problem as `check-claimed-counts` and the generated sources:
 * an artifact derived from the catalog that does not regenerate itself. So
 * it is checked at build, where it is cheap, rather than trusted.
 *
 * NOT AN ERROR WHEN THE KIT IS ABSENT. Someone cloning the repo and running
 * a build should not be told to install Playwright and crawl 250 pages
 * before they can see the site. A missing kit is reported and skipped; a kit
 * that exists and disagrees with the catalog is a failure.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BLOCK_INDEX } from '../src/lib/blocks/block-index.ts'

const MANIFEST = join(process.cwd(), 'public', 'figma', 'manifest.json')

if (!existsSync(MANIFEST)) {
  console.log('check-figma-kit: no kit built, skipping. Run `npm run build:figma` to make one.')
  process.exit(0)
}

interface Manifest {
  generatedAt: string
  sections: number
  files: { category: string; slug: string; file: string; sections: number; ids: string[] }[]
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Manifest

const covered = new Set(manifest.files.flatMap((f) => f.ids))
const problems: string[] = []

/*
 * Missing is the failure that matters — a block the catalog sells and the
 * kit does not contain.
 */
const missing = BLOCK_INDEX.filter((b) => !covered.has(b.id))
if (missing.length) {
  problems.push(
    `  ${missing.length} block${missing.length === 1 ? '' : 's'} in the catalog are not in the kit:`,
    ...missing.slice(0, 12).map((b) => `    ${b.id}`),
    ...(missing.length > 12 ? [`    … and ${missing.length - 12} more`] : []),
  )
}

/*
 * Stale is the other half: a frame for a block that no longer exists ships a
 * section a buyer cannot get the code for.
 */
const catalogIds = new Set(BLOCK_INDEX.map((b) => b.id))
const orphans = [...covered].filter((id) => !catalogIds.has(id))
if (orphans.length) {
  problems.push(
    `  ${orphans.length} frame${orphans.length === 1 ? '' : 's'} in the kit have no catalog entry:`,
    ...orphans.slice(0, 12).map((id) => `    ${id}`),
  )
}

// The manifest's own total has to agree with the files it lists, or the
// figure rendered on /figma is not the figure in the files.
const listed = manifest.files.reduce((n, f) => n + f.sections, 0)
if (listed !== manifest.sections) {
  problems.push(`  manifest says ${manifest.sections} sections, its files list ${listed}`)
}

for (const f of manifest.files) {
  if (!existsSync(join(process.cwd(), 'public', 'figma', f.file))) {
    problems.push(`  manifest lists ${f.file}, which is not on disk`)
  }
}

if (problems.length) {
  throw new Error(
    [
      'check-figma-kit: the Figma kit no longer matches the catalog.',
      ...problems,
      '',
      '  Rebuild it:  npm run dev  (in another terminal)  &&  npm run build:figma',
    ].join('\n'),
  )
}

console.log(
  `check-figma-kit: ${manifest.sections} sections in ${manifest.files.length} files, ` +
    `matching the catalog (built ${manifest.generatedAt}).`,
)
