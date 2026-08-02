/**
 * "Open in <sandbox>" payloads.
 *
 * Copying a snippet is the fast path, but the moment someone wants to
 * *change* something they need a scratch environment — and the reflex for
 * a CSS snippet is CodePen or JSFiddle. Both accept a prefilled pen via a
 * POSTed form field, which is why these return form descriptors rather
 * than URLs: the payloads are far past what a query string can carry.
 *
 * Pure and dependency-free; the caller renders the form and submits it.
 */

export interface SandboxForm {
  /** Where the form POSTs. */
  action: string
  /** Hidden fields to submit, already serialized. */
  fields: Record<string, string>
  /** Display name of the destination. */
  label: string
}

interface SandboxInput {
  name: string
  description: string
  html: string
  css: string
  /** Rendered on a dark surface? Adds a matching body background. */
  darkSurface?: boolean
  /** Canonical page for the effect, credited in the pen. */
  sourceUrl?: string
}

/**
 * Body styling wrapped around the snippet so the pen opens looking like
 * the preview did, instead of a bare element in the top-left corner.
 */
function shellCss(darkSurface: boolean): string {
  const bg = darkSurface ? '#020617' : '#f8fafc'
  const fg = darkSurface ? '#e2e8f0' : '#0f172a'
  return `/* --- preview shell (delete this block) --- */
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: ${bg};
  color: ${fg};
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
/* --- effect --- */
`
}

/**
 * CodePen accepts a JSON blob in a field literally named `data`, POSTed to
 * /pen/define. Quotes inside must survive the round-trip, so the JSON is
 * HTML-escaped by the caller when it lands in a value attribute — React
 * does that for us.
 */
export function codepenForm(input: SandboxInput): SandboxForm {
  const payload = {
    title: input.name,
    description: input.sourceUrl
      ? `${input.description}\n\nFrom Hoverlab — ${input.sourceUrl}`
      : input.description,
    tags: ['css', 'hoverlab'],
    editors: '110', // HTML + CSS open, JS collapsed
    layout: 'left',
    html: input.html,
    css: shellCss(input.darkSurface !== false) + input.css,
    css_pre_processor: 'none',
    html_pre_processor: 'none',
  }
  return {
    action: 'https://codepen.io/pen/define',
    fields: { data: JSON.stringify(payload) },
    label: 'CodePen',
  }
}

/**
 * JSFiddle takes plain form fields rather than JSON. `wrap: 'b'` means
 * "no framework wrapper", which is what a CSS-only snippet wants.
 */
export function jsfiddleForm(input: SandboxInput): SandboxForm {
  return {
    action: 'https://jsfiddle.net/api/post/library/pure/',
    fields: {
      title: input.name,
      description: input.description,
      html: input.html,
      css: shellCss(input.darkSurface !== false) + input.css,
      js: '',
      wrap: 'b',
      panel_css: '0',
      panel_js: '3',
    },
    label: 'JSFiddle',
  }
}

/**
 * A complete, standalone HTML document for the effect — what the "Download
 * .html" action writes and what the embed route renders.
 */
export function standaloneHtml(input: SandboxInput): string {
  const title = input.name.replace(/[<>&]/g, '')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${shellCss(input.darkSurface !== false)}${input.css}
</style>
</head>
<body>
${input.html}
</body>
</html>
`
}
