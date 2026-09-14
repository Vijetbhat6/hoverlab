/**
 * Permalink spec for /tools/contrast.
 *
 * The state shape and its defaults live here rather than in the page,
 * because the page is no longer the only thing that needs them: the server
 * half reads a pair out of the query to build the <title>, and the client
 * half restores it. Two copies of `{ fg, bg }` is exactly the drift this
 * repo already factored out of `validStops` and `validLayers`.
 *
 * This is the tool where the readable URL earns the most. A contrast pair
 * IS two colours — there is nothing else to say — so the permalink is
 * genuinely typeable, and the title it generates ("16.5:1 — passes AAA") is
 * the answer to the query somebody ran to get here, which the old `#s=`
 * link could not have been.
 */

import { contrastRatio, wcagLevel } from '@/lib/color-tools'
import { hex, type ToolPermalink } from '@/lib/tools/permalink'

export interface ContrastState {
  fg: string
  bg: string
}

export const CONTRAST_DEFAULTS: ContrastState = { fg: '#0f172a', bg: '#f8fafc' }

/** The ratio, to one decimal, or null if either colour is unreadable. */
function ratioOf(state: ContrastState): number | null {
  return contrastRatio(state.fg, state.bg)
}

export const CONTRAST_PERMALINK: ToolPermalink<ContrastState> = {
  href: '/tools/contrast',
  defaults: CONTRAST_DEFAULTS,
  fields: {
    fg: { param: 'fg', codec: hex },
    bg: { param: 'bg', codec: hex },
  },

  describe(state) {
    const ratio = ratioOf(state)
    const fg = state.fg.toUpperCase()
    const bg = state.bg.toUpperCase()
    if (ratio === null) {
      return {
        title: `${fg} on ${bg} — contrast checker — Hoverlab`,
        description: `Check the WCAG contrast ratio of ${fg} on ${bg}, with the nearest passing shade if it fails.`,
      }
    }
    const normal = wcagLevel(ratio, false)
    const large = wcagLevel(ratio, true)
    const fixed = ratio.toFixed(2)
    // The verdict goes in the title because it is the thing being looked
    // up. "4.54:1" alone is a number; "4.54:1 — passes AA" is an answer.
    const verdict =
      normal === 'Fail'
        ? large === 'Fail'
          ? 'fails WCAG at every size'
          : 'passes AA for large text only'
        : `passes ${normal} for body text`
    return {
      title: `${fg} on ${bg} — ${fixed}:1 contrast — Hoverlab`,
      description: `${fg} text on ${bg} has a contrast ratio of ${fixed}:1, which ${verdict}. Open the pair in the checker to nudge either colour until it passes, and copy the result.`,
    }
  },

  swatches: (state) => [state.fg, state.bg],

  /*
    The curated set is chosen to be USEFUL rather than pretty: these are the
    pairs people actually land on a contrast checker to settle. Grey-on-white
    body text at the four Tailwind steps where the answer changes, white on
    each of the accent colours a button is most often painted, and the two
    notorious near-misses.
  */
  gallery: [
    {
      slug: 'slate-900-on-white',
      name: '#0F172A on #FFFFFF',
      note: 'Near-black body text on white. The safe default, and the baseline everything else is judged against.',
      state: { fg: '#0f172a', bg: '#ffffff' },
    },
    {
      slug: 'slate-500-on-white',
      name: '#64748B on #FFFFFF',
      note: 'The muted-foreground grey most design systems ship. Passes AA for body text, and only just.',
      state: { fg: '#64748b', bg: '#ffffff' },
    },
    {
      slug: 'slate-400-on-white',
      name: '#94A3B8 on #FFFFFF',
      note: 'One step lighter, and it fails. The exact place a placeholder colour stops being readable.',
      state: { fg: '#94a3b8', bg: '#ffffff' },
    },
    {
      slug: 'white-on-blue-500',
      name: '#FFFFFF on #3B82F6',
      note: 'White on the default blue button. The most-shipped failing pair on the web.',
      state: { fg: '#ffffff', bg: '#3b82f6' },
    },
    {
      slug: 'white-on-blue-600',
      name: '#FFFFFF on #2563EB',
      note: 'The same button one step darker, which is what it takes to pass AA.',
      state: { fg: '#ffffff', bg: '#2563eb' },
    },
    {
      slug: 'white-on-emerald-600',
      name: '#FFFFFF on #059669',
      note: 'White on a green call-to-action — the pair that decides whether a success state is legible.',
      state: { fg: '#ffffff', bg: '#059669' },
    },
    {
      slug: 'white-on-amber-500',
      name: '#FFFFFF on #F59E0B',
      note: 'White on amber. Fails badly at every size, and ships anyway more often than any other pair.',
      state: { fg: '#ffffff', bg: '#f59e0b' },
    },
    {
      slug: 'amber-950-on-amber-400',
      name: '#451A03 on #FBBF24',
      note: 'What the amber button should be: dark ink on the same warning yellow.',
      state: { fg: '#451a03', bg: '#fbbf24' },
    },
    {
      slug: 'white-on-red-600',
      name: '#FFFFFF on #DC2626',
      note: 'Destructive-button white on red, the pair a delete confirmation lives or dies on.',
      state: { fg: '#ffffff', bg: '#dc2626' },
    },
    {
      slug: 'slate-200-on-slate-900',
      name: '#E2E8F0 on #0F172A',
      note: 'Dark-mode body text. Off-white rather than white, because pure white on near-black haloes.',
      state: { fg: '#e2e8f0', bg: '#0f172a' },
    },
    {
      slug: 'slate-400-on-slate-900',
      name: '#94A3B8 on #0F172A',
      note: 'The dark-mode muted grey. The light-mode twin of this pair fails; this one does not.',
      state: { fg: '#94a3b8', bg: '#0f172a' },
    },
    {
      slug: 'slate-600-on-slate-900',
      name: '#475569 on #0F172A',
      note: 'Dark-on-dark, the failure that only shows up on a real screen in a bright room.',
      state: { fg: '#475569', bg: '#0f172a' },
    },
  ],
}
