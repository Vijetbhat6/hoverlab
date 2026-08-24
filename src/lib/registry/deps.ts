/**
 * Import resolution for the shadcn registry — the pure half of `registry.ts`.
 *
 * Split out for one concrete reason: `registry.ts` is marked `server-only`,
 * so importing it from `scripts/check-registry.mts` throws before the check
 * can run. The build check and the served registry must agree about what a
 * dependency is — if they disagree, the check passes and the install breaks
 * — so the rule lives here once and both sides call it.
 *
 * No `server-only` marker here, and nothing in this file touches a catalog:
 * it takes source text and a set of known ids and answers questions about
 * them.
 */

/** One `from '...'` specifier, as written in the source. */
export function importSpecifiers(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
}

/**
 * The registry item id an import refers to, or null if it refers to a package.
 *
 * Two shapes resolve, and both are real in the catalog today:
 *
 *   `@/components/{id}`  a page pulling in its blocks, or one block reusing
 *                        another.
 *   `./{id}`             the same thing relatively — `product-buy-box`
 *                        imports `./product-grid`.
 *
 * Both land in `components/` after install, so the relative form still
 * resolves there; it is a dependency either way.
 *
 * Returns null for bare specifiers (`react`, `lucide-react`) — those are npm
 * dependencies and are carried separately by the catalog's `deps`.
 */
export function localImportId(spec: string): string | null {
  if (spec.startsWith('@/components/')) return spec.slice('@/components/'.length)
  if (spec.startsWith('./')) return spec.slice(2)
  return null
}

/** True for anything that resolves inside this project rather than node_modules. */
export function isLocalImport(spec: string): boolean {
  return spec.startsWith('@/') || spec.startsWith('./') || spec.startsWith('../')
}

/** Registry item ids a set of sources depends on, sorted and deduplicated. */
export function registryDepIds(sources: string[], known: ReadonlySet<string>): string[] {
  const found = new Set<string>()

  for (const source of sources) {
    for (const spec of importSpecifiers(source)) {
      const id = localImportId(spec)
      if (id && known.has(id)) found.add(id)
    }
  }

  return [...found].sort()
}

/**
 * Local imports the registry cannot serve.
 *
 * A published block importing `@/components/site-header` compiles in this
 * repo and fails in the user's project, and nothing about the install says
 * why. This is the check that catches that class of bug at build time.
 */
export function unresolvedLocalImports(
  artifacts: Array<{ id: string; sources: string[] }>,
  known: ReadonlySet<string>,
): Array<{ item: string; unresolved: string }> {
  const problems: Array<{ item: string; unresolved: string }> = []

  for (const artifact of artifacts) {
    for (const source of artifact.sources) {
      for (const spec of importSpecifiers(source)) {
        if (!isLocalImport(spec)) continue

        const id = localImportId(spec)
        if (!id || !known.has(id)) problems.push({ item: artifact.id, unresolved: spec })
      }
    }
  }

  return problems
}
