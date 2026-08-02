import { NextResponse } from 'next/server'
import { getEffect } from '@/lib/effects'
import { standaloneHtml } from '@/lib/sandbox'
import { absoluteUrl } from '@/lib/site'

/**
 * Embeddable preview: GET /embed/<effect-id>
 *
 * Returns a complete, self-contained HTML document with nothing but the
 * effect on a centered surface — meant to be dropped into an <iframe> in a
 * blog post, a docs page, or a Notion embed.
 *
 * Implemented as a route handler rather than a page so the response skips
 * the app shell entirely: no React runtime, no providers, no theme script.
 * The whole document is typically under 3 KB, which matters when a post
 * embeds a dozen of them.
 *
 * Query params:
 *   ?theme=light   render on a light surface instead of the effect default
 *
 * Framing is deliberately open (`frame-ancestors *`) — an embed that only
 * works on our own domain is not an embed. Nothing here reads cookies or
 * session state, so there's no clickjacking surface to protect.
 */

export const dynamic = 'force-static'
export const revalidate = 86400

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const effect = getEffect(slug)

  if (!effect) {
    return new NextResponse('Effect not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const theme = new URL(request.url).searchParams.get('theme')
  const darkSurface = theme === 'light' ? false : effect.darkSurface !== false

  const body = standaloneHtml({
    name: effect.name,
    description: effect.description,
    html: effect.html,
    css: effect.css,
    darkSurface,
    sourceUrl: absoluteUrl(`/effect/${effect.id}`),
  })

  // A quiet attribution link in the corner — the embed's only addition to
  // the standalone document, and the reason embedding is worth supporting.
  const withCredit = body.replace(
    '</body>',
    `<a href="${absoluteUrl(`/effect/${effect.id}`)}" target="_blank" rel="noopener"
   style="position:fixed;right:8px;bottom:6px;font:500 10px/1 ui-sans-serif,system-ui,sans-serif;
          color:currentColor;opacity:.35;text-decoration:none">Hoverlab</a>
</body>`,
  )

  return new NextResponse(withCredit, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "frame-ancestors *; script-src 'none'",
      'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
