"use client";

import { ShoppingBag, X } from "lucide-react";
import { APP_CONFIG } from "~/lib/constants/app";
import type { NavItem } from "~/lib/types/models";
import { cn } from "~/lib/utils/cn";

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Sandali", href: "/sandali" },
  { label: "Catalogo", href: "/catalogo" },
  { label: "La Bottega", href: "/la-bottega" },
  { label: "Contatti", href: "/contatti" },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Mobile navigation overlay with nav links and action icons.
 * Extracted from Navbar to respect 200 LOC limit.
 */
export function MobileMenu({ isOpen, onClose, cartCount, menuRef }: MobileMenuProps) {
  return (
    <div
      ref={menuRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu di navigazione"
      className={cn(
        "fixed inset-0 top-0 z-[var(--z-overlay)] bg-[var(--color-background)] transition-transform duration-300 ease-out md:hidden",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Mobile menu header */}
        <div className="flex h-[var(--navbar-height)] items-center justify-between px-[var(--page-padding-x)] border-b border-[var(--color-border)]">
          <a
            href="/"
            className="flex items-center"
            aria-label={APP_CONFIG.site.name}
          >
            <img
              src="/images/logo.png"
              alt=""
              className="h-7 w-auto"
              width={132}
              height={80}
            />
          </a>
          <button
            onClick={onClose}
            aria-label="Chiudi menu"
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile nav links */}
        <ul className="flex flex-1 flex-col gap-1 px-[var(--page-padding-x)] py-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onClose}
                className="block py-3 font-display text-2xl text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile actions — carrello only */}
        <div className="flex items-center justify-center border-t border-[var(--color-border)] px-[var(--page-padding-x)] py-4">
          <a
            href="/carrello" onClick={onClose}
            aria-label="Carrello"
            className="relative flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-medium">Carrello</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
