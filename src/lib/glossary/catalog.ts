/**
 * The UI glossary — 60 terms, each one illustrated by a real artifact.
 *
 * Every other glossary of interface terms on the web has the same shape: a
 * word, two sentences, and a stock photograph of a laptop. They are written
 * by people who are describing the thing rather than shipping it, which is
 * why they can tell you a modal "interrupts the user with a dialog" and
 * cannot tell you that the reason yours feels wrong is that it has two
 * primary buttons and no way out with the keyboard.
 *
 * The thing that makes this page worth existing is the last field on every
 * entry: `example`. It is an id from this site's own catalog, and the page
 * renders the artifact under the definition — live, and with the source on a
 * copy button. So "what is a bento grid" is answered by a paragraph and a
 * bento grid, and the next click is `npx hoverlab add bento-features` rather
 * than a search.
 *
 * That is also the constraint that keeps this honest. A term only goes on
 * this list if the catalog can show it. Nothing here is aspirational; if the
 * example is deleted or renamed, `scripts/check-glossary.mts` fails the build
 * rather than letting the page ship a definition with a dead illustration
 * under it — the exact failure mode `check-paths.mts` exists to prevent one
 * rung up.
 *
 * TWO FIELDS, DELIBERATELY
 *
 *   `definition` is what the word means. No jargon, no forward references to
 *   other entries, no comparison to a neighbouring term — a definition you
 *   have to read three other definitions to understand is not one.
 *
 *   `inPractice` is the part a dictionary leaves out and the reason anyone
 *   would read this rather than the first search result: the rule, the trap,
 *   the judgement call, the thing that is true of every good one and missing
 *   from most real ones.
 *
 * DATA-ONLY. No imports, no catalog lookups — `resolve.ts` does that, so this
 * module stays cheap to import from a checker and from the sitemap.
 */

/** The rungs a glossary illustration may come from. */
export type GlossaryLevel = 'effect' | 'primitive' | 'block'

export interface GlossaryTerm {
  /** URL fragment and cross-reference key. Kebab-case, stable. */
  slug: string
  /** The headword, as a designer would say it. */
  term: string
  /** Other names for the same thing. Real synonyms only — this drives search. */
  aka?: string[]
  /** What it is. One or two plain sentences. */
  definition: string
  /** The part a dictionary leaves out. */
  inPractice: string
  /** The artifact that shows it. Must exist in the catalog. */
  example: { level: GlossaryLevel; id: string }
  /** Slugs of other terms worth reading next. */
  see?: string[]
}

export interface GlossaryGroup {
  id: string
  title: string
  /** One line on what the group covers, shown under its heading. */
  blurb: string
  terms: GlossaryTerm[]
}

export const GLOSSARY: GlossaryGroup[] = [
  /* ---------------------------------------------------------------- *
   *  Page anatomy
   * ---------------------------------------------------------------- */
  {
    id: 'page-anatomy',
    title: 'Page anatomy',
    blurb:
      'The named parts of a marketing page or an application frame — the vocabulary a brief is written in.',
    terms: [
      {
        slug: 'hero',
        term: 'Hero',
        aka: ['hero section', 'masthead'],
        definition:
          'The first section of a page: a headline, a sentence under it, and the one action you want taken. It is the only part of a page most visitors read.',
        inPractice:
          'A hero fails on the headline, not the layout. If the headline could appear on a competitor’s site with the logo swapped, the section is decoration. Split heroes want a product screenshot on the right; if you do not have one yet, centre it rather than filling the space with an illustration of nothing.',
        example: { level: 'block', id: 'hero-split' },
        see: ['call-to-action', 'social-proof'],
      },
      {
        slug: 'bento-grid',
        term: 'Bento grid',
        aka: ['bento box', 'asymmetric feature grid'],
        definition:
          'A features grid of deliberately unequal cells — one large, several small — named after the compartmented Japanese lunchbox.',
        inPractice:
          'The point is the asymmetry: the big cell is a claim that one feature matters more than the others. A bento grid where every tile is the same size is a card grid, and a bento grid where the big tile holds your fourth-best feature is worse than one. Pick the lead cell first, then fill in around it.',
        example: { level: 'block', id: 'bento-features' },
        see: ['hero'],
      },
      {
        slug: 'social-proof',
        term: 'Social proof',
        aka: ['logo cloud', 'logo wall', 'trust bar'],
        definition:
          'Evidence that other people already decided you were fine — customer logos, user counts, ratings, testimonials — placed where a visitor is deciding whether to keep reading.',
        inPractice:
          'Position is the whole mechanism: proof goes immediately after a claim, because it is what buys attention for the next section. A logo strip works with six real logos and stops working at twenty, where it reads as a list of anyone who ever signed up. If you cannot name customers, count something true instead.',
        example: { level: 'block', id: 'logo-cloud' },
        see: ['hero', 'carousel'],
      },
      {
        slug: 'call-to-action',
        term: 'Call to action',
        aka: ['CTA'],
        definition:
          'The control that asks for the one thing the page exists to get — a signup, a purchase, a booked call — and the copy around it.',
        inPractice:
          'One per section, and the label says what happens next rather than what the button is: “Start free” beats “Submit”, and “Book a demo” beats “Learn more”, which asks for nothing. Two equally weighted buttons is not a choice, it is a delay — make one of them a quiet link.',
        example: { level: 'block', id: 'cta-split-panel' },
        see: ['hero', 'pricing-table'],
      },
      {
        slug: 'app-shell',
        term: 'App shell',
        aka: ['application frame', 'chrome'],
        definition:
          'The persistent frame an application lives inside — sidebar, top bar, content region — that stays put while the middle changes.',
        inPractice:
          'The shell is the thing that has to survive every route, so it is where responsive decisions get expensive: a sidebar that collapses to icons at one breakpoint and to a drawer at another is two layouts plus the state that remembers which. Decide the collapsed behaviour before you build any page that sits inside it.',
        example: { level: 'block', id: 'dashboard-shell' },
        see: ['navbar', 'drawer'],
      },
      {
        slug: 'footer',
        term: 'Footer',
        aka: ['site footer', 'mega footer'],
        definition:
          'The block at the bottom of every page carrying navigation, legal links and contact routes.',
        inPractice:
          'It is the only place every page links to every section, which makes it the site’s real map — for crawlers and for anyone who scrolled to the bottom because the nav did not have what they wanted. A footer with four links is a missed index; one with eighty columns is a sitemap someone forgot to edit.',
        example: { level: 'block', id: 'footer-mega' },
        see: ['navbar'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Navigation
   * ---------------------------------------------------------------- */
  {
    id: 'navigation',
    title: 'Navigation and wayfinding',
    blurb:
      'How someone gets around, and how they know where they are while doing it.',
    terms: [
      {
        slug: 'navbar',
        term: 'Navbar',
        aka: ['navigation bar', 'top bar', 'header'],
        definition:
          'The horizontal strip at the top of a page holding the logo, the primary destinations and usually one action.',
        inPractice:
          'Five or six items is the working limit — past that nobody reads it, they search. The logo goes left and links home; the one action goes right and is the only thing in the bar with a filled background. If the bar sticks on scroll, give it a background, because transparent sticky navs become unreadable the moment they cross an image.',
        example: { level: 'block', id: 'navbar-simple' },
        see: ['mega-menu', 'hamburger-menu', 'footer'],
      },
      {
        slug: 'mega-menu',
        term: 'Mega menu',
        aka: ['dropdown panel'],
        definition:
          'A navigation dropdown that opens into a full-width panel of grouped links rather than a single column.',
        inPractice:
          'Worth it only when you have enough destinations that grouping is information — a panel with six links in one column is a dropdown with extra steps. The cost is hover: a panel that opens on hover and closes the instant the pointer leaves the trigger is unusable, so either open on click or give the pointer a forgiving path between trigger and panel.',
        example: { level: 'block', id: 'navbar-mega-menu' },
        see: ['navbar'],
      },
      {
        slug: 'hamburger-menu',
        term: 'Hamburger menu',
        aka: ['drawer nav', 'mobile menu'],
        definition:
          'The three-line button that opens the navigation on narrow screens, usually into a panel that slides in from an edge.',
        inPractice:
          'It hides everything behind one tap, which is the right trade on a phone and a bad one on a desktop where the links would have fit. Whatever it opens has to trap focus and close on Escape, or a keyboard user tabs straight past the menu into the page behind it.',
        example: { level: 'block', id: 'nav-mobile-drawer' },
        see: ['navbar', 'drawer'],
      },
      {
        slug: 'breadcrumb',
        term: 'Breadcrumb',
        aka: ['breadcrumb trail'],
        definition:
          'A single line of links showing the path from the site root to the current page.',
        inPractice:
          'It answers “where am I” and “how do I go up one level” — the second is the one people actually use, and it is why the browser back button is not a substitute for anyone who arrived from search. Only worth adding when the hierarchy is real; a breadcrumb on a flat site is a decoration that invents structure.',
        example: { level: 'effect', id: 'blue-breadcrumb-trail-5693' },
        see: ['navbar', 'stepper'],
      },
      {
        slug: 'tabs',
        term: 'Tabs',
        aka: ['tab bar'],
        definition:
          'A row of labels where selecting one swaps the panel below it, with only one panel visible at a time.',
        inPractice:
          'Tabs are for content that is genuinely alternative — the same kind of thing, seen one at a time. They are the wrong control for a sequence (that is a stepper) and for content people need to compare, because comparison across a tab switch is done from memory. Anything you hide in a tab is invisible to a reader scanning the page and to anyone using find-in-page.',
        example: { level: 'effect', id: 'blue-underline-tabs-4021' },
        see: ['segmented-control', 'accordion', 'stepper'],
      },
      {
        slug: 'segmented-control',
        term: 'Segmented control',
        aka: ['toggle group', 'button group selector'],
        definition:
          'Two to five adjacent buttons in one track where exactly one is selected — a radio group that looks like a switch.',
        inPractice:
          'Use it when the options are short, mutually exclusive, and worth showing all at once; past five segments the labels start truncating and it should be a select. The difference from tabs is scope: tabs swap a panel, a segmented control changes a setting that the surrounding view reacts to.',
        example: { level: 'primitive', id: 'segmented-control' },
        see: ['tabs', 'toggle'],
      },
      {
        slug: 'command-palette',
        term: 'Command palette',
        aka: ['⌘K menu', 'quick switcher'],
        definition:
          'A keyboard-opened overlay that searches every destination and action in the product from one input.',
        inPractice:
          'It is the escape hatch that lets the rest of the navigation stay small — features that do not deserve a nav item live here. It earns its place only if it covers actions as well as pages; a palette that only navigates is a search box with a shortcut. Bind it to ⌘K and Ctrl+K both, and show the hint somewhere, because nobody discovers a shortcut by accident.',
        example: { level: 'block', id: 'command-palette' },
        see: ['combobox', 'navbar'],
      },
      {
        slug: 'stepper',
        term: 'Stepper',
        aka: ['wizard', 'progress steps'],
        definition:
          'A numbered sequence of stages shown above a multi-step flow, marking what is done, what is current and what is left.',
        inPractice:
          'Its job is to bound the task: people abandon a long form because they cannot see the end of it, not because it is long. So show the real number of steps, never add one mid-flow, and let completed steps be clickable — a sequence you cannot walk back up is an interrogation.',
        example: { level: 'primitive', id: 'stepper' },
        see: ['tabs', 'progress-bar', 'breadcrumb'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Forms and input
   * ---------------------------------------------------------------- */
  {
    id: 'forms',
    title: 'Forms and input',
    blurb:
      'The controls people type into, and the small parts around them that decide whether a form is finishable.',
    terms: [
      {
        slug: 'form-field',
        term: 'Form field',
        aka: ['field', 'form control'],
        definition:
          'One input together with everything attached to it: its label, its help text, its error message and the association between them.',
        inPractice:
          'The field is the unit, not the input — which is why a placeholder is not a label. Placeholders vanish the moment someone types, so the person checking their own work has nothing to check it against, and screen readers treat them inconsistently. Help text goes above the input where it can prevent the error; the error goes below, where it reports one.',
        example: { level: 'primitive', id: 'field' },
        see: ['inline-validation', 'focus-ring', 'input-group'],
      },
      {
        slug: 'input-group',
        term: 'Input group',
        aka: ['affix', 'addon', 'prefix/suffix'],
        definition:
          'An input with fixed text or a control fused to one end — a currency symbol, a domain suffix, a unit, a button.',
        inPractice:
          'The affix is for the part of the value that is always the same, and it is worth the markup because it removes a whole class of error: nobody types the currency twice or forgets the protocol. Keep the affix out of the value you submit, and remember it is not a label — “https://” tells you the format, not what the field is for.',
        example: { level: 'primitive', id: 'input-group' },
        see: ['form-field'],
      },
      {
        slug: 'combobox',
        term: 'Combobox',
        aka: ['autocomplete', 'typeahead'],
        definition:
          'A text input with a filtered list of suggestions under it, where typing narrows the list and a selection fills the input.',
        inPractice:
          'It is the control for a set too long to scroll and too fixed to free-type. The decisions that matter are all about the empty and losing cases: what shows before anyone types, what shows when nothing matches, and whether a value that is not in the list is allowed. Arrow keys must move through the options and Escape must close the list without clearing the input.',
        example: { level: 'primitive', id: 'combobox' },
        see: ['command-palette', 'form-field'],
      },
      {
        slug: 'otp-input',
        term: 'One-time code input',
        aka: ['OTP input', 'verification code'],
        definition:
          'A row of single-character boxes for a short code sent by SMS, email or an authenticator app.',
        inPractice:
          'Almost everyone arrives at this by pasting, so the first box must accept a whole code and distribute it — an implementation that only accepts one character per box is the single most common bug in this control. Set `autocomplete="one-time-code"` so phones offer the code from the notification, and never clear every box on a wrong code.',
        example: { level: 'primitive', id: 'verification-code-input' },
        see: ['form-field', 'inline-validation'],
      },
      {
        slug: 'date-picker',
        term: 'Date picker',
        aka: ['calendar picker'],
        definition:
          'A calendar popover for choosing a date, usually paired with a text input that accepts a typed one.',
        inPractice:
          'Always keep the typed input. A calendar is faster for “next Thursday” and much slower for a birthday, and picking 1987 by clicking a month arrow is a punishment. The hard parts are not the grid: they are the time zone the date is stored in and what a range picker does when the second click lands before the first.',
        example: { level: 'primitive', id: 'date-picker' },
        see: ['form-field', 'popover'],
      },
      {
        slug: 'dropzone',
        term: 'Dropzone',
        aka: ['file drop area', 'upload area'],
        definition:
          'A bordered region that accepts files dropped onto it, and also opens a file browser when clicked.',
        inPractice:
          'Drag-and-drop is the affordance people notice and the one they use least — it does not exist on a phone and it is awkward on a laptop trackpad, so the click path has to be a real button, not a hint. State what you accept and how large before the upload fails, and show per-file progress rather than one bar for the batch.',
        example: { level: 'block', id: 'file-dropzone' },
        see: ['progress-bar', 'error-state'],
      },
      {
        slug: 'toggle',
        term: 'Toggle',
        aka: ['switch'],
        definition:
          'A two-state control that turns something on or off, styled as a sliding knob in a track.',
        inPractice:
          'A toggle means the change takes effect now; a checkbox means it takes effect when the form is submitted. Mixing them is why a settings page feels unreliable. Label the thing being controlled, not the state — “Email notifications”, not “Enable email notifications”, which reads as off when it is on.',
        example: { level: 'effect', id: 'blue-ios-switch-md-2357' },
        see: ['segmented-control', 'form-field'],
      },
      {
        slug: 'focus-ring',
        term: 'Focus ring',
        aka: ['focus indicator', 'focus outline'],
        definition:
          'The visible outline a control gets when it holds keyboard focus, showing where the next keystroke will land.',
        inPractice:
          'It is the single most removed and least replaceable piece of interface on the web: `outline: none` with nothing after it makes a form impossible to fill in by keyboard. If the default is ugly, replace it — a ring with real contrast against both the control and the page — and use `:focus-visible` so it appears for keyboards without following the mouse around.',
        example: { level: 'effect', id: 'blue-focus-ring-field-5543' },
        see: ['form-field', 'inline-validation'],
      },
      {
        slug: 'inline-validation',
        term: 'Inline validation',
        aka: ['field-level validation', 'live validation'],
        definition:
          'Error and success feedback shown next to the field it belongs to, rather than collected at the top on submit.',
        inPractice:
          'Timing is the entire design. Validating on every keystroke tells someone their email is invalid after one character; the rule that works is validate on blur, then re-validate on change once the field has already errored. Never signal state with colour alone — an icon or the message itself has to carry it too.',
        example: { level: 'effect', id: 'ocean-validation-states-7063' },
        see: ['form-field', 'error-state', 'focus-ring'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Overlays
   * ---------------------------------------------------------------- */
  {
    id: 'overlays',
    title: 'Overlays and transient surfaces',
    blurb:
      'Everything that appears over the page — and the rules about giving it back.',
    terms: [
      {
        slug: 'modal',
        term: 'Modal',
        aka: ['dialog', 'modal dialog'],
        definition:
          'A window over the page that blocks interaction with everything behind it until it is dismissed.',
        inPractice:
          'Modal means the rest of the app is unavailable, so it is justified by one of two things: a decision that cannot be deferred, or a destructive action worth confirming. Everything it needs must be inside it — a modal that sends you elsewhere to find a value has trapped you. Focus moves in on open, is trapped while open, Escape closes, and focus returns to whatever opened it.',
        example: { level: 'block', id: 'confirm-dialog' },
        see: ['scrim', 'drawer', 'popover'],
      },
      {
        slug: 'scrim',
        term: 'Scrim',
        aka: ['backdrop', 'overlay', 'dim layer'],
        definition:
          'The translucent layer between an overlay and the page behind it, dimming and often blurring the content underneath.',
        inPractice:
          'It does two jobs — it says the page is unavailable, and it buys contrast for the panel on top of any content that happens to be behind it. Clicking it should dismiss anything cancellable and should not dismiss anything with unsaved input. Blur is expensive to composite; one scrim is fine, a scrim under an animated backdrop is a dropped frame.',
        example: { level: 'effect', id: 'ocean-blur-backdrop-dialog-3773' },
        see: ['modal', 'drawer'],
      },
      {
        slug: 'drawer',
        term: 'Drawer',
        aka: ['slide-over', 'side panel', 'off-canvas panel'],
        definition:
          'A panel that slides in from an edge of the screen and sits over the page, usually with the page still visible beside it.',
        inPractice:
          'The reason to reach for one over a modal is context: a drawer lets someone keep the list they came from on screen while working on one row of it. That only holds if the page behind stays legible — a drawer covering nine-tenths of the viewport is a modal with a slower animation. Same keyboard contract as a modal: trap focus, close on Escape, restore focus.',
        example: { level: 'block', id: 'slide-over-panel' },
        see: ['modal', 'scrim', 'hamburger-menu', 'cart-drawer'],
      },
      {
        slug: 'tooltip',
        term: 'Tooltip',
        definition:
          'A small label that appears on hover or focus to name or explain the control it is attached to.',
        inPractice:
          'A tooltip is for a hint, never for information required to complete the task — it is invisible on touch, gone the moment the pointer moves, and unreachable if it only opens on hover. The classic misuse is the icon-only button whose meaning lives entirely in its tooltip; that button needs an accessible name regardless, and the tooltip should repeat it rather than be it.',
        example: { level: 'effect', id: 'blue-top-tooltip-md-2587' },
        see: ['popover'],
      },
      {
        slug: 'popover',
        term: 'Popover',
        aka: ['hover card', 'flyout'],
        definition:
          'A positioned panel anchored to a trigger that can hold real content — text, controls, links — and stays open until dismissed.',
        inPractice:
          'The distinction from a tooltip is interactivity: if there is anything inside worth clicking, it is a popover and it must open on click, not hover. The hard part is positioning — it has to flip when it would run off the bottom of the viewport and shift when it would run off the side, which is why this is the one overlay usually worth a library.',
        example: { level: 'effect', id: 'ocean-profile-popover-8183' },
        see: ['tooltip', 'modal', 'date-picker'],
      },
      {
        slug: 'toast',
        term: 'Toast',
        aka: ['snackbar', 'notification'],
        definition:
          'A short message that appears in a corner after an action and dismisses itself.',
        inPractice:
          'Toasts are for confirmation, not for errors that need a decision — anything the person must act on will be missed, because a toast leaves on a timer and is off-screen from wherever they were looking. The best ones carry an Undo, which is how you replace a confirmation dialog with something people do not have to read. Stack them; never queue them one at a time.',
        example: { level: 'effect', id: 'ocean-toast-stack-6327' },
        see: ['modal', 'error-state', 'badge'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Loading and status
   * ---------------------------------------------------------------- */
  {
    id: 'status',
    title: 'Loading and status',
    blurb:
      'What the interface shows when it has nothing to show yet, nothing to show at all, or something has gone wrong.',
    terms: [
      {
        slug: 'skeleton',
        term: 'Skeleton',
        aka: ['skeleton screen', 'placeholder loader'],
        definition:
          'Grey shapes standing in for content that has not arrived, laid out in the same positions the real content will occupy.',
        inPractice:
          'It beats a spinner because it makes the wait feel shorter and stops the page jumping when data lands — but only if the shapes match the real layout. A skeleton of three rows that resolves into eight is worse than a blank space. Do not show one for a wait under about 200ms; the flash costs more than the wait did.',
        example: { level: 'primitive', id: 'skeleton' },
        see: ['shimmer', 'spinner', 'empty-state'],
      },
      {
        slug: 'shimmer',
        term: 'Shimmer',
        aka: ['loading shimmer', 'skeleton animation'],
        definition:
          'The band of light that sweeps across a skeleton to show the wait is still progressing.',
        inPractice:
          'It is the difference between “loading” and “broken” — a static grey block reads as a rendering bug after a couple of seconds. It also runs forever by definition, so it belongs behind `prefers-reduced-motion` and should stop when the content arrives rather than fading under it.',
        example: { level: 'effect', id: 'ocean-wave-shimmer-md-2867' },
        see: ['skeleton', 'spinner'],
      },
      {
        slug: 'spinner',
        term: 'Spinner',
        aka: ['loader', 'activity indicator'],
        definition:
          'A small looping animation shown while an operation of unknown length is running.',
        inPractice:
          'Right for a button that is submitting, wrong for a page that is loading — a full-screen spinner tells you nothing and a skeleton tells you what is coming. A spinner inside a button must also disable it, or the form gets submitted three times. If the wait exceeds a few seconds, replace the spin with words about what is happening.',
        example: { level: 'effect', id: 'blue-ring-spinner-norm-0490' },
        see: ['skeleton', 'progress-bar'],
      },
      {
        slug: 'progress-bar',
        term: 'Progress bar',
        aka: ['progress indicator', 'meter'],
        definition:
          'A bar that fills to show how much of a task is done, out of a known total.',
        inPractice:
          'Determinate only. If you do not know the total, you have a spinner, and a fake bar that sits at 90% is the reason people distrust all of them. A bar that can go backwards should say why. For a quantity rather than a task — storage used, quota remaining — the same shape is a meter, and it needs a threshold before it means anything.',
        example: { level: 'effect', id: 'blue-striped-progress-md-3475' },
        see: ['spinner', 'stepper', 'sparkline'],
      },
      {
        slug: 'empty-state',
        term: 'Empty state',
        aka: ['zero state', 'blank slate'],
        definition:
          'What a list, table or dashboard shows when it has no data — because it is new, or because a filter matched nothing.',
        inPractice:
          'Those two cases are different screens and get built as one, which is the usual bug: a first-run empty state should teach and offer the action that creates the first record, while a no-results empty state should show what was searched and offer to clear it. Neither is a shrug emoji. The first-run one is also the most-seen screen in the product and usually the least designed.',
        example: { level: 'block', id: 'empty-state-cta' },
        see: ['error-state', 'data-table', 'skeleton'],
      },
      {
        slug: 'error-state',
        term: 'Error state',
        aka: ['failure state', 'retry state'],
        definition:
          'What a region shows when its data failed to load or an action failed to complete, in place of the content.',
        inPractice:
          'Three things or it is not finished: what failed, whether it was their fault, and a way to try again without losing what they had typed. Scope it to the region that failed rather than replacing the whole page — one dead chart should not take the dashboard with it. Put the technical detail behind a disclosure, not in the headline.',
        example: { level: 'block', id: 'error-state-retry' },
        see: ['empty-state', 'toast', 'inline-validation'],
      },
      {
        slug: 'badge',
        term: 'Badge',
        aka: ['pill', 'label', 'count indicator'],
        definition:
          'A small coloured label carrying a status, a category or a count, attached to something else.',
        inPractice:
          'Badges are cheap to add and quietly expensive: once a row has four of them nothing stands out, which is the opposite of the point. Colour must never be the only signal — the word is the content, the colour is emphasis. A numeric badge needs a cap (“99+”) or it eventually breaks the layout that holds it.',
        example: { level: 'primitive', id: 'badge' },
        see: ['chip', 'toast'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Data display
   * ---------------------------------------------------------------- */
  {
    id: 'data',
    title: 'Data display',
    blurb: 'Ways of putting many records on one screen without losing the reader.',
    terms: [
      {
        slug: 'data-table',
        term: 'Data table',
        aka: ['grid', 'table view'],
        definition:
          'Rows and columns of records with per-column sorting, and usually selection, filtering and row actions.',
        inPractice:
          'The table is easy; the surrounding contract is not. Sort, filter and page state should live in the URL so a view can be shared and survives a refresh. Keep the header visible when the body scrolls, right-align numbers so digits line up, and never put a destructive action in a row without a confirmation — mis-clicks in dense rows are constant.',
        example: { level: 'block', id: 'data-table-sortable' },
        see: ['pagination', 'empty-state', 'kanban'],
      },
      {
        slug: 'pagination',
        term: 'Pagination',
        aka: ['pager', 'paging'],
        definition:
          'Splitting a long result set across numbered pages, with controls to move between them and a page-size choice.',
        inPractice:
          'Choose against infinite scroll deliberately: pagination gives a stable position, a reachable footer and a shareable URL, and infinite scroll gives none of those. Always show the total, or at least the current range — “Page 3” with no end in sight is a corridor. Offset paging drifts when rows are inserted mid-read; cursors do not.',
        example: { level: 'block', id: 'data-table-pagination' },
        see: ['data-table'],
      },
      {
        slug: 'kanban',
        term: 'Kanban board',
        aka: ['board view', 'column board'],
        definition:
          'Records as cards in vertical columns, where the column is a status and moving a card between columns changes it.',
        inPractice:
          'It works when there are few statuses and the transition is the main verb; it collapses when any column holds hundreds of cards, because a board has no equivalent of sort. Drag has to have a keyboard path — move-to-column on the card menu is the usual answer — and the state should update optimistically, because the drop is meant to feel like the change.',
        example: { level: 'block', id: 'kanban-board' },
        see: ['data-table', 'timeline'],
      },
      {
        slug: 'timeline',
        term: 'Timeline',
        aka: ['activity feed', 'audit trail'],
        definition:
          'Events in time order down a vertical line, each with an actor, an action and a timestamp.',
        inPractice:
          'The unit of value is the entry, and the entry is a sentence: who did what to which thing. Group by day so the line does not read as one undifferentiated stream, show relative time with the absolute time on hover, and resist making every entry expandable — a feed where everything is collapsed is a list of nothing.',
        example: { level: 'block', id: 'activity-timeline' },
        see: ['kanban', 'reasoning-trace'],
      },
      {
        slug: 'sparkline',
        term: 'Sparkline',
        definition:
          'A tiny chart with no axes, sitting beside a number to show the trend behind it.',
        inPractice:
          'It answers one question — up or down, and roughly how steadily — so stripping the axes is the design rather than a shortcut. That also means it cannot carry a value anyone will read off it; pair it with the number and the change. Fix the baseline across a row of them or the shapes are not comparable, which is the only reason to put them in a row.',
        example: { level: 'block', id: 'metric-sparkline-cards' },
        see: ['progress-bar', 'data-table'],
      },
      {
        slug: 'accordion',
        term: 'Accordion',
        aka: ['disclosure', 'collapsible'],
        definition:
          'A stack of headings that expand to reveal their content, usually with one or several open at a time.',
        inPractice:
          'Right when the headings are scannable and most readers want one of them — an FAQ is the archetype. Wrong for content everybody has to read, which it makes longer rather than shorter. Build it on `<details>` where you can: it is keyboard-operable and findable by the browser’s own find-in-page for free, which a div-based one is not.',
        example: { level: 'effect', id: 'blue-details-accordion-4103' },
        see: ['tabs', 'carousel'],
      },
      {
        slug: 'carousel',
        term: 'Carousel',
        aka: ['slider', 'slideshow'],
        definition:
          'A horizontal track of items showing a few at a time, advanced by arrows, dots, swipe or a timer.',
        inPractice:
          'Almost nobody sees slide two, which makes a carousel a good way to show that more exists and a bad way to show anything important — never put a single key message on a rotating slide. Auto-advance is the part to drop first: it moves content out from under a reader and is a `prefers-reduced-motion` problem. Let the track be a real scroll container so touch and trackpads work without any script.',
        example: { level: 'block', id: 'testimonial-carousel' },
        see: ['social-proof', 'marquee'],
      },
      {
        slug: 'avatar-stack',
        term: 'Avatar stack',
        aka: ['avatar group', 'facepile'],
        definition:
          'Several profile images overlapped in a row, usually ending in a count of the ones not shown.',
        inPractice:
          'It compresses “who is involved” into about the width of two avatars, and the overflow count is doing most of the work — show three or four faces, then “+12”. Every avatar still needs a name available on hover and to a screen reader, or the row announces as a series of images.',
        example: { level: 'primitive', id: 'avatar-group' },
        see: ['badge', 'chip'],
      },
      {
        slug: 'chip',
        term: 'Chip',
        // "Pill" is deliberately not here — it is `badge`'s. Both are fair
        // names for both shapes, and letting each claim it sends a reader
        // looking up the word to whichever one sorts first.
        aka: ['tag', 'token'],
        definition:
          'A small removable element representing one selected value — a filter, a recipient, a label — usually with an ✕ on it.',
        inPractice:
          'The difference from a badge is agency: a badge is read, a chip is removed. So a chip needs a real button inside it with a name that says what it removes, and Backspace should delete the last one when the cursor is in the input beside it. A row of chips is also the clearest way to show which filters are currently applied.',
        example: { level: 'primitive', id: 'tag-chip' },
        see: ['badge', 'combobox'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Surface and motion
   * ---------------------------------------------------------------- */
  {
    id: 'surface',
    title: 'Surface and motion',
    blurb:
      'The visual vocabulary — the named finishes and movements that get asked for by name in a brief.',
    terms: [
      {
        slug: 'glassmorphism',
        term: 'Glassmorphism',
        aka: ['frosted glass', 'acrylic'],
        definition:
          'A surface treatment where a panel is translucent and blurs whatever is behind it, with a thin bright border to catch the edge.',
        inPractice:
          'It only reads as glass when there is something worth blurring behind it — over a flat background it is a grey box with a border. The two costs are real: text contrast depends on content you do not control, so it needs a tint under the blur, and `backdrop-filter` is recomposited every frame, which is why a page of frosted cards scrolls badly.',
        example: { level: 'effect', id: 'ocean-glass-card-md-3265' },
        see: ['scrim', 'gradient-border'],
      },
      {
        slug: 'gradient-border',
        term: 'Gradient border',
        aka: ['gradient ring', 'border beam'],
        definition:
          'A border whose colour changes along its length, often animated so the gradient travels around the shape.',
        inPractice:
          'CSS has no gradient border property, so every version is a trick: a gradient background with an inset mask, or `border-image`, or a rotating conic gradient behind a solid inner panel. The mask approach is the one that keeps a rounded corner clean. Animated ones loop forever, so gate the animation on `prefers-reduced-motion`.',
        example: { level: 'effect', id: 'ocean-hairline-gradient-ring-6123' },
        see: ['glow', 'glassmorphism'],
      },
      {
        slug: 'glow',
        term: 'Glow',
        aka: ['neon', 'bloom'],
        definition:
          'Coloured light spilling out from an element’s edges, made with layered shadows or a blurred copy behind it.',
        inPractice:
          'It reads as light only against a dark surface — on white it is a coloured smudge. Tint the glow from the element’s own colour rather than adding a second hue, and keep at most one glowing thing in view: glow is an emphasis mechanism, and two of them cancel out. A pulsing glow is an infinite animation and needs the same reduced-motion guard as everything else here.',
        example: { level: 'effect', id: 'glow-pulse-blue-md-button-0316' },
        see: ['gradient-border', 'focus-ring'],
      },
      {
        slug: 'parallax',
        term: 'Parallax',
        definition:
          'Layers that move at different speeds as the page scrolls or the pointer moves, so the nearer ones appear to sit in front.',
        inPractice:
          'The effect depends entirely on restraint — a few percent of differential reads as depth, and more reads as the page fighting the scroll. Anything tied to scroll position has to be cheap to compute, so drive it with transforms rather than layout properties. It is also one of the most reliable triggers of motion sickness, which makes the reduced-motion path mandatory rather than polite.',
        example: { level: 'effect', id: 'ocean-parallax-scene-10611' },
        see: ['marquee', 'glow'],
      },
      {
        slug: 'marquee',
        term: 'Marquee',
        aka: ['ticker', 'infinite scroller'],
        definition:
          'A row of content that slides continuously in one direction and loops, commonly used for logo strips and testimonials.',
        inPractice:
          'The loop is built by duplicating the content and translating by exactly half, so the seam never lands on screen — get that wrong by a pixel and it visibly stutters once per cycle. Fade both edges or items get sliced by the container. Pause on hover, and stop entirely under reduced motion: text that never stops moving cannot be read by everyone.',
        example: { level: 'effect', id: 'ocean-logo-marquee-7369' },
        see: ['carousel', 'social-proof'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  Commerce
   * ---------------------------------------------------------------- */
  {
    id: 'commerce',
    title: 'Commerce and conversion',
    blurb: 'The parts of an interface whose job is to get a decision made.',
    terms: [
      {
        slug: 'buy-box',
        term: 'Buy box',
        aka: ['purchase panel', 'add-to-cart panel'],
        definition:
          'The panel on a product page holding price, variant choices, stock status and the add-to-cart button.',
        inPractice:
          'Everything needed to decide has to be inside it, because on a long product page it is the only part that stays in view — which is why it is usually sticky on desktop. Variant selection is the fragile part: changing a size must update price, stock and image together, and an unavailable combination should be visibly unavailable rather than silently missing.',
        example: { level: 'block', id: 'product-buy-box' },
        see: ['cart-drawer', 'pricing-table'],
      },
      {
        slug: 'cart-drawer',
        term: 'Cart drawer',
        aka: ['mini cart', 'slide-out cart'],
        definition:
          'A panel that slides in to show the basket after something is added, without leaving the page.',
        inPractice:
          'It exists so adding a second item stays cheap — sending someone to a full cart page after every add is how a two-item order becomes a one-item order. Confirm what was added, show the running total, and offer both “keep shopping” and “checkout”. Open it on add; do not open it on hover.',
        example: { level: 'block', id: 'cart-drawer' },
        see: ['drawer', 'buy-box'],
      },
      {
        slug: 'pricing-table',
        term: 'Pricing table',
        aka: ['pricing tiers', 'plan picker'],
        definition:
          'Plans side by side, each with a price, a short list of what it includes and its own call to action.',
        inPractice:
          'Three tiers with one visibly recommended is the shape that works, because the middle is chosen relative to the other two. Show the price — a table of “Contact us” reads as expensive — and state the billing period next to the number rather than in a footnote. Feature lists should differ by what is added at each tier, not repeat the same eight rows with ticks.',
        example: { level: 'block', id: 'pricing-tiers' },
        see: ['comparison-table', 'call-to-action'],
      },
      {
        slug: 'comparison-table',
        term: 'Comparison table',
        aka: ['feature matrix'],
        definition:
          'A grid of features against plans or products, showing which rows each column includes.',
        inPractice:
          'It is the second screen, not the first: people come to it having narrowed to two options and needing one difference settled. So order rows by how often they decide it, keep the header row and the first column pinned while scrolling, and let a tick have a tooltip — “Included” and “Included, up to 5 seats” are different answers.',
        example: { level: 'block', id: 'comparison-table' },
        see: ['pricing-table', 'data-table'],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   *  AI interfaces
   * ---------------------------------------------------------------- */
  {
    id: 'ai',
    title: 'AI interfaces',
    blurb:
      'The patterns that did not exist five years ago, and the vocabulary that is still settling around them.',
    terms: [
      {
        slug: 'chat-thread',
        term: 'Chat thread',
        aka: ['conversation view', 'message thread'],
        definition:
          'The scrolling transcript of a conversation, alternating between the person’s messages and the model’s replies.',
        inPractice:
          'The scroll behaviour is the hard part: pin to the bottom while a reply is generating, and release the pin the instant the reader scrolls up, or reading an earlier message becomes impossible. Every assistant message needs copy, and the useful ones need regenerate and edit-and-resend, because the second attempt is where most of the value is.',
        example: { level: 'block', id: 'chat-thread-panel' },
        see: ['streaming-response', 'reasoning-trace'],
      },
      {
        slug: 'streaming-response',
        term: 'Streaming response',
        aka: ['token streaming', 'incremental rendering'],
        definition:
          'Rendering a model’s answer as it arrives, token by token, instead of waiting for the complete reply.',
        inPractice:
          'It is a perceived-latency fix rather than a speed one — the answer takes the same total time, but the wait before anything appears drops to almost nothing. The cost is that you are rendering half-finished Markdown: an unclosed code fence or table has to degrade gracefully rather than flicker. Always give a visible stop control; a long wrong answer is worse than a short one.',
        example: { level: 'block', id: 'chat-streaming-answer' },
        see: ['chat-thread', 'spinner'],
      },
      {
        slug: 'reasoning-trace',
        term: 'Reasoning trace',
        aka: ['thinking', 'chain of thought'],
        definition:
          'The model’s intermediate steps, shown separately from the answer — usually collapsed, and expandable when someone wants to check the work.',
        inPractice:
          'Collapsed by default is the whole design: the trace is there to be audited when the answer looks wrong, and shown inline it buries the answer. Label it as working rather than as fact, because it is neither guaranteed to be faithful nor something to quote. Streaming the trace live is the honest way to fill a long wait.',
        example: { level: 'block', id: 'agent-thinking-trace' },
        see: ['tool-call', 'timeline', 'streaming-response'],
      },
      {
        slug: 'tool-call',
        term: 'Tool call',
        aka: ['function call', 'action'],
        definition:
          'A record of the model invoking something outside itself — a search, an API, a file read — with its arguments and what came back.',
        inPractice:
          'Show the name and the arguments before showing the result, because that is the order in which someone checks whether it did the right thing. Collapse the payload but keep it reachable, mark running, succeeded and failed distinctly, and treat a failed call as content rather than an error state — the model’s next move usually depends on having seen it.',
        example: { level: 'primitive', id: 'tool-call' },
        see: ['reasoning-trace', 'human-in-the-loop'],
      },
      {
        slug: 'citation',
        term: 'Citation',
        aka: ['source chip', 'grounding reference'],
        definition:
          'A reference from a generated sentence back to the source it came from, usually an inline marker that opens the passage.',
        inPractice:
          'The value is in being checkable, so the citation has to land on the specific passage rather than the document — a link to a 40-page PDF is decoration. Attach them to claims, not to paragraphs, and make an uncited claim visibly uncited. This is the main interface-level defence against a confident wrong answer.',
        example: { level: 'primitive', id: 'citation-chip' },
        see: ['reasoning-trace', 'chip'],
      },
      {
        slug: 'human-in-the-loop',
        term: 'Human in the loop',
        aka: ['approval gate', 'confirmation step'],
        definition:
          'A checkpoint where an agent stops and asks a person to approve an action before it takes effect.',
        inPractice:
          'The gate is only worth anything if the request is specific: “Allow this action?” gets approved reflexively, while “Delete 412 rows from `customers`?” does not. Show exactly what will happen, make rejection as easy as approval, and give the person somewhere to say why — and decide up front which actions are reversible enough not to need a gate at all, because a flow that asks about everything trains people to stop reading.',
        example: { level: 'block', id: 'approval-request-card' },
        see: ['tool-call', 'modal'],
      },
    ],
  },
]

/* ------------------------------------------------------------------ *
 *  Derived
 * ------------------------------------------------------------------ */

/** Every term, flattened, in group order. */
export const GLOSSARY_TERMS: GlossaryTerm[] = GLOSSARY.flatMap((g) => g.terms)

/** How many terms the glossary defines. One integer, safe to import anywhere. */
export const GLOSSARY_COUNT = GLOSSARY_TERMS.length

const BY_SLUG = new Map(GLOSSARY_TERMS.map((t) => [t.slug, t]))

/** Look up one term by slug. */
export function getTerm(slug: string): GlossaryTerm | undefined {
  return BY_SLUG.get(slug)
}

/**
 * Every term in alphabetical order, for the A–Z index.
 *
 * Sorted on `term` rather than `slug` because the index shows the headword,
 * and "One-time code input" filing under `o` while its slug says `otp-input`
 * would put it under the wrong letter.
 */
export const GLOSSARY_ALPHABETICAL: GlossaryTerm[] = [...GLOSSARY_TERMS].sort((a, b) =>
  a.term.localeCompare(b.term, 'en'),
)
