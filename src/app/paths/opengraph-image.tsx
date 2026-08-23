import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'
import { PATHS } from '@/lib/paths/catalog'

/** Share card for the /paths hub. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab guided paths'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function PathsHubOGImage() {
  const steps = PATHS.reduce((n, p) => n + p.steps.length, 0)

  return ogCard({
    level: 'block',
    badge: 'Guided paths',
    kind: `${PATHS.length} paths · ${steps} steps`,
    name: 'Build the whole thing, in order',
    description:
      'A catalog tells you what exists. These tell you what to take and in what order — and, at every step, why it goes there rather than somewhere else.',
    path: '/paths',
  })
}
