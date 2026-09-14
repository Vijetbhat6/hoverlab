import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ROADMAP, STATUS_ORDER, roadmapBy } from './roadmap'
import { SHOWCASE, USED_BY } from './showcase'
import { ENDORSEMENTS } from './endorsements'
import { LAB_ENTRIES } from './labs'
import { AFFILIATE_PERCENT, AFFILIATE_TERMS } from './affiliate'

/**
 * The growth surfaces have one failure mode in common, and it is not a crash.
 *
 * Every one of them publishes a claim about somebody who is not us — a
 * customer, a reviewer, a contributor — or a promise about what we will do
 * next. All of those render perfectly when they are false. A roadmap row
 * that says "shipped" with nothing to click looks finished; a testimonial
 * with no source looks like a testimonial; an affiliate rate that drifted
 * from the terms page still reads like a rate.
 *
 * `scripts/check-claims.mts` catches the version of this that reaches the
 * markup. These catch the version that reaches the data, which is where all
 * of it starts.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/
const HTTPS = /^https:\/\//

test('every shipped roadmap row links to the thing that proves it', () => {
  // The rule from lib/roadmap.ts, and the reason it needs a test: a shipped
  // row with a null href renders as plain text that looks exactly as
  // finished as a linked one. Nothing on the page would show the difference.
  for (const item of roadmapBy('shipped')) {
    assert.ok(
      item.href,
      `roadmap row "${item.id}" claims to be shipped with nothing to link to. ` +
        'If it cannot produce a URL it is not shipped.',
    )
  }
})

test('the roadmap publishes no dates', () => {
  /*
    The second rule, enforced against the prose rather than against a field,
    because there is no date field to check — which is precisely how a date
    would get in. Someone writes "landing in Q1" into `detail` and nothing
    anywhere objects.

    Matches the shapes a date actually arrives in: a quarter, a month name, a
    bare year, or the words that mean a date without being one.
  */
  const DATEY = /\bQ[1-4]\b|\b20\d\d\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b|\b(soon|shortly|imminently|next month|next week|by the end of)\b/i

  for (const item of ROADMAP) {
    const found = `${item.title} ${item.detail}`.match(DATEY)
    assert.equal(
      found,
      null,
      `roadmap row "${item.id}" contains "${found?.[0]}". The roadmap does not ` +
        'publish dates — see the second rule in lib/roadmap.ts.',
    )
  }
})

test('every roadmap row has a status the page renders', () => {
  // A status missing from STATUS_ORDER is a row that exists, type-checks and
  // is silently absent from the page.
  for (const item of ROADMAP) {
    assert.ok(
      STATUS_ORDER.includes(item.status),
      `roadmap row "${item.id}" has status "${item.status}", which /roadmap never renders`,
    )
  }
})

test('roadmap ids are unique', () => {
  const ids = ROADMAP.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length, 'duplicate roadmap id')
})

test('every refusal explains itself', () => {
  // "No" without a reason reads as "not yet" and generates the same email
  // every month, which is the entire point of publishing the list.
  for (const item of roadmapBy('not-doing')) {
    assert.ok(
      item.detail.length > 80,
      `"${item.id}" is on the not-doing list with no real reason given`,
    )
  }
})

test('every endorsement carries a public source and a date it was read', () => {
  /*
    The wall of love is empty today, so this loop currently runs zero times —
    and that is exactly when it earns its place. It is written for the day
    somebody adds the first entry under launch pressure, which is the same
    pressure that produced the six invented testimonials that
    `check-claims.mts` exists because of.

    https only: a source is a URL a stranger opens, and a citation that
    downgrades to plaintext is not one worth publishing.
  */
  for (const e of ENDORSEMENTS) {
    assert.match(
      e.source,
      HTTPS,
      `endorsement from ${e.author} has no public https source. A quote the ` +
        'reader cannot check is worth what an invented one is worth.',
    )
    assert.match(e.checkedOn, ISO, `endorsement from ${e.author} has a malformed checkedOn`)
    assert.ok(e.quote.trim().length > 0, `endorsement from ${e.author} has no quote`)
  }
})

test('every showcase entry is live, permitted and dated', () => {
  const today = new Date().toISOString().slice(0, 10)
  for (const site of SHOWCASE) {
    assert.match(site.href, HTTPS, `${site.name} has no live https URL`)
    assert.ok(
      site.permission.trim().length > 0,
      `${site.name} is published with no record of how we are allowed to`,
    )
    assert.match(site.addedOn, ISO, `${site.name} has a malformed addedOn`)
    assert.ok(site.addedOn <= today, `${site.name} claims to have been added in the future`)
    assert.ok(site.uses.length > 0, `${site.name} does not say what it used`)
  }
})

test('every used-by logo records the permission that allows it', () => {
  // Higher stakes than the showcase: a logo row is a claim that a named
  // company endorses us by association, and it is their mark.
  for (const logo of USED_BY) {
    assert.match(logo.href, HTTPS, `${logo.name} has no https URL`)
    assert.ok(
      logo.permission.trim().length > 0,
      `${logo.name}'s mark is published with no record of permission`,
    )
    assert.match(logo.addedOn, ISO, `${logo.name} has a malformed addedOn`)
  }
})

test('every lab entry names its original and credits its author', () => {
  for (const entry of LAB_ENTRIES) {
    assert.match(
      entry.original.href,
      HTTPS,
      `lab entry "${entry.id}" does not link what it recreated`,
    )
    assert.ok(
      entry.credit.name.trim().length > 0 && HTTPS.test(entry.credit.href),
      `lab entry "${entry.id}" has no usable credit. The credit is the payment.`,
    )
    assert.match(entry.addedOn, ISO, `lab entry "${entry.id}" has a malformed addedOn`)
  }
})

test('the affiliate rate on the terms matches the constant', () => {
  // The rate is quoted in three places — the terms table, the page heading
  // and /llms.txt — and all three read AFFILIATE_PERCENT. This asserts the
  // one that is a hand-written string containing the number.
  const commission = AFFILIATE_TERMS.find((t) => t.label === 'Commission')
  assert.ok(commission, 'the affiliate terms no longer state a commission')
  assert.ok(
    commission.value.includes(String(AFFILIATE_PERCENT)),
    `the commission row says "${commission.value}" but AFFILIATE_PERCENT is ${AFFILIATE_PERCENT}. ` +
      'One of them is a promise to pay somebody the wrong amount.',
  )
})
