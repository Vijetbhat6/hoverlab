import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { GLOSSARY, GLOSSARY_COUNT } from '@/lib/glossary/catalog'

/** Share card for /glossary. */

export const runtime = 'nodejs'
export const alt = 'The Hoverlab UI glossary'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function GlossaryOGImage() {
  return ogCard({
    level: 'block',
    badge: 'Glossary',
    kind: `${GLOSSARY_COUNT} terms · ${GLOSSARY.length} groups`,
    name: 'The words, with the thing itself under them',
    description:
      'Interface terms defined in plain language, each one illustrated by a real component from this catalog — with its code on a copy button.',
    path: '/glossary',
  })
}
