import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  RECENT_KEY,
  RECENT_MAX,
  clearRecent,
  parseRecent,
  pushRecent,
  readRecent,
  rememberSearch,
  type RecentStore,
} from './recent'

function memoryStore(initial?: string): RecentStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(RECENT_KEY, initial)
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

const throwingStore: RecentStore = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

describe('pushRecent', () => {
  test('newest first, deduplicated without regard to case or spacing', () => {
    assert.deepEqual(pushRecent(['pricing', 'hero'], 'Hero'), ['Hero', 'pricing'])
    assert.deepEqual(pushRecent(['a1', 'b2'], '  b2  '), ['b2', 'a1'])
  })

  test('caps the list at six', () => {
    let list: string[] = []
    for (const q of ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh']) list = pushRecent(list, q)
    assert.equal(list.length, RECENT_MAX)
    assert.deepEqual(list, ['hh', 'gg', 'ff', 'ee', 'dd', 'cc'])
  })

  test('ignores queries too short to be worth remembering', () => {
    assert.deepEqual(pushRecent(['pricing'], 'a'), ['pricing'])
    assert.deepEqual(pushRecent([], '  '), [])
  })
})

describe('parseRecent', () => {
  test('survives garbage in storage', () => {
    assert.deepEqual(parseRecent(null), [])
    assert.deepEqual(parseRecent('not json'), [])
    assert.deepEqual(parseRecent('{"a":1}'), [])
    assert.deepEqual(parseRecent('[1,null,"ok","",""," x "," xy "]'), ['ok', ' xy '])
  })

  test('never returns more than the cap', () => {
    assert.equal(parseRecent(JSON.stringify(Array.from({ length: 20 }, (_, i) => `q${i}`))).length, RECENT_MAX)
  })
})

describe('the storage wrappers', () => {
  test('remember, read and clear', () => {
    const store = memoryStore()
    assert.deepEqual(rememberSearch('pricing', store), ['pricing'])
    assert.deepEqual(rememberSearch('hero', store), ['hero', 'pricing'])
    assert.deepEqual(readRecent(store), ['hero', 'pricing'])
    clearRecent(store)
    assert.deepEqual(readRecent(store), [])
    assert.equal(store.data.has(RECENT_KEY), false)
  })

  test('never throw when storage is missing, blocked or full', () => {
    assert.deepEqual(readRecent(null), [])
    assert.deepEqual(rememberSearch('pricing', null), ['pricing'])
    assert.doesNotThrow(() => clearRecent(null))
    assert.deepEqual(readRecent(throwingStore), [])
    assert.deepEqual(rememberSearch('pricing', throwingStore), ['pricing'])
    assert.doesNotThrow(() => clearRecent(throwingStore))
  })
})
