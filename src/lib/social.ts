/**
 * Where the project's public accounts live.
 *
 * These were previously written inline at seven call sites — the landing
 * page footer, the library footer, the changelog, the roadmap and the three
 * community tiles — and every one of them was the string
 * `'https://github.com'`. That is not a link to this project: it is a link
 * to GitHub's home page, and the same was true of `discord.com` and
 * `twitter.com`. Anyone who clicked "Star on GitHub" landed nowhere near
 * the repository.
 *
 * Collecting them here means the real URLs get set once instead of seven
 * times, and that a missed call site is impossible rather than merely
 * unlikely.
 *
 * ⚠️ The defaults below are still placeholders. Set the environment
 * variables (or edit the fallbacks) to the project's real accounts —
 * until then these links go to the platforms' home pages.
 *
 * NEXT_PUBLIC_ so they reach the client components that render them; these
 * are public URLs printed in the markup, so there is nothing to keep back.
 */

export interface SocialLink {
  /** Absolute URL. */
  href: string
  /** The handle/path to display, e.g. "/hoverlab/css-effects". */
  handle: string
}

export const SOCIAL = {
  github: {
    href: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com',
    handle: '/hoverlab/css-effects',
  },
  discord: {
    href: process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com',
    handle: '/hoverlab',
  },
  twitter: {
    href: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com',
    handle: '@hoverlabcss',
  },
} as const satisfies Record<string, SocialLink>

/**
 * True while a link is still pointing at a platform home page rather than
 * at this project.
 *
 * Exposed so a surface that wants to can hide a dead CTA instead of
 * offering it — better than sending someone to github.com and letting them
 * work out that nothing happened.
 */
export function isPlaceholder(link: SocialLink): boolean {
  return !new URL(link.href).pathname.replace(/\/$/, '')
}
