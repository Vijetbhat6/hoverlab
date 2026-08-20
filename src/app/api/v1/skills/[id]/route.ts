import { getSkill, SKILLS } from '@/lib/skills'
import { siteUrl } from '@/lib/site'
import { apiError, apiJson, apiPreflight, ARTIFACT_CACHE } from '@/lib/api/public'

/**
 * GET /api/v1/skills/{id} — one agent skill.
 *
 * Two shapes, because two very different clients read this:
 *
 *   default        JSON, for the CLI and anything that wants the metadata
 *                  alongside the file.
 *   ?format=raw    the markdown itself, as text/markdown. An agent told to
 *                  "read this URL" should get the skill, not a JSON
 *                  envelope it has to unwrap.
 *
 * Cached like a block rather than like an effect: skills are hand-written
 * and get corrected, and a fix to how an agent uses the catalog should not
 * sit behind a year-long CDN entry.
 */

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  const skill = getSkill(id)

  if (!skill) {
    return apiError(`No skill with id "${id}"`, 404, {
      available: SKILLS.map((s) => s.id),
    })
  }

  const format = new URL(request.url).searchParams.get('format')
  if (format === 'raw') {
    return new Response(skill.markdown, {
      headers: {
        // Charset is explicit: the skills contain typographic quotes and
        // arrows, and a client that guesses latin-1 renders them as noise.
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': ARTIFACT_CACHE,
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  return apiJson(
    {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      markdown: skill.markdown,
      // Where it goes. Claude Code and Claude Desktop both read
      // `.claude/skills/<name>/SKILL.md`; other agents are told the path
      // rather than guessing at it.
      path: `.claude/skills/${skill.id}/SKILL.md`,
      install: `npx hoverlab skill ${skill.id}`,
      raw: `${siteUrl.replace(/\/$/, '')}/api/v1/skills/${skill.id}?format=raw`,
    },
    { cache: ARTIFACT_CACHE },
  )
}

export async function OPTIONS() {
  return apiPreflight()
}
