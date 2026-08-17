import { toolMetadata } from '@/lib/designer-tools'

export const metadata = toolMetadata('/tools/email')

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
