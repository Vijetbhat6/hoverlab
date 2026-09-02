'use client'

/**
 * The last resort: an error thrown by the ROOT LAYOUT itself.
 *
 * `error.tsx` sits inside the root layout, so it can only catch what the
 * layout successfully wrapped. If the layout is what threw — a provider, a
 * font load, the theme script — that boundary never mounts and the visitor
 * gets Next's built-in screen. This one replaces the whole document, which
 * is why it renders its own `<html>` and `<body>`: at this point there is
 * no layout to inherit them from.
 *
 * EVERYTHING HERE IS INLINE, AND THAT IS THE POINT.
 *
 * No `<SiteHeader>`, no `<Button>`, no `cn()`, no Tailwind class doing
 * anything load-bearing. Each of those is a thing that could be the reason
 * this file is rendering, and a fallback that depends on the code it is
 * catching for is not a fallback. The styles are a `style` attribute and
 * the colours are literals rather than tokens, because `globals.css`
 * defines those tokens and may itself be missing.
 *
 * The one concession to appearance is `prefers-color-scheme`, done with a
 * tiny inline <style> block so a dark-mode visitor is not flashbanged by a
 * white page at the exact moment something has already gone wrong.
 *
 * This should essentially never render. If it does, the useful thing is the
 * digest — it is the only handle on the server-side log for a failure that
 * happened before any of our own logging ran.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background: '#ffffff',
          color: '#18181b',
        }}
      >
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background: #09090b !important; color: #fafafa !important; }
            .hl-muted { color: #a1a1aa !important; }
            .hl-code { background: #18181b !important; border-color: #27272a !important; }
            .hl-btn { background: #fafafa !important; color: #09090b !important; }
          }
        `}</style>

        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
            Hoverlab failed to load.
          </h1>
          <p
            className="hl-muted"
            style={{ margin: '0 0 1.5rem', lineHeight: 1.6, color: '#52525b' }}
          >
            Something broke before the page could be built — not something you
            did. Reloading usually clears it.
          </p>

          <button
            type="button"
            onClick={reset}
            className="hl-btn"
            style={{
              cursor: 'pointer',
              border: 0,
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: '#18181b',
              color: '#ffffff',
            }}
          >
            Reload
          </button>

          {error.digest ? (
            <p
              className="hl-muted"
              style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#71717a' }}
            >
              Reference{' '}
              <code
                className="hl-code"
                style={{
                  userSelect: 'all',
                  border: '1px solid #e4e4e7',
                  background: '#f4f4f5',
                  borderRadius: '0.25rem',
                  padding: '0.125rem 0.375rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {error.digest}
              </code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  )
}
