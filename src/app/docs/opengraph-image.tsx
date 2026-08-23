import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og-card'

/** Share card for /docs. */

export const runtime = 'nodejs'
export const alt = 'Hoverlab documentation'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function DocsOGImage() {
  return ogCard({
    level: 'block',
    badge: 'Docs',
    kind: 'CLI · MCP · HTTP API',
    name: 'Install it from anywhere',
    description:
      'npx hoverlab add writes any component into your project. An MCP server puts the same catalog in front of your editor agent, and a public HTTP API is behind both.',
    path: '/docs',
  })
}
