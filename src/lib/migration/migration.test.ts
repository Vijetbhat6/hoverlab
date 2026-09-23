import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

import tokens from '@/lib/generated-dna.json'
import { BRAND_IDS } from '@/lib/dna'
import { buildDesignSystem } from '@/lib/export/design-system'
import { DEFAULT_THEME_SHAPE } from '@/lib/theme-shape'
import { DEFAULT_THEME, themeCss } from '@/lib/shadcn-theme'
import { PLANS } from '@/lib/billing/plans'
import { buildLlmsTxt } from '@/lib/llms-txt'
import { buildRegistryItem, registryItemNames } from '@/lib/registry/registry'
import {
  EXPORT_FILES,
  LOCKFILE_FIELDS,
  MIGRATION_CLI,
  MIGRATION_ENV,
  MIGRATION_EXAMPLE_IDS,
  MIGRATION_FILES,
  MIGRATION_ROUTES,
  TOKEN_MAPPING,
} from './cli-reference'
import { MIGRATE_INDEX, MIGRATION_GUIDES, guidePath } from './guides'

/**
 * The migration guides print commands people paste into a terminal in a
 * project that already works. These tests read the CLI's own source and the
 * generators' real output, so a guide cannot name a flag, a file or a format
 * that does not exist — and if one is renamed, the failure points here.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..')
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), 'utf8')

const BIN = read('packages', 'cli', 'bin', 'hoverlab.mjs')
const COMMANDS = read('packages', 'cli', 'src', 'commands.mjs')
const CLI_SRC = (file: string) => read('packages', 'cli', 'src', file)

/* -- the pages under test -------------------------------------------- */

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(path))
    else if (/\.tsx$/.test(entry.name)) out.push(path)
  }
  return out
}

const MIGRATE_DIR = join(ROOT, 'src', 'app', 'docs', 'migrate')
const SOURCES = walk(MIGRATE_DIR).map((file) => ({ file, text: readFileSync(file, 'utf8') }))

/* -- reading the CLI --------------------------------------------------- */

const capital = (word: string) => word[0]!.toUpperCase() + word.slice(1)

/** The dispatch cases in bin/hoverlab.mjs. `help` is handled before the switch. */
const DISPATCHED = new Set([...BIN.matchAll(/case '([a-z-]+)':/g)].map((m) => m[1]!))
DISPATCHED.add('help')

/** Flags the argument parser knows take a value. */
const VALUE_FLAGS = new Set(
  [...(BIN.match(/const VALUE_FLAGS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? '').matchAll(/'([a-z-]+)'/g)].map(
    (m) => m[1]!,
  ),
)

/** The source of one `export async function commandX`, up to the next export. */
function commandBody(command: string): string {
  const start = COMMANDS.search(new RegExp(`export (async )?function command${capital(command)}\\(`))
  assert.ok(start >= 0, `commands.mjs has no command${capital(command)}`)
  const rest = COMMANDS.slice(start + 10)
  const next = rest.search(/\nexport /)
  return next === -1 ? rest : rest.slice(0, next)
}

const readsFlag = (body: string, flag: string) =>
  body.includes(`flags.${flag}`) || body.includes(`flags['${flag}']`) || body.includes(`flags["${flag}"]`)

const ALL_LISTED_FLAGS = new Set(MIGRATION_CLI.flatMap((c) => c.flags))

describe('the CLI commands the guides print', () => {
  for (const { command, flags } of MIGRATION_CLI) {
    test(`${command} exists, and reads ${flags.length ? flags.map((f) => `--${f}`).join(' ') : 'no flags'}`, () => {
      assert.ok(DISPATCHED.has(command), `bin/hoverlab.mjs has no case '${command}'`)
      const body = commandBody(command)
      for (const flag of flags) {
        assert.ok(
          readsFlag(body, flag),
          `command${capital(command)} does not read --${flag}, but a guide prints it with \`${command}\``,
        )
      }
    })
  }

  test('every value flag the guides use is one the parser expects a value for', () => {
    for (const flag of ['brand', 'out', 'dir']) assert.ok(VALUE_FLAGS.has(flag), `--${flag}`)
  })
})

describe('what the guide pages actually say', () => {
  const allowedCommands = new Set([...MIGRATION_CLI.map((c) => c.command), 'help'])

  test('every `hoverlab <command>` in a guide is a real command and is listed', () => {
    let seen = 0
    for (const { file, text } of SOURCES) {
      for (const [n, line] of text.split('\n').entries()) {
        for (const m of line.matchAll(/(?<![@\w./-])hoverlab\s+([a-z][a-z-]*)/g)) {
          seen++
          const command = m[1]!
          const where = `${file.replace(ROOT, '')}:${n + 1}`
          assert.ok(DISPATCHED.has(command), `${where}: "hoverlab ${command}" is not a CLI command`)
          assert.ok(
            allowedCommands.has(command),
            `${where}: "${command}" is real but missing from MIGRATION_CLI — add it, so it stays checked`,
          )

          // Flags on this line belong to this command.
          const tail = line.slice((m.index ?? 0) + m[0].length)
          const listed = MIGRATION_CLI.find((c) => c.command === command)?.flags ?? []
          for (const f of tail.matchAll(/(?<![\w-])--([a-z][a-z-]*)/g)) {
            assert.ok(
              listed.includes(f[1]!),
              `${where}: "--${f[1]}" is used with \`${command}\` but not listed for it`,
            )
          }
        }
      }
    }
    assert.ok(seen > 15, `expected to find the guides' commands, found ${seen}`)
  })

  test('every <F> flag mention is a listed flag', () => {
    let seen = 0
    for (const { file, text } of SOURCES) {
      for (const m of text.matchAll(/<F>--([a-z][a-z-]*)<\/F>/g)) {
        seen++
        assert.ok(ALL_LISTED_FLAGS.has(m[1]!), `${file.replace(ROOT, '')}: --${m[1]} is not in MIGRATION_CLI`)
      }
    }
    assert.ok(seen >= 5, 'the guides should mention flags through <F>')
  })

  test('never prints a flag that this CLI deliberately does not have', () => {
    for (const { file, text } of SOURCES) {
      for (const bad of ['--apply', '--yes', '--write', '--fix', '--upgrade']) {
        assert.ok(!text.includes(bad), `${file.replace(ROOT, '')} mentions ${bad}`)
      }
    }
  })

  test('a --brand value is a real preset id', () => {
    for (const { text } of SOURCES) {
      for (const m of text.matchAll(/--brand\s+([a-z]+)/g)) {
        assert.ok(BRAND_IDS.includes(m[1]!), `--brand ${m[1]} is not one of ${BRAND_IDS.join(', ')}`)
      }
    }
  })
})

describe('files, fields and variables', () => {
  test('the lockfile and config names are the ones the CLI uses', () => {
    for (const { name, definedIn } of Object.values(MIGRATION_FILES)) {
      assert.ok(CLI_SRC(definedIn).includes(name), `${definedIn} does not name ${name}`)
    }
  })

  test('every lockfile field the guide shows is one the CLI writes', () => {
    const lock = CLI_SRC('lockfile.mjs')
    for (const field of LOCKFILE_FIELDS) {
      assert.ok(new RegExp(`\\b${field}\\b`).test(lock), `lockfile.mjs never mentions "${field}"`)
    }
  })

  test('the environment variables exist where stated', () => {
    for (const { name, definedIn } of MIGRATION_ENV) {
      assert.ok(CLI_SRC(definedIn).includes(name), `${definedIn} does not read ${name}`)
    }
  })

  test('only `add` records to the lockfile — init does not, which the guides say', () => {
    assert.ok(commandBody('add').includes('recordInstall('))
    assert.ok(!commandBody('init').includes('recordInstall('))
  })

  test('the destination rules the guide states are the ones detect.mjs applies', () => {
    const detect = CLI_SRC('detect.mjs')
    for (const marker of ['src/app', 'src/components', 'src/pages']) {
      assert.ok(detect.includes(`'${marker}'`), `detect.mjs no longer roots at src/ for ${marker}`)
    }
  })

  test('update refuses blocked files unless --force, and dry-run writes nothing', () => {
    const body = commandBody('update')
    assert.ok(body.includes('blocked.length > 0 && !force'))
    assert.ok(body.includes('dryRun'))
    assert.ok(body.includes('has local changes'))
  })

  test('outdated never sets a failing exit code, so the CI note is true', () => {
    assert.ok(!commandBody('outdated').includes('exitCode'))
  })

  test('the revisions endpoint the guide curls exists, with the parameters it names', () => {
    const route = read('src', 'app', 'api', 'v1', 'revisions', 'route.ts')
    assert.ok(MIGRATION_ROUTES.revisions.endsWith('/revisions'))
    assert.ok(route.includes("get('level')") && route.includes("get('ids')"))
  })
})

describe('the design-system export, as the tokens guide describes it', () => {
  const exported = buildDesignSystem()
  const file = (path: string) => {
    const found = exported.files.find((f) => f.path === path)
    assert.ok(found, `the export has no ${path}`)
    return found.code
  }

  test('every file the guide names is one the exporter produces', () => {
    const paths = exported.files.map((f) => f.path)
    for (const name of Object.values(EXPORT_FILES)) {
      assert.ok(paths.includes(name), `${name} is not in the export: ${paths.join(', ')}`)
    }
  })

  test('tokens.css is HSL channels on :root, and has no @theme unless the shape moved', () => {
    const css = file(EXPORT_FILES.css)
    assert.match(css, /--primary: \d+ \d+% \d+%;/)
    assert.ok(!css.includes('@theme'), 'the default shape should emit no @theme block')

    const moved = buildDesignSystem(undefined, {
      shape: { ...DEFAULT_THEME_SHAPE, density: 1.25, typeScale: 1.125 },
    }).files.find((f) => f.path === EXPORT_FILES.css)!.code
    assert.ok(moved.includes('@theme {'), 'a moved shape should emit an @theme block')
    assert.ok(moved.includes('--spacing:'))
    assert.ok(moved.includes('--text-'))
  })

  test('the v4 file is an @theme inline block; the v3 file is not', () => {
    const v4 = file(EXPORT_FILES.tailwindV4)
    assert.ok(v4.includes('@theme inline'))
    assert.ok(v4.includes('--color-primary: hsl(var(--primary));'))
    assert.ok(v4.includes('@custom-variant dark'))

    const v3 = file(EXPORT_FILES.tailwindV3)
    assert.ok(!v3.includes('@theme'), 'the v3 file must not claim to be a v4 block')
    assert.ok(v3.includes('extend'))
  })

  test('the DTCG files are one per mode, with hex values', () => {
    for (const path of [EXPORT_FILES.dtcgLight, EXPORT_FILES.dtcgDark]) {
      const doc = JSON.parse(file(path))
      assert.equal(doc.color.$type, 'color')
      assert.match(doc.color.primary.$value, /^#[0-9a-f]{6}$/i)
    }
  })

  test('the free generator and the registry base emit finished colours, not channels', () => {
    const generated = themeCss(DEFAULT_THEME)
    assert.match(generated, /--primary: oklch\(/)
    assert.ok(generated.includes('@theme inline'))
    assert.ok(generated.includes('--color-primary: var(--primary);'))

    const base = buildRegistryItem('hoverlab', 'https://example.test')
    assert.ok(base, 'the registry has no base item')
    assert.match(base.cssVars?.light?.primary ?? '', /^oklch\(/)
  })

  test('every name the tokens guide aliases is a token blocks really read', () => {
    const page = read('src', 'app', 'docs', 'migrate', 'tokens', 'page.tsx')
    const keys = new Set(tokens.colorKeys as string[])
    const aliased = [...page.matchAll(/^ {2}--([a-z-]+): var\(--/gm)].map((m) => m[1]!)
    assert.ok(aliased.length >= 8, 'expected the alias example to be found')
    for (const name of aliased) assert.ok(keys.has(name), `--${name} is not a Hoverlab token`)
  })

  test('every suggested mapping targets a token blocks really read', () => {
    const keys = new Set(tokens.colorKeys as string[])
    for (const row of TOKEN_MAPPING) {
      assert.ok(keys.has(row.hoverlab), `${row.hoverlab} is not one of ${[...keys].join(', ')}`)
    }
    assert.equal(new Set(TOKEN_MAPPING.map((r) => r.hoverlab)).size, TOKEN_MAPPING.length)
  })
})

describe('the adopt guide’s claims about the catalog', () => {
  const names = new Set(registryItemNames())

  test('the example ids exist, on three different rungs', () => {
    for (const id of Object.values(MIGRATION_EXAMPLE_IDS)) {
      assert.ok(names.has(id), `${id} is not in the catalog`)
    }
  })

  test('a block installs to components/, a page to app/<id>.tsx — and shadcn puts a page at a route', () => {
    const blocks = JSON.parse(read('src', 'lib', 'blocks', 'generated-block-sources.json'))
    const pages = JSON.parse(read('src', 'lib', 'pages', 'generated-page-sources.json'))
    assert.equal(blocks[MIGRATION_EXAMPLE_IDS.block][0].path, `components/${MIGRATION_EXAMPLE_IDS.block}.tsx`)
    assert.equal(pages[MIGRATION_EXAMPLE_IDS.page][0].path, `app/${MIGRATION_EXAMPLE_IDS.page}.tsx`)

    const item = buildRegistryItem(MIGRATION_EXAMPLE_IDS.page, 'https://example.test')
    assert.equal(item?.files?.[0]?.target, `app/${MIGRATION_EXAMPLE_IDS.page}/page.tsx`)
  })

  test('pages import their blocks through the @/ alias the guide tells people to check', () => {
    const pages = JSON.parse(read('src', 'lib', 'pages', 'generated-page-sources.json'))
    assert.ok(pages[MIGRATION_EXAMPLE_IDS.page][0].source.includes("from '@/components/"))
  })

  test('every scaffolded template is Tailwind v3, and this site is v4', () => {
    const templates = join(ROOT, 'src', 'lib', 'templates', 'files')
    let checked = 0
    for (const dir of readdirSync(templates, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue
      let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
      try {
        pkg = JSON.parse(readFileSync(join(templates, dir.name, 'package.json'), 'utf8'))
      } catch {
        continue
      }
      const version = pkg.dependencies?.tailwindcss ?? pkg.devDependencies?.tailwindcss
      if (!version) continue
      checked++
      assert.match(version, /^[\^~]?3\./, `${dir.name} is on tailwindcss ${version}`)
    }
    assert.ok(checked > 0)
    assert.match(read('package.json'), /"tailwindcss":\s*"\^4/)
  })

  test('no block, page or primitive uses a utility v4 removed or one only v4 has', () => {
    // v3 utilities that v4 deleted outright, and syntax that does not exist in v3.
    // Bracketed arbitrary properties such as [mask-image:…] are valid in both.
    const removedInV4 =
      /(?<![\w\-[])(bg-opacity-|text-opacity-|border-opacity-|ring-opacity-|placeholder-opacity-|divide-opacity-|flex-shrink-|flex-grow-|overflow-ellipsis|decoration-slice|decoration-clone)/
    const onlyInV4 =
      /(?<![\w\-[])(bg-linear-|bg-radial|bg-conic|shadow-xs|shadow-2xs|inset-shadow|inset-ring|rounded-xs|blur-xs|outline-hidden|field-sizing|not-[a-z]+:|in-[a-z]+:|nth-|starting:|@min-|@max-|bg-\(--|text-\(--)/
    for (const rel of [
      ['blocks', 'generated-block-sources.json'],
      ['pages', 'generated-page-sources.json'],
      ['primitives', 'generated-primitive-sources.json'],
    ]) {
      const data = JSON.parse(read('src', 'lib', ...rel)) as Record<string, Array<{ source?: string }>>
      for (const [id, files] of Object.entries(data)) {
        for (const f of files) {
          const source = f.source ?? ''
          assert.ok(!removedInV4.test(source), `${id} uses a utility Tailwind v4 removed — update the adopt guide`)
          assert.ok(!onlyInV4.test(source), `${id} uses v4-only syntax — update the adopt guide`)
        }
      }
    }
  })
})

describe('the updates guide’s claims', () => {
  test('a renewal buys twelve months', () => {
    assert.equal(PLANS.renewal.updateWindowMonths, 12)
  })

  test('the licence still grants twelve months of updates and perpetual use of what shipped', () => {
    const licence = read('src', 'lib', 'license.ts')
    assert.ok(licence.includes('Twelve months of catalog updates'))
    assert.ok(licence.includes('anything already shipped'))
  })

  test('the update ledger the guide renders is still the one /pricing and /compare render', () => {
    assert.ok(read('src', 'app', 'pricing', 'page.tsx').includes('UPDATE_LEDGER'))
    assert.ok(read('src', 'app', 'compare', 'page.tsx').includes('UPDATE_LEDGER'))
  })
})

describe('the guides are wired in everywhere they should be', () => {
  test('each guide has a page, and the index has one', () => {
    for (const guide of MIGRATION_GUIDES) {
      assert.doesNotThrow(
        () => readFileSync(join(MIGRATE_DIR, guide.slug, 'page.tsx'), 'utf8'),
        `no page for ${guide.slug}`,
      )
    }
    assert.doesNotThrow(() => readFileSync(join(MIGRATE_DIR, 'page.tsx'), 'utf8'))
  })

  test('slugs and titles are unique and no description is empty', () => {
    assert.equal(new Set(MIGRATION_GUIDES.map((g) => g.slug)).size, MIGRATION_GUIDES.length)
    assert.equal(new Set(MIGRATION_GUIDES.map((g) => g.title)).size, MIGRATION_GUIDES.length)
    for (const g of MIGRATION_GUIDES) assert.ok(g.description.length > 60 && g.short && g.situation)
  })

  test('every guide sets a canonical of its own path, and carries breadcrumbs', () => {
    for (const { file, text } of SOURCES.filter((s) => s.file.endsWith('page.tsx'))) {
      assert.ok(text.includes('migrateMetadata('), `${file} sets no metadata`)
      assert.ok(text.includes('<MigrateBreadcrumbs'), `${file} has no breadcrumbs`)
    }
  })

  test('the sidebar, the sitemap and /llms.txt list the section', () => {
    assert.ok(read('src', 'components', 'docs', 'docs-nav.tsx').includes('/docs/migrate'))
    assert.ok(read('src', 'app', 'sitemap.ts').includes('MIGRATION_GUIDES'))

    const llms = buildLlmsTxt()
    assert.ok(llms.includes(MIGRATE_INDEX.path))
    for (const guide of MIGRATION_GUIDES) assert.ok(llms.includes(guidePath(guide.slug)), guide.slug)
  })
})
