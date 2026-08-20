import generated from './generated-skills.json'

/**
 * Agent skills — the catalog, taught to a coding agent.
 *
 * A skill is a markdown file with front matter that an agent loads into its
 * own instructions. It is the fifth rung of the distribution ladder, above
 * effect/block/page/template: those hand over code, this hands over the
 * judgement about when to reach for which.
 *
 * Why it exists: the browse funnel that used to sell developer tools is
 * being replaced by agents, and an agent that has never heard of this
 * catalog writes a loader from scratch. A skill is how the catalog gets
 * into the loop — which makes it distribution, not a feature, and it is
 * free for exactly that reason.
 *
 * Authored in `skills/<id>/SKILL.md` and compiled to JSON by
 * `scripts/build-skills.mts` in the prebuild pass; see that file for why
 * the app cannot read the directory at request time.
 */

export interface Skill {
  /** Directory name, the id in every URL, and the install path. */
  id: string
  name: string
  description: string
  /** The complete file including front matter — what gets installed. */
  markdown: string
  /** Body without front matter, for rendering. */
  body: string
}

export const SKILLS: Skill[] = generated as Skill[]

export const SKILL_COUNT = SKILLS.length

export function getSkill(id: string): Skill | null {
  return SKILLS.find((skill) => skill.id === id) ?? null
}
