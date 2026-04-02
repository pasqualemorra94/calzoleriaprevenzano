/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { APP_CONFIG } from "~/lib/constants/app";
import appCss from "~/styles/app.css?url";

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
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.bunny.net",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.bunny.net/css?family=cormorant-garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=dm-sans:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
      { rel: "stylesheet", href: "/design-tokens.css" },
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
        <a href="#main-content" className="skip-to-content">
          Vai al contenuto principale
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}

function NotFoundComponent(): ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="text-8xl font-display font-bold text-[var(--color-primary)] mb-4">
        404
      </p>
      <h1 className="text-2xl md:text-3xl font-display font-semibold text-[var(--color-text)] mb-4">
        Pagina non trovata
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 text-center max-w-md leading-relaxed">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
      >
        Torna alla homepage
      </Link>
    </main>
  );
}
