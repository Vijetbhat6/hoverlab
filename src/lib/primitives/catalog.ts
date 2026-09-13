/**
 * Hand-authored metadata for every primitive.
 *
 * Source text is NOT here — it lives in `./sources/*.tsx` and is inlined at
 * build time by `scripts/build-artifact-sources.mjs`, the same split the
 * block catalog makes and for the same reason.
 *
 * A record's `id` must equal its source filename without the extension. The
 * build script pairs the two by that convention and fails loudly when one
 * has no partner, which is the only thing keeping this file honest.
 *
 * `exportName` is stored rather than derived. Most of these are the id in
 * PascalCase, and three are not — `credit-card` exports `CreditCardInput`,
 * `tag-chip` exports `TagChip` alongside `TagInput`, `skeleton` exports
 * `Skeleton` alongside `SkeletonGroup` — so deriving it would be right
 * until it quietly was not, on the install command of the component whose
 * name a visitor was least sure about.
 */

import type { ArtifactTier } from '../artifact-types'
import type { PrimitiveCategory } from './primitive-types'

/** Metadata as authored — everything about a primitive except its source. */
export interface PrimitiveRecord {
  id: string
  name: string
  category: PrimitiveCategory
  description: string
  tags: string[]
  /** Registry key in `./registry`. Equal to `id` for every primitive. */
  previewComponent: string
  /** The component the source exports, for docs and `hoverlab add`. */
  exportName: string
  deps: string[]
  tier?: ArtifactTier
  featured?: boolean
  /** Tailwind height for the card crop. See `Primitive.thumbHeight`. */
  thumbHeight?: string
}

export const PRIMITIVE_CATALOG: PrimitiveRecord[] = [
  /* ---------------------------- Actions ---------------------------- */
  {
    id: 'button',
    name: 'Button',
    category: 'Actions',
    description:
      'Six variants and four sizes, with the two states everyone forgets: a loading state that keeps its width, and an icon-only size whose type refuses to compile without an accessible name.',
    tags: ['button', 'action', 'loading', 'variants', 'cta'],
    previewComponent: 'button',
    exportName: 'Button',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-40',
  },
  {
    id: 'button-group',
    name: 'Button Group',
    category: 'Actions',
    description:
      'Buttons joined into one control, with collapsed borders, logical end rounding and a focus ring that paints above its neighbours instead of being clipped by them.',
    tags: ['button group', 'toolbar', 'joined', 'actions', 'segmented'],
    previewComponent: 'button-group',
    exportName: 'ButtonGroup',
    deps: [],
    featured: true,
    thumbHeight: 'h-36',
  },
  {
    id: 'social-buttons',
    name: 'Social & Login Buttons',
    category: 'Actions',
    description:
      'Google, GitHub, Apple and Microsoft with their real marks drawn as inline SVG — no icon package, no brand-guideline violation, and the "Continue with" wording that works for sign-up and sign-in at once.',
    tags: ['oauth', 'login', 'social', 'sign in', 'google', 'github', 'apple'],
    previewComponent: 'social-buttons',
    exportName: 'SocialButtons',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-52',
  },

  /* ------------------------- Form Controls ------------------------- */
  {
    id: 'field',
    name: 'Field',
    category: 'Form Controls',
    description:
      'The label, hint, error and aria wiring around one input — including the part that is usually wrong, where the hint has to stay in aria-describedby once an error joins it.',
    tags: ['form', 'label', 'error', 'validation', 'accessibility', 'a11y'],
    previewComponent: 'field',
    exportName: 'Field',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-56',
  },
  {
    id: 'input-group',
    name: 'Input Group',
    category: 'Form Controls',
    description:
      'An input with addons, an inline icon or an action button attached, with the padding reserved for the icon and the focus ring on the whole group rather than its middle third.',
    tags: ['input', 'addon', 'prefix', 'suffix', 'form', 'search'],
    previewComponent: 'input-group',
    exportName: 'InputGroup',
    deps: [],
    featured: true,
    thumbHeight: 'h-56',
  },
  {
    id: 'verification-code-input',
    name: 'Verification Code Input',
    category: 'Form Controls',
    description:
      'Six boxes that handle the interaction that actually happens: a pasted code distributes from the first box whichever one was focused, and backspace in an empty box steps back and clears.',
    tags: ['otp', '2fa', 'verification', 'code', 'auth', 'paste'],
    previewComponent: 'verification-code-input',
    exportName: 'VerificationCodeInput',
    deps: [],
    featured: true,
    thumbHeight: 'h-40',
  },
  {
    id: 'stepper',
    name: 'Number Stepper',
    category: 'Form Controls',
    description:
      'A quantity control that is not input[type=number] — so no unstyleable spinner, no accepted "e", and no clamping mid-keystroke that rewrites your 2 to a 10 before you can type the 5.',
    tags: ['number', 'quantity', 'stepper', 'increment', 'spinbutton'],
    previewComponent: 'stepper',
    exportName: 'Stepper',
    deps: ['lucide-react'],
    thumbHeight: 'h-36',
  },
  {
    id: 'kbd',
    name: 'Keyboard Key',
    category: 'Form Controls',
    description:
      'A shortcut written once as "mod+k" and rendered for the keyboard it will be typed on — ⌘ on Apple, Ctrl elsewhere — with the symbols hidden from screen readers behind a spoken name.',
    tags: ['kbd', 'shortcut', 'keyboard', 'hotkey', 'command'],
    previewComponent: 'kbd',
    exportName: 'Kbd',
    deps: [],
    thumbHeight: 'h-36',
  },

  /* --------------------------- Selection --------------------------- */
  {
    id: 'combobox',
    name: 'Combobox',
    category: 'Selection',
    description:
      'A select you can type into, with the full ARIA combobox keyboard contract and focus that never leaves the input — which is the single most common defect in hand-built ones.',
    tags: ['combobox', 'select', 'autocomplete', 'search', 'dropdown'],
    previewComponent: 'combobox',
    exportName: 'Combobox',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-56',
  },
  {
    id: 'segmented-control',
    name: 'Segmented Control',
    category: 'Selection',
    description:
      'Pick exactly one, built as a radio group rather than three buttons, so a screen reader says which is chosen — with a sliding indicator that animates one transform instead of repainting backgrounds.',
    tags: ['segmented', 'toggle group', 'tabs', 'radio', 'switcher'],
    previewComponent: 'segmented-control',
    exportName: 'SegmentedControl',
    deps: [],
    featured: true,
    thumbHeight: 'h-36',
  },
  {
    id: 'rating',
    name: 'Rating',
    category: 'Selection',
    description:
      'Both ratings, which are different components: a radio group for choosing whole stars, and a non-interactive display with fractional fill, because an average of 4.3 drawn as 4.5 is a number the page invented.',
    tags: ['rating', 'stars', 'review', 'score', 'feedback'],
    previewComponent: 'rating',
    exportName: 'Rating',
    deps: ['lucide-react'],
    thumbHeight: 'h-40',
  },
  {
    id: 'emoji-selector',
    name: 'Emoji Reactions',
    category: 'Selection',
    description:
      'A reaction row where each pill is a toggle that says whether you are one of the count, plus a short picker — announced with names, since "👍 3" is read as a shrug by a screen reader.',
    tags: ['emoji', 'reactions', 'picker', 'social', 'toggle'],
    previewComponent: 'emoji-selector',
    exportName: 'EmojiSelector',
    deps: ['lucide-react'],
    thumbHeight: 'h-40',
  },

  /* ------------------------ Status & Labels ------------------------ */
  {
    id: 'badge',
    name: 'Badge',
    category: 'Status & Labels',
    description:
      'Six semantic tones across three shapes, kept as separate axes — so a red outline badge is something you can ask for rather than something the variant list forgot.',
    tags: ['badge', 'label', 'tag', 'pill', 'chip'],
    previewComponent: 'badge',
    exportName: 'Badge',
    deps: [],
    thumbHeight: 'h-44',
  },
  {
    id: 'status-badge',
    name: 'Status Badge',
    category: 'Status & Labels',
    description:
      'A dot and a word, with no icon-only mode by design — one in twelve men cannot separate the red state from the green one, so the word is structural rather than optional.',
    tags: ['status', 'state', 'online', 'indicator', 'dot', 'a11y'],
    previewComponent: 'status-badge',
    exportName: 'StatusBadge',
    deps: [],
    featured: true,
    thumbHeight: 'h-44',
  },
  {
    id: 'tag-chip',
    name: 'Tag Chip & Input',
    category: 'Status & Labels',
    description:
      'Removable tags and the field that makes them, including the part nobody does: after removing a chip, focus moves to the next one instead of falling to the top of the document.',
    tags: ['tag', 'chip', 'token', 'input', 'multiselect'],
    previewComponent: 'tag-chip',
    exportName: 'TagChip',
    deps: ['lucide-react'],
    thumbHeight: 'h-44',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'Status & Labels',
    description:
      'Shapes that match what replaces them, so the page does not jump when data lands — and a group wrapper that announces "loading" once instead of describing six grey rectangles.',
    tags: ['skeleton', 'loading', 'placeholder', 'shimmer', 'suspense'],
    previewComponent: 'skeleton',
    exportName: 'Skeleton',
    deps: [],
    thumbHeight: 'h-48',
  },

  /* --------------------- Navigation & Steps ------------------------ */
  {
    id: 'progress-steps',
    name: 'Progress Steps',
    category: 'Navigation & Steps',
    description:
      'An ordered list in a nav, not a row of divs — so the count and the position come free, and aria-current names the step you are on. Horizontal and vertical, because four labels do not fit on a phone.',
    tags: ['stepper', 'progress', 'wizard', 'checkout', 'onboarding'],
    previewComponent: 'progress-steps',
    exportName: 'ProgressSteps',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-44',
  },
  {
    id: 'tree-view',
    name: 'Tree View',
    category: 'Navigation & Steps',
    description:
      'One tab stop for the whole tree, with the ARIA tree keyboard contract in full — including typeahead and the arrow keys mapped through the reading direction.',
    tags: ['tree', 'file', 'explorer', 'nested', 'sidebar', 'keyboard'],
    previewComponent: 'tree-view',
    exportName: 'TreeView',
    deps: ['lucide-react'],
    thumbHeight: 'h-64',
  },

  /* --------------------------- Identity ---------------------------- */
  {
    id: 'avatar-group',
    name: 'Avatar Group',
    category: 'Identity',
    description:
      'Overlapping faces with a descending stack order, deterministic colours for initials, and an overflow chip announced as "and 3 more" rather than an ambiguous +3.',
    tags: ['avatar', 'group', 'stack', 'team', 'members', 'initials'],
    previewComponent: 'avatar-group',
    exportName: 'AvatarGroup',
    deps: [],
    featured: true,
    thumbHeight: 'h-36',
  },
  {
    id: 'featured-icon',
    name: 'Featured Icon',
    category: 'Identity',
    description:
      'The glyph-in-a-tinted-box that every feature grid and empty state is built from, in five tones and four treatments — decorative by default, because it sits next to a heading that says the same thing.',
    tags: ['icon', 'feature', 'empty state', 'container', 'tint'],
    previewComponent: 'featured-icon',
    exportName: 'FeaturedIcon',
    deps: [],
    thumbHeight: 'h-40',
  },

  /* ----------------------- Pickers & Media ------------------------- */
  {
    id: 'color-picker',
    name: 'Color Picker',
    category: 'Pickers & Media',
    description:
      'A swatch grid as a radio group, a hex field that accepts what people actually paste and normalises on blur, and the native picker as the escape hatch.',
    tags: ['color', 'swatch', 'hex', 'picker', 'palette', 'brand'],
    previewComponent: 'color-picker',
    exportName: 'ColorPicker',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-56',
  },
  {
    id: 'gradient-picker',
    name: 'Gradient Picker',
    category: 'Pickers & Media',
    description:
      'Draggable stops with pointer capture, an angle, and the CSS it produces shown and copyable — with the stop list kept sorted, because an unsorted linear-gradient is not an error, it just renders wrong.',
    tags: ['gradient', 'color', 'stops', 'css', 'picker', 'brand'],
    previewComponent: 'gradient-picker',
    exportName: 'GradientPicker',
    deps: ['lucide-react'],
    thumbHeight: 'h-72',
  },
  {
    id: 'image-picker',
    name: 'Image Picker',
    category: 'Pickers & Media',
    description:
      'A drop zone that counts drag events instead of flickering on every child boundary, validates on drop where the accept attribute does nothing, and revokes its object URLs.',
    tags: ['upload', 'image', 'file', 'dropzone', 'drag and drop'],
    previewComponent: 'image-picker',
    exportName: 'ImagePicker',
    deps: ['lucide-react'],
    thumbHeight: 'h-56',
  },
  {
    id: 'credit-card',
    name: 'Credit Card Input',
    category: 'Pickers & Media',
    description:
      'Brand detection, per-brand digit grouping and CVC length, a Luhn check that catches a transposed digit before the network declines it, and the autocomplete tokens that make a card actually autofill.',
    tags: ['payment', 'credit card', 'checkout', 'luhn', 'billing', 'form'],
    previewComponent: 'credit-card',
    exportName: 'CreditCardInput',
    deps: [],
    featured: true,
    thumbHeight: 'h-72',
  },
  {
    id: 'qr-code',
    name: 'QR Code',
    category: 'Pickers & Media',
    description:
      'A real, scannable symbol with no dependency — Reed-Solomon over GF(256), block interleaving and all eight masks scored by the standard penalty rules. Byte mode, level M, up to 213 bytes.',
    tags: ['qr', 'qr code', 'barcode', 'share', 'svg', 'no dependencies'],
    previewComponent: 'qr-code',
    exportName: 'QrCode',
    deps: [],
    featured: true,
    thumbHeight: 'h-56',
  },
  {
    id: 'video-player',
    name: 'Video Player',
    category: 'Pickers & Media',
    description:
      'Custom controls that keep what the native ones gave you: YouTube key bindings, a real range input for scrubbing, and the buffered range painted behind the played one.',
    tags: ['video', 'player', 'media', 'controls', 'scrubber'],
    previewComponent: 'video-player',
    exportName: 'VideoPlayer',
    deps: ['lucide-react'],
    thumbHeight: 'h-56',
  },

  /* ------------------------- Date & Time --------------------------- */
  {
    id: 'calendar',
    name: 'Calendar',
    category: 'Date & Time',
    description:
      'A real `role="grid"` month rather than 42 tab stops — one tab stop, arrows for days, PageUp/PageDown for months, and six rows always, so paging never changes the height of what sits below it.',
    tags: ['calendar', 'month', 'date', 'grid', 'keyboard'],
    previewComponent: 'calendar',
    exportName: 'Calendar',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-80',
  },
  {
    id: 'date-picker',
    name: 'Date Picker',
    category: 'Date & Time',
    description:
      'The typing half most pickers drop, attached to the calendar: parses on blur, refuses to guess whether 3/4 is March or April, and leaves what it cannot read in the box instead of clearing it.',
    tags: ['date', 'picker', 'input', 'calendar', 'popover'],
    previewComponent: 'date-picker',
    exportName: 'DatePicker',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-80',
  },
  {
    id: 'time-picker',
    name: 'Time Picker',
    category: 'Date & Time',
    description:
      'Slots at a fixed step with the taken ones struck through and the time zone rendered beside the value — the three things a booking needs and a native time input cannot say.',
    tags: ['time', 'picker', 'slots', 'booking', 'time zone'],
    previewComponent: 'time-picker',
    exportName: 'TimePicker',
    deps: ['lucide-react'],
    thumbHeight: 'h-64',
  },
  {
    id: 'relative-time',
    name: 'Relative Time',
    category: 'Date & Time',
    description:
      'A real `<time>` that says "3 hours ago" and cannot mismatch on hydration: both sides render the absolute date first, and the relative wording only arrives in an effect. Ticks at an interval scaled to its own age.',
    tags: ['time', 'relative', 'timestamp', 'ago', 'hydration'],
    previewComponent: 'relative-time',
    exportName: 'RelativeTime',
    deps: [],
    thumbHeight: 'h-40',
  },
  {
    id: 'duration-input',
    name: 'Duration Input',
    category: 'Date & Time',
    description:
      'Three segments that behave like one field — typing past one advances, Backspace on an empty one goes back, arrows carry 59 minutes into the next hour, and pasting `1:30:00` fills all three.',
    tags: ['duration', 'input', 'timer', 'segments', 'hours'],
    previewComponent: 'duration-input',
    exportName: 'DurationInput',
    deps: [],
    thumbHeight: 'h-40',
  },

  /* --------------------------- Structure --------------------------- */
  {
    id: 'content-divider',
    name: 'Content Divider',
    category: 'Structure',
    description:
      'A rule with a label on it, built from two growing flex children — so it needs no background colour behind the text and does not break the moment you put it on a card.',
    tags: ['divider', 'separator', 'rule', 'or', 'section'],
    previewComponent: 'content-divider',
    exportName: 'ContentDivider',
    deps: [],
    thumbHeight: 'h-40',
  },

  /* ------------------------ Frames & Mocks ------------------------- */
  {
    id: 'browser-frame',
    name: 'Browser Frame',
    category: 'Frames & Mocks',
    description:
      'Desktop browser chrome that wraps whatever you put inside it — a screenshot, a video, or the live component itself. Three variants, no image asset, and the window controls are grey rather than a copy of one vendor’s.',
    tags: ['browser', 'mockup', 'frame', 'safari', 'screenshot'],
    previewComponent: 'browser-frame',
    exportName: 'BrowserFrame',
    deps: ['lucide-react'],
    featured: true,
    thumbHeight: 'h-64',
  },
  {
    id: 'phone-frame',
    name: 'Phone & Tablet Frame',
    category: 'Frames & Mocks',
    description:
      'One handset bezel with the cut-out as a prop, so iPhone, Android and tablet are three settings rather than three assets. Status bar and home indicator included, and the clock is a prop so it can never be a hydration mismatch.',
    tags: ['phone', 'mobile', 'mockup', 'device', 'ios', 'android'],
    previewComponent: 'phone-frame',
    exportName: 'PhoneFrame',
    deps: [],
    featured: true,
    thumbHeight: 'h-80',
  },
  {
    id: 'laptop-frame',
    name: 'Laptop Frame',
    category: 'Frames & Mocks',
    description:
      'A lid, a hinge and a tapered base, with the taper done by clip-path rather than the border trick that cannot round or carry a background. Degrades to a boxier laptop where clip-path is missing.',
    tags: ['laptop', 'macbook', 'mockup', 'device', 'hero'],
    previewComponent: 'laptop-frame',
    exportName: 'LaptopFrame',
    deps: [],
    thumbHeight: 'h-64',
  },
  {
    id: 'device-showcase',
    name: 'Device Showcase',
    category: 'Frames & Mocks',
    description:
      'The product-hero arrangement: a handset overlapping a laptop, overlapped with a negative inline-start margin so both stay in flow and the group keeps an honest height. Stacks below sm instead of shrinking to nothing.',
    tags: ['showcase', 'hero', 'devices', 'responsive', 'mockup'],
    previewComponent: 'device-showcase',
    exportName: 'DeviceShowcase',
    deps: [],
    thumbHeight: 'h-72',
  },
]

/** How many primitives exist. */
export const PRIMITIVE_COUNT = PRIMITIVE_CATALOG.length

const BY_ID = new Map(PRIMITIVE_CATALOG.map((p) => [p.id, p]))

/** Look up one primitive record. Undefined for an id from another tier. */
export function getPrimitiveRecord(id: string): PrimitiveRecord | undefined {
  return BY_ID.get(id)
}
