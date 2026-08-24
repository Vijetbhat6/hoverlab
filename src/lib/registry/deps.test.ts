/**
 * Unit tests for the registry's import resolution.
 *
 * This is the logic that decides whether `npx shadcn add @hoverlab/…` writes a
 * complete set of files or a broken one. A missed dependency does not fail
 * here — it fails in a stranger's project, as a TypeScript error in code they
 * did not write — so the cases below are the ones that would produce exactly
 * that.
 *
 * Runner: Node's built-in `node:test` via the tsx loader (no test deps).
 *   npm test
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  importSpecifiers,
  isLocalImport,
  localImportId,
  registryDepIds,
  unresolvedLocalImports,
} from './deps'

const KNOWN = new Set(['hero-split', 'navbar-simple', 'product-grid', 'saas-landing-page'])

/* ============================================================
 *  Specifier extraction
 * ========================================================== */

describe('importSpecifiers', () => {
  it('finds every from-clause', () => {
    const src = [
      "import * as React from 'react'",
      "import { Rocket } from 'lucide-react'",
      "import { NavbarSimple } from '@/components/navbar-simple'",
    ].join('\n')

    assert.deepEqual(importSpecifiers(src), ['react', 'lucide-react', '@/components/navbar-simple'])
  })

  it('handles double quotes and extra whitespace', () => {
    assert.deepEqual(importSpecifiers('import x from   "@/components/hero-split"'), [
      '@/components/hero-split',
    ])
  })

  it('finds re-exports, which are imports for our purposes', () => {
    // `export { X } from './product-grid'` pulls the file in exactly the same
    // way an import does. Missing this would drop a real dependency.
    assert.deepEqual(importSpecifiers("export { ProductGrid } from './product-grid'"), [
      './product-grid',
    ])
  })

  it('returns nothing for a file with no imports', () => {
    assert.deepEqual(importSpecifiers('export const x = 1'), [])
  })
})

/* ============================================================
 *  Classification
 * ========================================================== */

describe('localImportId', () => {
  it('maps an aliased component import to its id', () => {
    assert.equal(localImportId('@/components/navbar-simple'), 'navbar-simple')
  })

  it('maps a sibling import to its id', () => {
    assert.equal(localImportId('./product-grid'), 'product-grid')
  })

  it('returns null for packages', () => {
    assert.equal(localImportId('react'), null)
    assert.equal(localImportId('lucide-react'), null)
    assert.equal(localImportId('@radix-ui/react-dialog'), null)
  })

  it('returns null for aliases that are not components', () => {
    // `@/lib/utils` is local but is not a registry item, so it must not be
    // mistaken for one — it should surface in the audit instead.
    assert.equal(localImportId('@/lib/utils'), null)
  })
})

describe('isLocalImport', () => {
  it('recognises the three local forms', () => {
    for (const s of ['@/components/x', './x', '../x']) assert.equal(isLocalImport(s), true)
  })

  it('rejects bare package specifiers', () => {
    for (const s of ['react', 'lucide-react', '@radix-ui/react-slot']) {
      assert.equal(isLocalImport(s), false)
    }
  })
})

/* ============================================================
 *  Dependency collection
 * ========================================================== */

describe('registryDepIds', () => {
  it('collects known ids and ignores packages', () => {
    const src = [
      "import * as React from 'react'",
      "import { NavbarSimple } from '@/components/navbar-simple'",
      "import { HeroSplit } from '@/components/hero-split'",
    ].join('\n')

    assert.deepEqual(registryDepIds([src], KNOWN), ['hero-split', 'navbar-simple'])
  })

  it('deduplicates across files and sorts', () => {
    const a = "import { HeroSplit } from '@/components/hero-split'"
    const b = "import { HeroSplit } from '@/components/hero-split'\nimport { NavbarSimple } from '@/components/navbar-simple'"

    assert.deepEqual(registryDepIds([a, b], KNOWN), ['hero-split', 'navbar-simple'])
  })

  it('is stable regardless of source order', () => {
    const a = "import x from '@/components/navbar-simple'"
    const b = "import y from '@/components/hero-split'"

    assert.deepEqual(registryDepIds([a, b], KNOWN), registryDepIds([b, a], KNOWN))
  })

  it('omits local imports that are not registry items', () => {
    // The audit reports these; they must never be emitted as a dependency,
    // because a registryDependencies entry pointing at a nonexistent item
    // fails the install outright.
    const src = "import { cn } from '@/lib/utils'\nimport x from '@/components/site-header'"

    assert.deepEqual(registryDepIds([src], KNOWN), [])
  })

  it('returns nothing for a self-contained component', () => {
    assert.deepEqual(registryDepIds(["import * as React from 'react'"], KNOWN), [])
  })
})

/* ============================================================
 *  Audit
 * ========================================================== */

describe('unresolvedLocalImports', () => {
  it('passes a self-contained item', () => {
    const items = [{ id: 'hero-split', sources: ["import * as React from 'react'"] }]
    assert.deepEqual(unresolvedLocalImports(items, KNOWN), [])
  })

  it('passes an item whose local imports are all published', () => {
    const items = [
      {
        id: 'saas-landing-page',
        sources: ["import { NavbarSimple } from '@/components/navbar-simple'"],
      },
    ]
    assert.deepEqual(unresolvedLocalImports(items, KNOWN), [])
  })

  it('flags an alias that is not a registry item', () => {
    const items = [{ id: 'hero-split', sources: ["import { SiteHeader } from '@/components/site-header'"] }]

    assert.deepEqual(unresolvedLocalImports(items, KNOWN), [
      { item: 'hero-split', unresolved: '@/components/site-header' },
    ])
  })

  it('flags a non-component alias such as @/lib/utils', () => {
    const items = [{ id: 'hero-split', sources: ["import { cn } from '@/lib/utils'"] }]

    assert.deepEqual(unresolvedLocalImports(items, KNOWN), [
      { item: 'hero-split', unresolved: '@/lib/utils' },
    ])
  })

  it('flags a parent-relative import, which cannot survive an install', () => {
    // `../` escapes the directory the CLI writes into, so it can never
    // resolve in the target project no matter what else is installed.
    const items = [{ id: 'hero-split', sources: ["import x from '../shared/thing'"] }]

    assert.deepEqual(unresolvedLocalImports(items, KNOWN), [
      { item: 'hero-split', unresolved: '../shared/thing' },
    ])
  })

  it('reports every offending import, not just the first', () => {
    const items = [
      {
        id: 'hero-split',
        sources: ["import { cn } from '@/lib/utils'\nimport x from '@/components/site-header'"],
      },
    ]

    assert.equal(unresolvedLocalImports(items, KNOWN).length, 2)
  })
})
