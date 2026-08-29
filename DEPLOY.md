# Deploying the monetisation branch

Everything on `effect-page-anatomy` past `13cf297` changes what Hoverlab
sells. Most of it is code and ships with the build. Three things are not,
and the failure mode of each is quiet — nothing crashes, a customer just
silently gets less than they paid for.

Work top to bottom. Nothing below the line takes more than a few minutes.

---

## 1. Before the deploy

### Firestore composite index — **required**

`GET /api/billing/license` queries `purchases` by `userId` + `plan`, ordered
by `createdAt` descending. Firestore cannot infer that combination.

```
firebase deploy --only firestore:indexes
```

`firestore.indexes.json` is committed and carries the definition. There is no
`firebase.json` in this repo, so that command needs `firebase init firestore`
once first — or add the index by hand at **Firestore → Indexes → Composite →
Add**, with the fields in exactly the order the JSON lists them.

**Why it matters:** the route catches the failure and still renders a
certificate, with `licenseId: null`. So nothing looks broken, and every
customer gets a licence certificate missing the one field a client's
procurement inbox asks for. Wait for the index to show **Enabled**, not
**Building**.

### Polar products — **required for anything to be buyable**

```
npm run polar:provision
```

Creates any product that does not exist and prints a `! price drift` report
for any whose price in `lib/billing/plans.ts` no longer matches Polar.

**Read that report.** The script is idempotent *by product name*, so it will
never re-price something people may already have bought. A price changed in
`plans.ts` therefore changes only what the site *displays* — Polar keeps
charging the old amount until you edit it in the dashboard. This is true of
the India discount amounts too.

New in this branch, and inert until provisioned:

| Env var | Product | Price |
| --- | --- | --- |
| `POLAR_PRODUCT_ID_RENEWAL` | Hoverlab Pro updates renewal | $32 / ₹3,000 |
| `POLAR_PRODUCT_ID_RENEWAL_STUDIO` | Hoverlab Studio updates renewal | $120 / ₹11,200 |

Until these are set, `isPurchasable` is false, the certificate shows no renew
button, and the checkout route 503s rather than dead-ending at Polar. That is
the intended unconfigured state — it is safe to deploy without them.

### Operator details — **required before taking real money**

The four values Terms, Privacy, Refunds and the Licence name as the legal
person behind Hoverlab:

```
OPERATOR_LEGAL_NAME       registered company, or your own name as a sole trader
OPERATOR_ADDRESS          registered address, one line
OPERATOR_JURISDICTION     governing law and courts, e.g. "India"
OPERATOR_CONTACT_EMAIL    where support, privacy and legal notices land
```

Unset, each falls back to a detectable `TO BE SET` placeholder — so the
pages render, and say something true about being incomplete, rather than
showing a blank where a company name goes. Polar reads these on merchant
review.

**They are read at build time**, not per request: module scope in
`src/lib/legal.ts`, on statically rendered routes. Setting them in the
hosting dashboard takes effect on the *next deploy*. `npm run check:env`
warns while any is unset; `npm run check:deploy` FAILS, which is the gate
that matters — it asks the running site, so it cannot be satisfied by a
value that never made it into a build.

### Environment

Nothing else is *required*. Two optional variables:

- `ANTHROPIC_API_KEY` — what Pro+ sells. `/api/ai/variant`, `/api/ai/compose`
  and `/api/ai/search` all call a model through `src/lib/ai/claude.ts`.
  Unset, all three return 503 **before** metering, so nothing is charged and
  `/library` falls back to substring search. If you are not setting this,
  leave `POLAR_PRODUCT_ID_PLUS` empty too — otherwise you are selling a
  $9/month meter for a feature that always refuses. Set a spend limit on the
  key: the routes are metered per user, not per dollar.

- `QUOTA_IP_SALT` — salts the hashed client IP used to meter anonymous
  visitors. Unset falls back to a constant, which still meters correctly;
  setting it means a leaked `quotas` collection is a list of opaque strings
  rather than one that can be brute-forced back to addresses. Any long random
  string. Changing it resets every anonymous counter, which is harmless.

---

## 2. After the deploy — the walk

This is the part no amount of local checking substitutes for. None of it has
run against real Firestore, real Polar or a real licence key.

1. **Anonymous.** Open an effect, copy it. Should be free and unmetered.
   Build a bundle and export it three times; the fourth should refuse and
   offer sign-in.
2. **Free account.** Same, with ten exports before the wall, and the wall
   should offer Pro rather than sign-in.
3. **Templates.** `/template/marketing-site` downloads. `/template/saas-starter`
   returns the Pro offer, and the offer links the free one.
4. **Buy Pro** (Polar sandbox). Then:
   - `/account` shows a certificate **with a licence id** — if it is blank,
     step 1 above did not take.
   - **Updates until** shows a date twelve months out.
   - A licence key can be created, and shows once.
5. **The key.** `npx hoverlab login <key>` then
   `npx hoverlab init saas-starter` — should scaffold. `npx hoverlab logout`
   then the same command — should print the offer, not an empty directory.
6. **Design system.** `/design-system`, pick a brand, build it, download the
   zip. Drop `tokens.css` into a scaffolded template and confirm the colour
   moves.
7. **AI.** A variation, a brand recolour, and a compose. Watch the credit
   balance go 1, 1, 3.
8. **Mailing list.** Submit the footer form, then check `subscribers/` in
   Firestore actually has the row.

---

## 3. Known-unbuilt, on purpose

Do not treat these as bugs found in testing.

- **No mail sender.** `/api/subscribe` stores addresses; nothing can send to
  them. Pick a provider, wire the send path, and honour `unsubscribedAt`
  when you do.
- **Three Team features still say Coming.** Shared collections, workspace
  theming and seat management. The shared brand library is real; the pricing
  card marks the other three.
- **No Firestore security rules in the repo.** Every write in this branch
  goes through the Admin SDK, which bypasses rules, so nothing here depends
  on them. If client-side Firestore access is ever added, that changes.
- **Renewal reminders.** The certificate offers a renewal inside the last 60
  days of the window, but nothing emails anyone about it. That needs the mail
  sender above.

---

## 4. If you need to roll back

Every change is additive and behind either an entitlement check or an unset
environment variable. To neutralise the two that are visible to everyone
without reverting code:

- **Template gating** — set `tier` back to `'free'` in
  `src/lib/templates/catalog.ts`. One field per template.
- **The export meter** — raise the numbers in
  `src/lib/billing/quota-limits.ts`. `Number.POSITIVE_INFINITY` on every tier
  disables it entirely.
