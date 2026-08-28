import { OG_SIZE, toolOgAlt, toolOgImage } from '@/lib/tool-og'

/** Share card for /tools/shadcn, drawn from the designer-tools registry. */

export const runtime = 'nodejs'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = toolOgAlt('/tools/shadcn')

export default function OpenGraphImage() {
  return toolOgImage('/tools/shadcn')
}
