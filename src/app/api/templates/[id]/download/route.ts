/**
 * GET /api/templates/<id>/download — the template as a zip.
 *
 * Built server-side rather than in the browser. The alternative is shipping
 * every file to the client so it can zip them locally, which would put
 * ~200 KB of source into the page bundle to service a button most visitors
 * never press.
 *
 * The archive is deterministic for a given catalog: same template, same
 * bytes. That is what makes it safe to cache aggressively — the content
 * only changes when a deploy changes the blocks or pages underneath it.
 */

import { NextResponse } from 'next/server'
import { TEMPLATE_CATALOG } from '@/lib/templates/catalog'
import { getTemplate } from '@/lib/templates/templates'
import { buildTemplateZip } from '@/lib/templates/template-zip'

/**
 * Pre-render the archive for every template at build time and serve it
 * from the cache. There are three of them and their contents are fixed per
 * deploy, so building on demand would only ever mean a cold first request.
 */
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  // Derived from the catalog, never hard-coded. `dynamicParams = false`
  // means an id missing from this list 404s rather than falling back to an
  // on-demand build — so a hard-coded array does not fail loudly when a
  // template is added, it just makes the new one undownloadable while the
  // rest of its page renders perfectly.
  //
  // `catalog` rather than `templates`: this needs ids, and importing the
  // assembled module would pull every page and block source into the
  // route's graph to produce a list of four strings.
  return TEMPLATE_CATALOG.map((t) => ({ id: t.id }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const template = getTemplate(id)

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const zip = await buildTemplateZip(template)

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      'Content-Type': 'application/zip',
      // `filename` rather than `filename*`: the id is already an ASCII slug,
      // so the simple form is correct and universally understood.
      'Content-Disposition': `attachment; filename="${template.id}.zip"`,
      'Content-Length': String(zip.byteLength),
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
    },
  })
}
