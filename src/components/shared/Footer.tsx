import type { ReactNode } from "react";
import { APP_CONFIG } from "~/lib/constants/app";
import { Instagram, Facebook } from "lucide-react";

const FOOTER_LINKS = {
  shop: {
    title: "Shop",
    items: [
      { label: "Sandali Artigianali", href: "/catalogo?category=sandali" },
      { label: "Pelletteria", href: "/catalogo?category=pelletteria" },
      { label: "Articoli per Calzature", href: "/catalogo?category=articoli-calzature" },
      { label: "Catalogo completo", href: "/catalogo" },
    ],
  },
  info: {
    title: "Informazioni",
    items: [
      { label: "Chi siamo", href: "/la-bottega" },
      { label: "Contatti", href: "/contatti" },
      { label: "Guida taglie", href: "/guida-taglia" },
      { label: "Spedizioni e resi", href: "/termini" },
    ],
  },
  legal: {
    title: "Termini e condizioni",
    items: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookie policy", href: "/cookie" },
      { label: "Termini di servizio", href: "/termini" },
    ],
  },
} as const;

const SOCIAL_LINKS = [
  { platform: "Instagram", href: "https://instagram.com/calzoleriaprevenzano", icon: Instagram },
  { platform: "Facebook", href: "https://facebook.com/calzoleriaprevenzano", icon: Facebook },
] as const;

const PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "PayPal",
  "Contrassegno",
] as const;

export function Footer(): ReactNode {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-text)] text-[var(--color-background)]">
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Brand Column */}
          <div>
            <a
              href="/"
              className="inline-flex items-center mb-4"
              aria-label="Calzoleria Prevenzano"
            >
              <img
                src="/images/logo-light.png"
                alt=""
                className="h-12 w-auto"
                width={180}
                height={109}
              />
            </a>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
              Sandali artigianali fatti a mano a Napoli dal 1965.
              Tradizione, qualità e passione per la pelletteria italiana.
            </p>

            {/* 🧬 DNA: Stitch divider */}
            <hr className="h-[var(--stitch-width)] w-12 border-0 bg-[var(--color-accent)] mb-6" />

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-accent)]"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider mb-4 text-[var(--color-accent)]">
              {FOOTER_LINKS.shop.title}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.shop.items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-background)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider mb-4 text-[var(--color-accent)]">
              {FOOTER_LINKS.info.title}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.info.items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-background)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider mb-4 text-[var(--color-accent)]">
              {FOOTER_LINKS.legal.title}
            </h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-background)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    localStorage.removeItem("consent_preferences");
                    window.location.reload();
                  }}
                  className="text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-background)] text-left"
                >
                  Gestisci preferenze cookie
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <hr className="mt-12 mb-8 h-[var(--stitch-width)] border-0 bg-[var(--color-text-secondary)]/20" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-[var(--color-text-secondary)]">
            &copy; {currentYear} {APP_CONFIG.site.name}. Tutti i diritti riservati. P.IVA 04590921211
          </p>
          <div className="flex items-center gap-3">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded border border-[var(--color-text-secondary)]/20 px-2 py-1 text-[10px] font-medium text-[var(--color-text-secondary)]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
