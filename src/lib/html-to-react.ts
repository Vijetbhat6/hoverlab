/**
 * React conversion — kept as a named entry point for the CodeBlock's
 * "Copy as React" button, now backed by the shared export engine in
 * `@/lib/export`.
 *
 * The previous implementation parsed markup with DOMParser, which pinned
 * it to the browser. Once the same conversion had to run in route
 * handlers, the CLI, and the MCP server, that became untenable — so the
 * parsing moved into `@/lib/export/html-parse`, which is isomorphic.
 * The signature here is unchanged so existing call sites keep working.
 */

import { exportEffect } from './export'

export interface ReactConversionOptions {
  effectId: string
  html: string
  css: string
  /** Include the leading comment block with effect metadata. */
  includeHeaderComment?: boolean
  /** Effect display name, used in the header comment when present. */
  name?: string
  /** Effect description, used in the header comment when present. */
  description?: string
}

export function convertToReactComponent({
  effectId,
  html,
  css,
  includeHeaderComment = true,
  name,
  description,
}: ReactConversionOptions): string {
  const { clipboard } = exportEffect(
    { id: effectId, name, description, html, css },
    'react',
  )
  if (includeHeaderComment) return clipboard
  // Drop the leading /** … */ banner.
  return clipboard.replace(/^\/\*\*[\s\S]*?\*\/\n/, '')
}

export { pascalCase } from './export'
