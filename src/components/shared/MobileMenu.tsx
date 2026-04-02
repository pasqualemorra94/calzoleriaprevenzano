"use client";

import { ShoppingBag, Heart, Search, X } from "lucide-react";
import { APP_CONFIG } from "~/lib/constants/app";
import type { NavItem } from "~/lib/types/models";
import { cn } from "~/lib/utils/cn";

const NAV_ITEMS: NavItem[] = [
  { label: "Sandali", href: "/sandali" },
  { label: "Accessori", href: "/accessori" },
  { label: "Pelletteria", href: "/pelletteria" },
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
          <span className="font-display text-lg font-semibold text-[var(--color-text)]">
            {APP_CONFIG.site.name}
          </span>
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

        {/* Mobile actions */}
        <div className="flex items-center justify-around border-t border-[var(--color-border)] px-[var(--page-padding-x)] py-4">
          <a
            href="/ricerca" onClick={onClose}
            aria-label="Cerca"
            className="flex flex-col items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <Search className="h-5 w-5" />
            <span className="text-xs">Cerca</span>
          </a>
          <a
            href="/wishlist" onClick={onClose}
            aria-label="Lista desideri"
            className="relative flex flex-col items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Desideri</span>
          </a>
          <a
            href="/carrello" onClick={onClose}
            aria-label="Carrello"
            className="relative flex flex-col items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs">Carrello</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}
