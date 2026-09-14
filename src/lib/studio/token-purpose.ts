/**
 * What each token is for, in one line.
 *
 * ── WHY THIS IS WORTH WRITING DOWN ──────────────────────────────────────
 *
 * The CSS the studio hands out answers "what do I paste". It does not
 * answer "what is `--muted-foreground` actually for", and the second
 * question is the one that decides whether the next component reaches for
 * `bg-card` or for `bg-white`. A token set nobody understands gets pasted
 * and then ignored.
 *
 * Several of these are written as prohibitions rather than definitions, and
 * that is the half that earns its place: `--accent` is the one people
 * reliably get wrong, because the word means "the brand colour" everywhere
 * except in this convention, where it is a hover tint and `--primary` is
 * the brand.
 *
 * ── WHY IT IS A LIB AND NOT A CONSTANT IN THE TAB ───────────────────────
 *
 * So a test can assert there are no gaps. Four rows shipped blank the first
 * time, and a blank cell lands in exactly the rows a reader is least sure
 * about. Importing it from the `'use client'` tab dragged `next/link` into
 * the Node test process — the same wall `SHARE_URL_MAX` hit.
 */

export const TOKEN_PURPOSE: Record<string, string> = {
  '--background': 'The page. Nothing else.',
  '--foreground': 'Body text on the page.',
  '--card': 'Any raised surface — cards, popovers, table rows.',
  '--card-foreground': 'Text on a card.',
  '--popover': 'A floating surface — menus, tooltips, comboboxes.',
  '--popover-foreground': 'Text on a floating surface.',
  '--primary': 'The accent. Buttons, links, the active state.',
  '--primary-foreground': 'Text on the accent. Never body text.',
  '--secondary': 'The quieter button. Not a second brand colour.',
  '--secondary-foreground': 'Text on the quieter button.',
  '--muted': 'A recessed surface — a filled input, an alternating row.',
  '--muted-foreground': 'Captions and helper text. The pair that fails contrast first.',
  '--accent': 'Hover and highlight tints. Not the brand colour.',
  '--accent-foreground': 'Text on a hover or highlight tint.',
  '--destructive': 'Destructive actions and nothing else.',
  '--border': 'Every border. Never a literal grey.',
  '--input': 'Input borders, which are a shade stronger than a border.',
  '--ring': 'The focus ring. Its visibility is an accessibility requirement.',
}
