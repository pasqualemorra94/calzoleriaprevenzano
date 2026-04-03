/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { APP_CONFIG } from "~/lib/constants/app";
import { MotionProvider } from "~/providers/MotionProvider";
import { Navbar } from "~/components/shared/Navbar";
import { Footer } from "~/components/shared/Footer";
import { MobileBottomNav } from "~/components/shared/MobileBottomNav";
import { StructuredData } from "~/components/seo/StructuredData";
import { cn } from "~/lib/utils/cn";
import appCss from "~/styles/app.css?url";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: APP_CONFIG.site.name,
  url: APP_CONFIG.site.url,
  description: `${APP_CONFIG.site.name} — ${APP_CONFIG.site.tagline}. Sandali artigianali fatti a mano a Napoli dal 1965.`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Via Chiaia, 104",
    addressLocality: "Napoli",
    addressRegion: "NA",
    postalCode: "80132",
    addressCountry: "IT",
  },
} as const;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      {
        name: "description",
        content: `${APP_CONFIG.site.name} — ${APP_CONFIG.site.tagline}. Sandali artigianali fatti a mano a Napoli dal 1965.`,
      },
      { title: APP_CONFIG.site.name },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "it_IT" },
      { property: "og:site_name", content: APP_CONFIG.site.name },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.bunny.net",
      },
      {
        rel: "preconnect",
        href: "https://fonts.bunny.net",
        crossOrigin: "",
      },
      {
        rel: "preload",
        href: "https://fonts.bunny.net/css?family=cormorant-garamond:wght@400;500;600;700&display=swap",
        as: "style",
      },
      {
        rel: "preload",
        href: "https://fonts.bunny.net/css?family=dm-sans:wght@400;500;600&display=swap",
        as: "style",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.bunny.net/css?family=cormorant-garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=dm-sans:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <MotionProvider>
      <a href="#main-content" className="skip-to-content">
        Vai al contenuto principale
      </a>
      <StructuredData data={ORG_SCHEMA} />
      {!isAdmin && <Navbar />}
      <main
        id="main-content"
        className={cn(
          "min-h-screen",
          !isAdmin && "pt-[var(--navbar-height)] md:pt-[var(--navbar-height-md)] pb-20 md:pb-0",
        )}
      >
        <Outlet />
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
    </MotionProvider>
  );
}

function NotFoundComponent(): ReactNode {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--page-padding-x)]">
      <p className="mb-4 text-8xl font-display font-bold text-[var(--color-primary)]">
        404
      </p>
      <h1 className="mb-4 text-center text-2xl font-display font-semibold text-[var(--color-text)] md:text-3xl">
        Pagina non trovata
      </h1>
      <p className="mb-8 max-w-md text-center leading-relaxed text-[var(--color-text-secondary)]">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <a
        href="/"
        className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
      >
        Torna alla homepage
      </a>
    </div>
  );
}
