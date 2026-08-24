import { NextResponse } from 'next/server'
import { withJsonErrors } from '@/lib/route-errors'
import { requirePro } from '@/lib/billing/require-pro'
import { buildDesignSystem } from '@/lib/export/design-system'
import { coerceBrandColor, DEFAULT_BRAND_COLOR } from '@/lib/brand-presets'

/**
 * POST /api/design-system  body { brand?, name?, radius? } → { files, … }
 *
 * The design system, in the caller's brand.
 *
 * Pro-gated, and this is the one gate in the product that is neither a
 * licence nor a store: the output is derived per-customer and does not
 * exist until they ask for it, which makes it the only thing here that
 * copying a public file cannot get you. See `lib/export/design-system.ts`.
 *
 * POST rather than GET despite being a pure function of its input. The
 * brand is four floats and a name, which is a query string nobody can read
 * and a URL that would end up in logs and in a CDN; a body keeps the
 * request honest about being per-caller and uncacheable.
 *
 * The build itself is deliberately server-side even though it is
 * isomorphic and could run in the browser. Not for secrecy — the maths is
 * in the client bundle already — but because this is the surface the CLI
 * and an agent call, and one implementation reachable three ways beats
 * three that drift.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withJsonErrors('design-system', async (request: Request) => {
  const gate = await requirePro('The design system export')
  if ('response' in gate) return gate.response

  let body: { brand?: unknown; name?: unknown; radius?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  /*
   * `coerceBrandColor` clamps rather than rejects, so an out-of-range
   * chroma becomes a legal one instead of failing the request. Falling
   * back to the default brand when it returns null means a caller who
   * sends nothing gets Hoverlab's own tokens, which is a reasonable thing
   * to want and a bad thing to 400 over.
   */
  const brand = coerceBrandColor(body.brand) ?? DEFAULT_BRAND_COLOR

  const name = typeof body.name === 'string' ? body.name.slice(0, 60) : undefined
  const radius = typeof body.radius === 'string' ? body.radius.slice(0, 24) : undefined

  return NextResponse.json(buildDesignSystem(brand, { name, radius }), {
    headers: { 'Cache-Control': 'private, no-store' },
  })
})
