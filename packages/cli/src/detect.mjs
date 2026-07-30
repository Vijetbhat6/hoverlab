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
