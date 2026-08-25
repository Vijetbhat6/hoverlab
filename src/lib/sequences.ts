/**
 * Written email sequences, as content rather than as a schedule.
 *
 * The one channel agents do not disintermediate is the one where somebody
 * already knows your name. Search rankings get re-ranked, an MCP server is a
 * config line an assistant can swap, a registry entry is one of forty — but
 * a person who typed the domain into a bar, or opened an email because the
 * last one was useful, arrived for reasons no intermediary controls. The two
 * healthiest catalogs in this category run on 56–57% direct traffic. Nothing
 * we ship builds that; this is the first thing that tries.
 *
 * WHY THE COPY LIVES IN THE REPO
 *
 * There is no mail provider wired up (see `components/landing/newsletter-
 * signup.tsx`), so nothing here sends. That is deliberate ordering, not an
 * oversight: the addresses are being collected and the sequence they will
 * receive is written and reviewable, so the first send is a provider
 * integration rather than a provider integration plus five emails written
 * under time pressure on the day.
 *
 * Keeping the copy in the repo also means it is diffed, reviewed and
 * versioned like everything else. An email that makes a claim about the
 * licence or the price is a claim the product has to keep, and copy that
 * lives only in a marketing tool drifts from the code with nothing to catch
 * it. Every factual claim below is a link to a page that states it.
 *
 * WHO THIS SEQUENCE IS FOR
 *
 * Envato's displaced authors — people who built and sold themes and
 * templates on ThemeForest, whose marketplace income has fallen away. They
 * are the warmest available segment for one specific reason: they already
 * believe that a well-built component is worth money, which is the belief
 * every other acquisition channel has to manufacture.
 *
 * What they are NOT being offered is a marketplace to sell through. That
 * idea stays rejected, and the sequence says so in the first email rather
 * than letting anyone read three of them before finding out. Nothing costs
 * more trust than a sequence that withholds its own premise.
 */

export interface SequenceEmail {
  /** Days after signup. 0 is immediate. */
  day: number
  subject: string
  /** Plain text. Formatting belongs to whatever eventually sends this. */
  body: string
}

/**
 * Every `source` the signup endpoint accepts.
 *
 * Lives here rather than in the route because it is really a property of
 * this file: a source is a promise that somebody who signed up there gets
 * something, and the route validating a value that enrols nobody into
 * anything is how five of the six came to do exactly that. `route.ts`
 * imports this set, and `sequences.test.ts` asserts every member of it
 * reaches a sequence.
 */
export const SIGNUP_SOURCES = [
  'landing',
  'pricing',
  'footer',
  'docs',
  'tools',
  'authors',
] as const

export type SignupSource = (typeof SIGNUP_SOURCES)[number]

export interface Sequence {
  id: string
  /**
   * The `source` values recorded at signup that enrol someone here.
   *
   * A list rather than one string. Four of the six sources — the landing
   * page, the pricing page, the footer and the docs — are the same person
   * arriving at the same catalog from a different scroll position, and
   * writing four nearly identical sequences to honour a one-to-one mapping
   * would produce four things to keep in step and no extra relevance.
   *
   * Where the segment genuinely differs, it gets its own: someone who came
   * for a free contrast checker has not decided to evaluate a component
   * catalog, and someone who sold on ThemeForest is starting from a belief
   * the others do not hold.
   */
  sources: SignupSource[]
  audience: string
  emails: SequenceEmail[]
}

/**
 * For everyone who signed up from the catalog itself — the landing page,
 * the pricing page, the footer, the docs.
 *
 * The assumption this sequence makes about its reader is narrow and worth
 * stating: they have seen the catalog and did not buy. That is not a
 * failure to be pursued. Most of them are on a project that has not started
 * yet, and the useful thing is to still be legible to them when it does.
 *
 * So it is short, it is spaced wider than the author sequence, and it sells
 * the licence exactly once. The rest is the two things a returning reader
 * cannot get from the site without knowing where to look: how the four ways
 * in differ, and what has actually been added lately.
 */
export const CATALOG_SEQUENCE: Sequence = {
  id: 'catalog',
  sources: ['landing', 'pricing', 'footer', 'docs'],
  audience: 'Developers who found the catalog and have not bought',
  emails: [
    {
      day: 0,
      subject: 'Start here: nothing is behind the payment',
      body: `You signed up from the catalog, so the most useful thing to say
first is what you can do without paying us anything, because it is nearly
everything.

Open any effect, block, page or template. Read its source — the same file
its preview renders from, not a cleaned-up copy. Customise it, copy it,
install it with npx. Use the API without a key. Point an editor agent at the
MCP server. None of that needs an account, and none of it is a trial.

What Pro buys is the right to ship what you copied in commercial work. That
is the only thing that was ever being withheld, and it is why there is no
gate anywhere else.

Four more emails over the next month: the licence line, the four ways in,
and what has been added. Then nothing unless something is.`,
    },
    {
      day: 4,
      subject: 'The four ways in, and which one you want',
      body: `The same artifact is reachable four ways. Which one is right
depends on how you work, and most people only ever find the first.

  The site. Open anything, read the source, copy it. No account.

  npx hoverlab add <id>. Detects your framework, writes to the right paths,
  and tells you which dependencies you still need.

  npx shadcn add. If your project already has a components.json, the whole
  catalog is one registry entry away — including a base preset that installs
  the tokens, fonts and config in one command: hoverlab.dev/docs/registry

  An editor agent. There is an MCP server, so Claude or Cursor can search
  the catalog and install from it without you leaving the file you are in.

The third and fourth are the ones worth ten minutes of setup. After that you
stop browsing a catalog and start asking for components by description.`,
    },
    {
      day: 11,
      subject: 'The one line in the licence that matters',
      body: `Short, because most of the licence is boilerplate and one line
is not.

Free covers personal and non-commercial work. Pro covers work you are paid
for — client sites, your own products, work for an employer — unlimited
projects, unlimited clients, bought once, no per-project fee.

The line: you may not repackage the catalog and sell it as a theme, a
template pack or a UI kit. Building something substantial with these
components and selling that is exactly what Pro is for. Rearranging the
components and selling those is not, at any tier.

It is written out in full rather than left to a support email:
  hoverlab.dev/licence

If your situation sits on the boundary, reply and describe it. A straight
answer costs us nothing and a guess costs you a project.`,
    },
    {
      day: 25,
      subject: 'What has been added since you signed up',
      body: `The catalog grows in waves rather than continuously, and the
changelog is the honest version of what landed:
  hoverlab.dev/changelog

Worth knowing about if you have not looked since: several categories are
finished rather than paused — dividers, badges, skeletons, borders,
progress and scroll have the shapes that exist, and another wave there would
buy you a fifth kind of horizontal rule. The work is in blocks now, which is
where a real page actually gets built.

If something you needed was missing when you looked, reply and say what it
was. That list decides the next wave, and it is short enough that one reply
moves it.`,
    },
  ],
}

/**
 * For everyone who arrived at a free tool.
 *
 * The hardest sequence to write here, because the reader has not decided to
 * evaluate a component catalog. They searched for a contrast checker or a
 * cubic-bézier curve, got it, and gave us an address so their work would
 * survive a laptop reboot. Selling them a licence in the first email would
 * be answering a question they did not ask.
 *
 * So the whole sequence is one bridge, walked slowly: the tokens you just
 * made are the same tokens a thousand components are already styled
 * against. That is not a pitch, it is a fact about how the site is built,
 * and it is the only reason a tool visitor should care that a catalog
 * exists at all. The licence appears once, at the end, in two sentences.
 */
export const TOOLS_SEQUENCE: Sequence = {
  id: 'tools',
  sources: ['tools'],
  audience: 'People who came for a free designer tool',
  emails: [
    {
      day: 0,
      subject: 'Your presets are saved — and one thing worth knowing',
      body: `Whatever you saved is on your account now, on every machine you
sign in from. That is the whole reason the account exists; nothing about the
tools is metered and nothing gets taken away.

The one thing worth knowing, because the tools do not say it loudly enough:
they are not a side project next to the catalog. The tokens the generator
emits are the exact variables every component on this site is styled
against. Set a brand colour in the palette tool and the whole catalog
repaints in it — that is not a preview trick, it is the same CSS.

Which means the output of the tool you just used is directly installable:
  npx shadcn add @hoverlab/hoverlab

That command writes your token set, the fonts and the config into a project
in one go. Everything else in the catalog is styled to match it.`,
    },
    {
      day: 6,
      subject: 'The other nineteen tools',
      body: `Most people find one of these through a search and never learn
the rest exist, so: hoverlab.dev/tools

The ones people come back for:

  Tokens — a full light and dark shadcn variable set, colour maths in OKLCH
  Spacing and Typography — scales that stay consistent across breakpoints
  Contrast — WCAG AA and AAA, checked as you drag
  Easing, Shadow, Clip-path, Border-radius — the fiddly CSS, tuned by eye
  Favicon, Meta and OG — the boring launch-day checklist, in one pass

All free, all saveable to your account, none of them behind anything.

Nobody else bundles a tool suite into a component catalog — the tool sites
have no components and the component catalogs have no tools. That
combination is the actual reason to keep the tab open.`,
    },
    {
      day: 18,
      subject: 'When you next start a project',
      body: `Last email in this sequence. After this you only hear from us
when something is added.

When you next start something from scratch, the sequence that saves the most
time is: tune your tokens in the generator, install them with the one
command, then build the page out of blocks that are already styled against
them. No theming pass at the end, because there is nothing to re-theme.

The catalog itself is free to read, copy and install — all of it, no
account. A Pro licence is what you buy when the work is commercial, once,
covering unlimited projects and clients. That is the only wall on the site,
and now you know where it is: hoverlab.dev/licence

Reply if a tool is missing something. Those replies are why several of them
have the features they have.`,
    },
  ],
}

export const AUTHOR_SEQUENCE: Sequence = {
  id: 'authors',
  sources: ['authors'],
  audience: 'Marketplace theme and template authors',
  emails: [
    {
      day: 0,
      subject: 'What this is, and what it is not',
      body: `You signed up from the page for marketplace authors, so the first
thing to say is the thing that page says: Hoverlab is not a marketplace and
we are not planning to become one. You cannot sell your work through us.

If that was what you were hoping for, unsubscribe now with the link at the
bottom and no hard feelings — it is a real thing to want and we are not it.

What we are is the catalog you build client work out of. Around a thousand
effects, blocks, pages and templates, all readable and copyable without an
account, installable with npx, and covered by a commercial licence that is
written down in public rather than implied on a pricing card.

The next email is about that licence, because it is the part authors ask
about first and it is the part most component libraries are vague on.`,
    },
    {
      day: 2,
      subject: 'The licence, in the part that matters to you',
      body: `You have read more marketplace licences than most people alive, so
this will be short.

Free covers personal and non-commercial work. Pro covers work you are paid
for — client sites, your own products, work for an employer — for unlimited
projects and unlimited clients, bought once, with no per-project fee.

The part you are checking for: you may not repackage the catalog and sell it
as a theme, a template pack or a UI kit. Building something substantial with
these components and selling that is exactly what Pro is for. Rearranging
the components and selling those is not, at any tier.

That line is drawn where it is because it is the only line that has to
exist, and it is written out in full rather than left to a support email:
  hoverlab.dev/licence

If your situation sits on the boundary, reply and describe it. A straight
answer costs us nothing and a guess costs you a project.`,
    },
    {
      day: 5,
      subject: 'Why we did not build a marketplace',
      body: `Worth explaining, because it is the difference between us and the
thing you came from.

A marketplace's economics push in one direction: more items, more sellers,
lower average quality, and a race to the bottom on price that the platform
survives and the authors do not. You watched that happen from inside it.

A single-author catalog has the opposite problem — it does not scale by
adding people — and one advantage that turns out to matter more: everything
in it can be held to one standard. Every block is checked for reduced-motion
handling before it ships. Every artifact's source is the same file its
preview renders from, so the code you paste is the code you saw.

That is not a better business than a marketplace. It is a better product,
and it is the only one we know how to keep honest.`,
    },
    {
      day: 9,
      subject: 'The four ways in',
      body: `Practical email, no pitch.

The same artifact is reachable four ways, and which one you want depends on
how you work:

  The site. Open anything, read the source, copy it. No account.

  npx hoverlab add <id>. Detects your framework, writes to the right
  paths, tells you which dependencies you still need.

  npx shadcn add. If your project already has components.json, the catalog
  is a registry entry away: hoverlab.dev/docs/registry

  An editor agent. There is an MCP server, so Claude or Cursor can search
  the catalog and install from it without you leaving the file you are in.

None of those four requires a licence. They are free because the catalog's
value is that people use it; the licence is what you buy when the work stops
being for yourself.`,
    },
    {
      day: 16,
      subject: 'One question',
      body: `Last one in this sequence — after this you only hear from us when
something is actually added.

The question, and a real answer changes what gets built next: what did you
build most often on the marketplace that this catalog does not have?

Not "what would be nice". What you built repeatedly, because clients kept
asking for it. That list is worth more to us than any amount of guessing,
and the people who have it are almost all in your position.

Reply to this email. It goes to a person.`,
    },
  ],
}

export const SEQUENCES: Sequence[] = [CATALOG_SEQUENCE, TOOLS_SEQUENCE, AUTHOR_SEQUENCE]

/**
 * The sequence a signup source enrols into.
 *
 * Returns null for an unknown source rather than falling back to the
 * catalog sequence. A typo'd source should surface as "this enrols nobody"
 * in the test below, not as silently sending a stranger the wrong five
 * emails — and the route only accepts values from `SIGNUP_SOURCES` anyway,
 * so in production the null branch means a source was added there and its
 * sequence was not written yet.
 */
export function sequenceForSource(source: string): Sequence | null {
  return SEQUENCES.find((s) => (s.sources as string[]).includes(source)) ?? null
}
