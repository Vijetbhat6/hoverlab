/**
 * <ToolSchema> — the structured data for one designer tool.
 *
 * Mounted from each tool's `layout.tsx` rather than from <ToolLayout>,
 * which looks like the more obvious home for it. <ToolLayout> is a client
 * component, and putting a crawler-only payload there would ship the whole
 * registry lookup into the browser bundle of a page whose entire selling
 * point is that it is small and works offline. The layouts are server
 * components, so here it costs the visitor nothing.
 *
 * Two blobs, because they answer different questions: what this page is
 * (a free browser-based design tool) and where it sits (Home › Designer
 * tools › this one).
 */

import { JsonLd } from '@/components/json-ld'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { breadcrumbLd, toolLd } from '@/lib/structured-data'

export function ToolSchema({ href }: { href: string }) {
  const tool = DESIGNER_TOOLS.find((entry) => entry.href === href)
  // A missing entry means the route and the registry have drifted. Render
  // nothing rather than throw: structured data is not worth a 500 on a
  // page that otherwise works perfectly.
  if (!tool) return null

  return (
    <>
      <JsonLd
        data={toolLd({
          name: tool.name,
          description: tool.description,
          path: tool.href,
          keywords: tool.keywords,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Designer tools', path: '/tools' },
          { name: tool.name },
        ])}
      />
    </>
  )
}
