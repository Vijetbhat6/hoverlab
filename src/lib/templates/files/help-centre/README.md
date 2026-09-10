# Help Centre

The support surface as four routes that agree with each other: searchable
answers, the documentation, what changed, and a status page carrying the
same incident the help page announces.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path         | Screen                                                  |
| ------------ | ------------------------------------------------------- |
| `/`          | Help — search, answers, feedback, ticket form           |
| `/docs`      | The three-column documentation frame                    |
| `/changelog` | Release timeline with a subscribe form                  |
| `/status`    | The maintenance window, with an end time                |
| `not-found`  | 404                                                     |

## One incident, stated in three places

The announcement bar on `/`, the status word in its footer and the whole of
`/status` are the same maintenance window. That is the part of this template
that is easiest to break and hardest to notice: blocks ship independent demo
data, and a bar announcing an outage above a footer reading "all systems
normal" does not read as two components with different defaults. It reads as
a product that does not know whether it is up.

When you wire this to a real status source, wire all three from it:

- `components/announcement-bar.tsx` — the bar on the help page
- `components/footer-status-locale.tsx` — the `status` prop
- `components/maintenance-window-state.tsx` — `endsAt`, on `/status`

The end time is the one that matters. A maintenance page without one is
indistinguishable from an outage nobody has noticed, and "back soon" is not
a time.

## Three decisions worth keeping

**Search is the hero.** Everyone arriving has a specific problem already
phrased in their head. Opening with categories asks them to translate that
phrasing into your taxonomy, and the translation is where people give up and
write to support instead. The suggestion chips carry four queries a support
inbox actually receives.

**The ticket form is in plain sight, not behind a modal.** Hiding it does
reduce tickets — by converting them into churn you never see. Answers first,
form underneath, reachable from the screen they landed on.

**Every answer ends in something the reader can do alone.** An answer that
finishes with "contact support" belongs in the form at the bottom; in the
grid it costs a scroll and gains nothing.

## Before you deploy

**This is the one part of your product that must be indexed.** Note the
absence of the `robots: { index: false }` line the app templates carry.
People find help pages by typing an error message into a search engine, so
the title template appends the product name rather than prefixing it — the
words that match the query need to survive truncation in a result list.

**Set `metadataBase` in `app/layout.tsx`.** Support links get pasted into
tickets, chat threads and email replies, and every one of those unfurls a
card built from a URL resolved against that value.

**Rewrite the six answers before launch.** They are written to be replaced,
and each one is a claim about how *your* product behaves — the 2FA recovery
path, the export format, what deactivating a member does to their work. An
answer that is wrong in a help centre is worse than an answer that is
missing.

**The ticket form posts nowhere.** `onSubmit` is a no-op. Point it at your
helpdesk, and put the response target you publish on the page next to the
submit button rather than in a policy nobody opens.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps
them onto class names. The two files are a pair — copying one without the
other leaves everything unstyled.
