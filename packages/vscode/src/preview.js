/**
 * Previewing an artifact inside the editor.
 *
 * ── WHY IT IS AN IFRAME AND NOT RE-RENDERED MARKUP ──────────────────────
 *
 * A webview could be handed the block's HTML and a Tailwind CDN script, and
 * it would look approximately right. Approximately is the problem: the
 * catalog's whole argument is that the preview on the site IS the component
 * — the same module whose text ships as the source — and a second rendering
 * path in an editor extension is a copy that drifts, in the one place a
 * developer is deciding whether to trust the thing.
 *
 * So the panel frames `/preview/{level}/{id}`, a route that already exists
 * because the responsive width control on every detail page needs it. It is
 * the real component, the real stylesheet, the real tokens, and it stays
 * correct without anybody maintaining it.
 *
 * Two tiers cannot use it and say so instead of faking it. Effects have no
 * such route — they are html plus css, so the panel builds a document from
 * exactly the two strings the API returns. Templates are projects, not
 * components; there is nothing to render on one screen, so the panel shows
 * what the project contains and offers to scaffold it.
 *
 * ── THE CSP, WHICH IS THE FIDDLY PART ───────────────────────────────────
 *
 * A webview blocks everything by default. Framing a remote origin needs it
 * in `frame-src`, and the origin is configurable (`hoverlab.apiUrl` points
 * at a preview deployment or localhost), so the policy is built per panel
 * from the origin actually in play rather than hardcoded. Nothing else is
 * allowed: no remote scripts, no remote styles, and the frame is the only
 * thing that talks to the network.
 *
 * ── WHY THE SOURCE IS A REAL EDITOR DOCUMENT ────────────────────────────
 *
 * "Copy source" opens an untitled document in the right language rather
 * than printing into the webview. The reader already has the best source
 * viewer available — theirs, with their theme, their font and their
 * keybindings — and a webview pretending to be one would be worse at it in
 * every respect.
 */

const vscode = require('vscode')

const catalog = require('./catalog')

/** One panel, reused. A catalog is browsed; twelve panels is a mess. */
let panel = null

/** What the open panel is showing, so a repeat click is not a refetch. */
let showing = null

async function showPreview(level, entry, context) {
  const origin = await catalog.origin()

  if (!panel) {
    panel = vscode.window.createWebviewPanel(
      'hoverlab.preview',
      'Hoverlab',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: false,
        /*
         * Kept alive when hidden. The alternative is re-fetching the
         * artifact and reloading the frame every time the user tabs back,
         * which for a panel whose whole job is "let me look at this while
         * I work" is the wrong trade for a few hundred kilobytes.
         */
        retainContextWhenHidden: true,
        localResourceRoots: [],
      },
    )
    panel.onDidDispose(
      () => {
        panel = null
        showing = null
      },
      null,
      context.subscriptions,
    )
  }

  panel.title = entry.name
  panel.reveal(vscode.ViewColumn.Beside, true)

  const token = `${level}:${entry.id}`
  if (showing === token) return
  showing = token

  panel.webview.html = loadingHtml(entry)

  try {
    if (catalog.FRAMED_LEVELS.has(level)) {
      panel.webview.html = framedHtml(entry, level, origin)
      return
    }

    if (level === 'effect') {
      const data = await catalog.getArtifact(entry.id, { framework: 'css' })
      panel.webview.html = effectHtml(entry, data, origin)
      return
    }

    const data = await catalog.getArtifact(entry.id)
    panel.webview.html = templateHtml(entry, data, origin)
  } catch (error) {
    showing = null
    panel.webview.html = errorHtml(entry, catalog.describeError(error).message)
  }
}

/* ------------------------------------------------------------------ *
 *  Documents
 * ------------------------------------------------------------------ */

/**
 * The chrome every panel shares.
 *
 * Coloured entirely with VS Code's own theme variables, so the panel is in
 * the user's theme rather than in ours. An extension that painted its own
 * light-grey card in a high-contrast dark theme would be the most visible
 * thing in the window and the least readable.
 */
function shell({ csp, head = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
  }
  .bar {
    display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap;
    padding: .6rem .9rem;
    border-bottom: 1px solid var(--vscode-panel-border);
  }
  .bar h1 { margin: 0; font-size: 1rem; font-weight: 600; }
  .bar code, .meta code {
    font-family: var(--vscode-editor-font-family);
    background: var(--vscode-textCodeBlock-background);
    padding: .05rem .3rem; border-radius: 3px;
  }
  .dim { color: var(--vscode-descriptionForeground); }
  .meta { padding: .9rem; line-height: 1.55; }
  iframe { display: block; width: 100%; height: calc(100vh - 3rem); border: 0; background: #fff; }
  .frame-note { padding: .5rem .9rem; }
  pre {
    margin: 0; padding: .9rem; overflow: auto;
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-editor-font-size);
    background: var(--vscode-textCodeBlock-background);
  }
  ul { margin: .4rem 0; padding-left: 1.2rem; }
</style>
${head}
</head>
<body>${body}</body>
</html>`
}

/** The title bar, shared by every state. */
function bar(entry) {
  return `<div class="bar">
  <h1>${escapeHtml(entry.name)}</h1>
  <code>${escapeHtml(entry.id)}</code>
  <span class="dim">${escapeHtml(entry.category || '')}</span>
</div>`
}

function loadingHtml(entry) {
  return shell({
    csp: "default-src 'none'; style-src 'unsafe-inline';",
    body: `${bar(entry)}<p class="meta dim">Loading…</p>`,
  })
}

/**
 * A primitive, block or page: the real thing, in a frame.
 *
 * `frame-src` names the origin in play and nothing else. `sandbox` on the
 * iframe allows scripts, because the blocks are React and an accordion that
 * does not open is not a preview of an accordion — but not
 * `allow-same-origin`, so the framed page cannot reach anything of the
 * editor's, and not `allow-top-navigation`, so a demo link inside a block
 * cannot replace the panel.
 */
function framedHtml(entry, level, origin) {
  const src = `${origin}/preview/${level}/${encodeURIComponent(entry.id)}`
  return shell({
    csp: `default-src 'none'; style-src 'unsafe-inline'; frame-src ${origin};`,
    body: `${bar(entry)}
<iframe src="${escapeHtml(src)}" sandbox="allow-scripts allow-forms allow-popups" title="${escapeHtml(entry.name)}"></iframe>`,
  })
}

/**
 * An effect: the two strings the API returns, in a document.
 *
 * Built here rather than framed because there is no route to frame. The
 * markup and the stylesheet are inlined into one page, which is exactly
 * what the effect is — and `style-src 'unsafe-inline'` is unavoidable for
 * that and is the reason `enableScripts` is off on the panel.
 */
function effectHtml(entry, data, origin) {
  /*
   * The markup goes in unescaped — it has to, it IS the thing being shown —
   * so containment is the panel's, not this function's: `enableScripts` is
   * false, the CSP is `default-src 'none'`, and `localResourceRoots` is
   * empty. Nothing in there can run, fetch, or read a file.
   *
   * The stylesheet is a different matter only because of one sequence: a
   * `</style` inside it would close the element and drop the rest of the
   * effect into the document as text. Neutralised rather than escaped,
   * since escaping a stylesheet would stop it being one.
   */
  const css = String((data && data.css) || '').replace(/<\/style/gi, '<\\/style')
  const html = String((data && data.html) || '')

  if (!css && !html) {
    return errorHtml(entry, 'That effect came back without any markup to show.')
  }

  return shell({
    csp: "default-src 'none'; style-src 'unsafe-inline';",
    head: `<style>
  .stage {
    display: grid; place-items: center; min-height: 45vh; padding: 2rem;
    background: var(--vscode-editor-background);
  }
${indent(css)}
</style>`,
    body: `${bar(entry)}
<div class="stage">${html}</div>
<div class="meta">
  <p class="dim">Install it with <code>npx hoverlab add ${escapeHtml(entry.id)}</code>, or use the sidebar's install action to write it into this project.</p>
  <p class="dim">Effects can be emitted as React, Vue, Svelte, styled-components or plain CSS — set <code>hoverlab.framework</code>, or leave it on <code>auto</code> to follow the project.</p>
  <p class="dim">${escapeHtml(origin)}/effect/${escapeHtml(entry.id)}</p>
</div>`,
  })
}

/** A template: what the project holds, since it cannot be shown on a screen. */
function templateHtml(entry, data, origin) {
  const artifact = (data && data.artifact) || entry
  const routes = Array.isArray(artifact.routes) ? artifact.routes : []
  const files = typeof artifact.fileCount === 'number' ? artifact.fileCount : null

  return shell({
    csp: "default-src 'none'; style-src 'unsafe-inline';",
    body: `${bar(entry)}
<div class="meta">
  <p>${escapeHtml(artifact.description || '')}</p>
  <p class="dim">A template is a whole runnable project, not a component — there is nothing to render on one screen, so here is what it contains.</p>
  ${files ? `<p><strong>${files}</strong> files</p>` : ''}
  ${
    routes.length
      ? `<p><strong>${routes.length}</strong> routes</p><ul>${routes
          .map((route) => `<li><code>${escapeHtml(String(route))}</code></li>`)
          .join('')}</ul>`
      : ''
  }
  <p class="dim">Scaffold it with <code>npx hoverlab init ${escapeHtml(entry.id)}</code>, or use the sidebar's install action to pick a directory.</p>
  <p class="dim">${escapeHtml(origin)}/template/${escapeHtml(entry.id)}</p>
</div>`,
  })
}

function errorHtml(entry, message) {
  return shell({
    csp: "default-src 'none'; style-src 'unsafe-inline';",
    body: `${bar(entry)}<div class="meta"><p>${escapeHtml(message)}</p></div>`,
  })
}

/* ------------------------------------------------------------------ *
 *  Source, in a real editor
 * ------------------------------------------------------------------ */

/** Language ids by file extension, for the untitled document. */
const LANGUAGE = {
  tsx: 'typescriptreact',
  ts: 'typescript',
  jsx: 'javascriptreact',
  js: 'javascript',
  css: 'css',
  html: 'html',
  vue: 'vue',
  svelte: 'svelte',
  json: 'json',
  md: 'markdown',
}

/**
 * Open an artifact's source as untitled documents, one per file.
 *
 * Untitled rather than written to disk: this is the "let me read it before
 * I commit to it" path, and a command called Copy Source that put files in
 * somebody's repo would be the single most surprising thing this extension
 * could do. Install is the command that writes.
 *
 * Also puts the first file on the clipboard, because for a one-file block —
 * which is nearly all of them — that is what the reader came for.
 */
async function openSource(level, entry) {
  const framework = level === 'effect' ? 'css' : undefined
  const data = await catalog.getArtifact(entry.id, { deep: level === 'page', framework })

  /*
   * Effects name the code `code` and every tier above it names it
   * `source` — a wire-format difference this has to absorb rather than
   * paper over, since both shapes are public API that older clients read.
   */
  const files = (data.files || []).map((file) => ({
    path: String(file.path || entry.id),
    text: String(file.source ?? file.code ?? ''),
  }))

  if (files.length === 0) {
    throw new Error(
      `${entry.name} came back with no files. If it is a Pro template, it needs a licence key.`,
    )
  }

  for (const file of files) {
    const ext = file.path.split('.').pop()
    const document = await vscode.workspace.openTextDocument({
      content: file.text,
      language: LANGUAGE[ext] || 'plaintext',
    })
    await vscode.window.showTextDocument(document, { preview: false })
  }

  await vscode.env.clipboard.writeText(files[0].text)
  return files
}

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

/**
 * Escape for HTML text and for double-quoted attributes.
 *
 * Every string interpolated into a panel goes through this. Most of them
 * are catalog metadata we wrote, but `hoverlab.apiUrl` is user input and
 * the artifact bodies come off the network — and a webview, even one with
 * scripts disabled, is not a place to find out that one of them contained
 * a quote.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Indent a block of CSS so the generated `<style>` stays readable. */
function indent(css) {
  return css
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join('\n')
}

module.exports = { showPreview, openSource }
