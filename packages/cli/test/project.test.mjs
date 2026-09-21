/**
 * Tests for reading the project the CLI stands in.
 *
 * Every case builds a real directory. The functions under test exist to read
 * files, and a mock of `readFile` would test the mock — the thing that goes
 * wrong here is the shape of real tsconfigs and real lockfile layouts, which
 * is what these fixtures are copied from.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  addCommand,
  detectPackageManager,
  detectTailwind,
  installAllCommand,
  isSafePackageSpec,
  majorOf,
  parseJsonc,
  readComponentsJson,
  resolveAtAlias,
  runScriptCommand,
} from '../src/project.mjs'

let base
before(async () => {
  base = await mkdtemp(path.join(tmpdir(), 'hoverlab-project-'))
})
after(() => rm(base, { recursive: true, force: true }))

/** A fresh project directory with the given files. */
async function project(name, files) {
  const dir = path.join(base, name)
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(dir, relative)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, typeof content === 'string' ? content : JSON.stringify(content), 'utf8')
  }
  await mkdir(dir, { recursive: true })
  return dir
}

describe('parseJsonc', () => {
  test('reads what a Next tsconfig actually looks like', () => {
    const parsed = parseJsonc(`{
      // the compiler
      "compilerOptions": {
        /* strict */ "strict": true,
        "paths": { "@/*": ["./src/*"], },
      },
    }`)
    assert.deepEqual(parsed.compilerOptions.paths, { '@/*': ['./src/*'] })
  })

  test('does not treat /* inside a string as a comment', () => {
    // The alias key contains "/*". A stripper that ignores quotes deletes
    // everything after it and still yields parseable JSON — silently wrong.
    const parsed = parseJsonc('{ "paths": { "@/*": ["./src/*"] }, "after": 1 }')
    assert.equal(parsed.after, 1)
  })

  test('leaves a comma-brace inside a string alone', () => {
    assert.equal(parseJsonc('{ "note": "ends in ,}" }').note, 'ends in ,}')
  })

  test('survives a byte-order mark', () => {
    assert.equal(parseJsonc('﻿{ "a": 1 }').a, 1)
  })
})

describe('majorOf', () => {
  for (const [range, major] of [
    ['^4.1.0', 4],
    ['~3.4', 3],
    ['4', 4],
    ['>=3.3 <5', 3],
    ['npm:tailwindcss@4.0.0', 4],
    ['latest', null],
    ['workspace:*', null],
    [undefined, null],
  ]) {
    test(`${range} → ${major}`, () => assert.equal(majorOf(range), major))
  }
})

describe('detectPackageManager', () => {
  test('a packageManager field beats a lockfile', async () => {
    const dir = await project('pm-field', {
      'package.json': { packageManager: 'pnpm@9.1.0' },
      'package-lock.json': '{}',
    })
    assert.equal((await detectPackageManager(dir, {})).name, 'pnpm')
  })

  test('reads each lockfile', async () => {
    for (const [file, name] of [
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['bun.lock', 'bun'],
      ['bun.lockb', 'bun'],
      ['package-lock.json', 'npm'],
    ]) {
      const dir = await project(`pm-${file}`, { 'package.json': {}, [file]: '' })
      assert.equal((await detectPackageManager(dir, {})).name, name, file)
    }
  })

  test('finds the lockfile of the workspace above the package', async () => {
    const dir = await project('pm-workspace', {
      'pnpm-lock.yaml': '',
      'package.json': {},
      'apps/web/package.json': {},
    })
    const result = await detectPackageManager(path.join(dir, 'apps/web'), {})
    assert.equal(result.name, 'pnpm')
  })

  test('falls back to how the CLI was launched, then to npm', async () => {
    const dir = await project('pm-agent', { 'package.json': {} })
    assert.equal((await detectPackageManager(dir, { npm_config_user_agent: 'pnpm/9.0.0 npm/? node/v20' })).name, 'pnpm')
    assert.equal((await detectPackageManager(dir, { npm_config_user_agent: 'bun/1.1.0' })).name, 'bun')
    assert.equal((await detectPackageManager(dir, {})).name, 'npm')
  })

  test('a lockfile outranks the launching tool', async () => {
    // `npx hoverlab` in a pnpm project reports npm. The lockfile is the truth.
    const dir = await project('pm-lock-vs-agent', { 'package.json': {}, 'yarn.lock': '' })
    assert.equal((await detectPackageManager(dir, { npm_config_user_agent: 'npm/10.0.0' })).name, 'yarn')
  })
})

describe('commands', () => {
  test('add uses the right verb per manager', () => {
    assert.equal(addCommand('npm', ['a', 'b']).display, 'npm install a b')
    assert.equal(addCommand('pnpm', ['a']).display, 'pnpm add a')
    assert.equal(addCommand('yarn', ['a']).display, 'yarn add a')
    assert.equal(addCommand('bun', ['a']).display, 'bun add a')
  })

  test('install and run scripts', () => {
    assert.equal(installAllCommand('npm').display, 'npm install')
    assert.equal(installAllCommand('yarn').display, 'yarn')
    assert.equal(runScriptCommand('npm', 'dev').display, 'npm run dev')
    assert.equal(runScriptCommand('pnpm', 'dev').display, 'pnpm dev')
    assert.equal(runScriptCommand('bun', 'dev').display, 'bun run dev')
  })
})

describe('isSafePackageSpec', () => {
  test('accepts real package names', () => {
    for (const spec of ['react', 'lucide-react', '@radix-ui/react-dialog', 'clsx@2.1.0', '@a/b@^1.2.3']) {
      assert.ok(isSafePackageSpec(spec), spec)
    }
  })

  test('rejects anything a shell would act on', () => {
    // On Windows the package manager is a .cmd shim, spawned through a shell.
    for (const spec of ['x & calc', 'x; rm -rf /', '$(id)', 'x|y', 'x`y`', '-g', '../x', 'x y', '']) {
      assert.ok(!isSafePackageSpec(spec), JSON.stringify(spec))
    }
  })
})

describe('detectTailwind', () => {
  test('v4 from the installed version, with the colours mapped', async () => {
    const dir = await project('tw4', {
      'package.json': { dependencies: { tailwindcss: '^4.0.0' } },
      'node_modules/tailwindcss/package.json': { version: '4.1.18' },
      'src/app/globals.css':
        '@import "tailwindcss";\n@theme inline { --color-primary: var(--primary); }\n:root { --primary: oklch(0.5 0.2 160); }',
    })
    const result = await detectTailwind(dir)
    assert.equal(result.major, 4)
    assert.equal(result.certain, true)
    assert.equal(result.entryCss, 'src/app/globals.css')
    assert.equal(result.mapsColors, true)
    assert.equal(result.tokensResolve, true)
  })

  test('the installed version outranks the range in package.json', async () => {
    const dir = await project('tw-installed', {
      'package.json': { devDependencies: { tailwindcss: '^3.4.0' } },
      'node_modules/tailwindcss/package.json': { version: '4.0.0' },
    })
    assert.equal((await detectTailwind(dir)).major, 4)
  })

  test('a mapping to an undefined variable is not "resolves"', async () => {
    // The failure that looks fine: bg-primary compiles, points at var(--primary),
    // and nothing declares it. No error anywhere, just colourless buttons.
    const dir = await project('tw4-undefined', {
      'package.json': { dependencies: { tailwindcss: '^4' } },
      'src/app/globals.css': '@import "tailwindcss";\n@theme inline { --color-primary: var(--primary); }',
    })
    const result = await detectTailwind(dir)
    assert.equal(result.mapsColors, true)
    assert.equal(result.tokensResolve, false)
  })

  test('follows the relative imports the design-system export tells you to add', async () => {
    const dir = await project('tw4-imports', {
      'package.json': { dependencies: { tailwindcss: '^4' } },
      'src/app/globals.css': '@import "tailwindcss";\n@import "./tokens.css";\n@import "./tailwind-theme.css";',
      'src/app/tokens.css': ':root { --primary: 160 60% 40%; }',
      'src/app/tailwind-theme.css': '@theme inline { --color-primary: hsl(var(--primary)); }',
    })
    const result = await detectTailwind(dir)
    assert.equal(result.mapsColors, true)
    assert.equal(result.tokensResolve, true)
  })

  test('does not read a package as if it were a stylesheet', async () => {
    const dir = await project('tw4-pkg-import', {
      'package.json': { dependencies: { tailwindcss: '^4' } },
      'src/app/globals.css': '@import "tailwindcss";',
    })
    assert.equal((await detectTailwind(dir)).mapsColors, false)
  })

  test('v3 from a config file, mapped', async () => {
    const dir = await project('tw3', {
      'package.json': { devDependencies: { tailwindcss: '~3.4.1' } },
      'tailwind.config.ts': "export default { theme: { extend: { colors: { primary: 'hsl(var(--primary))' } } } }",
      'app/globals.css': '@tailwind base;\n:root { --primary: 160 60% 40%; }',
    })
    const result = await detectTailwind(dir)
    assert.equal(result.major, 3)
    assert.equal(result.configFile, 'tailwind.config.ts')
    assert.equal(result.mapsColors, true)
    assert.equal(result.tokensResolve, true)
  })

  test('v3 with no colour mapping', async () => {
    const dir = await project('tw3-bare', {
      'package.json': { devDependencies: { tailwindcss: '^3.4.0' } },
      'tailwind.config.js': 'module.exports = { content: [] }',
    })
    assert.equal((await detectTailwind(dir)).mapsColors, false)
  })

  test('a @tailwindcss/* plugin means v4 even when the version is unreadable', async () => {
    const dir = await project('tw4-plugin', {
      'package.json': { devDependencies: { '@tailwindcss/vite': 'latest', tailwindcss: 'latest' } },
    })
    const result = await detectTailwind(dir)
    assert.equal(result.major, 4)
    assert.equal(result.certain, false)
  })

  test('none at all is null', async () => {
    const dir = await project('tw-none', { 'package.json': { dependencies: { react: '^19' } } })
    assert.equal(await detectTailwind(dir), null)
  })
})

describe('resolveAtAlias', () => {
  test('Next style: paths in tsconfig.json', async () => {
    const dir = await project('alias-next', {
      'package.json': {},
      'tsconfig.json': '{ // comment\n "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
    })
    const alias = await resolveAtAlias(dir)
    assert.equal(alias.dir, path.join(dir, 'src'))
    assert.equal(alias.from, 'tsconfig.json')
  })

  test('Vite style: paths live in tsconfig.app.json', async () => {
    const dir = await project('alias-vite', {
      'package.json': {},
      'tsconfig.json': '{ "files": [], "references": [{ "path": "./tsconfig.app.json" }] }',
      'tsconfig.app.json': '{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }',
    })
    assert.equal((await resolveAtAlias(dir)).dir, path.join(dir, 'src'))
  })

  test('root alias maps to the project root', async () => {
    const dir = await project('alias-root', {
      'package.json': {},
      'tsconfig.json': '{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }',
    })
    assert.equal((await resolveAtAlias(dir)).dir, dir)
  })

  test('follows a relative extends', async () => {
    const dir = await project('alias-extends', {
      'package.json': {},
      'tsconfig.json': '{ "extends": "./tsconfig.base.json" }',
      'tsconfig.base.json': '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
    })
    assert.equal((await resolveAtAlias(dir)).dir, path.join(dir, 'src'))
  })

  test('a different alias is not @/', async () => {
    const dir = await project('alias-tilde', {
      'package.json': {},
      'tsconfig.json': '{ "compilerOptions": { "paths": { "~/*": ["./src/*"] } } }',
    })
    assert.equal(await resolveAtAlias(dir), null)
  })

  test('no tsconfig is null, not a throw', async () => {
    const dir = await project('alias-none', { 'package.json': {} })
    assert.equal(await resolveAtAlias(dir), null)
  })
})

describe('readComponentsJson', () => {
  test('reads shadcn config', async () => {
    const dir = await project('cj', {
      'package.json': {},
      'components.json': {
        style: 'new-york',
        aliases: { components: '@/components', utils: '@/lib/utils' },
        tailwind: { css: 'src/app/globals.css', config: '' },
      },
    })
    const result = await readComponentsJson(dir)
    assert.equal(result.style, 'new-york')
    assert.equal(result.aliases.components, '@/components')
    assert.equal(result.tailwind.css, 'src/app/globals.css')
  })

  test("does not adopt a parent package's components.json", async () => {
    // A monorepo: the workspace root has one, the app below it has none.
    const dir = await project('cj-monorepo', {
      'package.json': {},
      'components.json': { aliases: { components: '~/ui' } },
      'apps/web/package.json': {},
    })
    assert.equal(await readComponentsJson(path.join(dir, 'apps/web')), null)
  })
})
