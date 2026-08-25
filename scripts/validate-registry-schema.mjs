// Validate the served registry against shadcn's published JSON schema.
//
//   npm run check:registry:schema              # against localhost:3007
//   npm run check:registry:schema -- https://hoverlab.dev
//
// WHY THIS IS NOT IN prebuild
//
// It needs two things a build must not depend on: the network (the schema
// is fetched from ui.shadcn.com, because a vendored copy would go stale
// silently and a stale schema that passes is worse than no schema) and a
// running server. `scripts/check-registry.mts` covers what can be checked
// offline and is the one wired into the build; this is the check you run
// before submitting to registry.directory, and after any change to the
// item shape.
//
// WHAT IT PROVES
//
// That every item we publish is one the CLI will accept — the type is in
// the enum, the required fields are present, `css` and `files` have the
// shapes the schema demands. TypeScript cannot prove this: our
// `RegistryItem` is a hand-written subset of the schema, so it is exactly
// as right as whoever last edited it believed.

import Ajv from 'ajv'

const SCHEMA_URL = 'https://ui.shadcn.com/schema/registry-item.json'
const base = (process.argv[2] ?? 'http://localhost:3007').replace(/\/$/, '')

/* A spread rather than all 1,025: the base, both file-carrying types, and
   effects covering plain rules, @keyframes, a usage note and @property. */
const SAMPLE = [
  'hoverlab',
  'hero-split',
  'saas-landing-page',
  'btn-gradient',
  'btn-pulse',
  'card-spotlight',
  'ocean-beam-border-6147',
]

const schema = await (await fetch(SCHEMA_URL)).json()
/* This ajv is v6, whose meta-schema is draft-07 already; the inline
   $schema line makes it look for one it has not been given. */
delete schema.$schema
const validate = new Ajv({ allErrors: true }).compile(schema)

const failures = []

const index = await (await fetch(`${base}/registry.json`)).json()
for (const item of index.items) {
  if (!validate(item)) {
    failures.push(`${item.name} (index): ${JSON.stringify(validate.errors?.slice(0, 2))}`)
  }
}
console.log(`schema check: ${index.items.length} index entries`)

for (const name of SAMPLE) {
  const res = await fetch(`${base}/r/${name}.json`)
  if (!res.ok) {
    failures.push(`${name}: HTTP ${res.status}`)
    continue
  }
  const item = await res.json()
  if (!validate(item)) {
    failures.push(`${name}: ${JSON.stringify(validate.errors?.slice(0, 3))}`)
    continue
  }
  const shape = item.css
    ? `${Object.keys(item.css).length} rules`
    : `${item.files?.length ?? 0} files`
  console.log(`  ok  ${name.padEnd(24)} ${item.type.padEnd(18)} ${shape}`)
}

if (failures.length) {
  console.error(`\nschema check failed — ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}

console.log(`schema check: every item validates against ${SCHEMA_URL}`)
