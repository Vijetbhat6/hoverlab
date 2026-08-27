/**
 * /tools — the hub route.
 *
 * A server component whose only job is the structured data; the page
 * itself is `<ToolsHub />`, which has to stay a client component because
 * it opens the command palette.
 *
 * The ItemList lives here rather than in `app/tools/layout.tsx` because
 * that layout also wraps all twenty tool routes, and a list of every tool
 * repeated on each individual tool page is the sort of thing that reads as
 * boilerplate to a crawler rather than as a directory.
 */

import { ToolsHub } from '@/components/tools-hub'
import { JsonLd } from '@/components/json-ld'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { itemListLd } from '@/lib/structured-data'

export default function ToolsHubPage() {
  return (
    <>
      <JsonLd
        data={itemListLd(
          'Designer tools',
          '/tools',
          DESIGNER_TOOLS.map((tool) => ({ name: tool.name, path: tool.href })),
        )}
      />
      <ToolsHub />
    </>
  )
}
