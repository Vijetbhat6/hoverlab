'use client'

/**
 * <AvatarGroup> — overlapping faces with an honest overflow count.
 *
 * Two things are usually wrong with this component.
 *
 * The first is the stacking order. Avatars overlap, and the default paint
 * order puts each one on top of the last — so the stack reads
 * right-to-left, the overflow chip sits *under* the avatar before it, and
 * the ring around the first face is clipped. Fixing it means an explicit
 * descending `z-index`, which also has to survive `isolation` so it does
 * not fight the page's own stacking contexts.
 *
 * The second is the count. `+3` next to five avatars is ambiguous — three
 * more, or three total? It is announced here as "and 3 more", and the
 * group's accessible name is the whole list, so a screen reader user hears
 * who is actually on the team rather than "image image image".
 *
 * Initials, not a broken image icon, are the fallback. A missing avatar is
 * the normal case in any product where people have not uploaded one, and
 * the initials are derived from the same name that is already required for
 * the alt text.
 */

import * as React from 'react'

export interface AvatarPerson {
  name: string
  src?: string
}

export interface AvatarGroupProps {
  people: AvatarPerson[]
  /** How many faces before the rest collapse into a count. */
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /** Names the group: "Project members". */
  label?: string
  className?: string
}

const SIZES = {
  sm: { box: 'h-6 w-6 text-[10px]', ring: 'ring-2', overlap: '-ms-2' },
  md: { box: 'h-8 w-8 text-xs', ring: 'ring-2', overlap: '-ms-2.5' },
  lg: { box: 'h-11 w-11 text-sm', ring: 'ring-[3px]', overlap: '-ms-3' },
} as const

/** "Ada Lovelace" → "AL"; "cher" → "C". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * A stable colour per person, from the name.
 *
 * Deterministic rather than random: the same person is the same colour on
 * every page and after every reload, which is most of what makes initials
 * readable as identity at all.
 */
function tint(name: string): string {
  const palette = [
    'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

export function AvatarGroup({
  people,
  max = 4,
  size = 'md',
  label = 'Members',
  className = '',
}: AvatarGroupProps) {
  const shown = people.slice(0, max)
  const overflow = people.length - shown.length
  const s = SIZES[size]

  return (
    <div
      role="group"
      // The whole list, not "4 images". This is the accessible content of
      // the component; everything inside is hidden from the tree.
      aria-label={`${label}: ${people.map((p) => p.name).join(', ')}`}
      // `isolation` so the descending z-indexes below resolve against this
      // group and cannot be reordered by a stacking context on the page.
      className={`isolate flex items-center ${className}`}
    >
      {shown.map((person, i) => (
        <span
          key={`${person.name}-${i}`}
          aria-hidden
          title={person.name}
          // Descending, so each avatar paints OVER the one after it and
          // the stack reads from the first face.
          style={{ zIndex: shown.length - i }}
          className={[
            'relative inline-flex shrink-0 items-center justify-center overflow-hidden',
            'rounded-full font-semibold ring-background',
            s.box,
            s.ring,
            i === 0 ? '' : s.overlap,
            person.src ? 'bg-muted' : tint(person.name),
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {person.src ? (
            /* A plain <img>, not next/image: a primitive has to paste
               into a Vite, CRA or Remix project unchanged, and the alt is
               empty because the group's own label already names everyone
               in it. */
            <img src={person.src} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(person.name)
          )}
        </span>
      ))}

      {overflow > 0 ? (
        <span
          aria-hidden
          style={{ zIndex: 0 }}
          className={[
            'relative inline-flex shrink-0 items-center justify-center rounded-full',
            'bg-muted font-semibold text-muted-foreground ring-background',
            s.box,
            s.ring,
            s.overlap,
          ].join(' ')}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  )
}
