import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ReducedMotionProvider } from "@/components/reduced-motion-provider";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
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
