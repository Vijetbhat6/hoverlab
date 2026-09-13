import assert from 'node:assert/strict'
import { test } from 'node:test'

import GENERATED_SOURCES from './generated-primitive-sources.json'
import LINE_COUNTS from './generated-primitive-stats.json'
import { PRIMITIVE_CATALOG, PRIMITIVE_COUNT, getPrimitiveRecord } from './catalog'
import { PRIMITIVE_CATEGORIES } from './primitive-types'

/**
 * The invariants the primitive tier rests on, none of which is a type.
 *
 * Three of them are load-bearing for other code:
 *
 *   - the sandbox builder skips import-walking for primitives, on the
 *     stated grounds that a primitive never imports another artifact. If
 *     that stops being true the StackBlitz project silently ships a file
 *     with an unresolvable import, and nothing anywhere goes red.
 *   - the catalog stores `exportName` by hand because three of them are not
 *     the id in PascalCase. A wrong one is an install command that names a
 *     component the file does not export.
 *   - `deps` is what the card renders as "No deps" and what the tier's
 *     whole argument rests on. A primitive that grew an import nobody
 *     declared would keep saying "No deps" on the card.
 */

const sources = GENERATED_SOURCES as Record<
  string,
  { path: string; lang: string; source: string }[]
>
const stats = LINE_COUNTS as Record<string, { lines: number; files: number }>

test('every record generates its own file first, and only siblings after it', () => {
  /*
   * This asserted `files.length === 1` — "a control that needs more than
   * one is a block". The sentiment is right and the count was the wrong way
   * to measure it: a primitive that *composes* siblings ships them too, and
   * the count grows without the artifact becoming a section.
   *
   * What actually distinguishes the tiers is that every file a primitive
   * ships is itself a primitive, landing in `components/ui/`. A block would
   * be pulling in `components/`, and that is what this now checks.
   */
  for (const record of PRIMITIVE_CATALOG) {
    const files = sources[record.id]
    assert.ok(files, `${record.id} has no generated source — run npm run build:artifacts`)

    // Its own file leads, so a reader opening the source sees the component
    // they came for rather than one of its parts.
    assert.equal(files[0].path, `components/ui/${record.id}.tsx`)

    for (const file of files) {
      assert.match(
        file.path,
        /^components\/ui\/[\w-]+\.tsx$/,
        `${record.id} ships "${file.path}" — a primitive composes primitives, not sections`,
      )
      assert.ok(
        getPrimitiveRecord(file.path.replace(/^components\/ui\/|\.tsx$/g, '')),
        `${record.id} ships "${file.path}", which is not a primitive in the catalog`,
      )
    }

    assert.ok((stats[record.id]?.lines ?? 0) > 0, `${record.id} reports zero lines`)
  }
})

test('no generated source outlives the record that produced it', () => {
  for (const id of Object.keys(sources)) {
    assert.ok(getPrimitiveRecord(id), `generated source for "${id}" has no catalog record`)
  }
})

test('ids are unique, url-safe, and match the preview key', () => {
  const seen = new Set<string>()
  for (const record of PRIMITIVE_CATALOG) {
    assert.match(record.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${record.id} is not a clean slug`)
    assert.ok(!seen.has(record.id), `${record.id} appears twice`)
    seen.add(record.id)
    assert.equal(
      record.previewComponent,
      record.id,
      `${record.id} names a different preview key — the registry is keyed by id`,
    )
  }
  assert.equal(seen.size, PRIMITIVE_COUNT)
})

test('categories are real primitive categories', () => {
  for (const record of PRIMITIVE_CATALOG) {
    assert.ok(
      (PRIMITIVE_CATEGORIES as string[]).includes(record.category),
      `${record.id} is filed under "${record.category}", which is not a category`,
    )
  }
})

test('every category has at least one primitive', () => {
  // The block taxonomy deliberately runs ahead of what is built; this one
  // was written from the set of primitives, so an empty category here means
  // one was renamed and its members left behind.
  for (const category of PRIMITIVE_CATEGORIES) {
    const count = PRIMITIVE_CATALOG.filter((p) => p.category === category).length
    assert.ok(count > 0, `"${category}" has no primitives in it`)
  }
})

test('the declared export is the one the source exports', () => {
  for (const record of PRIMITIVE_CATALOG) {
    const source = sources[record.id][0].source
    const exported = new RegExp(
      `export (?:function|const) ${record.exportName}\\b`,
    ).test(source)
    assert.ok(
      exported,
      `${record.id} declares exportName "${record.exportName}" but its source does not export it`,
    )
  }
})

test('every import a primitive makes resolves where it lands', () => {
  /*
   * The promise `buildArtifactSandbox` has to keep: paste what the tier
   * gives you and it runs.
   *
   * This used to read "a primitive may import react and lucide-react and
   * nothing else", which kept the promise by forbidding composition
   * outright. That held while all 31 primitives were single controls and
   * broke on the first one that is not: `<DeviceShowcase>` is an
   * *arrangement* of `<LaptopFrame>` and `<PhoneFrame>`, and inlining two
   * frames into it would duplicate three hundred lines to satisfy a rule
   * rather than a reader.
   *
   * So the rule is now the thing the promise actually needs. A relative
   * import is allowed exactly when the file it names ships in the same
   * artifact — `build-artifact-sources.mjs` pulls siblings in for that
   * reason — and everything else is still react or lucide-react. A bare
   * specifier for an undeclared package, or a `./` pointing at a file the
   * buyer will not have, still fails here.
   */
  for (const record of PRIMITIVE_CATALOG) {
    const files = sources[record.id]
    const shipped = new Set(files.map((f) => f.path))

    for (const file of files) {
      for (const [, specifier] of file.source.matchAll(/from\s+'([^']+)'/g)) {
        if (specifier === 'react' || specifier === 'lucide-react') continue

        assert.ok(
          specifier.startsWith('./'),
          `${record.id} imports "${specifier}" — a primitive may only import react, lucide-react, or a file shipped with it`,
        )

        const resolved = `components/ui/${specifier.slice(2)}.tsx`
        assert.ok(
          shipped.has(resolved),
          `${record.id} imports "${specifier}" but ${resolved} is not shipped with it — the paste would not resolve`,
        )
      }
    }
  }
})

test('a composing primitive ships the siblings it composes', () => {
  // The generator derives this from the imports, so the guard is that the
  // derivation actually ran — a stale generated-primitive-sources.json
  // would leave the file list at one and the paste broken, and every other
  // assertion here would still pass.
  const showcase = sources['device-showcase']
  assert.ok(showcase, 'device-showcase should exist')
  assert.deepEqual(
    showcase.map((f) => f.path).sort(),
    [
      'components/ui/device-showcase.tsx',
      'components/ui/laptop-frame.tsx',
      'components/ui/phone-frame.tsx',
    ],
    'run `npm run build:artifacts` — the sibling files are generated, not authored',
  )

  // And the ordinary case is untouched: a single control is still one file.
  assert.equal(sources['badge'].length, 1)
})

test('declared deps match what the source actually imports', () => {
  for (const record of PRIMITIVE_CATALOG) {
    const source = sources[record.id][0].source
    const usesLucide = /from\s+'lucide-react'/.test(source)
    const declared = record.deps.includes('lucide-react')

    assert.equal(
      usesLucide,
      declared,
      usesLucide
        ? `${record.id} imports lucide-react but does not declare it — the card says "No deps"`
        : `${record.id} declares lucide-react but does not import it`,
    )
    // `react` is never a dependency: it is the thing you already have.
    assert.ok(!record.deps.includes('react'), `${record.id} declares react as a dependency`)
  }
})

test('interactive primitives carry the client directive', () => {
  /*
   * A component with `useState` in a Next.js app router project is a build
   * error without `'use client'`, and the error names a file the buyer just
   * pasted rather than the catalog that gave it to them.
   */
  for (const record of PRIMITIVE_CATALOG) {
    const source = sources[record.id][0].source
    const stateful = /\bReact\.(useState|useRef|useEffect|useId)\b/.test(source)
    if (!stateful) continue
    assert.ok(
      source.startsWith("'use client'"),
      `${record.id} uses React state but does not start with 'use client'`,
    )
  }
})

test('descriptions say something specific', () => {
  for (const record of PRIMITIVE_CATALOG) {
    assert.ok(
      record.description.length >= 80,
      `${record.id}'s description is too short to say why this one is worth having`,
    )
    assert.ok(record.tags.length >= 3, `${record.id} has fewer than three tags`)
  }
})
