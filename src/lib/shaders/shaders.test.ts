import assert from 'node:assert/strict'
import { test } from 'node:test'

import GENERATED_SOURCES from './generated-shader-sources.json'
import { SHADER_CATALOG, SHADER_COUNT, getShaderRecord, isShaderEffect } from './catalog'
import { SHADER_EFFECTS, getShaderEffect, shaderLines } from './shader-effects'
import { isShaderRenderer, rendererOf } from './shader-types'
import { CATEGORIES } from '../effect-types'

/**
 * The shader tier has one failure mode that nothing else in this repo has:
 * it is assembled at build time from three files that are edited
 * separately, and a mismatch between them does not crash. A record with no
 * generated markup renders an empty box. A generated file left stale after
 * a palette change ships a fallback gradient in last week's colours. A
 * shipped source whose imports were not rewritten pastes into somebody's
 * project and fails to resolve, in their editor, days later.
 *
 * None of those are type errors and none of them are visible on this
 * machine. `scripts/shot-shaders.mts` covers whether a design *draws* —
 * that needs a GPU and 30 seconds. This covers whether the catalog is
 * internally consistent, which is the part that has to be true on every
 * commit.
 */

const sources = GENERATED_SOURCES as unknown as {
  shared: { path: string; lang: string; source: string }[]
  own: Record<string, { path: string; lang: string; source: string }>
}

test('every catalog record has generated markup and a source file', () => {
  for (const record of SHADER_CATALOG) {
    const effect = getShaderEffect(record.id)
    assert.ok(effect, `${record.id} has no generated markup — run npm run build:shaders`)
    assert.ok(
      sources.own[record.id],
      `${record.id} has no generated source — run npm run build:shaders`,
    )
    assert.ok(shaderLines(record.id) > 0, `${record.id} reports zero lines of source`)
  }
})

test('no generated entry outlives the record that produced it', () => {
  // The direction the first test cannot catch: a design deleted from the
  // catalog whose generated markup is still sitting in the JSON, still
  // being served by whatever reads it.
  for (const id of Object.keys(sources.own)) {
    assert.ok(getShaderRecord(id), `generated source for "${id}" has no catalog record`)
  }
})

test('ids are unique, url-safe, and claimed by the tier', () => {
  const seen = new Set<string>()
  for (const record of SHADER_CATALOG) {
    assert.match(record.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${record.id} is not a clean slug`)
    assert.ok(!seen.has(record.id), `${record.id} appears twice`)
    seen.add(record.id)
    assert.ok(isShaderEffect(record.id), `${record.id} is not recognised as a shader effect`)
  }
  assert.equal(seen.size, SHADER_COUNT)
})

test('every shader effect declares a renderer that is not css', () => {
  for (const effect of SHADER_EFFECTS) {
    assert.ok(
      isShaderRenderer(effect.renderer),
      `${effect.id} has renderer "${rendererOf(effect)}" — a shader effect that claims to be CSS is invisible to the filter and miscounted in every claim`,
    )
  }
})

test('categories are real effect categories', () => {
  // The tier deliberately spans the existing taxonomy rather than inventing
  // a "Shaders" category, so a typo here files a design under nothing.
  for (const record of SHADER_CATALOG) {
    assert.ok(
      (CATEGORIES as string[]).includes(record.category),
      `${record.id} is filed under "${record.category}", which is not a category`,
    )
  }
})

test('markup names its own canvas and its own class', () => {
  for (const effect of SHADER_EFFECTS) {
    assert.ok(
      effect.html.includes(`data-hoverlab-shader="${effect.id}"`),
      `${effect.id}'s markup does not carry its own shader attribute — the runtime would never find it`,
    )
    assert.ok(
      effect.html.includes(`class="fx-${effect.id}"`),
      `${effect.id}'s markup does not carry its own class`,
    )
    assert.ok(
      effect.css.includes(`.fx-${effect.id} {`),
      `${effect.id}'s stylesheet does not style its own class`,
    )
  }
})

test('every design has a fallback in both themes', () => {
  for (const effect of SHADER_EFFECTS) {
    const light = effect.css.match(/^\.fx-[a-z0-9-]+ \{[^}]*background: ([^;]+);/m)
    const dark = effect.css.match(/\.dark \.fx-[a-z0-9-]+ \{[^}]*background: ([^;]+);/)
    assert.ok(light, `${effect.id} has no light fallback background`)
    assert.ok(dark, `${effect.id} has no dark fallback background`)
    // Identical gradients mean a palette was copied rather than authored,
    // and the design will be unreadable in one of the two themes.
    assert.notEqual(
      light![1],
      dark![1],
      `${effect.id}'s light and dark fallbacks are the same gradient`,
    )
  }
})

test('shipped sources are three files, design first, with no internal paths', () => {
  for (const effect of SHADER_EFFECTS) {
    const files = [sources.own[effect.id], ...sources.shared]
    assert.equal(files.length, 3, `${effect.id} ships ${files.length} files, expected 3`)
    assert.equal(
      files[0].path,
      `components/${effect.id}.tsx`,
      `${effect.id}'s own file is not first — primaryFile() would copy the runtime instead of the design`,
    )

    for (const file of files) {
      /*
       * The rewrite in `build-shader-sources.mts` is the only thing between
       * this repo's layout and a buyer's. A missed one resolves here and
       * nowhere else, which means it cannot fail on this machine — exactly
       * the class of bug that has to be asserted rather than noticed.
       */
      assert.ok(
        !file.source.includes("from '../shader-surface'"),
        `${file.path} still imports the internal shader-surface path`,
      )
      assert.ok(
        !file.source.includes("from '../runtime'") && !file.source.includes("from './runtime'"),
        `${file.path} still imports the internal runtime path`,
      )
      assert.ok(
        !file.source.includes('@/lib/shaders'),
        `${file.path} still imports an internal @/lib/shaders path`,
      )
    }
  }
})

test('shared files are stored once, not once per effect', () => {
  // The encoding this replaced wrote the runtime fifteen times and turned a
  // 70 KB artifact into 516 KB. Worth a test, because the obvious edit —
  // "just give each record a complete files[]" — reintroduces it silently.
  assert.equal(sources.shared.length, 2)
  assert.deepEqual(
    sources.shared.map((f) => f.path),
    ['components/shader-runtime.ts', 'components/shader-surface.tsx'],
  )
})

test('no shader effect claims a dependency', () => {
  // The pitch, and a thing that would stop being true by accident: every
  // competitor ships these on three.js or ogl.
  for (const effect of SHADER_EFFECTS) {
    assert.deepEqual(effect.deps, [], `${effect.id} has picked up a dependency`)
  }
})
