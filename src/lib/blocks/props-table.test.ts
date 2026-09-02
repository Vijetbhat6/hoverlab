import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseBlockProps, sortBlockProps } from './props-table'

const SOURCE = `'use client'

import * as React from 'react'

export interface HeroCenteredProps {
  announcement?: string
  /** Wordmarks under the fold. Text rather than images, so they theme. */
  logos?: string[]
  /**
   * A multi-line note about the heading.
   * It wraps onto a second line.
   */
  heading?: string
  count: number
  className?: string
}

const DEFAULT_LOGOS = ['Acme']

export function HeroCentered({
  announcement = 'Introducing team workspaces',
  logos = DEFAULT_LOGOS,
  heading = 'The fastest way',
  className = '',
}: HeroCenteredProps) {
  return null
}
`

test('every declared prop is found', () => {
  const props = parseBlockProps(SOURCE)
  assert.deepEqual(
    props.map((p) => p.name),
    ['announcement', 'logos', 'heading', 'count', 'className'],
  )
})

test('optionality comes from the question mark', () => {
  const props = parseBlockProps(SOURCE)
  const byName = Object.fromEntries(props.map((p) => [p.name, p]))

  assert.equal(byName.count.required, true)
  assert.equal(byName.announcement.required, false)
})

test('types are carried through as written', () => {
  const byName = Object.fromEntries(parseBlockProps(SOURCE).map((p) => [p.name, p]))
  assert.equal(byName.logos.type, 'string[]')
  assert.equal(byName.count.type, 'number')
})

test('defaults come from the destructuring signature', () => {
  const byName = Object.fromEntries(parseBlockProps(SOURCE).map((p) => [p.name, p]))

  assert.equal(byName.announcement.defaultValue, "'Introducing team workspaces'")
  assert.equal(byName.logos.defaultValue, 'DEFAULT_LOGOS')
  assert.equal(byName.className.defaultValue, "''")
  // Declared but never defaulted.
  assert.equal(byName.count.defaultValue, null)
})

test('doc comments attach to the prop below them, in one line or several', () => {
  const byName = Object.fromEntries(parseBlockProps(SOURCE).map((p) => [p.name, p]))

  assert.match(byName.logos.description ?? '', /^Wordmarks under the fold/)
  assert.equal(
    byName.heading.description,
    'A multi-line note about the heading. It wraps onto a second line.',
  )
  assert.equal(byName.announcement.description, null)
})

test('a comment never attaches to the wrong prop', () => {
  // The failure this guards: a comment above something unparseable drifting
  // down onto the next real prop and describing it wrongly.
  const source = `export interface XProps {
  /** About the nested thing. */
  nested: {
    a: string
  }
  plain?: string
}
`
  const byName = Object.fromEntries(parseBlockProps(source).map((p) => [p.name, p]))
  assert.equal(byName.plain?.description ?? null, null)
})

test('a block with no props interface yields no rows', () => {
  assert.deepEqual(parseBlockProps('export function Thing() { return null }'), [])
})

test('a multi-line default is skipped rather than truncated', () => {
  const source = `export interface XProps {
  items?: string[]
}

export function X({
  items = [
    'one',
    'two',
  ],
}: XProps) {}
`
  const props = parseBlockProps(source)
  assert.equal(props[0].name, 'items')
  assert.equal(props[0].defaultValue, null)
})

test('className sorts last and required props sort first', () => {
  const sorted = sortBlockProps(parseBlockProps(SOURCE))
  assert.equal(sorted[0].name, 'count')
  assert.equal(sorted[sorted.length - 1].name, 'className')
})

test('nothing is silently dropped from the sort', () => {
  const props = parseBlockProps(SOURCE)
  assert.equal(sortBlockProps(props).length, props.length)
})
