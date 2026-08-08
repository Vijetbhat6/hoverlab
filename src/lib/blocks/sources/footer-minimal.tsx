/**
 * <FooterMinimal> — one row: brand, a few links, socials, copyright.
 *
 * For a site with a handful of pages, where a five-column footer would be
 * mostly whitespace pretending to be structure. A small site with a big
 * footer looks padded; this looks finished.
 *
 * The whole thing is a single flex row that becomes a stack below `sm`,
 * with the copyright ordered *last* visually on mobile and first in the
 * DOM — `flex-col-reverse` handles the flip without duplicating markup or
 * reordering what a screen reader hears.
 *
 * Server component. Nothing here has state.
 */

import * as React from 'react'
import { Github, Twitter } from 'lucide-react'

export interface FooterMinimalLink {
  label: string
  href: string
}

export interface FooterMinimalProps {
  brand?: string
  links?: FooterMinimalLink[]
  socials?: Array<{ label: string; href: string; icon: 'github' | 'twitter' }>
  year?: number
  className?: string
}

const DEFAULT_LINKS: FooterMinimalLink[] = [
  { label: 'Docs', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

const DEFAULT_SOCIALS: FooterMinimalProps['socials'] = [
  { label: 'GitHub', href: '#', icon: 'github' },
  { label: 'Twitter', href: '#', icon: 'twitter' },
]

const ICONS = { github: Github, twitter: Twitter } as const

export function FooterMinimal({
  brand = 'Acme',
  links = DEFAULT_LINKS,
  socials = DEFAULT_SOCIALS,
  year = new Date().getFullYear(),
  className = '',
}: FooterMinimalProps) {
  return (
    <footer className={`border-t border-border/60 ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col-reverse items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        {/* Brand + copyright */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-xs font-black text-primary-foreground"
          >
            {brand.slice(0, 1)}
          </span>
          <p className="text-sm text-muted-foreground">
            © {year} {brand}
          </p>
        </div>

        {/* Links */}
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Socials */}
        <div className="flex gap-1">
          {socials?.map(({ label, href, icon }) => {
            const Icon = ICONS[icon]
            return (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon aria-hidden className="h-4 w-4" />
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
