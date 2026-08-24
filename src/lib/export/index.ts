/**
 * Multi-framework export — the single entry point every surface uses.
 *
 * The catalog is plain CSS, which is exactly why this is worth doing: a
 * React-coupled component library can only ever ship React, but an effect
 * that is markup plus a stylesheet can be handed to any framework. The
 * detail page's copy menu, the ZIP builder, the `/api/v1` routes, the CLI,
 * and the MCP server all call `exportEffect` so they cannot drift apart.
 *
 * Isomorphic by construction: no DOMParser, no Node built-ins, no
 * dependencies. It runs in a route handler, in a browser click handler,
 * and in the CLI unchanged.
 */

import {
  type FrameworkInput,
  buildReact,
  buildStandaloneHtml,
  buildStyledComponents,
  buildSvelte,
  buildVue,
  effectClassNames,
  pascalCase,
} from './frameworks'
import { cssToTailwind } from './tailwind'
import { formatHtml } from './html-parse'

export type FrameworkId =
  | 'html'
  | 'css'
  | 'react'
  | 'vue'
  | 'svelte'
  | 'styled-components'
  | 'tailwind'

export interface FrameworkMeta {
  id: FrameworkId
  /** Menu label. */
  label: string
  /** One line, shown as a tooltip / in `hoverlab add --help`. */
  description: string
  /** Default file extension for the primary file. */
  extension: string
  /** Highlighting hint for the code viewer. */
  language: string
}

export const FRAMEWORKS: readonly FrameworkMeta[] = [
  {
    id: 'html',
    label: 'HTML',
    description: 'Standalone HTML document with the CSS inlined',
    extension: 'html',
    language: 'html',
  },
  {
    id: 'css',
    label: 'CSS',
    description: 'Just the stylesheet, plus the markup it expects',
    extension: 'css',
    language: 'css',
  },
  {
    id: 'react',
    label: 'React',
    description: 'Self-contained function component (works as .jsx or .tsx)',
    extension: 'tsx',
    language: 'tsx',
  },
  {
    id: 'vue',
    label: 'Vue',
    description: 'Single-file component with scoped styles',
    extension: 'vue',
    language: 'vue',
  },
  {
    id: 'svelte',
    label: 'Svelte',
    description: 'Svelte component with scoped styles',
    extension: 'svelte',
    language: 'svelte',
  },
  {
    id: 'styled-components',
    label: 'styled-components',
    description: 'Styled component with hoisted keyframes and an & -scoped root',
    extension: 'tsx',
    language: 'tsx',
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    description: 'Markup rewritten as Tailwind utility classes',
    extension: 'html',
    language: 'html',
  },
] as const

/**
 * Export targets a free account can reach on the website.
 *
 * The split is the one the pricing page names, and it is drawn where it is
 * for a reason. HTML and CSS are what the effect *is* — withholding them
 * would be withholding the artifact, which this catalog does not do. React
 * is free because it is the majority stack: gating it would make the free
 * tier read as crippled to most visitors, and the free tier is the SEO
 * funnel the whole business sits on.
 *
 * What Pro buys is the long tail — Vue, Svelte, styled-components,
 * Tailwind. Each is a real translation of the same source, and each is work
 * someone would otherwise do by hand.
 *
 * Be honest about what this gate is: the CSS is public, the conversion runs
 * in the browser, and `/api/v1` plus the CLI stay open on purpose (see
 * `lib/api/public.ts`). A determined user can reach these anyway. That is
 * true of every product in this market and it is not what the licence
 * protects — the licence is the enforceable thing, and it is sold on
 * /license. This gate is the product boundary the pricing page describes;
 * it is not, and cannot be, a lock.
 */
export const FREE_FRAMEWORK_IDS: readonly FrameworkId[] = ['html', 'css', 'react']

const FREE_FRAMEWORK_SET = new Set<string>(FREE_FRAMEWORK_IDS)

/** True when this target is one of the Pro-only export formats. */
export function isProFramework(id: FrameworkId): boolean {
  return !FREE_FRAMEWORK_SET.has(id)
}

/**
 * Narrow a target to one the given entitlement can actually use.
 *
 * Callers pass what the user picked; this returns what they may have. A
 * stored preference for Vue that outlives a refund would otherwise render a
 * Pro export to a free account forever.
 */
export function frameworkForPlan(
  id: FrameworkId,
  canUseProFeatures: boolean,
): FrameworkId {
  return canUseProFeatures || !isProFramework(id) ? id : 'css'
}

const FRAMEWORK_IDS = new Set<string>(FRAMEWORKS.map((f) => f.id))

export function isFrameworkId(value: string): value is FrameworkId {
  return FRAMEWORK_IDS.has(value)
}

export function frameworkMeta(id: FrameworkId): FrameworkMeta {
  return FRAMEWORKS.find((f) => f.id === id) ?? FRAMEWORKS[0]
}

export interface ExportFile {
  /** Path relative to the effect's own folder, e.g. `BtnGradient.tsx`. */
  path: string
  language: string
  code: string
}

export interface EffectExport {
  framework: FrameworkId
  label: string
  files: ExportFile[]
  /** Caveats worth reading before pasting. Never empty for lossy targets. */
  notes: string[]
  /**
   * All files joined into one string, with banner comments when there is
   * more than one. This is what the clipboard gets.
   */
  clipboard: string
}

export interface ExportInput {
  id: string
  name?: string
  description?: string
  category?: string
  html: string
  css: string
}

/** Comment syntax differs per file type; banners must not break the file. */
function banner(path: string, language: string): string {
  if (language === 'html' || language === 'vue' || language === 'svelte') {
    return `<!-- ${path} -->`
  }
  if (language === 'css') return `/* ${path} */`
  return `// ${path}`
}

function toClipboard(files: ExportFile[]): string {
  if (files.length === 1) return files[0].code
  return files
    .map((f) => `${banner(f.path, f.language)}\n${f.code.trim()}`)
    .join('\n\n')
}

export function exportEffect(
  input: ExportInput,
  framework: FrameworkId,
): EffectExport {
  const meta = frameworkMeta(framework)
  const normalized: FrameworkInput = {
    id: input.id,
    name: input.name ?? input.id,
    description: input.description ?? '',
    html: input.html,
    css: input.css,
  }
  const componentName = pascalCase(input.id)

  let files: ExportFile[]
  let notes: string[] = []

  switch (framework) {
    case 'html': {
      files = [
        {
          path: `${input.id}.html`,
          language: 'html',
          code: buildStandaloneHtml(normalized),
        },
      ]
      break
    }

    case 'css': {
      files = [
        {
          path: `${input.id}.css`,
          language: 'css',
          code: normalized.css.trim() + '\n',
        },
        {
          path: `${input.id}.html`,
          language: 'html',
          code: formatHtml(normalized.html) + '\n',
        },
      ]
      notes = ['Link the stylesheet, then paste the markup wherever you need it.']
      break
    }

    case 'react': {
      const built = buildReact(normalized)
      files = [{ path: `${componentName}.tsx`, language: 'tsx', code: built.code }]
      notes = built.notes
      break
    }

    case 'vue': {
      const built = buildVue(normalized)
      files = [{ path: `${componentName}.vue`, language: 'vue', code: built.code }]
      notes = built.notes
      break
    }

    case 'svelte': {
      const built = buildSvelte(normalized)
      files = [{ path: `${componentName}.svelte`, language: 'svelte', code: built.code }]
      notes = built.notes
      break
    }

    case 'styled-components': {
      const built = buildStyledComponents(normalized)
      files = [{ path: `${componentName}.tsx`, language: 'tsx', code: built.code }]
      notes = built.notes
      break
    }

    case 'tailwind': {
      const built = cssToTailwind(normalized.html, normalized.css, {
        effectId: input.id,
      })
      files = [
        {
          path: `${input.id}.html`,
          language: 'html',
          code: built.markup + '\n',
        },
      ]
      if (built.css) {
        files.push({
          path: `${input.id}.css`,
          language: 'css',
          code: built.css,
        })
      }
      notes = built.notes
      break
    }

    default: {
      // Exhaustiveness guard — a new FrameworkId must handle itself here.
      const never: never = framework
      throw new Error(`Unsupported framework: ${String(never)}`)
    }
  }

  return {
    framework,
    label: meta.label,
    files,
    notes,
    clipboard: toClipboard(files),
  }
}

export { effectClassNames, pascalCase }
export { cssToTailwind } from './tailwind'
export type { TailwindResult } from './tailwind'
export { parseHtml, renderMarkup, formatHtml } from './html-parse'
