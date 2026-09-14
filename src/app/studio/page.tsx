/**
 * /studio — the server half.
 *
 * Thin on purpose. It exists for three things a client component cannot do:
 * export `metadata`, emit the breadcrumb JSON-LD, and read `siteUrl` — which
 * `lib/site.ts` documents as server-only and which the Agent tab's document
 * needs for the links at its foot. The editor itself is
 * `studio-editor.tsx`.
 *
 * No `searchParams`. The folded-in tools' handoff params (`?hue=`, `?base=`)
 * are read in the browser instead — see the seed effect in the editor. That
 * is a deliberate departure from the six tools with readable permalinks,
 * which parse on the server because their <title> is built from the
 * parameters. Nothing here is: most of a studio state is free prose, there
 * is no set of studio URLs worth indexing, and reading `searchParams` would
 * opt the whole route out of static rendering to title a page the same way
 * every time.
 */

import type { Metadata } from 'next'

import { JsonLd } from '@/components/json-ld'
import { breadcrumbLd } from '@/lib/structured-data'
import { absoluteUrl, siteUrl } from '@/lib/site'
import { StudioEditor } from '@/app/studio/studio-editor'

const TITLE = 'Design System Studio — Tokens, Palette and Brand Voice in One Editor — Hoverlab'
const DESCRIPTION =
  'Build a whole design system in one place: accent, neutrals, typeface and corners, plus the audience, voice and anti-patterns a token file cannot carry. Leaves as CSS variables, Figma tokens, and a document your coding agent reads.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'design system generator',
    'design tokens',
    'shadcn theme generator',
    'brand voice guidelines',
    'css variables generator',
    'figma design tokens',
    'agents.md design rules',
    'cursor rules design system',
  ],
  alternates: { canonical: '/studio' },
  openGraph: {
    url: absoluteUrl('/studio'),
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    siteName: 'Hoverlab',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default function StudioPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Studio' }])} />
      <StudioEditor origin={siteUrl} />
    </>
  )
}
