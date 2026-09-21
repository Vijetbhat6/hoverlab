/**
 * Reading the project the CLI is standing in.
 *
 * `detect.mjs` answers "what framework is this?" and stops there, which was
 * enough while every artifact was a single self-contained file. Blocks and
 * pages are not. A page imports `@/components/pricing-tiers`, needs Tailwind
 * to compile its classes, and needs tokens that give `bg-primary` a value —
 * and whether all of that holds is decided by five things this file reads:
 *
 *   the package manager   so an install hint is a command that works here
 *   the Tailwind major    v3 and v4 disagree about where config lives
 *   components.json       shadcn's record of where the project keeps things
 *   the `@/*` path alias  what every page's imports resolve against
 *   the design tokens     whether `--primary` exists at all
 *
 * EVERY READER HERE FAILS TO `null`, NEVER THROWS. `add` has to work in a
 * directory that has none of these, and `doctor` has to be able to say so
 * instead of crashing on the thing it was asked to inspect.
 *
 * Dependency-free like the rest of this package: tsconfig is JSONC and there
 * is no parser for it in Node's standard library, so `readJsonc` is the small
 * string-aware one below rather than a dependency.
 */

import { readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ *
 *  Reading files that are almost JSON
 * ------------------------------------------------------------------ */

/**
 * Parse JSON that may carry comments and trailing commas.
 *
 * tsconfig.json is JSONC, and so is most of what a Next or Vite scaffold
 * writes. `JSON.parse` throws on the first `//`, which used to mean a project
 * whose tsconfig had a comment was indistinguishable from one with no tsconfig
 * at all — and the tool then reported a missing alias that was sitting right
 * there.
 *
 * String-aware on purpose: `"@/*": ["./src/*"]` contains `/*`, and a
 * comment-stripper that does not track quotes deletes the rest of the file
 * from that point on, silently, leaving JSON that still parses.
 */
export function parseJsonc(text) {
  let out = ''
  let i = 0
  let inString = false

  while (i < text.length) {
    const ch = text[i]
    const next = text[i + 1]

    if (inString) {
      out += ch
      if (ch === '\\') {
        out += next ?? ''
        i += 2
        continue
      }
      if (ch === '"') inString = false
      i++
      continue
    }

    if (ch === '"') {
      inString = true
      out += ch
      i++
    } else if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (ch === '/' && next === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
    } else {
      out += ch
      i++
    }
  }

  return JSON.parse(dropTrailingCommas(out).replace(/^﻿/, ''))
}

/**
 * Remove a comma that sits directly before `}` or `]`, outside strings.
 *
 * A second pass rather than a regex over the whole text, for the same reason
 * the comment stripper tracks quotes: `"note": "ends in ,}"` is a value, and
 * a regex cannot tell it from structure.
 */
function dropTrailingCommas(text) {
  let out = ''
  let inString = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      out += ch
      if (ch === '\\') out += text[++i] ?? ''
      else if (ch === '"') inString = false
      continue
    }

    if (ch === '"') {
      inString = true
      out += ch
    } else if (ch === ',') {
      let j = i + 1
      while (j < text.length && /\s/.test(text[j])) j++
      if (text[j] !== '}' && text[j] !== ']') out += ch
    } else {
      out += ch
    }
  }
  return out
}

async function readJson(file, { jsonc = false } = {}) {
  try {
    const text = await readFile(file, 'utf8')
    return jsonc ? parseJsonc(text) : JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    return null
  }
}

/** Walk up from `dir` for a file; returns its absolute path or null. */
export async function findUp(names, dir = process.cwd(), { stopAt } = {}) {
  let current = path.resolve(dir)
  const limit = stopAt ? path.resolve(stopAt) : null
  const list = Array.isArray(names) ? names : [names]
  for (;;) {
    for (const name of list) {
      const candidate = path.join(current, name)
      if (await exists(candidate)) return candidate
    }
    if (limit && current === limit) return null
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

/* ------------------------------------------------------------------ *
 *  Package manager
 * ------------------------------------------------------------------ */

/** Lockfile → manager, in the order they are believed. */
const LOCKFILES = [
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
]

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun']

/**
 * Which package manager this project uses.
 *
 * Four signals, most authoritative first, because they can disagree and the
 * order is the decision:
 *
 *   1. `packageManager` in package.json. Corepack enforces it; the project
 *      has said so in as many words.
 *   2. A lockfile, searched UPWARD. In a workspace the lockfile lives at the
 *      repository root while the package being edited is two levels down, and
 *      looking only beside package.json reports "no lockfile" for the most
 *      common monorepo layout.
 *   3. The user agent of whatever launched us — `pnpm dlx hoverlab` sets
 *      `npm_config_user_agent` to pnpm. Weaker than a lockfile because
 *      `npx hoverlab` in a pnpm project says npm, which is why it ranks below.
 *   4. npm, because it is on every machine that has Node.
 *
 * @returns {Promise<{ name: string, reason: string }>}
 */
export async function detectPackageManager(cwd = process.cwd(), env = process.env) {
  const pkgPath = await findUp('package.json', cwd)
  const root = pkgPath ? path.dirname(pkgPath) : null

  if (pkgPath) {
    const pkg = await readJson(pkgPath)
    const field = typeof pkg?.packageManager === 'string' ? pkg.packageManager : ''
    const named = field.split('@')[0]
    if (PACKAGE_MANAGERS.includes(named)) {
      return { name: named, reason: `package.json says packageManager: ${field}`, root }
    }
  }

  const lock = await findUp(LOCKFILES.map(([file]) => file), cwd)
  if (lock) {
    const file = path.basename(lock)
    const name = LOCKFILES.find(([candidate]) => candidate === file)[1]
    return { name, reason: `found ${file}`, root }
  }

  const agent = String(env.npm_config_user_agent ?? '')
  const fromAgent = PACKAGE_MANAGERS.find((name) => agent.startsWith(`${name}/`))
  if (fromAgent) {
    return { name: fromAgent, reason: `launched by ${fromAgent}`, root }
  }

  return { name: 'npm', reason: 'no lockfile found', root }
}

/**
 * The command that adds packages, as an argv and as a string to print.
 *
 * Returned as data rather than run here: the caller decides whether to print
 * it, prompt over it or spawn it, and a hint that says `npm i` in a pnpm
 * project is the failure this exists to end.
 */
export function addCommand(manager, packages) {
  const verb = { npm: 'install', pnpm: 'add', yarn: 'add', bun: 'add' }[manager] ?? 'install'
  const args = [verb, ...packages]
  return { command: manager, args, display: `${manager} ${args.join(' ')}` }
}

/** `npm install` / `pnpm install` / `yarn` / `bun install`. */
export function installAllCommand(manager) {
  return manager === 'yarn'
    ? { command: 'yarn', args: [], display: 'yarn' }
    : { command: manager, args: ['install'], display: `${manager} install` }
}

/** `npm run dev` / `pnpm dev` / `yarn dev` / `bun run dev`. */
export function runScriptCommand(manager, script) {
  const display =
    manager === 'npm' || manager === 'bun' ? `${manager} run ${script}` : `${manager} ${script}`
  return { display }
}

/**
 * A package name npm would accept, and nothing a shell would misread.
 *
 * `add` can install the packages an artifact says it needs, and that list
 * comes from the API — which `HOVERLAB_API_URL` lets a user point at any
 * host. On Windows the package manager is a `.cmd` shim, which can only be
 * spawned through a shell, so a name like `x & calc` would be a command. The
 * pattern is the npm name grammar (optionally scoped, optionally with a
 * version range after `@`), which contains no shell metacharacter.
 */
export function isSafePackageSpec(spec) {
  return /^(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(@[a-zA-Z0-9.^~<>=*|-]+)?$/.test(
    String(spec),
  )
}

/* ------------------------------------------------------------------ *
 *  Tailwind
 * ------------------------------------------------------------------ */

const TAILWIND_CONFIGS = [
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.mjs',
  'tailwind.config.ts',
]

/** Where a stylesheet that imports Tailwind usually lives, most common first. */
const CSS_ENTRIES = [
  'src/app/globals.css',
  'app/globals.css',
  'src/styles/globals.css',
  'styles/globals.css',
  'src/globals.css',
  'src/index.css',
  'src/app.css',
  'src/styles.css',
  'app/app.css',
  'app/root.css',
]

/** The major in a semver range: `^4.1.0` → 4, `~3.4` → 3, `latest` → null. */
export function majorOf(range) {
  const match = /(\d+)(?:\.|$|\s|-)/.exec(String(range ?? '').replace(/^[^\d]*/, ''))
  return match ? Number(match[1]) : null
}

/** The installed version of a package, resolved the way Node would: up the tree. */
async function installedVersion(name, from) {
  const found = await findUp(path.join('node_modules', name, 'package.json'), from)
  return found ? ((await readJson(found))?.version ?? null) : null
}

/**
 * Which Tailwind this project runs, and where its theme lives.
 *
 * v3 and v4 are not the same tool with a bigger number. v3 reads a
 * `tailwind.config.*` and maps tokens in JavaScript; v4 has no config file by
 * default and maps them in a CSS `@theme` block. A block written for one
 * compiles in the other but styles nothing — every `bg-primary` silently
 * resolves to no colour — so this is the fact `doctor` leads with.
 *
 * The evidence, strongest first: the version actually installed, the range
 * in package.json, a `@tailwindcss/*` plugin (v4 only), then a config file
 * (v3, or v4 with `@config`). Only the first two are a version; the rest are
 * reported with `certain: false` so nothing downstream states a guess as fact.
 *
 * @returns {Promise<null | { major: number|null, certain: boolean, source: string, configFile: string|null, entryCss: string|null, hasTheme: boolean, hasPrimaryToken: boolean, mapsColors: boolean, tokensResolve: boolean }>}
 */
export async function detectTailwind(cwd = process.cwd(), componentsJson = null) {
  const pkgPath = await findUp('package.json', cwd)
  if (!pkgPath) return null
  const root = path.dirname(pkgPath)
  const pkg = await readJson(pkgPath)
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies, ...pkg?.peerDependencies }
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name)

  let configFile = null
  for (const name of TAILWIND_CONFIGS) {
    if (await exists(path.join(root, name))) {
      configFile = name
      break
    }
  }

  const v4Plugin = has('@tailwindcss/postcss') || has('@tailwindcss/vite') || has('@tailwindcss/cli')

  let major = null
  let certain = false
  let source = null

  const installed = await installedVersion('tailwindcss', root)
  if (installed) {
    major = majorOf(installed)
    certain = major !== null
    source = `tailwindcss ${installed} is installed`
  } else if (has('tailwindcss') && majorOf(deps.tailwindcss) !== null) {
    major = majorOf(deps.tailwindcss)
    certain = true
    source = `package.json asks for tailwindcss ${deps.tailwindcss}`
  } else if (v4Plugin) {
    major = 4
    source = 'a @tailwindcss/* plugin is a dependency, and those are v4 only'
  } else if (has('tailwindcss')) {
    source = `tailwindcss is a dependency (${deps.tailwindcss}), but its version is not readable`
  } else if (configFile) {
    major = 3
    source = `found ${configFile}, which v3 projects use`
  } else {
    return null
  }

  // Where the stylesheet is. shadcn's components.json names it exactly; the
  // rest is a search of the places scaffolds put it.
  const candidates = [componentsJson?.tailwind?.css, ...CSS_ENTRIES].filter(Boolean)
  let entryCss = null
  let entryAbsolute = null
  let css = ''
  for (const candidate of candidates) {
    const absolute = path.resolve(root, candidate)
    if (await exists(absolute)) {
      entryAbsolute = absolute
      entryCss = path.relative(root, absolute).split(path.sep).join('/')
      css = await readFile(absolute, 'utf8').catch(() => '')
      break
    }
  }

  const configText = configFile
    ? await readFile(path.join(root, configFile), 'utf8').catch(() => '')
    : ''

  /*
    The stylesheet as the build sees it: the entry plus what it imports by
    relative path. The design-system export tells people to `@import
    "./tokens.css"` from their entry, so the tokens are usually one file away
    from the one that was read, and a check that stopped at the entry would
    report a missing theme for a project that did exactly what the README said.
  */
  const allCss = entryAbsolute ? `${css}\n${await relativeImports(entryAbsolute, css)}` : ''

  /*
    Whether `bg-primary` can resolve to anything. Blocks are written in
    semantic colour names, so this decides whether an install looks right or
    renders as a page of unstyled boxes. v4 takes the mapping from
    `--color-primary` in an @theme block; v3 from a `primary` key in the
    config's colours. Two spellings, which is why it is read per major.
  */
  const mapsColors =
    major === 3 ? /['"]?primary['"]?\s*:/.test(configText) : /--color-primary\s*:/.test(allCss)

  const hasPrimaryToken = /--primary\s*:/.test(allCss)

  /*
    A mapping is only half of it. `--color-primary: var(--primary)` points at
    a variable, and if nothing defines that variable `bg-primary` compiles
    and resolves to nothing — no error anywhere, just unstyled buttons. So
    "resolves" means the mapping exists AND either it holds a literal colour
    or the variable it names is defined.
  */
  const mappingText =
    major === 3
      ? (/['"]?primary['"]?\s*:\s*([^,}\n]+)/.exec(configText)?.[1] ?? '')
      : (/--color-primary\s*:\s*([^;]+);/.exec(allCss)?.[1] ?? '')
  const tokensResolve = mapsColors && (!/var\(\s*--primary\b/.test(mappingText) || hasPrimaryToken)

  return {
    major,
    certain,
    source,
    configFile,
    entryCss,
    hasTheme: /@theme\b/.test(allCss),
    hasPrimaryToken,
    mapsColors,
    tokensResolve,
  }
}

/**
 * The text of stylesheets the entry imports by relative path, one level deep.
 *
 * Relative only, never a package: `@import "tailwindcss"` is not a file we
 * can or should read, and following it would report Tailwind's own tokens as
 * the project's.
 */
async function relativeImports(entryAbsolute, css) {
  let text = ''
  for (const match of css.matchAll(/@import\s+(?:url\()?["'](\.{1,2}\/[^"']+)["']/g)) {
    const content = await readFile(path.resolve(path.dirname(entryAbsolute), match[1]), 'utf8').catch(
      () => null,
    )
    if (content !== null) text += `\n${content}`
  }
  return text
}

/* ------------------------------------------------------------------ *
 *  components.json and the path alias
 * ------------------------------------------------------------------ */

/**
 * shadcn's `components.json`, or null.
 *
 * Read for two reasons. It is the project's own statement of where UI lives
 * (`aliases.components`) and which stylesheet carries the tokens
 * (`tailwind.css`), so honouring it beats guessing from folder names. And its
 * presence is a signal in itself: a project with one already follows the
 * conventions blocks assume — `@/` aliases, `cn` in `lib/utils`, CSS
 * variables — so the install can say less.
 */
export async function readComponentsJson(cwd = process.cwd()) {
  /*
    Bounded by the package, unlike the brand file. A brand belongs to a whole
    repository; components.json belongs to ONE package — in a monorepo each
    app has its own, with its own aliases and stylesheet. Walking past this
    package's root would adopt a sibling's or the workspace root's, and
    `doctor` would then check this project against a config that is not its.
  */
  const pkg = await findUp('package.json', cwd)
  const file = await findUp('components.json', cwd, { stopAt: pkg ? path.dirname(pkg) : cwd })
  if (!file) return null
  const json = await readJson(file)
  if (!json || typeof json !== 'object') return null

  return {
    path: file,
    dir: path.dirname(file),
    style: json.style ?? null,
    rsc: json.rsc ?? null,
    tsx: json.tsx ?? null,
    iconLibrary: json.iconLibrary ?? null,
    aliases: json.aliases ?? {},
    tailwind: {
      css: json.tailwind?.css ?? null,
      // An empty string is shadcn's spelling of "Tailwind v4, no config file".
      config: json.tailwind?.config ?? null,
      baseColor: json.tailwind?.baseColor ?? null,
      cssVariables: json.tailwind?.cssVariables ?? null,
      prefix: json.tailwind?.prefix ?? '',
    },
  }
}

const TSCONFIGS = ['tsconfig.json', 'tsconfig.app.json', 'jsconfig.json']

/**
 * The `paths` a project's TypeScript config declares, resolved to disk.
 *
 * Vite scaffolds put `paths` in `tsconfig.app.json` and leave `tsconfig.json`
 * as a list of references, so the first file is not the only place to look.
 * A relative `extends` is followed one level for the same reason.
 *
 * @returns {Promise<{ file: string, base: string, paths: Record<string, string[]> } | null>}
 */
export async function readPathAliases(cwd = process.cwd()) {
  const pkgPath = await findUp('package.json', cwd)
  const root = pkgPath ? path.dirname(pkgPath) : path.resolve(cwd)

  for (const name of TSCONFIGS) {
    const file = path.join(root, name)
    let config = await readJson(file, { jsonc: true })
    if (!config) continue

    let compiler = config.compilerOptions ?? {}
    let configDir = path.dirname(file)

    if (!compiler.paths && typeof config.extends === 'string' && config.extends.startsWith('.')) {
      const parent = path.resolve(configDir, config.extends.endsWith('.json') ? config.extends : `${config.extends}.json`)
      const extended = await readJson(parent, { jsonc: true })
      if (extended?.compilerOptions?.paths) {
        compiler = { ...extended.compilerOptions, ...compiler, paths: extended.compilerOptions.paths }
        configDir = path.dirname(parent)
      }
    }

    if (compiler.paths && typeof compiler.paths === 'object') {
      return {
        file: path.relative(root, file).split(path.sep).join('/'),
        base: path.resolve(configDir, compiler.baseUrl ?? '.'),
        paths: compiler.paths,
      }
    }
  }
  return null
}

/**
 * Where `@/` points, as an absolute directory — or null when nothing does.
 *
 * Every page imports `@/components/<block>`. That import resolves only if the
 * project declares an `@/*` alias, and the directory it maps to is where
 * `components/` has to land for it to work. This is the one place the answer
 * is read rather than assumed from whether a `src/` folder exists, which is
 * the guess `detectArtifactRoot` used to make on its own.
 */
export async function resolveAtAlias(cwd = process.cwd()) {
  const aliases = await readPathAliases(cwd)
  if (!aliases) return null

  const targets = aliases.paths['@/*']
  if (!Array.isArray(targets) || targets.length === 0) return null

  // `./src/*` → `./src`. A target that is not of the `<dir>/*` form cannot
  // be a directory alias, and guessing at it would put files somewhere the
  // import does not look.
  const target = String(targets[0])
  if (!target.endsWith('/*')) return null
  const dir = path.resolve(aliases.base, target.slice(0, -2))
  return { dir, from: aliases.file, target }
}

/* ------------------------------------------------------------------ *
 *  Everything at once, for `doctor`
 * ------------------------------------------------------------------ */

/**
 * The whole picture of the project, gathered once.
 *
 * `doctor` and the install notes both want the same facts. Reading them in
 * one place means a fact is only ever read one way — the thing that stops
 * two surfaces telling the same user two different Tailwind versions.
 */
export async function inspectProject(cwd = process.cwd()) {
  const pkgPath = await findUp('package.json', cwd)
  const root = pkgPath ? path.dirname(pkgPath) : null
  const pkg = pkgPath ? await readJson(pkgPath) : null

  const componentsJson = await readComponentsJson(cwd)
  const [manager, tailwind, atAlias] = await Promise.all([
    detectPackageManager(cwd),
    detectTailwind(cwd, componentsJson),
    resolveAtAlias(cwd),
  ])

  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies, ...pkg?.peerDependencies }

  return { root, pkg, deps, manager, tailwind, componentsJson, atAlias }
}
