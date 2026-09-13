/**
 * The free-asset surface gets the same chrome as every catalog surface.
 *
 * One line, like the other eleven route trees. `CatalogLayout` brings the
 * ladder nav, the theme bar, the `<main>` landmark the skip link needs, and
 * the footer — so nothing beneath this file renders a `<main>` of its own.
 *
 * Worth stating why this belongs here despite `/assets` not being a rung of
 * the ladder: a visitor who lands on a free avatar from a search result is
 * exactly the visitor the surface exists for, and the nav is the only thing
 * on the page that tells them a catalog is attached to it.
 */
export { CatalogLayout as default } from '@/components/catalog-layout'
