/**
 * The registry's own name, in a module with no `server-only` import.
 *
 * `registry.ts` builds items out of block and page sources and is
 * server-only for good reasons. This one string is also needed on the
 * client — /tools shows the install command, and the command contains the
 * name — so it lives here rather than being typed out a second time
 * somewhere a rename would not reach.
 */

/** The `registry:base` item's name, and the namespace people will configure. */
export const REGISTRY_NAME = 'hoverlab'
