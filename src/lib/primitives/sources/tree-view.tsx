'use client'

/**
 * <TreeView> — a file tree, with the keyboard contract that makes it one.
 *
 * Nested `<details>` gets you collapsing for free and is genuinely a good
 * answer for a sidebar of three sections. It is not an answer for a tree,
 * because a tree is one tab stop with arrow-key navigation across the whole
 * structure, and `<details>` gives you one tab stop per node.
 *
 * The ARIA tree pattern, and all of it is here:
 *
 *   Down/Up      next/previous VISIBLE node — so a collapsed folder's
 *                children are skipped, which is the part that is fiddly
 *   Right        expand a closed folder; on an open one, move to its first
 *                child; on a leaf, nothing
 *   Left         collapse an open folder; otherwise move to its parent
 *   Home/End     first and last visible node
 *   Enter/Space  select, or toggle a folder
 *   a letter     jump to the next node starting with it
 *
 * Right and Left are mapped through the reading direction: in an RTL tree
 * the children are indented from the right, so ArrowLeft is "go deeper".
 *
 * Only one node is tabbable at a time (`tabIndex={0}`), which is what makes
 * Tab leave the tree rather than walk 400 files.
 */

import * as React from 'react'
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'

export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
}

export interface TreeViewProps {
  nodes: TreeNode[]
  /** Ids open on first render. */
  defaultExpanded?: string[]
  selectedId?: string
  onSelect?: (node: TreeNode) => void
  /** Names the tree: "Project files". */
  label: string
  className?: string
}

interface Flat {
  node: TreeNode
  depth: number
  parentId: string | null
  expandable: boolean
}

export function TreeView({
  nodes,
  defaultExpanded = [],
  selectedId,
  onSelect,
  label,
  className = '',
}: TreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(defaultExpanded))
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const rootRef = React.useRef<HTMLUListElement>(null)

  /**
   * Every node currently on screen, in visual order.
   *
   * Recomputed from the tree rather than tracked incrementally, because
   * "the next visible node" is a question about the whole structure and
   * the alternative is a linked list that has to be repaired on every
   * expand. A few hundred nodes is nothing; a tree big enough for this to
   * matter needs virtualising, which is a different component.
   */
  const visible = React.useMemo(() => {
    const out: Flat[] = []
    const walk = (list: TreeNode[], depth: number, parentId: string | null) => {
      for (const node of list) {
        const expandable = Array.isArray(node.children) && node.children.length > 0
        out.push({ node, depth, parentId, expandable })
        if (expandable && expanded.has(node.id)) {
          walk(node.children!, depth + 1, node.id)
        }
      }
    }
    walk(nodes, 0, null)
    return out
  }, [nodes, expanded])

  const activeId = focusId ?? selectedId ?? visible[0]?.node.id ?? null
  const activeIndex = visible.findIndex((f) => f.node.id === activeId)

  const focusNode = (id: string) => {
    setFocusId(id)
    // The tree owns focus placement, so it has to move DOM focus too —
    // `aria-activedescendant` is the alternative, and it reads worse in
    // several screen readers for trees specifically.
    requestAnimationFrame(() => {
      rootRef.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)?.focus()
    })
  }

  const toggle = (id: string, open?: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      const shouldOpen = open ?? !next.has(id)
      if (shouldOpen) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (activeIndex < 0) return
    const entry = visible[activeIndex]
    const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
    const deeper = rtl ? 'ArrowLeft' : 'ArrowRight'
    const shallower = rtl ? 'ArrowRight' : 'ArrowLeft'

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = visible[activeIndex + 1]
      if (next) focusNode(next.node.id)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = visible[activeIndex - 1]
      if (prev) focusNode(prev.node.id)
    } else if (e.key === deeper) {
      e.preventDefault()
      if (entry.expandable && !expanded.has(entry.node.id)) {
        toggle(entry.node.id, true)
      } else if (entry.expandable) {
        const child = visible[activeIndex + 1]
        if (child) focusNode(child.node.id)
      }
    } else if (e.key === shallower) {
      e.preventDefault()
      if (entry.expandable && expanded.has(entry.node.id)) {
        toggle(entry.node.id, false)
      } else if (entry.parentId) {
        focusNode(entry.parentId)
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      if (visible[0]) focusNode(visible[0].node.id)
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = visible[visible.length - 1]
      if (last) focusNode(last.node.id)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (entry.expandable) toggle(entry.node.id)
      else onSelect?.(entry.node)
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Typeahead, wrapping from the current position — the behaviour a
      // file list has in every OS.
      const letter = e.key.toLowerCase()
      const order = [
        ...visible.slice(activeIndex + 1),
        ...visible.slice(0, activeIndex + 1),
      ]
      const hit = order.find((f) => f.node.label.toLowerCase().startsWith(letter))
      if (hit) focusNode(hit.node.id)
    }
  }

  return (
    <ul
      ref={rootRef}
      role="tree"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`select-none text-sm ${className}`}
    >
      {visible.map((entry) => {
        const { node, depth, expandable } = entry
        const isOpen = expanded.has(node.id)
        const isSelected = node.id === selectedId

        return (
          <li
            key={node.id}
            role="treeitem"
            aria-expanded={expandable ? isOpen : undefined}
            aria-selected={isSelected}
            // The depth has to be stated: the flattened list has no nesting
            // for a screen reader to infer it from.
            aria-level={depth + 1}
            data-node={node.id}
            // Roving tabindex — one stop for the whole tree.
            tabIndex={node.id === activeId ? 0 : -1}
            onFocus={() => setFocusId(node.id)}
            onClick={() => {
              if (expandable) toggle(node.id)
              else onSelect?.(node)
            }}
            className={[
              'flex cursor-pointer items-center gap-1.5 rounded-md py-1 pe-2',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60',
            ].join(' ')}
            // Indentation is inline because the depth is data, not a fixed
            // set of classes — `padding-inline-start` so the tree indents
            // away from the reading edge in both directions.
            style={{ paddingInlineStart: `${depth * 1.125 + 0.5}rem` }}
          >
            {expandable ? (
              <ChevronRight
                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform rtl:-scale-x-100 ${isOpen ? 'rotate-90 rtl:-rotate-90' : ''}`}
                aria-hidden
              />
            ) : (
              <span aria-hidden className="w-3.5 shrink-0" />
            )}

            {expandable ? (
              isOpen ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )
            ) : (
              <File className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}

            <span className="truncate">{node.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
