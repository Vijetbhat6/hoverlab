/**
 * Tests for public collection share links.
 *
 * Two properties carry the feature. First, revocation is real: after
 * `revokeShare` the old token resolves to nothing, at once, and sharing
 * again gives a DIFFERENT token. Second, the public view is a whitelist:
 * nothing about the owner, and nothing the owner typed beyond the collection
 * name, reaches it.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  createShare,
  isSafeCollectionId,
  looksLikeShareToken,
  newShareToken,
  resolveShare,
  revokeShare,
  sameToken,
  shareKey,
  toPublicShare,
  type OwnedShare,
  type ShareStore,
  type SharedTarget,
} from './collection-share'

/** An in-memory store with the same contract as the Firestore one. */
function memoryStore(): ShareStore & { size: () => number } {
  const owned = new Map<string, OwnedShare>()
  const publicIndex = new Map<string, SharedTarget>()
  const id = (uid: string, c: string) => `${uid}__${c}`
  return {
    size: () => publicIndex.size,
    async getOwned(uid, collectionId) {
      return owned.get(id(uid, collectionId)) ?? null
    },
    async create(uid, collectionId, share) {
      const existing = owned.get(id(uid, collectionId))
      if (existing) return { ...existing, created: false }
      owned.set(id(uid, collectionId), share)
      publicIndex.set(shareKey(share.token), { uid, collectionId })
      return { ...share, created: true }
    },
    async remove(uid, collectionId) {
      const existing = owned.get(id(uid, collectionId))
      if (!existing) return false
      publicIndex.delete(shareKey(existing.token))
      owned.delete(id(uid, collectionId))
      return true
    },
    async lookup(key) {
      return publicIndex.get(key) ?? null
    },
  }
}

describe('tokens', () => {
  it('are 32 url-safe characters and never repeat', () => {
    const tokens = Array.from({ length: 300 }, newShareToken)
    for (const token of tokens) {
      assert.equal(token.length, 32)
      assert.ok(looksLikeShareToken(token))
    }
    assert.equal(new Set(tokens).size, tokens.length)
  })

  it('are not the collection id or derived from anything the owner controls', () => {
    const collectionId = '7b3c1e7a-1f7e-4a53-9a5d-3d1f2c8e9a11'
    const token = newShareToken()
    assert.ok(!token.includes(collectionId))
    assert.equal(looksLikeShareToken(collectionId), false) // a UUID is 36 chars
  })

  it('reject anything that cannot be one before any store is asked', () => {
    for (const bad of ['', 'short', 'a'.repeat(31), 'a'.repeat(33), `${'a'.repeat(31)}/`, null, 5]) {
      assert.equal(looksLikeShareToken(bad), false, String(bad))
    }
  })

  it('hash to a stable key that is not the token, and compare in constant time', () => {
    const token = newShareToken()
    assert.equal(shareKey(token), shareKey(token))
    assert.notEqual(shareKey(token), token)
    assert.match(shareKey(token), /^[0-9a-f]{64}$/)
    assert.ok(sameToken(token, token))
    assert.equal(sameToken(token, newShareToken()), false)
    assert.equal(sameToken(token, token.slice(1)), false)
  })
})

describe('collection ids', () => {
  it('accepts the shapes the client generates and refuses path tricks', () => {
    assert.ok(isSafeCollectionId('7b3c1e7a-1f7e-4a53-9a5d-3d1f2c8e9a11'))
    assert.ok(isSafeCollectionId('c-abc123_x'))
    for (const bad of ['', '__reserved', 'a/b', '../x', 'a b', 'a'.repeat(65), null, 3]) {
      assert.equal(isSafeCollectionId(bad), false, String(bad))
    }
  })
})

describe('share lifecycle', () => {
  it('create -> resolve opens exactly that owner and collection', async () => {
    const store = memoryStore()
    const share = await createShare(store, 'uid-1', 'coll-a')
    assert.equal(share.created, true)
    assert.deepEqual(await resolveShare(store, share.token), {
      uid: 'uid-1',
      collectionId: 'coll-a',
    })
  })

  it('is idempotent: pressing create twice returns the same link', async () => {
    const store = memoryStore()
    const first = await createShare(store, 'uid-1', 'coll-a')
    const second = await createShare(store, 'uid-1', 'coll-a')
    assert.equal(second.token, first.token)
    assert.equal(second.created, false)
    assert.equal(store.size(), 1)
  })

  it('gives two collections two different links', async () => {
    const store = memoryStore()
    const a = await createShare(store, 'uid-1', 'coll-a')
    const b = await createShare(store, 'uid-1', 'coll-b')
    assert.notEqual(a.token, b.token)
  })

  it('REVOKE makes the old token 404 immediately', async () => {
    const store = memoryStore()
    const share = await createShare(store, 'uid-1', 'coll-a')
    assert.ok(await resolveShare(store, share.token))

    assert.equal(await revokeShare(store, 'uid-1', 'coll-a'), true)

    assert.equal(await resolveShare(store, share.token), null)
    assert.equal(await store.getOwned('uid-1', 'coll-a'), null)
    assert.equal(store.size(), 0)
  })

  it('sharing again after a revoke mints a DIFFERENT token; the old one stays dead', async () => {
    const store = memoryStore()
    const first = await createShare(store, 'uid-1', 'coll-a')
    await revokeShare(store, 'uid-1', 'coll-a')
    const second = await createShare(store, 'uid-1', 'coll-a')
    assert.notEqual(second.token, first.token)
    assert.equal(second.created, true)
    assert.equal(await resolveShare(store, first.token), null)
    assert.ok(await resolveShare(store, second.token))
  })

  it('revoking is idempotent and says whether there was anything to revoke', async () => {
    const store = memoryStore()
    assert.equal(await revokeShare(store, 'uid-1', 'never-shared'), false)
    await createShare(store, 'uid-1', 'coll-a')
    assert.equal(await revokeShare(store, 'uid-1', 'coll-a'), true)
    assert.equal(await revokeShare(store, 'uid-1', 'coll-a'), false)
  })

  it('one account cannot revoke another account\'s share', async () => {
    const store = memoryStore()
    const share = await createShare(store, 'owner', 'coll-a')
    assert.equal(await revokeShare(store, 'intruder', 'coll-a'), false)
    assert.ok(await resolveShare(store, share.token))
  })

  it('unknown, malformed and never-issued tokens all resolve to null', async () => {
    const store = memoryStore()
    await createShare(store, 'uid-1', 'coll-a')
    assert.equal(await resolveShare(store, newShareToken()), null)
    assert.equal(await resolveShare(store, 'not-a-token'), null)
    assert.equal(await resolveShare(store, undefined), null)
  })

  it('refuses to create a share for an unsafe collection id', async () => {
    await assert.rejects(() => createShare(memoryStore(), 'uid-1', '../etc'))
  })
})

describe('the public view never carries owner identity', () => {
  /** A hostile collection document: everything an owner record could hold. */
  const hostile = {
    id: 'coll-a',
    name: '  Northwind kit  ',
    description: 'PRIVATE NOTE: pitch for Acme, budget 40k',
    uid: 'uid-SECRET-123',
    ownerUid: 'uid-SECRET-123',
    email: 'owner@private.example',
    ownerEmail: 'owner@private.example',
    displayName: 'Jane Private',
    createdBy: { uid: 'uid-SECRET-123', email: 'owner@private.example' },
    items: [
      {
        id: 'hero-split',
        level: 'block',
        name: 'Renamed by owner: SECRET LABEL',
        category: 'private-category',
        addedAt: '2026-09-01T00:00:00.000Z',
        note: 'owner@private.example',
      },
      { id: 'shimmer', name: 'Effect with no level' },
    ],
  }

  it('contains only the name and each item\'s level and id', () => {
    const view = toPublicShare(hostile)
    assert.deepEqual(view, {
      name: 'Northwind kit',
      items: [
        { level: 'block', id: 'hero-split' },
        { level: 'effect', id: 'shimmer' },
      ],
    })
  })

  it('leaks none of the identity or private strings, anywhere in the serialised output', () => {
    const json = JSON.stringify(toPublicShare(hostile))
    for (const secret of [
      'uid-SECRET-123',
      'owner@private.example',
      'Jane Private',
      'PRIVATE NOTE',
      'SECRET LABEL',
      'private-category',
      'coll-a',
    ]) {
      assert.ok(!json.includes(secret), `public view leaked "${secret}"`)
    }
  })

  it('has exactly the whitelisted keys, so a new field is private by default', () => {
    const view = toPublicShare({ ...hostile, futureField: 'x' })
    assert.deepEqual(Object.keys(view!).sort(), ['items', 'name'])
    for (const item of view!.items) {
      assert.deepEqual(Object.keys(item).sort(), ['id', 'level'])
    }
  })

  it('drops duplicates, unnamed and malformed items, and rejects a nameless collection', () => {
    const view = toPublicShare({
      name: 'Mixed',
      items: [
        { id: 'a', level: 'page' },
        { id: 'a', level: 'page' },
        { id: '', level: 'page' },
        { level: 'page' },
        null,
        'string',
        { id: 'b', level: 'not-a-level' },
      ],
    })
    assert.deepEqual(view?.items, [
      { level: 'page', id: 'a' },
      { level: 'effect', id: 'b' },
    ])
    assert.equal(toPublicShare({ name: '   ', items: [] }), null)
    assert.equal(toPublicShare(null), null)
    assert.equal(toPublicShare('x'), null)
  })
})
