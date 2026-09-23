'use client'

/**
 * <SidebarFileTree> — an explorer sidebar built as a real ARIA tree, with the
 * keyboard model people already know from every code editor.
 *
 *  - `role="tree"` with `treeitem` rows carrying `aria-level`, `aria-setsize`,
 *    `aria-posinset` and, for folders, `aria-expanded`. The rows are rendered
 *    flat rather than nested because a screen reader is told the structure by
 *    those attributes, and a flat list is far easier to move focus through.
 *  - One tab stop. Focus is roving: exactly one row has `tabIndex={0}`, so Tab
 *    enters the tree once and leaves it once instead of stopping on every file.
 *  - Up/Down move, Home/End jump, Right opens a folder or steps into it, Left
 *    closes it or steps out to its parent, Enter/Space activate, and typing a
 *    letter jumps to the next row starting with it. Left and Right swap in an
 *    RTL document, where "into" points the other way.
 *  - Selection (`aria-selected`) and focus are different things and are kept
 *    apart: arrowing does not open files, only activating does.
 *  - Folders carry `aria-expanded` and no `aria-controls`, on purpose. The
 *    tree pattern has no controlled region: a flat treeitem "owns" the rows
 *    that follow it through `aria-level`, so there is nothing for an IDREF to
 *    point at. The a11y audit lists this as an advisory, not a failure.
 */

import * as React from 'react'
import { ChevronDown, Folder, FolderOpen, FileText, FileCode2, FileJson } from 'lucide-react'

export interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
}

export interface SidebarFileTreeProps {
  nodes?: TreeNode[]
  defaultExpanded?: string[]
  defaultSelectedId?: string
  children?: React.ReactNode
  className?: string
}

const DEFAULT_NODES: TreeNode[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      {
        id: 'src/app',
        name: 'app',
        children: [
          { id: 'src/app/layout.tsx', name: 'layout.tsx' },
          { id: 'src/app/page.tsx', name: 'page.tsx' },
          { id: 'src/app/globals.css', name: 'globals.css' },
        ],
      },
      {
        id: 'src/components',
        name: 'components',
        children: [
          { id: 'src/components/button.tsx', name: 'button.tsx' },
          { id: 'src/components/card.tsx', name: 'card.tsx' },
        ],
      },
      { id: 'src/utils.ts', name: 'utils.ts' },
    ],
  },
  { id: 'public', name: 'public', children: [{ id: 'public/logo.svg', name: 'logo.svg' }] },
  { id: 'package.json', name: 'package.json' },
  { id: 'README.md', name: 'README.md' },
  { id: 'tsconfig.json', name: 'tsconfig.json' },
]

interface Row {
  node: TreeNode
  level: number
  parentId: string | null
  setsize: number
  posinset: number
}

function flatten(nodes: TreeNode[], open: Set<string>, level = 1, parentId: string | null = null): Row[] {
  return nodes.flatMap((node, i) => {
    const row: Row = { node, level, parentId, setsize: nodes.length, posinset: i + 1 }
    return node.children && open.has(node.id)
      ? [row, ...flatten(node.children, open, level + 1, node.id)]
      : [row]
  })
}

function FileIcon({ name }: { name: string }) {
  const cls = 'h-4 w-4 shrink-0'
  if (/\.(tsx?|jsx?|css)$/.test(name)) return <FileCode2 aria-hidden className={cls} />
  if (/\.json$/.test(name)) return <FileJson aria-hidden className={cls} />
  return <FileText aria-hidden className={cls} />
}

export function SidebarFileTree({
  nodes = DEFAULT_NODES,
  defaultExpanded = ['src', 'src/app'],
  defaultSelectedId = 'src/app/page.tsx',
  children,
  className = '',
}: SidebarFileTreeProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(() => new Set(defaultExpanded))
  const [selectedId, setSelectedId] = React.useState(defaultSelectedId)
  const [focusId, setFocusId] = React.useState(defaultSelectedId)
  const treeRef = React.useRef<HTMLUListElement>(null)
  const refs = React.useRef(new Map<string, HTMLLIElement>())
  const moveDomFocus = React.useRef(false)

  const rows = React.useMemo(() => flatten(nodes, open), [nodes, open])

  React.useEffect(() => {
    if (!moveDomFocus.current) return
    moveDomFocus.current = false
    refs.current.get(focusId)?.focus()
  }, [focusId, rows])

  const focusRow = (id: string) => {
    moveDomFocus.current = true
    setFocusId(id)
  }

  const toggle = (id: string, want?: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev)
      const shouldOpen = want ?? !prev.has(id)
      if (shouldOpen) next.add(id)
      else next.delete(id)
      return next
    })

  const activate = (row: Row) => {
    setFocusId(row.node.id)
    if (row.node.children) toggle(row.node.id)
    else setSelectedId(row.node.id)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const i = rows.findIndex((r) => r.node.id === focusId)
    const row = rows[i]
    if (!row) return
    const rtl = treeRef.current ? getComputedStyle(treeRef.current).direction === 'rtl' : false
    const inKey = rtl ? 'ArrowLeft' : 'ArrowRight'
    const outKey = rtl ? 'ArrowRight' : 'ArrowLeft'
    const isOpen = open.has(row.node.id)

    if (e.key === 'ArrowDown') focusRow(rows[Math.min(i + 1, rows.length - 1)].node.id)
    else if (e.key === 'ArrowUp') focusRow(rows[Math.max(i - 1, 0)].node.id)
    else if (e.key === 'Home') focusRow(rows[0].node.id)
    else if (e.key === 'End') focusRow(rows[rows.length - 1].node.id)
    else if (e.key === inKey) {
      if (row.node.children && !isOpen) toggle(row.node.id, true)
      else if (row.node.children && isOpen) focusRow(rows[i + 1].node.id)
    } else if (e.key === outKey) {
      if (row.node.children && isOpen) toggle(row.node.id, false)
      else if (row.parentId) focusRow(row.parentId)
    } else if (e.key === 'Enter' || e.key === ' ') activate(row)
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ch = e.key.toLowerCase()
      const hit = [...rows.slice(i + 1), ...rows.slice(0, i)].find((r) =>
        r.node.name.toLowerCase().startsWith(ch),
      )
      if (hit) focusRow(hit.node.id)
      else return
    } else return
    e.preventDefault()
  }

  const selectedName = selectedId.split('/').pop()

  return (
    <div
      className={`flex h-[32rem] overflow-hidden rounded-2xl border border-border/60 bg-background ${className}`}
    >
      <aside
        aria-label="Explorer"
        className="flex w-64 shrink-0 flex-col border-e border-border/60 bg-card/40"
      >
        <h2
          id={`${uid}-title`}
          className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Explorer
        </h2>
        <ul
          ref={treeRef}
          role="tree"
          aria-labelledby={`${uid}-title`}
          onKeyDown={onKeyDown}
          className="flex-1 overflow-y-auto px-2 pb-3"
        >
          {rows.map((row) => {
            const { node, level } = row
            const isFolder = !!node.children
            const isOpen = open.has(node.id)
            const selected = node.id === selectedId
            return (
              <li
                key={node.id}
                ref={(el) => {
                  if (el) refs.current.set(node.id, el)
                  else refs.current.delete(node.id)
                }}
                role="treeitem"
                aria-level={level}
                aria-setsize={row.setsize}
                aria-posinset={row.posinset}
                aria-expanded={isFolder ? isOpen : undefined}
                aria-selected={selected}
                tabIndex={node.id === focusId ? 0 : -1}
                onClick={() => activate(row)}
                onFocus={(e) => {
                  if (e.target === e.currentTarget) setFocusId(node.id)
                }}
                style={{ paddingInlineStart: `${(level - 1) * 14 + 8}px` }}
                className={`flex cursor-pointer select-none items-center gap-1.5 rounded-lg py-1.5 pe-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selected
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {isFolder ? (
                  <ChevronDown
                    aria-hidden
                    className={`h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none ${
                      isOpen ? '' : '-rotate-90 rtl:rotate-90'
                    }`}
                  />
                ) : (
                  <span aria-hidden className="w-3.5 shrink-0" />
                )}
                {isFolder ? (
                  isOpen ? (
                    <FolderOpen aria-hidden className="h-4 w-4 shrink-0" />
                  ) : (
                    <Folder aria-hidden className="h-4 w-4 shrink-0" />
                  )
                ) : (
                  <FileIcon name={node.name} />
                )}
                <span className="truncate">{node.name}</span>
              </li>
            )
          })}
        </ul>
      </aside>

      <main className="hidden min-w-0 flex-1 p-6 sm:block">
        {children ?? (
          <div className="flex min-h-full items-center justify-center rounded-xl border border-dashed border-border/60 p-4 font-mono text-sm text-muted-foreground">
            <span className="min-w-0 truncate">{selectedName}</span>
          </div>
        )}
      </main>
    </div>
  )
}
