/**
 * The footer every public surface shares.
 *
 * It replaces a single line of text — a wordmark and an `npx hoverlab add`
 * string — that ended a site with forty-plus routes, three docs pages,
 * twenty tools, thirty-two categories and eleven guided paths. Nothing
 * below the fold linked anywhere. For a catalog that is two problems at
 * once: a visitor who scrolled to the bottom looking for the thing they
 * wanted found no way to it, and the internal link equity that makes a
 * long tail rank had nowhere to flow.
 *
 * Four link columns beside the brand block: Catalog, Tools, Developers,
 * Company, and a legal row beneath them. Every href below points at a route
 * that exists today — a footer full of 404s distributes nothing and costs
 * trust, so nothing here is stubbed ahead of the page it names.
 *
 * Server component. Nothing here holds state.
 */

import Link from 'next/link'
import { Github, MessageCircle, Twitter, Wand2 } from 'lucide-react'

import { CATEGORIES } from '@/lib/effect-types'
import { DESIGNER_TOOLS } from '@/lib/designer-tools'
import { TOTAL_COUNT } from '@/lib/catalog-stats'
import { BLOCK_COUNT } from '@/lib/blocks/block-index'
import { PAGE_COUNT } from '@/lib/pages/page-index'
import { TEMPLATE_COUNT } from '@/lib/templates/template-index'
import { PATHS } from '@/lib/paths/catalog'
import { SOCIAL, isPlaceholder, type SocialLink } from '@/lib/social'

interface FooterLink {
  label: string
  href: string
  /** Rendered dimmed after the label — a count, not a description. */
  meta?: string
}

const CATALOG_LINKS: FooterLink[] = [
  { label: 'Browse everything', href: '/browse' },
  { label: 'Effects', href: '/library', meta: TOTAL_COUNT.toLocaleString('en-US') },
  { label: 'Blocks', href: '/blocks', meta: String(BLOCK_COUNT) },
  { label: 'Pages', href: '/pages', meta: String(PAGE_COUNT) },
  { label: 'Templates', href: '/templates', meta: String(TEMPLATE_COUNT) },
  { label: 'Categories', href: '/category', meta: String(CATEGORIES.length) },
  { label: 'Guided paths', href: '/paths', meta: String(PATHS.length) },
]

/**
 * Six tools by name, then the hub.
 *
 * Not all twenty: a footer column that runs to twenty rows stops being
 * navigation and becomes a wall. These six are the ones that answer a
 * search query on their own, and the hub link carries the rest.
 */
const FOOTER_TOOL_PATHS = [
  '/tools/contrast',
  '/tools/palette',
  '/tools/gradient',
  '/tools/tokens',
  '/tools/clip-path',
  '/tools/favicon',
]

const TOOL_LINKS: FooterLink[] = [
  ...FOOTER_TOOL_PATHS.map((href) => {
    const tool = DESIGNER_TOOLS.find((t) => t.href === href)
    // A rename in the registry should not silently drop a footer row.
    if (!tool) throw new Error(`site-footer: no designer tool registered at ${href}`)
    return { label: tool.name, href: tool.href }
  }),
  { label: `All ${DESIGNER_TOOLS.length} tools`, href: '/tools' },
]

const DEVELOPER_LINKS: FooterLink[] = [
  { label: 'Documentation', href: '/docs' },
  { label: 'CLI reference', href: '/docs/cli' },
  { label: 'MCP server', href: '/docs/mcp' },
  { label: 'HTTP API', href: '/docs/api' },
  // /design-system was an orphan: a real page, returning 200, in neither
  // nav nor footer nor the sitemap, reachable only from three deep links
  // inside /docs/mcp, /figma and the AI variant panel. It is the page that
  // repaints the whole catalog to a brand, which is the most consequential
  // control on the site — so it now has a way in that does not depend on
  // already being three pages deep.
  { label: 'Design system', href: '/design-system' },
  { label: 'Figma pairing', href: '/figma' },
  { label: 'Playground', href: '/playground' },
]

const COMPANY_LINKS: FooterLink[] = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Licence', href: '/licence' },
  // Directly under pricing, because "what happens when it breaks" is a
  // question asked while looking at a price and nowhere else. Competitors
  // in this category sell support as a line item; until this page existed
  // we made no commitment at all, which reads as none.
  { label: 'Support', href: '/support' },
  { label: 'Changelog', href: '/changelog' },
  // Next to the pricing link on purpose: someone who has just read our price
  // and is about to go and check it against four other tabs should find the
  // table we already built for them rather than build it themselves.
  { label: 'Compared to the others', href: '/compare' },
  // Written for one audience rather than for search. It sits in the footer
  // because that is where someone who has already read a page goes looking
  // for "is this for me", and it is the only route in that does not depend
  // on us being handed the visitor by a search engine or an agent.
  { label: 'For marketplace authors', href: '/for-authors' },
]

/**
 * The four policy documents, in the row under the columns.
 *
 * This list was empty while the pages did not exist, on the principle that
 * a footer link to a 404 is worse than no link. The pages exist now — see
 * src/app/(legal) — so the row renders. If one is ever removed, it comes
 * out of here in the same commit rather than being left to rot.
 *
 * The licence sits with them rather than under Company because it is the
 * document that answers "may I ship this?", which is the question a
 * visitor arrives at the footer holding.
 */
const LEGAL_LINKS: FooterLink[] = [
  { label: 'Licence', href: '/licence' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Refunds', href: '/refunds' },
  // In this row rather than under Company, because the reader who wants it
  // is doing vendor diligence and is already down here reading policies.
  // It is deliberately labelled "evidence" and not "statement": the page
  // makes no conformance claim, and the link should not imply one either.
  { label: 'Accessibility evidence', href: '/accessibility' },
]

/** Social accounts, before the placeholder filter in the component. */
const SOCIAL_ICONS: Array<{
  key: string
  link: SocialLink
  label: string
  Icon: typeof Github
}> = [
  { key: 'github', link: SOCIAL.github, label: 'GitHub', Icon: Github },
  { key: 'discord', link: SOCIAL.discord, label: 'Discord', Icon: MessageCircle },
  { key: 'twitter', link: SOCIAL.twitter, label: 'X', Icon: Twitter },
]

export function SiteFooter() {
  /*
    isPlaceholder() is why this filter exists. The three social URLs fall
    back to github.com / discord.com / twitter.com when their environment
    variables are unset, and a GitHub icon that lands on GitHub's front
    page is a promise the site cannot keep. Unset means not rendered.
  */
  const socials = SOCIAL_ICONS.filter((s) => !isPlaceholder(s.link))

  return (
    <footer className="border-t border-border/40 bg-background/60 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_0.8fr]">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-white">
                <Wand2 aria-hidden className="h-4 w-4" />
              </span>
              <span className="text-base font-bold tracking-tight">Hoverlab</span>
            </Link>

            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A catalog that starts at a single hover state and goes up to a
              project you can deploy. Live demos and real source at every rung.
            </p>

            <code className="mt-4 inline-block rounded-lg border border-border/60 bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
              npx hoverlab add &lt;id&gt;
            </code>

            {socials.length > 0 ? (
              <ul className="mt-5 flex items-center gap-2">
                {socials.map(({ key, link, label, Icon }) => (
                  <li key={key}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      <span className="sr-only">{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <FooterColumn title="Catalog" links={CATALOG_LINKS} />
          <FooterColumn title="Tools" links={TOOL_LINKS} />
          <FooterColumn title="Developers" links={DEVELOPER_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hoverlab — {TOTAL_COUNT.toLocaleString('en-US')} effects,{' '}
            {BLOCK_COUNT} blocks, {PAGE_COUNT} pages and {TEMPLATE_COUNT}{' '}
            templates. Free CLI and public API.
          </p>

          {LEGAL_LINKS.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  )
}

/**
 * One column.
 *
 * A <nav> each rather than one <nav> around all three: a screen reader
 * lists landmarks by their label, and "Catalog", "Tools" and "Developers"
 * are three useful entries where "Footer" is one vague one. The heading is
 * the label, via aria-labelledby, so the text is not duplicated.
 */
function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const headingId = `footer-${title.toLowerCase()}`

  return (
    <nav aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-xs font-semibold uppercase tracking-wider text-foreground"
      >
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group inline-flex items-baseline gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {l.label}
              {l.meta ? (
                <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground">
                  {l.meta}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
