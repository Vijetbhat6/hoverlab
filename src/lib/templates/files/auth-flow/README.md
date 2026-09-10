# Auth Flow

Every screen between a stranger and a working account. Sign in, sign up,
password reset with a magic-link alternative, the second factor, SSO by
email domain, and the first-run setup on the other side.

One runtime dependency — `lucide-react`.

## Run it

```bash
npm install
npm run dev
```

## Routes

| Path          | Screen                                              |
| ------------- | --------------------------------------------------- |
| `/`           | Sign in                                             |
| `/signup`     | Sign up, with proof below the fold                  |
| `/forgot`     | Reset, or skip the password entirely                |
| `/two-factor` | Authenticator code, and the recovery path under it  |
| `/sso`        | Enterprise sign-in by email domain                  |
| `/welcome`    | Workspace setup, guided wizard, then a checklist    |
| `not-found`   | 404                                                 |

## None of this is authentication

Every screen here is a form. There is no session, no token, no rate limit,
no lockout, and the two-factor screen accepts any six digits. This template
saves you the fortnight of layout work, not the afternoon of security work.

Wire it to something real — Auth.js, Clerk, WorkOS, your own — before it is
in front of anybody. The pieces that need a backend, in the order they bite:

1. **Submit handlers.** Each form calls a no-op. Search for `onSubmit` and
   `handleSubmit` in `components/auth-*.tsx`.
2. **Rate limiting.** The reset and two-factor screens are the two endpoints
   that get attacked, and neither can defend itself from the client.
3. **The redirect after success.** `/welcome` is where a *new* account
   goes. A returning user landing there is the most common bug in this
   flow, and it looks like the product forgetting them.

## Three decisions worth keeping

**The reset screen offers a magic link as an alternative, not a
replacement.** The separator carries the words "or skip the password"
rather than being a bare rule, because a plain line between two forms reads
as a second required step. Roughly half the people who land here have no
password to reset — they signed up with SSO and do not remember.

**The recovery path sits on the two-factor screen itself.** Someone who has
lost their phone cannot sign in to find the help page that explains what to
do about losing their phone. It is the one screen where the escape hatch
cannot be one click away.

**Sign-up puts its proof below the fold.** Logos and ratings above the form
push the form down, and everyone who reaches this URL has already decided.
The proof is there for the person who arrived by accident, not for the one
who arrived on purpose.

## Before you deploy

**These screens are `noindex`.** `app/layout.tsx` sets it, and it is not
about secrecy — a sign-in page is not a secret. It is that a page linked
from every route on your domain accumulates more internal links than
anything else and starts outranking your homepage for your own name. The
reset screen is worse: it ranks for "reset password <product>" and answers
that query with a form and no explanation.

**Decide what `/sso` does with an unknown domain.** The screen asks for an
email address and looks up the identity provider. The interesting case is a
domain with no provider configured, and the wrong answer — "no account
found" — tells an attacker which companies are customers.

**The data is fixtures.** Each block defaults to plausible sample content so
it renders standalone. Search your app for `DEFAULT_` to find every
hard-coded array that needs replacing with a fetch.

## Layout

```
app/            routes — one folder per screen
components/     the blocks each screen is built from
```

## Making it yours

Colours and radius live in `app/globals.css`; `tailwind.config.ts` maps
them onto class names. The two files are a pair — copying one without the
other leaves everything unstyled.
