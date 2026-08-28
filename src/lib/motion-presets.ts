/**
 * The motion preset gallery, as data.
 *
 * `/tools/motion` renders these; `/tools/keyframes` opens them. That second
 * sentence is the whole reason this file exists apart from the page: a
 * gallery of animations you cannot change is a gallery you leave, and the
 * editor next door already knew how to change one — it just had no way to be
 * handed a starting point.
 *
 * So a preset is not a block of CSS here. It is an `Animation` (see
 * `keyframes-css.ts`) and its CSS is derived, which means the snippet the
 * gallery hands out and the timeline the editor opens cannot disagree. Two
 * of the eight are the exception and say so: their CSS is written out by
 * hand because the timeline model cannot express it, and rather than
 * approximate them into something subtly different, the gallery says why
 * the Edit button is missing.
 *
 * Every preset ships with its `prefers-reduced-motion` guard already
 * written. The catalog's own effects are audited for exactly this (see
 * `test:motion`); handing out unguarded keyframes from the same site would
 * be incoherent.
 */

import {
  buildAnimationCss,
  keyframesBlock,
  animationShorthand,
  loops,
  stopAt,
  withIds,
  type Animation,
} from '@/lib/keyframes-css'

export interface MotionPreset {
  id: string
  name: string
  group: 'Enter' | 'Exit' | 'Attention'
  blurb: string
  /**
   * The editable form. Present on everything the timeline can express — and
   * when it is present, the CSS below is generated from it rather than
   * stored beside it.
   */
  anim?: Animation
  /** Keyframes body, without the wrapper. Only for the inexpressible two. */
  frames?: string
  /** `animation` shorthand minus the name. Only for the inexpressible two. */
  timing?: string
  /** Loops forever — needs the guard most. Only for the inexpressible two. */
  forever?: boolean
  /** Why the editor cannot open it. Set exactly when `anim` is absent. */
  notEditable?: string
}

/** The defaults every preset shares, so each one names only what differs. */
function anim(over: Partial<Animation> & Pick<Animation, 'duration' | 'easing' | 'stops'>): Animation {
  return {
    delay: 0,
    iterations: 1,
    direction: 'normal',
    fill: 'both',
    ...over,
  }
}

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'fade-in-up',
    name: 'Fade in up',
    group: 'Enter',
    blurb:
      'The default for anything entering on scroll. Small travel, never more than ~24px.',
    anim: anim({
      duration: 600,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      stops: withIds([stopAt(0, { opacity: 0, y: 24 }), stopAt(100)]),
    }),
  },
  {
    id: 'fade-in',
    name: 'Fade in',
    group: 'Enter',
    blurb: 'No movement at all. The safe choice when a lot of things enter at once.',
    anim: anim({
      duration: 400,
      easing: 'ease-out',
      stops: withIds([stopAt(0, { opacity: 0 }), stopAt(100)]),
    }),
  },
  {
    id: 'scale-in',
    name: 'Scale in',
    group: 'Enter',
    blurb: 'For things that appear where you clicked — popovers, menus, tooltips.',
    anim: anim({
      duration: 200,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      stops: withIds([stopAt(0, { opacity: 0, scale: 96 }), stopAt(100)]),
    }),
  },
  {
    id: 'slide-in-right',
    name: 'Slide in right',
    group: 'Enter',
    blurb:
      'Drawers and side panels. The one most worth guarding — it crosses the screen.',
    frames: `from { transform: translateX(100%); }
  to   { transform: none; }`,
    timing: '0.3s cubic-bezier(0.32, 0.72, 0, 1) both',
    notEditable:
      'The travel is 100% of the panel’s own width, so the same rule works on a 320px drawer and a full-bleed sheet. The timeline works in pixels, and pinning this to a number would quietly break the wider one.',
  },
  {
    id: 'fade-out-down',
    name: 'Fade out down',
    group: 'Exit',
    blurb:
      'Dismissals. Exits should be faster than entrances — nobody waits to watch something leave.',
    anim: anim({
      duration: 200,
      easing: 'ease-in',
      stops: withIds([stopAt(0), stopAt(100, { opacity: 0, y: 12 })]),
    }),
  },
  {
    id: 'pulse',
    name: 'Pulse',
    group: 'Attention',
    blurb:
      'A live status dot. Opacity only — a scaling pulse reflows everything beside it.',
    anim: anim({
      duration: 2000,
      easing: 'ease-in-out',
      iterations: 0,
      stops: withIds([stopAt(0), stopAt(50, { opacity: 40 }), stopAt(100)]),
    }),
  },
  {
    id: 'shake',
    name: 'Shake',
    group: 'Attention',
    blurb:
      'A rejected form field. Short, small, and once — a shake that repeats reads as broken.',
    anim: anim({
      duration: 400,
      easing: 'ease-in-out',
      stops: withIds([
        stopAt(0),
        stopAt(20, { x: -4 }),
        stopAt(40, { x: 4 }),
        stopAt(60, { x: -4 }),
        stopAt(80, { x: 4 }),
        stopAt(100),
      ]),
    }),
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    group: 'Attention',
    blurb: 'Skeleton loading. Pair it with a background gradient sized 200%.',
    frames: `from { background-position: 200% 0; }
  to   { background-position: -200% 0; }`,
    timing: '1.6s ease-in-out infinite',
    forever: true,
    notEditable:
      'It slides a background gradient rather than the element. The timeline animates transform, opacity and blur — the three properties that are free to animate — and `background-position` is none of them.',
  },
]

export const MOTION_GROUPS = ['Enter', 'Exit', 'Attention'] as const

export function findMotionPreset(id: string | null | undefined): MotionPreset | null {
  if (!id) return null
  return MOTION_PRESETS.find((p) => p.id === id) ?? null
}

/** The class and `@keyframes` name for a preset. Namespaced, so pasting two never collides. */
export function motionClass(preset: MotionPreset): string {
  return `fx-${preset.id}`
}

export function motionLoops(preset: MotionPreset): boolean {
  return preset.anim ? loops(preset.anim) : Boolean(preset.forever)
}

/** The full `@keyframes` block, derived where it can be. */
export function motionKeyframes(preset: MotionPreset): string {
  const name = motionClass(preset)
  if (preset.anim) return keyframesBlock(name, preset.anim.stops)
  return `@keyframes ${name} {\n  ${preset.frames}\n}`
}

/** The `animation` shorthand minus the name — what goes after it in the rule. */
export function motionShorthand(preset: MotionPreset): string {
  return preset.anim ? animationShorthand(preset.anim) : preset.timing!
}

/** Keyframes, class and guard — the thing the copy button hands over. */
export function buildMotionCss(preset: MotionPreset): string {
  const name = motionClass(preset)
  if (preset.anim) return buildAnimationCss(name, preset.anim)
  return `${motionKeyframes(preset)}

.${name} {
  animation: ${name} ${preset.timing};
}

@media (prefers-reduced-motion: reduce) {
  .${name} {
${
  preset.forever
    ? `    animation: none;`
    : `    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;`
}
  }
}`
}
