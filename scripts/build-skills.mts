// Read every agent skill in skills/ and emit them as JSON the app can serve.
//
// Skills are authored as markdown with YAML front matter — the format the
// agents that consume them expect, and the format a human can review in a
// pull request. The app cannot read them from disk at request time: on a
// serverless deploy only files Next's tracer can see are uploaded, and a
// directory read by a glob is not one of them. So this runs in the same
// prebuild pass as the block and artifact sources, and the app imports the
// JSON.
//
// The front matter is parsed here rather than shipped raw because every
// consumer wants the same two fields out of it — name and description —
// and re-implementing a YAML reader in the CLI, the API route and the docs
// page would be three chances to disagree.
//
// Run: npm run build:skills

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const skillsDir = join(here, '..', 'skills')
const out = join(here, '..', 'src', 'lib', 'generated-skills.json')

interface BuiltSkill {
  id: string
  name: string
  description: string
  /** The full file, front matter included — what gets written to disk. */
  markdown: string
  /** The body alone, for rendering on the docs page. */
  body: string
}

/**
 * Pull `name` and `description` out of the front matter.
 *
 * Deliberately not a YAML dependency: skill front matter is two flat string
 * keys by convention, and the failure mode of a hand-rolled reader here is
 * a build-time error on a file we wrote ourselves, not a runtime surprise.
 */
function parseFrontMatter(source: string, id: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    throw new Error(`skills/${id}/SKILL.md has no front matter`)
  }

  const fields: Record<string, string> = {}
  for (const line of match[1]!.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/)
    if (!kv) continue
    let value = kv[2]!.trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    fields[kv[1]!] = value
  }

  for (const key of ['name', 'description']) {
    if (!fields[key]) throw new Error(`skills/${id}/SKILL.md is missing "${key}:"`)
  }

  return { fields, body: source.slice(match[0].length).trim() }
}

const skills: BuiltSkill[] = []

for (const entry of readdirSync(skillsDir).sort()) {
  const file = join(skillsDir, entry, 'SKILL.md')
  try {
    if (!statSync(file).isFile()) continue
  } catch {
    continue // Not a skill directory.
  }

  const markdown = readFileSync(file, 'utf8')
  const { fields, body } = parseFrontMatter(markdown, entry)

  if (fields.name !== entry) {
    // The directory name is the install path and the id in every URL; a
    // front-matter name that disagrees would install one skill under
    // another's name.
    throw new Error(
      `skills/${entry}/SKILL.md declares name "${fields.name}" — it must match the directory.`,
    )
  }

  skills.push({
    id: entry,
    name: fields.name!,
    description: fields.description!,
    markdown,
    body,
  })
}

if (!skills.length) throw new Error('No skills found in skills/')

writeFileSync(out, `${JSON.stringify(skills, null, 2)}\n`)
console.log(`build-skills: ${skills.length} skills → ${out.replace(/.*[\\/]src/, 'src')}`)
