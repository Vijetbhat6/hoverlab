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

/* ------------------------------------------------------------------ *
 *  The three shapes the primitive tier introduced
 *
 *  Each of these silently produced an empty table before the parser
 *  learned them, which is the worst available failure here: the page
 *  renders, the prompt copies, and the "what can I change" half is
 *  simply missing with nothing to say so.
 * ------------------------------------------------------------------ */

test('an interface with a heritage clause still yields its own members', () => {
  const props = parseBlockProps(`
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  /** Pill rather than rounded rectangle. */
  pill?: boolean
}

export function Badge({
  tone = 'neutral',
  pill = false,
}: BadgeProps) {}
`)
  assert.deepEqual(props.map((p) => p.name), ['tone', 'pill'])
  assert.equal(props[0].defaultValue, "'neutral'")
  assert.equal(props[1].description, 'Pill rather than rounded rectangle.')
})

test('the heritage clause may sit on its own line', () => {
  // Prettier wraps a long `extends` onto the next line, which read as an
  // interface with no brace at all.
  const props = parseBlockProps(`
export interface InputGroupProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  addonStart?: React.ReactNode
  invalid?: boolean
}
`)
  assert.deepEqual(props.map((p) => p.name), ['addonStart', 'invalid'])
})

test('a type alias is followed to the local type holding its members', () => {
  const props = parseBlockProps(`
type BaseProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: Variant
  /** Shown before the label. */
  icon?: React.ReactNode
  className?: string
}

export type ButtonProps = BaseProps &
  ({ size: 'icon'; 'aria-label': string } | { size?: Exclude<Size, 'icon'> })

export function Button({
  variant = 'primary',
  className = '',
}: ButtonProps) {}
`)
  assert.deepEqual(props.map((p) => p.name), ['variant', 'icon', 'className'])
  assert.equal(props[0].defaultValue, "'primary'")
  // The union branches are deliberately not read: they are single-line and
  // semicolon-separated, and a union declares `size` twice with two
  // different types. A missing row beats two contradictory ones.
  assert.ok(!props.some((p) => p.name === 'size'))
})

test('a referenced type with no object body cannot bind to a later brace', () => {
  /*
    The regression this exists for. With an unbounded `[^{]*`, `type Size`
    matched forward into the `const SIZES` style map below it and the table
    sprouted rows called `sm`, `md` and `lg` — CSS class names presented as
    props. Wrong rows are the one thing this parser promises never to emit.
  */
  const props = parseBlockProps(`
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3',
  md: 'h-9 px-4',
  lg: 'h-11 px-6',
}

type BaseProps = {
  loading?: boolean
}

export type ThingProps = BaseProps & { size?: Size }
`)
  assert.deepEqual(props.map((p) => p.name), ['loading'])
  for (const bad of ['sm', 'md', 'lg']) {
    assert.ok(!props.some((p) => p.name === bad), `"${bad}" is a class name, not a prop`)
  }
})

test('a prop declared in two resolved bodies appears once', () => {
  const props = parseBlockProps(`
type A = {
  tone?: 'a'
}

type B = {
  tone?: 'b'
  extra?: boolean
}

export type DupProps = A & B
`)
  assert.deepEqual(props.map((p) => p.name), ['tone', 'extra'])
  // First declaration wins, rather than the table showing one prop twice.
  assert.equal(props[0].type, "'a'")
})

test('a component with no props declaration still returns nothing', () => {
  assert.deepEqual(parseBlockProps('export function Plain() { return null }'), [])
})
