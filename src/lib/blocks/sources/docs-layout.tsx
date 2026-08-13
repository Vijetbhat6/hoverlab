/**
 * <DocsLayout> — the three-column documentation screen.
 *
 * The layout survives because each column answers a different question.
 * The sidebar answers "where am I in the product", the article answers
 * "what does this page say", and the toc rail answers "where am I in the
 * page". Merge any two and one of those questions goes unanswered.
 *
 * The classic failure is collapsing them in the wrong order on mobile.
 * The correct order is the reverse of usefulness: the toc goes first
 * (hidden below xl — a short page is its own toc), the sidebar second
 * (folded behind a summary line below lg), and the article never. A docs
 * site that hides prose to keep navigation visible has it backwards.
 */

import * as React from 'react'
import {
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Info,
} from 'lucide-react'

interface DocsNavItem {
  label: string
  href: string
  active?: boolean
}

interface DocsNavGroup {
  group: string
  items: DocsNavItem[]
}

export interface DocsLayoutProps {
  title?: string
  standfirst?: string
  className?: string
}

const NAV: DocsNavGroup[] = [
  {
    group: 'Getting started',
    items: [
      { label: 'Introduction', href: '#introduction' },
      { label: 'Quickstart', href: '#quickstart' },
      { label: 'Authentication', href: '#authentication', active: true },
      { label: 'SDKs & clients', href: '#sdks' },
    ],
  },
  {
    group: 'Guides',
    items: [
      { label: 'Pagination', href: '#pagination' },
      { label: 'Rate limits', href: '#rate-limits' },
      { label: 'Webhooks', href: '#webhooks' },
    ],
  },
  {
    group: 'API reference',
    items: [
      { label: 'Projects', href: '#ref-projects' },
      { label: 'Deployments', href: '#ref-deployments' },
      { label: 'Logs', href: '#ref-logs' },
    ],
  },
]

const TOC: { label: string; href: string; active?: boolean }[] = [
  { label: 'Creating an API key', href: '#creating-an-api-key', active: true },
  { label: 'Rotating keys', href: '#rotating-keys' },
]

const SNIPPET = `curl https://api.acme.dev/v1/projects \\
  -H "Authorization: Bearer $ACME_API_KEY"`

function SidebarNav() {
  return (
    <nav aria-label="Docs" className="space-y-6">
      {NAV.map((section) => (
        <div key={section.group}>
          <h2 className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {section.group}
          </h2>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    item.active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function DocsLayout({
  title = 'Authentication',
  standfirst = 'Every request to the Acme API is authenticated with a bearer token. This page covers creating a key, storing it safely, and rotating it without downtime.',
  className = '',
}: DocsLayoutProps) {
  return (
    <div className={`w-full bg-background text-foreground ${className}`}>
      {/* Mobile: the sidebar folds behind a summary line; the article stays. */}
      <details className="group border-b border-border/60 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <ChevronDown
            aria-hidden
            className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
          />
          Docs navigation
        </summary>
        <div className="border-t border-border/60 px-2 py-4">
          <SidebarNav />
        </div>
      </details>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:px-8 xl:grid-cols-[13rem_minmax(0,1fr)_12rem]">
        <div className="hidden lg:block">
          <SidebarNav />
        </div>

        <article className="min-w-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <a href="#docs" className="transition-colors hover:text-foreground">
                  Docs
                </a>
              </li>
              <ChevronRight aria-hidden className="h-3.5 w-3.5" />
              <li>
                <a href="#getting-started" className="transition-colors hover:text-foreground">
                  Getting started
                </a>
              </li>
              <ChevronRight aria-hidden className="h-3.5 w-3.5" />
              <li aria-current="page" className="font-medium text-foreground">
                {title}
              </li>
            </ol>
          </nav>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-base text-muted-foreground">{standfirst}</p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Acme issues two kinds of keys. Secret keys (prefixed{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              sk_live_
            </code>
            ) can read and write everything in your project and must only ever live on a
            server. Publishable keys (prefixed{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              pk_live_
            </code>
            ) are safe to ship in a browser bundle and can only create client sessions.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Keys are scoped to a project, not to your account. Deleting a project revokes
            its keys immediately; removing a teammate does not, so treat offboarding as a
            reason to rotate.
          </p>

          <h2
            id="creating-an-api-key"
            className="mt-10 text-xl font-semibold tracking-tight"
          >
            Creating an API key
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Create a key from the dashboard under Settings → API keys, then pass it as a
            bearer token on every request:
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-zinc-950">
            <div aria-hidden className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-white/40">terminal</span>
            </div>
            <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
              <code className="font-mono text-zinc-300">{SNIPPET}</code>
            </pre>
          </div>

          <div className="mt-6 flex gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> the full secret is
              shown once, at creation. Acme stores only a hash, so a lost key cannot be
              recovered — it can only be rotated.
            </p>
          </div>

          <h2 id="rotating-keys" className="mt-10 text-xl font-semibold tracking-tight">
            Rotating keys
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Rotation is overlap, not replacement: create the new key, deploy it everywhere,
            and only then revoke the old one. Both keys stay valid during the window, so a
            slow rollout never turns into an outage.
          </p>

          <nav aria-label="Pagination" className="mt-12 grid gap-4 sm:grid-cols-2">
            <a
              href="#quickstart"
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/40"
            >
              <ArrowLeft
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
              />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Previous</span>
                <span className="block truncate text-sm font-medium">Quickstart</span>
              </span>
            </a>
            <a
              href="#sdks"
              className="group flex items-center justify-end gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-right transition-colors hover:border-primary/40"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Next</span>
                <span className="block truncate text-sm font-medium">SDKs & clients</span>
              </span>
              <ArrowRight
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
              />
            </a>
          </nav>
        </article>

        <nav aria-label="On this page" className="hidden xl:block">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            On this page
          </h2>
          <ul className="mt-3 space-y-1 border-l border-border/60">
            {TOC.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={item.active ? 'location' : undefined}
                  className={`-ml-px block border-l py-1 pl-4 text-sm transition-colors ${
                    item.active
                      ? 'border-primary font-medium text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
