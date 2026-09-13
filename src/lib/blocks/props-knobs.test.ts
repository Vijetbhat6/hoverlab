import assert from 'node:assert/strict'
import { test } from 'node:test'

import { knobsFor, jsxCall, type Knob } from './props-knobs'
import { parseBlockProps } from './props-table'
import type { BlockProp } from './props-table'

function prop(over: Partial<BlockProp>): BlockProp {
  return {
    name: 'x',
    type: 'string',
    required: false,
    defaultValue: null,
    description: null,
    ...over,
  }
}

test('reads the four shapes it supports', () => {
  const knobs = knobsFor([
    prop({ name: 'title', type: 'string', defaultValue: "'Ship faster'" }),
    prop({ name: 'columns', type: 'number', defaultValue: '3' }),
    prop({ name: 'dark', type: 'boolean', defaultValue: 'true' }),
    prop({ name: 'align', type: "'left' | 'center'", defaultValue: "'center'" }),
  ])

  assert.deepEqual(
    knobs.map((k) => [k.name, k.kind, k.value]),
    [
      ['title', 'string', 'Ship faster'],
      ['columns', 'number', 3],
      ['dark', 'boolean', true],
      ['align', 'enum', 'center'],
    ],
  )
  assert.deepEqual((knobs[3] as Extract<Knob, { kind: 'enum' }>).options, ['left', 'center'])
})

test('refuses what a control cannot honestly offer', () => {
  const knobs = knobsFor([
    // No default: the panel renders the real component and would have to
    // invent a starting value.
    prop({ name: 'heading', type: 'string', defaultValue: null }),
    // Shapes a text field would mangle.
    prop({ name: 'items', type: 'string[]', defaultValue: "['a']" }),
    prop({ name: 'onPick', type: '(id: string) => void', defaultValue: '() => {}' }),
    prop({ name: 'icon', type: 'React.ReactNode', defaultValue: 'null' }),
    // The one prop that can break the panel's own layout.
    prop({ name: 'className', type: 'string', defaultValue: "''" }),
    // A default that is not in its own union — the parse went wrong, and a
    // select whose value is not an option is a broken control.
    prop({ name: 'size', type: "'sm' | 'lg'", defaultValue: "'md'" }),
  ])

  assert.deepEqual(knobs, [])
})

test('unquotes only the escapes the catalog actually uses', () => {
  const knobs = knobsFor([
    prop({ name: 'copy', type: 'string', defaultValue: "'It\\'s ready'" }),
  ])
  assert.equal(knobs[0].value, "It's ready")
})

test('the emitted call carries only what changed', () => {
  const knobs = knobsFor([
    prop({ name: 'title', type: 'string', defaultValue: "'Ship faster'" }),
    prop({ name: 'columns', type: 'number', defaultValue: '3' }),
    prop({ name: 'dark', type: 'boolean', defaultValue: 'false' }),
  ])

  // Nothing touched — the block's whole promise is that it needs no props.
  assert.equal(
    jsxCall('PricingTiers', knobs, { title: 'Ship faster', columns: 3, dark: false }),
    '<PricingTiers />',
  )

  assert.equal(
    jsxCall('PricingTiers', knobs, { title: 'Ship faster', columns: 4, dark: false }),
    '<PricingTiers columns={4} />',
  )

  // A boolean turned on prints bare, which is how it is written.
  assert.equal(
    jsxCall('PricingTiers', knobs, { title: 'Go now', columns: 3, dark: true }),
    '<PricingTiers\n  title="Go now"\n  dark\n/>',
  )
})

test('a boolean whose default is true prints its off state explicitly', () => {
  const knobs = knobsFor([prop({ name: 'dark', type: 'boolean', defaultValue: 'true' })])
  assert.equal(jsxCall('Hero', knobs, { dark: false }), '<Hero dark={false} />')
})

test('runs end to end on a source in the catalog house style', () => {
  const source = [
    'export interface HeroSplitProps {',
    '  /** The headline. */',
    '  title?: string',
    '  columns?: number',
    "  align?: 'left' | 'center'",
    '  items?: string[]',
    '}',
    '',
    'export function HeroSplit({',
    "  title = 'Ship faster',",
    '  columns = 2,',
    "  align = 'left',",
    '  items = [],',
    '}: HeroSplitProps) {',
    '  return null',
    '}',
  ].join('\n')

  const knobs = knobsFor(parseBlockProps(source))

  assert.deepEqual(
    knobs.map((k) => k.name),
    ['title', 'columns', 'align'],
  )
  assert.equal(knobs[0].description, 'The headline.')
})
