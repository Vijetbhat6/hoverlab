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

export interface Sequence {
  id: string
  /** The `source` recorded at signup that enrols someone here. */
  source: string
  audience: string
  emails: SequenceEmail[]
}

export const AUTHOR_SEQUENCE: Sequence = {
  id: 'authors',
  source: 'authors',
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

export const SEQUENCES: Sequence[] = [AUTHOR_SEQUENCE]

/** The sequence a signup source enrols into, if any. */
export function sequenceForSource(source: string): Sequence | null {
  return SEQUENCES.find((s) => s.source === source) ?? null
}
