import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ReducedMotionProvider } from "@/components/reduced-motion-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ShaderRuntime } from "@/components/shader-runtime";
import { Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

/*
  The two faces the theme studio offers beyond what the site already loads.

  Kept to two, and both `display: "swap"`, because this is a picker: the
  cost of a font nobody selects is paid by every visitor, so the list is as
  short as it can be while still covering the three things a typeface can
  say — neutral (Geist), editorial (a text serif) and product (a grotesque
  with a squarer eye). The other two options in `lib/theme-studio.ts` are
  the mono this site already ships and the system stack, which downloads
  nothing at all.
*/
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

// Absolute base for resolving OG / Twitter image URLs, canonical links,
// and sitemap entries. Shared with sitemap.ts and robots.ts so all three
// agree on the origin. See src/lib/site.ts.
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Hoverlab — CSS Effects, Blocks, Pages and Templates",
  description:
    "A curated, open-source catalog that goes from a single CSS hover state to a deployable starter project. Live demos, copy-ready source, and a free CLI: npx hoverlab add <id>.",
  keywords: [
    "CSS",
    "CSS effects",
    "animation",
    "UI blocks",
    "React components",
    "landing page templates",
    "Tailwind",
    "library",
    "frontend",
    "ui",
    "demos",
  ],
  authors: [{ name: "Hoverlab" }],
  // Feed autodiscovery. Without this a reader handed hoverlab.dev finds
  // nothing to subscribe to, which for a catalog whose whole return-visit
  // proposition is "there is new stuff" is the wrong answer. The feed is
  // built from the same git-derived ledger as /changelog, so the two cannot
  // disagree about what shipped.
  alternates: {
    /*
     * The home page's canonical, and only the home page's.
     *
     * "/" is a client component, so it cannot export metadata of its own
     * and this is the one place its canonical can be set. Every other
     * route sets its own and overrides this — the catalog, the docs, the
     * legal pages, the dynamic block, effect, template and path routes,
     * and, as of this change, the tool pages, /login and /signup. So
     * nothing inherits it but "/".
     *
     * The footgun that leaves behind: a new route that forgets its
     * canonical claims to be the home page rather than claiming nothing.
     *
     * It belongs in this object rather than next to it — a second
     * `alternates` key does not merge, it replaces, and the duplicate
     * silently dropped the feed link below until tsc named it.
     */
    canonical: "/",
    types: { "application/atom+xml": [{ url: "/feed.xml", title: "Hoverlab — what's new" }] },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Hoverlab",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
    The font variables live on <html>, not on <body>.

    They used to be on the body, which was fine while nothing read them
    from further up. The theme studio does: it writes `--font-sans` as an
    inline style on <html>, and a custom property is resolved against the
    element it is declared on — so `--font-sans: var(--font-space-grotesk)`
    computed on <html> could not see a `--font-space-grotesk` declared on
    <body>, and silently became invalid. Declaring both on the same
    element fixes it, and costs nothing: the classes only define variables.

    Written as a JS comment rather than a JSX one: a braced JSX comment
    here would be a second child of the return expression, which does not
    parse.
  */
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${sourceSerif.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        {/*
          defaultTheme is "system", not "dark".

          `enableSystem` alone does not make the OS preference the default —
          it only makes "system" a theme the user can choose. With a concrete
          default of "dark", every first-time visitor whose machine is set to
          light still got the dark site, and the light palette this codebase
          maintains in globals.css was unreachable until someone found the
          toggle. "system" means the first paint matches the rest of their
          desktop, and an explicit choice still wins and still persists.
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <AuthProvider>
              <ReducedMotionProvider>
                {children}
                <Toaster />
                <SonnerToaster position="bottom-right" />
                <ServiceWorkerRegister />
                {/* Renders nothing. It finds the `<canvas
                    data-hoverlab-shader>` elements that effect markup drops
                    into the page — on any surface, including ones added
                    later — and starts them. Here rather than per page
                    because effect markup is injected as a string by nine
                    different components, and a tenth would otherwise have
                    to remember. See `shader-runtime.tsx`. */}
                <ShaderRuntime />
                {/* Last in the tree, and outside nothing: it is fixed to the
                    viewport, so where it sits in the DOM only decides paint
                    order and the order a screen reader reaches it in. Both
                    are right at the end — it asks for a decision about the
                    page rather than being part of it. */}
                <CookieConsentBanner />
              </ReducedMotionProvider>
            </AuthProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
