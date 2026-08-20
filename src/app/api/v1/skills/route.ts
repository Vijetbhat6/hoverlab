import { SKILLS } from '@/lib/skills'
import { siteUrl } from '@/lib/site'
import { apiJson, apiPreflight, LIST_CACHE } from '@/lib/api/public'

/**
 * GET /api/v1/skills — the agent skills this catalog publishes.
 *
 * Public and unauthenticated like the rest of `/api/v1`, and free on
 * purpose: a skill's whole job is to put Hoverlab inside an agent's loop.
 * Charging for the thing that creates demand would be charging for the
 * advertisement.
 *
 * Returns metadata only. `/api/v1/skills/{id}` returns the markdown.
 */

export const runtime = 'nodejs'

export async function GET() {
  const origin = siteUrl.replace(/\/$/, '')

  return apiJson(
    {
      skills: SKILLS.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        url: `${origin}/api/v1/skills/${skill.id}`,
        docs: `${origin}/docs/skills`,
      })),
      total: SKILLS.length,
      install: 'npx hoverlab skill <id>',
    },
    { cache: LIST_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
