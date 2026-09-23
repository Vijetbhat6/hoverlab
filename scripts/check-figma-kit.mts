/**
 * Do the shipped Figma kits still describe the catalog?
 *
 * There are two: the blocks kit in `public/figma/` and the primitives kit in
 * `public/figma/primitives/`. Both come from `build-figma-kit.mts`, which needs
 * a browser and a running dev server, so it is run by hand and its output is
 * committed. That is the right trade for a several-minute Playwright crawl,
 * and it buys the failure mode this script exists to catch: a kit is a
 * snapshot, artifacts keep being added, and nothing about a stale snapshot
 * looks broken. A designer downloads `blocks-heroes.svg`, gets eleven of the
 * fourteen heroes, and has no way to know the file is three waves behind.
 *
 * Same class of problem as `check-claimed-counts` and the generated sources:
 * an artifact derived from the catalog that does not regenerate itself. So
 * it is checked at build, where it is cheap, rather than trusted.
 *
 * NOT AN ERROR WHEN A KIT IS ABSENT. Someone cloning the repo and running
 * a build should not be told to install Playwright and crawl 300 pages
 * before they can see the site. A missing kit is reported and skipped; a kit
 * that exists and disagrees with the catalog is a failure. The two kits are
 * judged separately, so a repo with only the blocks kit is not broken.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BLOCK_INDEX } from '../src/lib/blocks/block-index.ts'
import { PRIMITIVE_INDEX } from '../src/lib/primitives/primitive-index.ts'

interface Manifest {
  generatedAt: string
  sections: number
  files: { category: string; slug: string; file: string; sections: number; ids: string[] }[]
}

interface KitSpec {
  name: string
  /** Plural and singular, for messages: "sections" / "section". */
  noun: string
  nounOne: string
  /** What the catalog calls one of them. */
  item: string
  dir: string[]
  catalog: readonly { id: string }[]
  rebuild: string
}

const KITS: KitSpec[] = [
  {
    name: 'blocks kit',
    noun: 'sections',
    nounOne: 'section',
    item: 'block',
    dir: ['public', 'figma'],
    catalog: BLOCK_INDEX,
    rebuild: 'npm run build:figma',
  },
  {
    name: 'primitives kit',
    noun: 'controls',
    nounOne: 'control',
    item: 'primitive',
    dir: ['public', 'figma', 'primitives'],
    catalog: PRIMITIVE_INDEX,
    rebuild: 'npm run build:figma-primitives',
  },
]

const problems: string[] = []
const summaries: string[] = []

for (const kit of KITS) {
  const dir = join(process.cwd(), ...kit.dir)
  const manifestPath = join(dir, 'manifest.json')

  if (!existsSync(manifestPath)) {
    summaries.push(`check-figma-kit: no ${kit.name} built, skipping. Run \`${kit.rebuild}\` to make one.`)
    continue
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest
  const covered = new Set(manifest.files.flatMap((f) => f.ids))
  const own: string[] = []

  /*
   * Missing is the failure that matters — an artifact the catalog sells and the
   * kit does not contain.
   */
  const missing = kit.catalog.filter((c) => !covered.has(c.id))
  if (missing.length) {
    own.push(
      `  ${missing.length} ${kit.item}${missing.length === 1 ? '' : 's'} in the catalog ${
        missing.length === 1 ? 'is' : 'are'
      } not in the ${kit.name}:`,
      ...missing.slice(0, 12).map((c) => `    ${c.id}`),
      ...(missing.length > 12 ? [`    … and ${missing.length - 12} more`] : []),
    )
  }

  /*
   * Stale is the other half: a frame for something that no longer exists ships
   * a layer a buyer cannot get the code for.
   */
  const catalogIds = new Set(kit.catalog.map((c) => c.id))
  const orphans = [...covered].filter((id) => !catalogIds.has(id))
  if (orphans.length) {
    own.push(
      `  ${orphans.length} frame${orphans.length === 1 ? '' : 's'} in the ${kit.name} ${
        orphans.length === 1 ? 'has' : 'have'
      } no catalog entry:`,
      ...orphans.slice(0, 12).map((id) => `    ${id}`),
    )
  }

  // The manifest's own total has to agree with the files it lists, or the
  // figure rendered on /figma is not the figure in the files.
  const listed = manifest.files.reduce((n, f) => n + f.sections, 0)
  if (listed !== manifest.sections) {
    own.push(`  the ${kit.name} manifest says ${manifest.sections} ${kit.noun}, its files list ${listed}`)
  }

  for (const f of manifest.files) {
    if (!existsSync(join(dir, f.file))) {
      own.push(`  the ${kit.name} manifest lists ${f.file}, which is not on disk`)
    }
  }

  if (own.length) {
    problems.push(...own, `  Rebuild it:  npm run dev  (in another terminal)  &&  ${kit.rebuild}`)
  } else {
    summaries.push(
      `check-figma-kit: ${manifest.sections} ${kit.noun} in ${manifest.files.length} files, ` +
        `matching the catalog (${kit.name}, built ${manifest.generatedAt}).`,
    )
  }
}

if (problems.length) {
  throw new Error(['check-figma-kit: a Figma kit no longer matches the catalog.', ...problems].join('\n'))
}

for (const line of summaries) console.log(line)
