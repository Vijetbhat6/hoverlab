import { toolMetadata } from '@/lib/designer-tools'

export const metadata = toolMetadata('/tools/palette')

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
