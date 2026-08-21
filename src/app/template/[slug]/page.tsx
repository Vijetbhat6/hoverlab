/**
 * Template detail — /template/saas-starter, …
 *
 * Three things a person deciding on a starter actually needs, in order:
 * see every screen, see the route table, see the file tree they are about
 * to inherit. The source panel comes last, because at this tier "read the
 * code" means forty files and nobody starts there.
 *
 * The file tree is the honest disclosure. A template that says "8 routes"
 * and quietly ships 60 files is how people end up with a project they do
 * not recognise, so every file is listed, grouped by folder, with the ones
 * that came from blocks marked as such.
 */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ArrowLeft,
  ArrowRight,
  Route as RouteIcon,
  FileCode,
  Package,
  Blocks,
  Terminal,
} from 'lucide-react'
import { TemplateRouteSwitcher } from '@/components/templates/template-route-switcher'
import { TemplateFileBrowser } from '@/components/templates/template-file-browser'
import { TemplateDownloadButton } from '@/components/templates/template-download-button'
import { TemplateCard } from '@/components/templates/template-card'
import { getPagePreview } from '@/lib/pages/registry'
import { getPageMeta } from '@/lib/pages/page-index'
import {
  TEMPLATES,
  getTemplate,
  templatesInCategory,
  filesByFolder,
} from '@/lib/templates/templates'
import { getTemplateMeta } from '@/lib/templates/template-index'
import { absoluteUrl } from '@/lib/site'
import { AddToCollectionButton } from '@/components/collections/add-to-collection'
import {
  TrackArtifactView,
  FavoriteArtifactButton,
  BundleArtifactButton,
  CompareArtifactButton,
  CopyDnaButton,
} from '@/components/artifact-actions'
import { ArtifactFacts } from '@/components/artifact-facts'
import { StickyInstallBar } from '@/components/sticky-install-bar'

export const dynamicParams = false

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const template = getTemplate(slug)
  if (!template) return { title: 'Template not found — Hoverlab' }

  const title = `${template.name} — Next.js Template — Hoverlab`

  return {
    title,
    description: template.description,
    keywords: [...template.tags, 'nextjs template', 'starter kit', 'react template'],
    alternates: { canonical: `/template/${template.id}` },
    openGraph: {
      url: absoluteUrl(`/template/${template.id}`),
      title,
      description: template.description,
      type: 'article',
      siteName: 'Hoverlab',
    },
    twitter: { card: 'summary_large_image', title, description: template.description },
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { slug } = await params
  const template = getTemplate(slug)
  if (!template) notFound()

  const meta = getTemplateMeta(template.id)
  const folders = filesByFolder(template)
  const totalLines = template.files.reduce((n, f) => n + f.source.split('\n').length, 0)

  // The browser gets the project files only — config, layout, tokens,
  // README and the routes. The 18–27 files under `components/` are blocks,
  // and each already has a detail page with a live preview attached, which
  // is a better place to read one than a file list.
  const projectFiles = template.files.filter((f) => !f.path.startsWith('components/'))

  const related = templatesInCategory(template.category).filter((t) => t.id !== template.id)

  const previewRoutes = template.routes.map((route) => ({
    path: route.path,
    label: route.label,
    preview: getPagePreview(route.pageId),
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/templates" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Templates
          </Link>
          <span aria-hidden>/</span>
          <span>{template.category}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="type-page">
            {template.name}
          </h1>
          <p className="mt-3 text-pretty text-body">{template.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FavoriteArtifactButton
              artifact={{
                id: template.id,
                name: template.name,
                category: template.category,
                level: 'template',
              }}
            />
            <BundleArtifactButton
              artifact={{
                id: template.id,
                name: template.name,
                category: template.category,
                level: 'template',
              }}
            />
            <CompareArtifactButton
              artifact={{
                id: template.id,
                name: template.name,
                category: template.category,
                level: 'template',
              }}
            />
            {/* Last in the row: copy, favorite and bundle all serve this
                visit, and a collection serves the month after it. */}
            <AddToCollectionButton
              artifact={{
                id: template.id,
                name: template.name,
                category: template.category,
                level: 'template',
              }}
            />
            {/* Aimed at whoever is about to build with an agent rather than
                paste a component: the tokens, motion and rules, as one
                pasteable document. */}
            <CopyDnaButton artifactId={template.id} />
          </div>

          <TrackArtifactView
            artifact={{
              id: template.id,
              name: template.name,
              category: template.category,
              level: 'template',
            }}
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <RouteIcon aria-hidden className="h-4 w-4" />
              {template.routes.length} routes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Blocks aria-hidden className="h-4 w-4" />
              {template.composedOf.length} pages · {meta?.blockCount ?? 0} blocks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCode aria-hidden className="h-4 w-4" />
              {template.files.length} files · {totalLines.toLocaleString('en-US')} lines
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package aria-hidden className="h-4 w-4" />
              {template.deps.join(', ')}
            </span>
          </div>
        </header>

        <ArtifactFacts
          id={template.id}
          level="template"
          files={projectFiles}
          deps={template.deps}
          includes={template.composedOf}
        />

        <StickyInstallBar
          id={template.id}
          name={template.name}
          command={`npx hoverlab init ${template.id} ./my-app`}
        />

        {/* ---------------------------------------------------------- *
         *  Live preview — every route
         * ---------------------------------------------------------- */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Every screen
          </h2>
          <TemplateRouteSwitcher routes={previewRoutes} />
          <p className="mt-3 text-xs text-muted-foreground">
            Live components in your current theme — switch routes, or the
            phone icon to check the mobile layout.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
         *  Get it
         * ---------------------------------------------------------- */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Get it
          </h2>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <TemplateDownloadButton
              templateId={template.id}
              fileCount={template.files.length}
              tier={template.tier ?? 'free'}
            />

            <div className="mt-5 overflow-hidden rounded-xl bg-zinc-950 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-mono text-xs text-white/40">
                <Terminal aria-hidden className="h-3.5 w-3.5" />
                then
              </p>
              <pre className="overflow-x-auto font-mono text-sm text-zinc-300">
                {`cd ${template.id}\nnpm install\nnpm run dev`}
              </pre>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              The archive contains the whole project — routes, blocks, theme
              tokens, Tailwind and PostCSS config, tsconfig and a{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">.gitignore</code>.
              One runtime dependency, and no Hoverlab dependency at all: it is
              your code from the moment it unzips.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  Routes — the spine
         * ---------------------------------------------------------- */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Routes
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Path</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Page</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">File</th>
                </tr>
              </thead>
              <tbody>
                {template.routes.map((route) => {
                  const page = getPageMeta(route.pageId)
                  return (
                    <tr
                      key={route.path}
                      className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{route.path}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/page/${route.pageId}`}
                          className="inline-flex items-center gap-1 font-medium transition-all hover:gap-1.5 hover:underline"
                        >
                          {page?.name ?? route.pageId}
                          <ArrowRight aria-hidden className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {route.file}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------------------------------------------------- *
         *  File tree — full disclosure
         * ---------------------------------------------------------- */}
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            What you get
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {folders.map(([folder, files]) => (
              <div key={folder} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <h3 className="mb-2 font-mono text-xs font-bold text-muted-foreground">
                  {folder === '/' ? 'project root' : `${folder}/`}
                  <span className="ml-1.5 font-sans font-normal">
                    ({files.length} {files.length === 1 ? 'file' : 'files'})
                  </span>
                </h3>
                <ul className="space-y-0.5">
                  {files.map((file) => (
                    <li key={file.path} className="truncate font-mono text-xs text-muted-foreground">
                      {folder === '/' ? file.path : file.path.slice(folder.length + 1)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Every file is listed. The {meta?.blockCount ?? 0} files in{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">components/</code>{' '}
            are the blocks the pages import —{' '}
            <Link href="/blocks" className="underline underline-offset-2 hover:text-foreground">
              each one has its own page
            </Link>{' '}
            if you want to read it on its own.
          </p>
        </section>

        {/* ---------------------------------------------------------- *
         *  Read the project files
         * ---------------------------------------------------------- */}
        <section className="mt-12">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Project files
          </h2>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            Everything except the blocks. Opens on{' '}
            <code className="font-mono text-xs">app/globals.css</code> — the file
            that makes the rest look right, since every block styles itself
            with <code className="font-mono text-xs">bg-card</code> and{' '}
            <code className="font-mono text-xs">text-muted-foreground</code> rather
            than literal colours.
          </p>

          <TemplateFileBrowser files={projectFiles} initialPath="app/globals.css" />
        </section>

        {related.length > 0 ? (
          <section className="mt-16 border-t border-border/60 pt-10">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              More {template.category}
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {related.map((t) => {
                const m = getTemplateMeta(t.id)
                return m ? <TemplateCard key={t.id} template={m} /> : null
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
