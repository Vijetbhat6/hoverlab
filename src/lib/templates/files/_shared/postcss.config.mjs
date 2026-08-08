/**
 * PostCSS configuration.
 *
 * Tailwind runs as a PostCSS plugin, so without this file the `@tailwind`
 * directives in `app/globals.css` are passed through to the browser as
 * literal text and nothing is styled at all. It is three lines and it is
 * not optional.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
