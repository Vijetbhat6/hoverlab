/**
 * `scripts/check-kits.mts` proves every id in the catalog resolves. This
 * proves the layer that turns those ids into what a page renders — the
 * grouping, the ordering, the derived counts — behaves the way the pages
 * assume it does.
 *
 * The split matters: the check script guards the *data* and runs in
 * prebuild, so a bad id fails a deploy. These guard the *functions*, and a
 * regression here would ship a page whose header count disagrees with the
 * list underneath it, which no id check would ever catch.
 */

import test from 'node:test'
import assert from 'node:assert/strict'

import { KITS, getKit } from './catalog'
import { kitGroups, kitItems, kitSize, kitSummary } from './resolve'
import { ARTIFACT_LEVELS } from '../artifact-types'

test('every kit resolves every id it names', () => {
  for (const kit of KITS) {
    const declared =
      (kit.contents.templates?.length ?? 0) +
      (kit.contents.pages?.length ?? 0) +
      kit.contents.blocks.length +
      (kit.contents.effects?.length ?? 0)

    assert.equal(
      kitSize(kit),
      declared,
      `${kit.slug}: ${declared} ids declared but ${kitSize(kit)} resolved — an id no longer exists`,
    )
  }
})

test('groups run top rung first', () => {
  // The page reads template → page → block → effect: the assembled thing,
  // then the screens, then the sections, then the polish. ARTIFACT_LEVELS
  // runs the other way, so this is really a test that the reverse is still
  // there.
  const descending = [...ARTIFACT_LEVELS].reverse()

  for (const kit of KITS) {
    const order = kitGroups(kit).map((g) => g.level)
    const expected = descending.filter((level) => order.includes(level))
    assert.deepEqual(order, expected, `${kit.slug}: groups are out of order`)
  }
})

test('empty rungs produce no group', () => {
  for (const kit of KITS) {
    for (const group of kitGroups(kit)) {
      assert.ok(group.items.length > 0, `${kit.slug}: ${group.level} group is empty`)
    }
  }
})

test('every item carries a working href for its own rung', () => {
  for (const kit of KITS) {
    for (const item of kitItems(kit)) {
      assert.equal(
        item.href,
        `/${item.level}/${item.id}`,
        `${kit.slug}: ${item.id} points at ${item.href}`,
      )
    }
  }
})

test('the summary counts what the groups hold', () => {
  // The failure this exists to prevent: a card saying "14 blocks" above a
  // page listing thirteen. Both numbers have to come from the same place.
  for (const kit of KITS) {
    const summary = kitSummary(kit)
    for (const group of kitGroups(kit)) {
      assert.ok(
        summary.includes(String(group.items.length)),
        `${kit.slug}: summary "${summary}" is missing the ${group.level} count`,
      )
    }
  }
})

test('a kit never lists the same piece twice', () => {
  for (const kit of KITS) {
    const items = kitItems(kit)
    const keys = items.map((i) => `${i.level}:${i.id}`)
    assert.equal(new Set(keys).size, keys.length, `${kit.slug}: lists a piece twice`)
  }
})

test('every kit has blocks, which are its substance', () => {
  for (const kit of KITS) {
    const blocks = kitGroups(kit).find((g) => g.level === 'block')
    assert.ok(blocks && blocks.items.length > 0, `${kit.slug}: has no blocks`)
  }
})

test('every kit is larger than the free bundle cap', () => {
  // Not a rule the kits have to obey forever — it is a statement about
  // what they are. A kit smaller than ten pieces is a list of links, and
  // the Pro line on the kit page would be talking about nothing. If this
  // ever fails, the kit is probably the thing to fix.
  for (const kit of KITS) {
    assert.ok(kitSize(kit) > 10, `${kit.slug}: only ${kitSize(kit)} pieces`)
  }
})

test('getKit finds every slug and nothing else', () => {
  for (const kit of KITS) {
    assert.equal(getKit(kit.slug)?.slug, kit.slug)
  }
  assert.equal(getKit('not-a-kit'), undefined)
})
