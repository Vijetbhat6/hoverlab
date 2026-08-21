/**
 * Payload builders for the public artifact API.
 *
 * ⚠️  SERVER-ONLY. This pulls all four catalogs *with their sources* — that
 * is the point of it, and also why no client component may touch it.
 *
 * The tiers above `effect` share one response shape: a summary, a list of
 * files with the paths they take on disk, a dependency list and a short set
 * of notes. Keeping that in one place is what lets `hoverlab add` treat a
 * block, a page and a template as the same operation with different file
 * counts, and it means `/api/v1/blocks/{id}` and `/api/v1/artifacts/{id}`
 * cannot drift into returning two different descriptions of one block.
 *
 * Effects keep their own builder because they are genuinely different:
 * there is no file list until a framework has been chosen, and the choice
 * changes the answer.
 */

import 'server-only'

import { getEffect } from '@/lib/effects'
import { getBlock } from '@/lib/blocks/blocks'
import { getPage } from '@/lib/pages/pages'
import { getTemplate } from '@/lib/templates/templates'
import { toDiskPath } from '@/lib/templates/template-files'
import { customizeCss, type CustomizationOptions } from '@/lib/customize'
import { exportEffect, type FrameworkId } from '@/lib/export'
import {
  API_VERSION,
  ARTIFACT_CACHE,
  apiError,
  apiJson,
  toSummary,
  type ArtifactSummary,
} from './public'
import { LEVEL_LABEL, type ArtifactFile, type ArtifactLevel } from '@/lib/artifact-types'
import type { TemplateRoute } from '@/lib/templates/template-types'
import type { NextResponse } from 'next/server'

/* ------------------------------------------------------------------ *
 *  File-tier artifacts — blocks, pages, templates
 * ------------------------------------------------------------------ */

/** One file, at the path a client should write it to. */
export interface PayloadFile {
  path: string
  lang: string
  source: string
}

export interface ArtifactPayload {
  version: string
  level: ArtifactLevel
  artifact: ArtifactSummary & {
    deps: string[]
    composedOf: string[]
    fileCount: number
    /** Templates only — the URL-to-file map that makes it a project. */
    routes?: TemplateRoute[]
  }
  files: PayloadFile[]
  deps: string[]
  notes: string[]
  /** Ids pulled in by `deep`, empty otherwise. */
  included: string[]
  /**
   * Present, and true, when the caller is not licensed for this artifact.
   *
   * The response still describes the artifact in full — name, category,
   * dependencies, route table, file COUNT — and carries no file bodies.
   * That split is the product: what a template is stays public so it can
   * be searched, linked and evaluated; what a template contains is what
   * Pro buys.
   *
   * Absent rather than `false` on a free artifact, so a client can treat
   * the key's presence as the signal and every existing consumer of a free
   * payload sees a byte-identical response.
   */
  locked?: true
  /** How to unlock it. Present only alongside `locked`. */
  license?: {
    tier: 'pro'
    message: string
    /** Where a human buys it. */
    url: string
    /** How a machine authenticates once they have. */
    hint: string
  }
}

/** The shape every file-tier catalog record shares. */
interface FileArtifact {
  id: string
  name: string
  category: string
  description: string
  tags: string[]
  featured?: boolean
  tier?: 'free' | 'pro'
  level: ArtifactLevel
  deps: string[]
  files: ArtifactFile[]
  composedOf?: string[]
  routes?: TemplateRoute[]
}

/**
 * What a client needs to know before the code will actually run.
 *
 * Deliberately short and specific. A note that says "requires Tailwind" is
 * noise to someone who already has it; a note naming the file that carries
 * the design tokens is the difference between a block that renders and a
 * block that renders unstyled.
 *
 * Dependencies are not mentioned here. They are already their own field,
 * and a client that renders both ends up telling the user to install
 * lucide-react twice.
 */
function notesFor(artifact: FileArtifact): string[] {
  const notes: string[] = []

  if (artifact.level === 'template') {
    // Not "run npm install" — every client already says that, and a note
    // that repeats the instruction above it is a note people stop reading.
    notes.push(
      'Self-contained: no Hoverlab dependency, and nothing phones home. ' +
        'GETTING-STARTED.md in the project root explains the layout.',
    )
  } else {
    notes.push(
      'React + Tailwind, styled through design tokens (bg-card, ' +
        'text-muted-foreground) rather than literal colours. A project ' +
        'without those tokens renders this unstyled; they ship in the ' +
        'app/globals.css of any Hoverlab template.',
    )
  }

  return notes
}

export function buildArtifactPayload(
  artifact: FileArtifact,
  siteOrigin: string,
  options: { deep?: boolean; licensed?: boolean } = {},
): ArtifactPayload {
  // `toDiskPath` also rejects anything that could escape the destination
  // directory. Nothing in the catalog does, but this payload's whole
  // purpose is to be written to a filesystem, so the check belongs here
  // rather than only in the zip builder.
  const files: PayloadFile[] = []
  const seenPaths = new Set<string>()

  const collect = (source: ArtifactFile[]) => {
    for (const file of source) {
      const path = toDiskPath(file.path)
      if (!path || seenPaths.has(path)) continue
      seenPaths.add(path)
      // Trailing newline: a file without one is a diff nobody asked for the
      // first time the user's editor saves it.
      files.push({ path, lang: file.lang, source: `${file.source.trimEnd()}\n` })
    }
  }

  collect(artifact.files)

  // `deep` resolves the rung below. A page's source imports its sections
  // from `@/components/...`, so a page installed alone is a file of broken
  // imports — correct as a *description* of the page, useless as an
  // installation. Templates already assemble their blocks in `templates.ts`
  // and blocks have nothing below them, so this only ever fires for pages.
  const included: string[] = []
  const deps = new Set(artifact.deps)

  if (options.deep) {
    for (const blockId of artifact.composedOf ?? []) {
      const block = getBlock(blockId)
      if (!block) continue
      collect(block.files)
      for (const dep of block.deps) deps.add(dep)
      included.push(block.id)
    }
  }

  const allDeps = [...deps]

  /*
   * The licence check, applied after the file list is built rather than
   * before.
   *
   * `fileCount` has to stay truthful — "18 files" is part of deciding
   * whether a template is worth buying — so the tree is assembled and then
   * the bodies are dropped. Building a locked payload down a separate path
   * would eventually produce a locked response that disagreed with the
   * free one about what the artifact is.
   */
  const locked = artifact.tier === 'pro' && options.licensed !== true

  return {
    version: API_VERSION,
    level: artifact.level,
    artifact: {
      ...toSummary(artifact, siteOrigin),
      deps: artifact.deps,
      composedOf: artifact.composedOf ?? [],
      fileCount: files.length,
      ...(artifact.routes ? { routes: artifact.routes } : {}),
    },
    files: locked ? [] : files,
    deps: allDeps,
    notes: notesFor({ ...artifact, deps: allDeps }),
    included: locked ? [] : included,
    ...(locked
      ? {
          locked: true as const,
          license: {
            tier: 'pro' as const,
            message: `"${artifact.name}" is part of Pro. Its description, dependencies and file list are public; its source needs a licence.`,
            url: `${siteOrigin}/#pricing`,
            hint: 'Pass a licence key as `Authorization: Bearer hl_live_…`, or run `npx hoverlab login`. Keys are issued on /account.',
          },
        }
      : {}),
  }
}

/**
 * The whole body of a `/api/v1/{level}s/{id}` handler.
 *
 * The 404 carries a search URL rather than a bare message. An id typed one
 * character wrong is the overwhelmingly common failure here, and the fix is
 * always the same next request — so the response may as well contain it.
 */
export function artifactDetailResponse(options: {
  id: string
  artifact: FileArtifact | undefined
  level: ArtifactLevel
  siteOrigin: string
  deep?: boolean
  /**
   * Whether the caller holds a commercial licence. Defaults to false, so a
   * route that forgets to resolve one serves the locked payload rather
   * than the source — the safe direction for a mistake to fail in.
   */
  licensed?: boolean
}): NextResponse {
  const { id, artifact, level, siteOrigin, deep, licensed } = options

  if (!artifact) {
    return apiError(`No ${level} with id "${id}"`, 404, {
      hint:
        `Search for one at ${siteOrigin}/api/v1/${level}s` +
        `?q=${encodeURIComponent(id)}`,
      level,
      label: LEVEL_LABEL[level].one,
    })
  }

  const payload = buildArtifactPayload(artifact, siteOrigin, { deep, licensed })

  return apiJson(payload, {
    /*
     * A licensed response is per-caller and must never reach a shared
     * cache: one Pro customer's request would otherwise populate the CDN
     * with the sources and serve them to everybody behind it. The locked
     * payload is identical for every anonymous caller, so it keeps the
     * ordinary cache and the free tiers are untouched.
     */
    cache: artifact.tier === 'pro' ? 'private, no-store' : ARTIFACT_CACHE,
  })
}

/** `?deep=true` — pull in the rung below. Off by default. */
export function readDeep(url: URL): boolean {
  return url.searchParams.get('deep') === 'true'
}

/* ------------------------------------------------------------------ *
 *  Effects
 * ------------------------------------------------------------------ */

/**
 * Build the `/api/v1/effects/{id}` body.
 *
 * Lives here rather than inline in the route so `/api/v1/artifacts/{id}`
 * can answer for an effect id with a byte-identical payload — a CLI that
 * resolved an id through the unified route and then re-fetched it through
 * the effect route must not see the two disagree.
 */
export function buildEffectPayload(
  effect: NonNullable<ReturnType<typeof getEffect>>,
  siteOrigin: string,
  framework: FrameworkId,
  customization: CustomizationOptions,
) {
  const css = customizeCss(effect.css, customization)
  const generated = exportEffect(
    {
      id: effect.id,
      name: effect.name,
      description: effect.description,
      category: effect.category,
      html: effect.html,
      css,
    },
    framework,
  )

  return {
    version: API_VERSION,
    level: 'effect' as const,
    effect: {
      ...toSummary(effect, siteOrigin),
      darkSurface: effect.darkSurface === true,
      previewClass: effect.previewClass ?? null,
    },
    framework: generated.framework,
    files: generated.files,
    notes: generated.notes,
    /** The raw source, so clients can run their own transforms. */
    source: { html: effect.html, css },
    customization,
  }
}

/* ------------------------------------------------------------------ *
 *  Cross-tier resolution
 * ------------------------------------------------------------------ */

/**
 * Find an id on whichever rung of the ladder holds it.
 *
 * Order is atom-first, which matters only in the event of a collision
 * between an effect id and a block id. There is none today, and the effect
 * catalog's ~4,300 generated ids are the ones a new block would have to
 * dodge — so resolving in favour of the older, larger, SEO-indexed namespace
 * is the choice that cannot break a URL somebody has already published.
 */
export type ResolvedArtifact =
  | { level: 'effect'; effect: NonNullable<ReturnType<typeof getEffect>> }
  | { level: 'block' | 'page' | 'template'; artifact: FileArtifact }

export function resolveArtifact(id: string): ResolvedArtifact | null {
  const effect = getEffect(id)
  if (effect) return { level: 'effect', effect }

  const block = getBlock(id)
  if (block) return { level: 'block', artifact: block }

  const page = getPage(id)
  if (page) return { level: 'page', artifact: page }

  const template = getTemplate(id)
  if (template) return { level: 'template', artifact: template }

  return null
}
