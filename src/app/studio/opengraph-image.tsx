/**
 * Share card for /studio.
 *
 * Built from `ogCardImage` rather than `toolOgImage`: the studio is not in
 * `DESIGNER_TOOLS`, so `findTool` would throw. Same card, values passed
 * directly. The tagline differs from the tools' — this is not one of the
 * thirty-six and calling it a designer tool undersells what it produces.
 *
 * The accent stops must exist in `STOP_HEX` in `lib/tool-og.tsx` or the
 * card renders grey; indigo and violet are both already there.
 */

import { OG_SIZE, ogCardImage } from '@/lib/tool-og'

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt =
  'Hoverlab Studio — build a design system’s colours, type and voice in one editor, and leave with a document your agent can read'

export default function OpenGraphImage() {
  return ogCardImage({
    name: 'Hoverlab Studio',
    description:
      'Accent, neutrals, typeface and corners — plus the audience, voice and anti-patterns a token file cannot carry. Out as CSS variables, Figma tokens, or a document your agent reads.',
    accent: 'from-indigo-500 to-violet-500',
    tagline: 'one editor, DNA as the output',
  })
}
