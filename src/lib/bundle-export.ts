import { customizeCss, DEFAULT_CUSTOMIZATION } from './customize'
import { exportEffect, frameworkMeta, type FrameworkId } from './export'
import { levelOf, type ArtifactLevel } from './artifact-types'
import type { BundleEntry } from '@/hooks/use-bundle'
import type { Effect } from './effects'

/**
 * Resolve the *effect* entries of a bundle against the effect catalog,
 * attaching the customized CSS for each. Effects that no longer exist are
 * dropped.
 *
 * Entries from the upper tiers are skipped here rather than dropped: a
 * block has no `css` to customize and nothing an HTML or CSS export could
 * meaningfully contain. They are carried by `resolveArtifacts` instead, and
 * only the zip builder — the one format that can hold a file tree — takes
 * both.
 *
 * `entry.opts` is absent for anything the user never customized as well as
 * for everything above `effect`, so the default is applied here rather than
 * at the call site.
 */
function resolveBundle(entries: BundleEntry[], effects: Effect[]) {
  return entries
    .filter((entry) => levelOf(entry) === 'effect')
    .map((entry) => {
      const effect = effects.find((e) => e.id === entry.id)
      if (!effect) return null
      const customizedCss = customizeCss(effect.css, entry.opts ?? DEFAULT_CUSTOMIZATION)
      return { entry, effect, customizedCss }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}

/** A block, page or template in the bundle, with its source files. */
export interface ResolvedArtifact {
  id: string
  name: string
  level: ArtifactLevel
  files: Array<{ path: string; source: string }>
  deps: string[]
}

/**
 * Sanitize an effect ID into a safe filename component. Effect IDs are
 * already slug-like (e.g. "btn-gradient", "card-hover-lift"), but we
 * strip anything that isn't [a-z0-9-] just to be safe for the filesystem.
 */
function safeFileName(id: string): string {
  return id.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').toLowerCase()
}

/**
 * Sanitize a generated file name for the archive.
 *
 * Unlike `safeFileName` (which normalizes an effect *id* into a slug),
 * this preserves case and the extension: the framework exporters emit
 * `BtnGradient.tsx` and `BtnGradient.vue`, and lowercasing those would
 * break the import statements in the generated code. Path separators are
 * stripped so a file can never escape the `effects/` folder.
 */
function safeArchivePath(name: string): string {
  const base = name.replace(/\\/g, '/').split('/').pop() ?? name
  return base.replace(/[^A-Za-z0-9._-]/g, '-') || 'effect.txt'
}

/**
 * Build a single self-contained HTML file containing all bundled effects.
 *
 * The output is a standalone .html file: open it in any browser and the
 * effects render with their customized CSS applied. Each effect is
 * shown in its own labeled card. The user can also "View Source" to
 * copy the CSS for any individual effect.
 *
 * Effects that don't exist in the catalog anymore (e.g. user added to
 * bundle, then the catalog changed) are silently skipped.
 */
export function buildBundleHtml(
  entries: BundleEntry[],
  effects: Effect[],
): string {
  // Was an inline copy of `resolveBundle`, which is exactly the drift that
  // helper exists to prevent — it had to be found and fixed twice when
  // entries stopped being effect-only.
  const resolved = resolveBundle(entries, effects)

  const cssBlocks = resolved
    .map(({ effect, customizedCss }) =>
      [
        `/* ============================================================`,
        `   ${effect.name} (${effect.id})`,
        `   Category: ${effect.category}`,
        `   ${effect.description}`,
        `   ========================================================== */`,
        customizedCss.trim(),
      ].join('\n'),
    )
    .join('\n\n')

  const cards = resolved
    .map(({ effect, entry }) => {
      const opts = entry.opts ?? DEFAULT_CUSTOMIZATION
      const optsSummary = [
        opts.hue !== 0 ? `hue: ${opts.hue}°` : null,
        opts.saturation !== 0 ? `sat: ${opts.saturation}%` : null,
        opts.scale !== 1 ? `size: ${opts.scale}×` : null,
        opts.speed !== 1 ? `speed: ${opts.speed}×` : null,
      ]
        .filter(Boolean)
        .join(' · ')

      return `
    <article class="cssfx-card">
      <header>
        <h2>${escapeHtml(effect.name)}</h2>
        <span class="cssfx-cat">${escapeHtml(effect.category)}</span>
        ${optsSummary ? `<span class="cssfx-opts">${escapeHtml(optsSummary)}</span>` : ''}
      </header>
      <div class="cssfx-preview${effect.darkSurface ? ' cssfx-dark' : ''}">
        ${effect.html}
      </div>
      <details>
        <summary>View CSS</summary>
        <pre><code>${escapeHtml(resolved.find(r => r.effect.id === effect.id)!.customizedCss)}</code></pre>
      </details>
    </article>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hoverlab Bundle — ${resolved.length} effect${resolved.length === 1 ? '' : 's'}</title>
  <style>
    /* Page chrome */
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
    }
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    .cssfx-meta { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
    .cssfx-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .cssfx-card header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .cssfx-card h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .cssfx-cat {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
      background: #f1f5f9;
      color: #475569;
    }
    .cssfx-opts {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.7rem;
      color: #6366f1;
    }
    .cssfx-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 160px;
      padding: 1.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .cssfx-preview.cssfx-dark { background: #020617; }
    details { margin-top: 0.75rem; }
    summary {
      cursor: pointer;
      font-size: 0.8rem;
      color: #64748b;
      user-select: none;
    }
    summary:hover { color: #0f172a; }
    details[open] summary { margin-bottom: 0.5rem; }
    pre {
      margin: 0;
      padding: 0.75rem;
      background: #0b1020;
      color: #e2e8f0;
      border-radius: 0.375rem;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.75rem;
      line-height: 1.5;
    }
    code { font-family: inherit; }

    /* All the bundled effects' CSS rules go here */
    ${cssBlocks}
  </style>
</head>
<body>
  <h1>Hoverlab Bundle</h1>
  <p class="cssfx-meta">
    ${resolved.length} effect${resolved.length === 1 ? '' : 's'} ·
    generated ${new Date().toISOString().slice(0, 10)} ·
    self-contained — open in any browser.
  </p>
${cards}
</body>
</html>
`
}

/**
 * Build a single CSS file containing all bundled effects' CSS,
 * concatenated with header comments. Useful for users who already
 * have their own HTML and just want the stylesheets.
 */
export function buildBundleCss(
  entries: BundleEntry[],
  effects: Effect[],
): string {
  // Third copy of the same resolution, now also shared.
  const resolved = resolveBundle(entries, effects)

  if (resolved.length === 0) return '/* Hoverlab bundle is empty */'

  return resolved
    .map(({ effect, entry, customizedCss }) => {
      const opts = entry.opts ?? DEFAULT_CUSTOMIZATION
      const optsLine = [
        opts.hue !== 0 ? `hue=${opts.hue}` : null,
        opts.saturation !== 0 ? `sat=${opts.saturation}` : null,
        opts.scale !== 1 ? `scale=${opts.scale}` : null,
        opts.speed !== 1 ? `speed=${opts.speed}` : null,
      ]
        .filter(Boolean)
        .join(', ')

      return [
        `/* ============================================================`,
        `   ${effect.name} (${effect.id})`,
        `   Category: ${effect.category}`,
        optsLine ? `   Customized: ${optsLine}` : null,
        `   ========================================================== */`,
        customizedCss.trim(),
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}

/** Trigger a browser download for a text file with the given filename. */
export function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  downloadBlob(filename, blob)
}

/** Trigger a browser download for an arbitrary Blob. */
export function downloadBlob(filename: string, blob: Blob) {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke after a short delay so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ============================================================
 *  ZIP bundle export
 * ==========================================================
 *
 *  Produces a structured .zip archive the user can hand off to a
 *  teammate or drop into a project. Structure:
 *
 *    hoverlab-bundle/
 *    ├── index.html          ← demo page rendering every effect
 *    ├── styles.css          ← all CSS concatenated (one big file)
 *    ├── README.md           ← how to use, what's included
 *    └── effects/
 *        ├── <slug>.html     ← per-effect markup
 *        └── <slug>.css      ← per-effect customized CSS
 *
 *  Per-effect files are useful when the user wants to grab just one
 *  effect's source without scrolling through a giant concatenated
 *  file. The index.html links each effect to its own files via
 *  <link rel="stylesheet">, so the demo page is also a working
 *  reference implementation.
 */

/**
 * Build a ZIP archive of the bundle as a Blob. Returns null if the
 * bundle is empty (caller should toast an error in that case).
 *
 * Uses dynamic import of jszip so the (somewhat large) library is
 * only loaded when the user actually clicks "Download ZIP" — not on
 * every page that imports bundle-export.ts.
 */
export async function buildBundleZip(
  entries: BundleEntry[],
  effects: Effect[],
  framework: FrameworkId = 'css',
  artifacts: ResolvedArtifact[] = [],
): Promise<Blob | null> {
  const resolved = resolveBundle(entries, effects)
  // A bundle of nothing but blocks is a real bundle — the emptiness test
  // has to consider both halves, or "download" silently does nothing for
  // anyone who never added an effect.
  if (resolved.length === 0 && artifacts.length === 0) return null

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const root = zip.folder('hoverlab-bundle')!

  /* Per-effect sources, generated for the chosen framework. With the
   * default 'css' target this produces the same effects/<slug>.html +
   * effects/<slug>.css pair the ZIP has always contained; with 'vue' it
   * produces one SFC per effect, and so on. */
  const notes = new Set<string>()

  /* Blocks, pages and templates keep their own authored file paths under a
   * folder per level. Unlike effects there is nothing to generate: the
   * source in the catalog is already the deliverable, and rewriting it for
   * a "framework" would be wrong — these are React files, and the framework
   * picker only ever described the effect exporter. */
  for (const artifact of artifacts) {
    const dir = root.folder(`${artifact.level}s`)!.folder(safeFileName(artifact.id))!
    for (const file of artifact.files) {
      dir.file(safeArchivePath(file.path), file.source.trimEnd() + '\n')
    }
    if (artifact.deps.length > 0) {
      notes.add(`${artifact.name} needs: ${artifact.deps.join(', ')}`)
    }
  }

  const effectsDir = root.folder('effects')!
  for (const { effect, customizedCss } of resolved) {
    const generated = exportEffect(
      {
        id: effect.id,
        name: effect.name,
        description: effect.description,
        category: effect.category,
        html: effect.html,
        css: customizedCss,
      },
      framework,
    )
    for (const file of generated.files) {
      effectsDir.file(safeArchivePath(file.path), file.code.trimEnd() + '\n')
    }
    for (const note of generated.notes) notes.add(note)
  }

  /* Concatenated styles.css at the root — still useful as a single drop-in
   * regardless of the per-effect format. */
  root.file('styles.css', buildBundleCss(entries, effects) + '\n')

  /* Demo index.html. For the CSS target it links each effect's stylesheet,
   * which doubles as a reference for how the files relate. Other targets
   * have no such stylesheet to link, so the demo inlines everything
   * instead of emitting <link> tags that would 404. */
  root.file(
    'index.html',
    framework === 'css'
      ? buildZipIndexHtml(resolved)
      : buildBundleHtml(entries, effects),
  )

  /* README.md */
  root.file('README.md', buildZipReadme(resolved, framework, [...notes]))

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

/**
 * Build the demo index.html for the ZIP. Unlike buildBundleHtml (which
 * inlines everything into one file), this version links to per-effect
 * CSS files via <link rel="stylesheet">, so the user can see exactly
 * how the files relate.
 */
function buildZipIndexHtml(
  resolved: ReturnType<typeof resolveBundle>,
): string {
  const links = resolved
    .map(
      ({ effect }) =>
        `  <link rel="stylesheet" href="effects/${safeFileName(effect.id)}.css" />`,
    )
    .join('\n')

  const cards = resolved
    .map(({ effect, entry }) => {
      const opts = entry.opts ?? DEFAULT_CUSTOMIZATION
      const optsSummary = [
        opts.hue !== 0 ? `hue: ${opts.hue}°` : null,
        opts.saturation !== 0 ? `sat: ${opts.saturation}%` : null,
        opts.scale !== 1 ? `size: ${opts.scale}×` : null,
        opts.speed !== 1 ? `speed: ${opts.speed}×` : null,
      ]
        .filter(Boolean)
        .join(' · ')

      return `
    <article class="hl-card">
      <header>
        <h2>${escapeHtml(effect.name)}</h2>
        <span class="hl-cat">${escapeHtml(effect.category)}</span>
        ${optsSummary ? `<span class="hl-opts">${escapeHtml(optsSummary)}</span>` : ''}
        <a class="hl-link" href="effects/${safeFileName(effect.id)}.css" target="_blank" rel="noopener">view css →</a>
      </header>
      <div class="hl-preview${effect.darkSurface ? ' hl-dark' : ''}">
        ${effect.html}
      </div>
    </article>`
    })
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hoverlab Bundle — ${resolved.length} effect${resolved.length === 1 ? '' : 's'}</title>
${links}
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc; color: #0f172a; line-height: 1.5;
    }
    h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    .hl-meta { color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
    .hl-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem;
      padding: 1.25rem; margin-bottom: 1.25rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }
    .hl-card header {
      display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem;
    }
    .hl-card h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .hl-cat {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.7rem;
      text-transform: uppercase; letter-spacing: 0.05em;
      padding: 0.1rem 0.4rem; border-radius: 0.25rem; background: #f1f5f9; color: #475569;
    }
    .hl-opts { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.7rem; color: #6366f1; }
    .hl-link { margin-left: auto; font-size: 0.75rem; color: #6366f1; text-decoration: none; }
    .hl-link:hover { text-decoration: underline; }
    .hl-preview {
      display: flex; align-items: center; justify-content: center;
      min-height: 160px; padding: 1.5rem;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden;
    }
    .hl-preview.hl-dark { background: #020617; }
  </style>
</head>
<body>
  <h1>Hoverlab Bundle</h1>
  <p class="hl-meta">
    ${resolved.length} effect${resolved.length === 1 ? '' : 's'} ·
    generated ${new Date().toISOString().slice(0, 10)} ·
    each effect's CSS lives in <code>effects/&lt;slug&gt;.css</code>.
  </p>
${cards}
</body>
</html>
`
}

/**
 * Build a README.md explaining the ZIP's structure and how to use it.
 */
function buildZipReadme(
  resolved: ReturnType<typeof resolveBundle>,
  framework: FrameworkId = 'css',
  notes: string[] = [],
): string {
  const meta = frameworkMeta(framework)
  const lines: string[] = []
  lines.push('# Hoverlab Bundle', '')
  lines.push(
    `Generated ${new Date().toISOString().slice(0, 10)} · ${resolved.length} effect${resolved.length === 1 ? '' : 's'} · ${meta.label}.`,
  )
  lines.push('')
  lines.push('## Structure', '')
  lines.push('```')
  lines.push('hoverlab-bundle/')
  lines.push('├── index.html          # demo page rendering every effect')
  lines.push('├── styles.css          # all CSS concatenated into one file')
  lines.push('├── README.md           # this file')
  lines.push('└── effects/            # one or more files per effect')
  lines.push('```', '')
  lines.push('## Usage', '')
  lines.push(
    '- **Quick preview:** open `index.html` in any browser. Each effect renders with its customized CSS applied.',
  )
  if (framework === 'css') {
    lines.push(
      '- **Copy into your project:** grab the `effects/<slug>.html` markup and the matching `effects/<slug>.css` stylesheet. Link the CSS in your page `<head>` and paste the HTML where you want the effect.',
    )
  } else {
    lines.push(
      `- **Copy into your project:** each effect is a self-contained ${meta.label} file under \`effects/\`. Drop it in and import it.`,
    )
  }
  lines.push(
    "- **One big stylesheet:** if you'd rather have all the CSS in one place, use `styles.css` at the root.",
  )
  lines.push(
    `- **Install straight from the CLI:** \`npx hoverlab add <id>${framework === 'css' ? '' : ` --framework ${framework}`}\` fetches any of these without leaving your editor.`,
  )
  lines.push('')

  if (notes.length) {
    lines.push(`## Notes for the ${meta.label} target`, '')
    for (const note of notes) lines.push(`- ${note}`)
    lines.push('')
  }
  lines.push('## Effects in this bundle', '')
  for (const { effect, entry } of resolved) {
    const opts = entry.opts ?? DEFAULT_CUSTOMIZATION
    const summary = [
      opts.hue !== 0 ? `hue=${opts.hue}°` : null,
      opts.saturation !== 0 ? `sat=${opts.saturation}%` : null,
      opts.scale !== 1 ? `size=${opts.scale}×` : null,
      opts.speed !== 1 ? `speed=${opts.speed}×` : null,
    ]
      .filter(Boolean)
      .join(', ')
    lines.push(
      `- **${effect.name}** (\`${effect.id}\`) — ${effect.category}${summary ? ` · customized: ${summary}` : ''}`,
    )
  }
  lines.push('')
  return lines.join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
