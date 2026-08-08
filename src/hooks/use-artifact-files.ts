'use client'

/**
 * Resolve bundled blocks, pages and templates to their source files.
 *
 * The counterpart to `useEffectDetails`, and it exists for the same reason:
 * the client ships metadata only. An effect's payload is `html` + `css` and
 * comes from `/api/effects/batch`; everything above it is a file tree and
 * comes from `/api/v1/artifacts/{id}`, which already resolves an id against
 * all three upper catalogs so the caller does not have to know which tier
 * an id belongs to.
 *
 * One request per artifact rather than a batch endpoint. A bundle is capped
 * well below the point where that matters (see `bundleLimit`), the
 * responses are individually cacheable — `ARTIFACT_CACHE` puts them at the
 * edge for an hour — and a shared batch route would have to re-implement
 * the per-tier resolution this one already does.
 *
 * Results are cached at module scope, so reopening the drawer or moving
 * between pages does not refetch. The catalog is immutable per deploy, so
 * there is nothing to invalidate within a session.
 */

import * as React from 'react'
import type { ResolvedArtifact } from '@/lib/bundle-export'
import { levelOf, type ArtifactLevel } from '@/lib/artifact-types'

/** id → resolved files, shared across every hook instance. */
const cache = new Map<string, ResolvedArtifact>()

interface ArtifactPayloadShape {
  level?: ArtifactLevel
  artifact?: { id?: string; name?: string; deps?: string[] }
  files?: Array<{ path?: string; source?: string }>
  deps?: string[]
}

/** Narrow an API payload, dropping anything that cannot produce files. */
function toResolved(id: string, raw: unknown): ResolvedArtifact | null {
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as ArtifactPayloadShape

  const files = (payload.files ?? []).filter(
    (f): f is { path: string; source: string } =>
      typeof f?.path === 'string' && typeof f?.source === 'string',
  )
  if (files.length === 0) return null

  return {
    id: payload.artifact?.id ?? id,
    name: payload.artifact?.name ?? id,
    level: levelOf({ level: payload.level }),
    files,
    deps: payload.deps ?? payload.artifact?.deps ?? [],
  }
}

export interface UseArtifactFilesResult {
  artifacts: ResolvedArtifact[]
  loading: boolean
}

/**
 * Fetch files for a set of artifact ids.
 *
 * `ids` is joined into the effect dependency rather than depended on
 * directly — a caller almost always passes a fresh array each render, and
 * depending on the identity would refetch on every one.
 */
export function useArtifactFiles(ids: string[]): UseArtifactFilesResult {
  const key = ids.join(',')
  const [artifacts, setArtifacts] = React.useState<ResolvedArtifact[]>(() =>
    ids.map((id) => cache.get(id)).filter((a): a is ResolvedArtifact => a !== undefined),
  )
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const wanted = key ? key.split(',') : []
    if (wanted.length === 0) {
      setArtifacts([])
      setLoading(false)
      return
    }

    const missing = wanted.filter((id) => !cache.has(id))
    if (missing.length === 0) {
      setArtifacts(
        wanted.map((id) => cache.get(id)).filter((a): a is ResolvedArtifact => a !== undefined),
      )
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await fetch(`/api/v1/artifacts/${encodeURIComponent(id)}`)
            if (!res.ok) return
            const resolved = toResolved(id, await res.json())
            if (resolved) cache.set(id, resolved)
          } catch {
            // A failed fetch leaves the id uncached, so the next open
            // retries. Better than caching a hole that never heals.
          }
        }),
      )
      if (cancelled) return
      setArtifacts(
        wanted.map((id) => cache.get(id)).filter((a): a is ResolvedArtifact => a !== undefined),
      )
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [key])

  return { artifacts, loading }
}
