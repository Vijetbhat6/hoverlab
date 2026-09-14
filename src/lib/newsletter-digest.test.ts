import assert from 'node:assert/strict'
import { test } from 'node:test'

import { composeDigest } from './newsletter-digest'
import { catalogWaves } from './recency'

/**
 * The digest has one failure mode that matters and it is not a crash: it
 * mails something when there is nothing to say, or mails the same wave
 * twice. Both look fine from the sending side and both are how a list learns
 * to ignore you — and the second one breaks the consent this site has been
 * recording against every signup, which says mail me when something is
 * added.
 *
 * These are cheap to test because `composeDigest` is pure. Nothing below
 * needs a sending key, and nothing below can email anybody.
 */

/** Newest and oldest dates present in the committed ledger. */
const WAVES = catalogWaves()
const NEWEST = WAVES[0]!.date
const OLDEST = WAVES[WAVES.length - 1]!.date

test('an empty window composes nothing rather than an empty email', () => {
  // The property the whole sender rests on. A quiet fortnight is a fact
  // about the fortnight, and `null` is what lets the script exit 0 without
  // sending — rather than mailing a list "0 new things".
  assert.equal(composeDigest(NEWEST), null)
})

test('the window is exclusive of its lower bound, so a re-run mails nothing', () => {
  /*
    Run the sender twice without advancing the watermark and the second run
    must find nothing. If `since` were inclusive, every run would re-send the
    most recent wave — the single worst bug this thing could have, and one
    that is invisible unless you are on the list.
  */
  const first = composeDigest(OLDEST)
  assert.ok(first, 'the ledger should have something after its oldest date')

  const second = composeDigest(first.until)
  assert.equal(second, null, 're-running at the last sent date mailed something again')
})

test('a full-history digest counts every artifact in the ledger exactly once', () => {
  // Guards the cross-wave grouping: two block waves three days apart are one
  // section, and an implementation that concatenated wrongly would either
  // drop ids or double them, with a plausible-looking email either way.
  const before = '1970-01-01'
  const digest = composeDigest(before)
  assert.ok(digest)

  const ledgerTotal = WAVES.reduce((sum, wave) => sum + wave.ids.length, 0)
  assert.equal(
    digest.itemCount,
    ledgerTotal,
    'the digest total disagrees with the ledger it was built from',
  )

  const sectionTotal = digest.sections.reduce((sum, section) => sum + section.total, 0)
  assert.equal(sectionTotal, digest.itemCount)
})

test('sections follow the ladder, not the order waves happened to land', () => {
  const digest = composeDigest('1970-01-01')
  assert.ok(digest)

  const ORDER = ['effect', 'primitive', 'block', 'page', 'template']
  const positions = digest.sections.map((section) => ORDER.indexOf(section.level))
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    'an email that opens with templates and ends with effects reads as a list, not a catalog',
  )
})

test('the subject carries a real number rather than being the same every time', () => {
  const digest = composeDigest('1970-01-01')
  assert.ok(digest)
  assert.match(
    digest.subject,
    /\d/,
    'a subject line identical on every send is one that stops being opened',
  )
})

test('every digest keeps the unsubscribe promise the consent text makes', () => {
  const digest = composeDigest('1970-01-01')
  assert.ok(digest)
  assert.ok(
    digest.text.includes('{{unsubscribe_url}}'),
    'the body has no unsubscribe placeholder for the sender to fill in',
  )
  assert.ok(
    digest.text.includes('because you asked'),
    'the body does not say why the reader is receiving it',
  )
})

test('no section names more ids than it admits to having', () => {
  const digest = composeDigest('1970-01-01')
  assert.ok(digest)
  for (const section of digest.sections) {
    assert.ok(
      section.sample.length <= section.total,
      `${section.level} lists more samples than it has items`,
    )
    // Every sampled id has to resolve to a URL a reader can open; a relative
    // path in an email body is a dead link in every mail client.
    for (const item of section.sample) {
      assert.match(item.url, /^https?:\/\//, `${item.id} has a relative URL`)
    }
  }
})
