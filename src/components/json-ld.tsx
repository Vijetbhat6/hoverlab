/**
 * <JsonLd> — a single schema.org blob, serialised into the document.
 *
 * Deliberately a Server Component with no 'use client': structured data is
 * for crawlers, so it belongs in the HTML the server sends and has no
 * business in a client bundle.
 *
 * `dangerouslySetInnerHTML` is the only way to put JSON inside a <script>
 * without React escaping it into something a parser will reject. The input
 * is our own catalog data rather than anything user-supplied, and the
 * closing-tag sequence is neutralised below — the one string in a JSON
 * payload that can end the script element early.
 */

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\u003c'),
      }}
    />
  )
}
