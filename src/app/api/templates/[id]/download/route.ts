/**
 * GET /api/templates/<id>/download — the template as a zip.
 *
 * Built server-side rather than in the browser. The alternative is shipping
 * every file to the client so it can zip them locally, which would put
 * ~200 KB of source into the page bundle to service a button most visitors
 * never press.
 *
 * NO LONGER `force-static`. It used to prerender one archive per template
 * and serve it from the CDN, which was the right call while every template
 * was free and is disqualifying now that six of the seven are not: a static
 * archive is a URL anyone can pass around, and the note in
 * `lib/artifact-types.ts` named exactly that as the reason per-artifact
 * selling was impossible. It is possible because this route now
 * authenticates.
 *
 * The cost of that change is real and worth stating: every download now
 * builds its archive on demand instead of hitting a cached one. The
 * archives are small and deterministic, the licence check is a single
 * document read, and `marketing-site` — the free template, and the one
 * most visitors take — is still served from the ordinary cache below.
 */

import { NextResponse } from 'next/server'
import { getTemplate } from '@/lib/templates/templates'
import { buildTemplateZip } from '@/lib/templates/template-zip'
import { getSession } from '@/lib/session'
import { entitlementsForApiRequest } from '@/lib/billing/api-key'
import { resolveRequestSubject } from '@/lib/billing/request-subject'
import { consumeQuota, refundQuota } from '@/lib/billing/quota'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const template = getTemplate(id)

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const session = await getSession().catch(() => null)
  const ent = await entitlementsForApiRequest(request, session?.uid ?? null)

  if (template.tier === 'pro' && !ent.canUseProFeatures) {
    /*
     * 402, matching `requirePro`. This is a purchase away, not a
     * permission the caller will never have, and the two read very
     * differently to whoever is looking at the response.
     */
    return NextResponse.json(
      {
        error: `"${template.name}" is part of Pro.`,
        upgrade: '/pricing',
        hint: 'Already bought it? Sign in, or pass a licence key as `Authorization: Bearer hl_live_…`.',
        free: 'marketing-site',
      },
      { status: 402, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }

  /*
   * The free template is still metered, because it is the one an
   * unlicensed visitor can take repeatedly. Licensed callers skip the
   * meter entirely — `consumeQuota` returns unlimited for them — so this
   * costs a paying customer nothing.
   */
  const { subject } = await resolveRequestSubject(request)
  const quota = await consumeQuota(subject, ent, 'artifact-zip')
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: `That's ${quota.state.limit} downloads for today.`,
        resetsAt: quota.state.resetsAt,
        offer: subject.kind === 'user' ? 'pro' : 'signin',
      },
      { status: 429, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }

  let zip: Buffer | Uint8Array
  try {
    zip = await buildTemplateZip(template)
  } catch (err) {
    // Charged before the work, refunded when the work fails — the same
    // order `spendCredits` uses, and for the same reason: the reverse
    // leaves an action that is free to anyone who can make it throw.
    await refundQuota(subject).catch(() => {})
    throw err
  }

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      'Content-Type': 'application/zip',
      // `filename` rather than `filename*`: the id is already an ASCII slug,
      // so the simple form is correct and universally understood.
      'Content-Disposition': `attachment; filename="${template.id}.zip"`,
      'Content-Length': String(zip.byteLength),
      // A Pro archive is served to one licensed caller and must not sit in
      // a shared cache; the free one is the same bytes for everybody.
      'Cache-Control':
        template.tier === 'pro'
          ? 'private, no-store'
          : 'public, max-age=3600, s-maxage=86400, immutable',
    },
  })
}
