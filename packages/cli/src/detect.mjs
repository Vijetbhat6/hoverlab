/**
 * Project detection.
 *
 * `hoverlab add btn-gradient` with no flags should do the obvious thing in
 * the project you're standing in: emit a Vue SFC in a Vue app, a Svelte
 * component in a SvelteKit app, Tailwind classes if the project uses
 * Tailwind. Guessing wrong is cheap (one flag corrects it) and guessing
 * right removes the only friction that matters.
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

/** Walk up from `dir` looking for package.json; returns its dir or null. */
export async function findProjectRoot(dir = process.cwd()) {
  let current = path.resolve(dir)
  for (;;) {
    if (await exists(path.join(current, 'package.json'))) return current
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

async function readPackageJson(root) {
  try {
    return JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  } catch {
    return null
  }
}

const TAILWIND_CONFIGS = [
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.mjs',
  'tailwind.config.ts',
]

/**
 * Infer the best framework target for the current project.
 *
 * Order matters. styled-components is checked before React because a
 * project with both is telling you which it prefers. Tailwind is checked
 * last among the CSS strategies but *before* falling back to plain CSS,
 * and never overrides a component framework — a Vue app using Tailwind
 * still wants a .vue file, and the Vue output can contain utility classes
 * only if the user asks for it explicitly.
 */
export async function detectFramework(cwd = process.cwd()) {
  const root = await findProjectRoot(cwd)
  if (!root) return { framework: 'css', reason: 'no package.json found', root: null }

  const pkg = await readPackageJson(root)
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
    ...(pkg?.peerDependencies ?? {}),
  }
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name)

  if (has('styled-components')) {
    return { framework: 'styled-components', reason: 'styled-components is a dependency', root }
  }
  if (has('svelte') || has('@sveltejs/kit')) {
    return { framework: 'svelte', reason: 'svelte is a dependency', root }
  }
  if (has('vue') || has('nuxt')) {
    return { framework: 'vue', reason: 'vue is a dependency', root }
  }
  if (has('react') || has('next')) {
    return { framework: 'react', reason: 'react is a dependency', root }
  }

  const hasTailwindDep = has('tailwindcss') || has('@tailwindcss/postcss')
  if (hasTailwindDep) {
    return { framework: 'tailwind', reason: 'tailwindcss is a dependency', root }
  }
  for (const config of TAILWIND_CONFIGS) {
    if (await exists(path.join(root, config))) {
      return { framework: 'tailwind', reason: `found ${config}`, root }
    }
  }

  return { framework: 'css', reason: 'no framework detected', root }
}

/**
 * Where a block's or page's file tree should be rooted.
 *
 * Blocks arrive with real paths — `components/product-grid.tsx`,
 * `app/checkout-page.tsx` — because that is the layout every Hoverlab page
 * source imports against. So the job here is not to pick a folder but to
 * find the directory those paths are relative to, which is the project root
 * unless the project uses Next's `src/` convention.
 *
 * Getting this wrong is visible immediately (a stray `components/` beside
 * `src/components/`), which is the good kind of wrong: `--dir` fixes it.
 */
export async function detectArtifactRoot(cwd = process.cwd()) {
  const root = (await findProjectRoot(cwd)) ?? path.resolve(cwd)

  for (const marker of ['src/app', 'src/components', 'src/pages']) {
    if (await exists(path.join(root, marker))) {
      return { root: path.join(root, 'src'), reason: `rooted at src/, since the project has ${marker}` }
    }
  }

  return { root, reason: 'rooted at the project root' }
}

/**
 * Whether this project can compile a React component.
 *
 * Blocks and pages are React + Tailwind and ship as written — there is no
 * Vue port to fall back to. Installing one into a Nuxt app should still
 * work (the files land, the user knows what they asked for), but it should
 * say so rather than leave them to discover it at build time.
 */
export async function detectReactSupport(cwd = process.cwd()) {
  const root = await findProjectRoot(cwd)
  if (!root) return { react: false, reason: 'no package.json found' }

  const pkg = await readPackageJson(root)
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
    ...(pkg?.peerDependencies ?? {}),
  }
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name)

  if (has('react') || has('next')) return { react: true, reason: 'react is a dependency' }
  if (has('vue') || has('nuxt')) return { react: false, reason: 'this project uses Vue' }
  if (has('svelte') || has('@sveltejs/kit')) {
    return { react: false, reason: 'this project uses Svelte' }
  }
  return { react: false, reason: 'react is not a dependency' }
}

/**
 * Which packages from `deps` the project does not already have.
 *
 * Used to print an install line worth reading: telling someone to
 * `npm i lucide-react` when it is already in their package.json is noise
 * that trains them to skip the notes.
 */
export async function missingDeps(deps, cwd = process.cwd()) {
  if (!deps?.length) return []

  const root = await findProjectRoot(cwd)
  if (!root) return [...deps]

  const pkg = await readPackageJson(root)
  const installed = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
    ...(pkg?.peerDependencies ?? {}),
  }
  return deps.filter((d) => !Object.prototype.hasOwnProperty.call(installed, d))
}

const COMPONENT_DIRS = [
  'src/components',
  'app/components',
  'components',
  'src/lib/components',
  'src',
  'app',
]

/**
 * Pick a sensible output directory. Prefers an existing components folder
 * so effects land where the project already keeps UI, rather than in a new
 * top-level directory nobody asked for.
 */
export async function detectOutputDir(framework, cwd = process.cwd()) {
  const root = (await findProjectRoot(cwd)) ?? cwd

  // Plain CSS/HTML output isn't a component — don't bury it in components/.
  if (framework === 'css' || framework === 'html' || framework === 'tailwind') {
    for (const candidate of ['src/styles', 'styles', 'src/css', 'public']) {
      if (await exists(path.join(root, candidate))) {
        return path.join(root, candidate, 'hoverlab')
      }
    }
    return path.join(root, 'hoverlab')
  }

  for (const candidate of COMPONENT_DIRS) {
    if (await exists(path.join(root, candidate))) {
      return path.join(root, candidate, 'hoverlab')
    }
  }
  return path.join(root, 'hoverlab')
}
