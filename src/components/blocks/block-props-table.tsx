import * as React from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { parseBlockProps, sortBlockProps } from '@/lib/blocks/props-table'
import type { Block } from '@/lib/blocks/block-types'

/**
 * "What can I change?" — the block's props, from its own source.
 *
 * A server component with no client cost: the parse happens once per build
 * on a string that is already in memory, and what reaches the browser is a
 * table.
 *
 * Renders nothing when there are no props worth listing. A block with only
 * `className` is configured by replacing its arrays, not by passing props,
 * and a one-row table saying so would be furniture.
 *
 * See `lib/blocks/props-table.ts` for why this is a table rather than the
 * interactive playground the effect tier has — the short version is that
 * the preview registry holds elements rather than component types, on
 * purpose, and inverting that would trade a real correctness property for
 * a set of sliders.
 */
export function BlockPropsTable({ block }: { block: Block }) {
  const source = block.files[0]?.source
  if (!source) return null

  const props = sortBlockProps(parseBlockProps(source))
  const meaningful = props.filter((prop) => prop.name !== 'className')
  if (meaningful.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal aria-hidden className="h-4 w-4" />
        Props
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Read out of the component&rsquo;s own type and signature, so this cannot
        drift from the source below. Every prop has a default — the block renders
        standalone before you pass it anything.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Prop
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Type
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr key={prop.name} className="border-b border-border/60 align-top last:border-0">
                <th scope="row" className="px-4 py-3 font-medium">
                  <code className="font-mono text-xs">{prop.name}</code>
                  {prop.required ? (
                    <span className="ms-1.5 rounded bg-destructive/10 px-1 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                      required
                    </span>
                  ) : null}
                  {prop.description ? (
                    <span className="mt-1 block max-w-md text-xs font-normal text-muted-foreground">
                      {prop.description}
                    </span>
                  ) : null}
                </th>
                <td className="px-4 py-3">
                  <code className="font-mono text-xs text-muted-foreground">{prop.type}</code>
                </td>
                <td className="px-4 py-3">
                  {prop.defaultValue ? (
                    <code className="font-mono text-xs text-muted-foreground">
                      {prop.defaultValue.length > 48
                        ? `${prop.defaultValue.slice(0, 45)}…`
                        : prop.defaultValue}
                    </code>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
