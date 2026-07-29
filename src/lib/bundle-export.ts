import { customizeCss } from './customize'
import type { BundleEntry } from '@/hooks/use-bundle'
import type { Effect } from './effects'

/**
 * Resolve bundle entries against the effect catalog, attaching the
 * customized CSS for each. Effects that no longer exist are dropped.
 *
 * Shared by all the export builders below so they all see the same
 * resolved list.
 */
function resolveBundle(entries: BundleEntry[], effects: Effect[]) {
  return entries
    .map((entry) => {
      const effect = effects.find((e) => e.id === entry.effectId)
      if (!effect) return null
      const customizedCss = customizeCss(effect.css, entry.opts)
      return { entry, effect, customizedCss }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
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
  const resolved = entries
    .map((entry) => {
      const effect = effects.find((e) => e.id === entry.effectId)
      if (!effect) return null
      const customizedCss = customizeCss(effect.css, entry.opts)
      return { entry, effect, customizedCss }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

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
      const optsSummary = [
        entry.opts.hue !== 0 ? `hue: ${entry.opts.hue}°` : null,
        entry.opts.saturation !== 0 ? `sat: ${entry.opts.saturation}%` : null,
        entry.opts.scale !== 1 ? `size: ${entry.opts.scale}×` : null,
        entry.opts.speed !== 1 ? `speed: ${entry.opts.speed}×` : null,
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
  const resolved = entries
    .map((entry) => {
      const effect = effects.find((e) => e.id === entry.effectId)
      if (!effect) return null
      const customizedCss = customizeCss(effect.css, entry.opts)
      return { entry, effect, customizedCss }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (resolved.length === 0) return '/* Hoverlab bundle is empty */'

  return resolved
    .map(({ effect, entry, customizedCss }) => {
      const optsLine = [
        entry.opts.hue !== 0 ? `hue=${entry.opts.hue}` : null,
        entry.opts.saturation !== 0 ? `sat=${entry.opts.saturation}` : null,
        entry.opts.scale !== 1 ? `scale=${entry.opts.scale}` : null,
        entry.opts.speed !== 1 ? `speed=${entry.opts.speed}` : null,
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
): Promise<Blob | null> {
  const resolved = resolveBundle(entries, effects)
  if (resolved.length === 0) return null

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const root = zip.folder('hoverlab-bundle')!

  /* Per-effect files: effects/<slug>.html + effects/<slug>.css */
  const effectsDir = root.folder('effects')!
  for (const { effect, customizedCss } of resolved) {
    const slug = safeFileName(effect.id)
    effectsDir.file(`${slug}.html`, effect.html.trim() + '\n')
    effectsDir.file(`${slug}.css`, customizedCss.trim() + '\n')
  }

  /* Concatenated styles.css at the root */
  root.file('styles.css', buildBundleCss(entries, effects) + '\n')

  /* Demo index.html — links each effect's CSS, renders each effect's HTML */
  root.file('index.html', buildZipIndexHtml(resolved))

  /* README.md */
  root.file(
    'README.md',
    buildZipReadme(resolved),
  )

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
      const optsSummary = [
        entry.opts.hue !== 0 ? `hue: ${entry.opts.hue}°` : null,
        entry.opts.saturation !== 0 ? `sat: ${entry.opts.saturation}%` : null,
        entry.opts.scale !== 1 ? `size: ${entry.opts.scale}×` : null,
        entry.opts.speed !== 1 ? `speed: ${entry.opts.speed}×` : null,
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
function buildZipReadme(resolved: ReturnType<typeof resolveBundle>): string {
  const lines: string[] = []
  lines.push('# Hoverlab Bundle', '')
  lines.push(
    `Generated ${new Date().toISOString().slice(0, 10)} · ${resolved.length} effect${resolved.length === 1 ? '' : 's'}.`,
  )
  lines.push('')
  lines.push('## Structure', '')
  lines.push('```')
  lines.push('hoverlab-bundle/')
  lines.push('├── index.html          # demo page rendering every effect')
  lines.push('├── styles.css          # all CSS concatenated into one file')
  lines.push('├── README.md           # this file')
  lines.push('└── effects/')
  for (const { effect } of resolved) {
    const slug = safeFileName(effect.id)
    lines.push(`    ├── ${slug}.html     # ${effect.name} (${effect.category})`)
    lines.push(`    └── ${slug}.css`)
  }
  lines.push('```', '')
  lines.push('## Usage', '')
  lines.push(
    '- **Quick preview:** open `index.html` in any browser. Each effect renders with its customized CSS applied.',
  )
  lines.push(
    '- **Copy into your project:** grab the `effects/<slug>.html` markup and the matching `effects/<slug>.css` stylesheet. Link the CSS in your page `<head>` and paste the HTML where you want the effect.',
  )
  lines.push(
    "- **One big stylesheet:** if you'd rather have all the CSS in one place, use `styles.css` at the root.",
  )
  lines.push('')
  lines.push('## Effects in this bundle', '')
  for (const { effect, entry } of resolved) {
    const opts = [
      entry.opts.hue !== 0 ? `hue=${entry.opts.hue}°` : null,
      entry.opts.saturation !== 0 ? `sat=${entry.opts.saturation}%` : null,
      entry.opts.scale !== 1 ? `size=${entry.opts.scale}×` : null,
      entry.opts.speed !== 1 ? `speed=${entry.opts.speed}×` : null,
    ]
      .filter(Boolean)
      .join(', ')
    lines.push(
      `- **${effect.name}** (\`${effect.id}\`) — ${effect.category}${opts ? ` · customized: ${opts}` : ''}`,
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
