/**
 * The self-contained HTML page the newsletter's email links land on.
 *
 * Inline styles and no app CSS on purpose: the only thing that ever opens
 * these is a mail client's browser, and a confirmation page that depends on
 * the app's stylesheet bundle is a page that breaks in the one context it
 * exists for. The unsubscribe route carries the same markup; this is the
 * copy the confirmation route uses so it is written once for the new code.
 *
 * `title` and `body` are always fixed strings from the route that calls this
 * — never a query parameter — so they are interpolated without escaping. If
 * that ever changes, escape here first.
 */
export function htmlPage(title: string, body: string, status: number): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    padding: 2rem; background: #fafbfb; color: #111a19;
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  main { max-width: 32rem; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 .75rem; letter-spacing: -.01em; }
  p { margin: 0; color: #41514e; }
  a { color: #00674c; margin-top: 1.5rem; display: inline-block; }
  @media (prefers-color-scheme: dark) {
    body { background: #0c1211; color: #e8efed; }
    p { color: #a7b6b3; }
    a { color: #4fd6a8; }
  }
</style>
</head>
<body><main><h1>${title}</h1><p>${body}</p>
<a href="/">Back to Hoverlab</a></main></body>
</html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        // Nothing on this page links anywhere the token could leak to, but
        // the URL carries a secret and costs nothing to keep out of Referer.
        'Referrer-Policy': 'no-referrer',
      },
    },
  )
}
