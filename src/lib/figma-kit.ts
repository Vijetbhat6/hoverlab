import 'server-only'

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The shipped Figma kit's manifest, or null when no kit has been built.
 *
 * READ FROM DISK RATHER THAN IMPORTED. A static `import manifest from
 * '../../public/figma/manifest.json'` is the shorter version and it makes
 * the file mandatory: anyone who clones this repo and runs a build gets a
 * module-not-found until they have installed Playwright and crawled 250
 * pages. The kit is a several-minute artifact produced by hand, so its
 * absence has to be a state the site renders, not a state the site refuses
 * to compile in.
 *
 * `server-only` because this reads the filesystem, and because the whole
 * point is that the pages linking these files are server-rendered.
 */

export interface FigmaKitFile {
  category: string
  slug: string
  file: string
  sections: number
  bytes: number
  ids: string[]
}

export interface FigmaKit {
  generatedAt: string
  sections: number
  note: string
  files: FigmaKitFile[]
}

function load(): FigmaKit | null {
  const path = join(process.cwd(), 'public', 'figma', 'manifest.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as FigmaKit
  } catch {
    // A malformed manifest is the same situation as a missing one as far as
    // a page is concerned: there is nothing trustworthy to offer.
    return null
  }
}

export const FIGMA_KIT: FigmaKit | null = load()

/** Public URL for one kit file. */
export function figmaKitHref(file: FigmaKitFile): string {
  return `/figma/${file.file}`
}

/** `1.4 MB`, `812 KB` — sizes a designer is choosing between. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}
