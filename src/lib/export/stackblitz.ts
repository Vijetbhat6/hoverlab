/**
 * "Open in StackBlitz" — a running project, not a snippet.
 *
 * WHY THIS EXISTS ALONGSIDE `sandbox.ts`. CodePen and JSFiddle take HTML and
 * CSS and nothing else, which is exactly right for an effect: an effect *is*
 * a rule set, and a pen opens in under a second. It is exactly wrong for a
 * block. A block is a React component with imports, props and a Tailwind
 * theme behind it, and there was no way to run one anywhere but a reader's
 * own repo — the tier we most want people to evaluate was the one tier with
 * no scratch environment at all.
 *
 * StackBlitz runs npm and Vite in the browser, so a block can be handed over
 * as the project it actually is: the source file verbatim, the token layer
 * the catalog styles against, and a package.json pinned to the versions this
 * repo builds with. What opens is what would happen in the reader's app.
 *
 * WHY NOT CODESANDBOX TOO. Its define API takes `parameters` as an
 * lz-string-compressed blob, and lz-string is not a dependency here. Adding
 * a compression library — or hand-rolling one — to reach a second sandbox
 * that does the same job as the first is a poor trade, so this ships one
 * React target rather than two. Revisit if lz-string arrives for another
 * reason.
 *
 * THE PAYLOAD IS A FORM, not a URL, for the same reason its neighbours are:
 * a project's worth of files is far past what a query string can carry.
 * Callers render the descriptor as a hidden <form> and submit it.
 *
 * Isomorphic and dependency-free.
 */

import type { SandboxForm } from '@/lib/sandbox'
import tokens from '@/lib/registry/generated-tokens.json'
import themeMap from '@/lib/export/generated-theme-map.json'

/* ------------------------------------------------------------------ *
 *  Versions
 * ------------------------------------------------------------------ */

/**
 * Pinned to what this repo builds with, and held to it by
 * `stackblitz.test.ts`.
 *
 * A sandbox on different majors is not a demo of this catalog — React 18
 * would reject the blocks that use `use`, and Tailwind 3 does not
 * understand `@theme inline` at all, which would silently drop every colour
 * in the project. The test compares these against package.json so the pair
 * cannot drift the next time the app upgrades.
 */
export const SANDBOX_DEPENDENCIES: Readonly<Record<string, string>> = {
  react: '^19.0.0',
  'react-dom': '^19.0.0',
  'lucide-react': '^0.525.0',
  'tw-animate-css': '^1.3.5',
}

export const SANDBOX_DEV_DEPENDENCIES: Readonly<Record<string, string>> = {
  '@tailwindcss/vite': '^4.0.0',
  '@types/react': '^19.0.0',
  '@types/react-dom': '^19.0.0',
  '@vitejs/plugin-react': '^5.0.0',
  tailwindcss: '^4.0.0',
  typescript: '^5.0.0',
  vite: '^7.0.0',
}

/* ------------------------------------------------------------------ *
 *  The theme layer
 * ------------------------------------------------------------------ */

/**
 * Fallbacks for the two font variables next/font injects.
 *
 * `@theme inline` maps `--font-sans` to `--font-geist-sans`, which this app
 * defines on <html> at runtime and a plain Vite project never defines at
 * all. An unresolved `var()` there makes `font-sans` generate nothing, so
 * every block would open in the browser's default serif — the single most
 * visible way a sandbox can misrepresent the thing it is demonstrating.
 *
 * Defined as real stacks rather than by editing the extracted map, so the
 * map stays a verbatim copy of globals.css.
 */
const FONT_FALLBACKS = [
  `  --font-geist-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;`,
  `  --font-jetbrains-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;`,
].join('\n')

function declarations(map: Record<string, string>, indent = '  '): string {
  return Object.entries(map)
    .map(([name, value]) => `${indent}--${name}: ${value};`)
    .join('\n')
}

/**
 * The catalog's token layer as one stylesheet.
 *
 * Three parts, and all three are load-bearing. The `@theme inline` map is
 * what turns `--primary` into the class `bg-primary`; without it Tailwind
 * emits no rule and the block renders with fallback colours — invisible
 * rather than wrong, which is the failure mode this codebase has already
 * shipped once. `:root` and `.dark` are the values. The import of
 * `tw-animate-css` is what makes `animate-in` mean something.
 */
export function sandboxThemeCss(): string {
  return `/**
 * Hoverlab design tokens.
 *
 * Extracted from the same globals.css the catalog itself is styled with, so
 * what renders here is what renders on the site. Drop this into your own
 * project and every Hoverlab block styles itself through these names.
 */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
${declarations(themeMap as Record<string, string>)}
}

:root {
${FONT_FALLBACKS}
${declarations(tokens.light as Record<string, string>)}
}

.dark {
${declarations(tokens.dark as Record<string, string>)}
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans);
  -webkit-font-smoothing: antialiased;
}
`
}

/* ------------------------------------------------------------------ *
 *  Project assembly
 * ------------------------------------------------------------------ */

export interface SandboxFile {
  /** Path relative to the project's `src/`, e.g. `components/hero-split.tsx`. */
  path: string
  source: string
}

export interface ReactSandboxInput {
  /** Catalog id — the project name and the download filename. */
  id: string
  name: string
  description: string
  /** Every file the artifact ships, in catalog order. */
  files: SandboxFile[]
  /**
   * The component to render, e.g. `HeroSplit`. Derived by the caller from
   * the source rather than guessed here — see `exportedComponent()`.
   */
  componentName: string
  /**
   * Whether the entry file exports that component as `default`.
   *
   * Blocks are named exports and pages are default ones — a page is a route
   * in the template it came from, and Next requires the default. Getting
   * this wrong produces `undefined is not a component` at runtime, not a
   * compile error, so it travels with the name rather than being inferred
   * downstream.
   */
  entryIsDefault?: boolean
  /** Module specifier for the entry component, relative to `src/`. */
  entryPath: string
  /** Canonical page for the artifact, credited in the README. */
  sourceUrl?: string
  /** Open the sandbox in dark mode. Defaults to the site's dark preview. */
  dark?: boolean
}

export interface ExportedComponent {
  name: string
  /** `export default function …` rather than `export function …`. */
  isDefault: boolean
}

/**
 * The exported component of an artifact source.
 *
 * Every artifact exports exactly one component and the registry pairs them
 * by convention, but neither the name nor the export kind is recorded
 * anywhere machine-readable, so both are read back out of the source.
 * Returns null rather than guessing from the filename: a wrong name
 * produces a project that fails to compile, which is a worse outcome than
 * not offering the button at all.
 */
export function exportedComponent(source: string): ExportedComponent | null {
  const byDefault = /^export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/m.exec(source)
  if (byDefault) return { name: byDefault[1], isDefault: true }

  const fn = /^export\s+function\s+([A-Z][A-Za-z0-9_]*)/m.exec(source)
  if (fn) return { name: fn[1], isDefault: false }

  const decl = /^export\s+(?:const|class)\s+([A-Z][A-Za-z0-9_]*)/m.exec(source)
  return decl ? { name: decl[1], isDefault: false } : null
}

function packageJson(input: ReactSandboxInput): string {
  return `${JSON.stringify(
    {
      name: `hoverlab-${input.id}`,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        preview: 'vite preview',
      },
      dependencies: SANDBOX_DEPENDENCIES,
      devDependencies: SANDBOX_DEV_DEPENDENCIES,
    },
    null,
    2,
  )}\n`
}

/**
 * `@` resolves to `src/`, matching the alias the catalog's own sources use.
 *
 * Most blocks import nothing but `react` and `lucide-react`, but pages
 * compose blocks through `@/components/…`, and an alias that only some of
 * the catalog needs is cheaper to always ship than to conditionally derive.
 */
const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
`

const TSCONFIG = `${JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      allowImportingTsExtensions: true,
      baseUrl: '.',
      paths: { '@/*': ['./src/*'] },
    },
    include: ['src'],
  },
  null,
  2,
)}\n`

function indexHtml(name: string): string {
  const title = name.replace(/[<>&]/g, '')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Hoverlab</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
}

const MAIN_TSX = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

/**
 * The wrapper, and the one piece of this project that is not the catalog's
 * own code.
 *
 * It exists to do one thing the block cannot do for itself: offer the theme
 * toggle. Every block in the catalog is built to render in light and dark,
 * that is a claim the site makes on the pricing page, and a sandbox that
 * opened in one mode with no way to see the other would quietly drop the
 * half of the work that is hardest to verify by reading source.
 */
function appTsx(input: ReactSandboxInput): string {
  const dark = input.dark !== false
  const specifier = `./${input.entryPath.replace(/\.tsx$/, '')}`
  const importLine = input.entryIsDefault
    ? `import ${input.componentName} from '${specifier}'`
    : `import { ${input.componentName} } from '${specifier}'`

  return `import { useState } from 'react'

${importLine}

/**
 * A theme switch and the block. Delete this file and import
 * <${input.componentName}> wherever you actually want it — it takes no
 * providers and no context, which is the point of the catalog.
 */
export default function App() {
  const [dark, setDark] = useState(${dark})

  return (
    <div className={dark ? 'dark' : undefined}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {dark ? 'Light' : 'Dark'} theme
          </button>
        </div>
        <${input.componentName} />
      </div>
    </div>
  )
}
`
}

function readme(input: ReactSandboxInput): string {
  const link = input.sourceUrl ? `\n\n${input.sourceUrl}\n` : '\n'
  return `# ${input.name}

${input.description}

From the Hoverlab catalog. \`src/${input.entryPath}\` is the artifact — it is
the same file the site renders and the same file \`npx hoverlab add ${input.id}\`
writes into your repo. \`src/App.tsx\` is scaffolding for this sandbox only.

\`src/styles.css\` carries the design tokens. Blocks style themselves entirely
through those names, so changing a value there restyles everything at once.
${link}`
}

/**
 * Every file of the runnable project, keyed by path.
 *
 * Exported separately from the form so a route, the CLI or a test can build
 * the same project without going near a DOM.
 */
export function reactSandboxFiles(input: ReactSandboxInput): Record<string, string> {
  const files: Record<string, string> = {
    'package.json': packageJson(input),
    'vite.config.ts': VITE_CONFIG,
    'tsconfig.json': TSCONFIG,
    'index.html': indexHtml(input.name),
    'README.md': readme(input),
    'src/main.tsx': MAIN_TSX,
    'src/App.tsx': appTsx(input),
    'src/styles.css': sandboxThemeCss(),
  }

  for (const file of input.files) {
    files[`src/${file.path}`] = file.source
  }

  return files
}

export interface ProjectFormOptions {
  title: string
  description: string
  /** Which file the editor opens on. */
  openFile: string
  sourceUrl?: string
}

/**
 * A StackBlitz form descriptor for an arbitrary file map.
 *
 * `template: 'node'` rather than one of the framework templates: the
 * framework ones pin their own toolchain, and every project built here
 * brings its own package.json precisely so the versions match the
 * catalog's.
 */
export function stackblitzProjectForm(
  files: Record<string, string>,
  options: ProjectFormOptions,
): SandboxForm {
  const fields: Record<string, string> = {
    'project[title]': `${options.title} — Hoverlab`,
    'project[description]': options.sourceUrl
      ? `${options.description}\n\nFrom Hoverlab — ${options.sourceUrl}`
      : options.description,
    'project[template]': 'node',
    'project[tags][]': 'hoverlab',
    'project[settings]': JSON.stringify({
      compile: { trigger: 'auto', clearConsole: false },
    }),
  }

  for (const [path, contents] of Object.entries(files)) {
    fields[`project[files][${path}]`] = contents
  }

  return {
    action: `https://stackblitz.com/run?file=${encodeURIComponent(options.openFile)}`,
    fields,
    label: 'StackBlitz',
  }
}

/** The same, for an artifact that needs the Vite + Tailwind scaffold built. */
export function stackblitzReactForm(input: ReactSandboxInput): SandboxForm {
  return stackblitzProjectForm(reactSandboxFiles(input), {
    title: input.name,
    description: input.description,
    openFile: `src/${input.entryPath}`,
    sourceUrl: input.sourceUrl,
  })
}

/* ------------------------------------------------------------------ *
 *  The CSS case
 * ------------------------------------------------------------------ */

export interface HtmlSandboxInput {
  name: string
  description: string
  html: string
  css: string
  sourceUrl?: string
}

/**
 * The plain-HTML variant, for effects.
 *
 * CodePen remains the first button on an effect — it is faster and it is
 * where CSS people already live. This is here for the reader who wants the
 * snippet in a file tree they can add to, rather than in three panes.
 */
export function stackblitzHtmlForm(input: HtmlSandboxInput): SandboxForm {
  const title = input.name.replace(/[<>&]/g, '')
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
${input.html
  .split('\n')
  .map((line) => (line.trim() ? `    ${line}` : line))
  .join('\n')}
  </body>
</html>
`

  return {
    action: 'https://stackblitz.com/run?file=style.css',
    fields: {
      'project[title]': `${input.name} — Hoverlab`,
      'project[description]': input.sourceUrl
        ? `${input.description}\n\nFrom Hoverlab — ${input.sourceUrl}`
        : input.description,
      'project[template]': 'html',
      'project[tags][]': 'hoverlab',
      'project[files][index.html]': html,
      'project[files][style.css]': input.css,
    },
    label: 'StackBlitz',
  }
}
