"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { Menu, X, ShoppingBag, Heart, Search } from "lucide-react";
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

interface NavbarProps {
  cartCount?: number;
  wishlistCount?: number;
}

export function Navbar({ cartCount = 0, wishlistCount = 0 }: NavbarProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[var(--z-navbar)] border-b border-[var(--color-border-light)] bg-[var(--color-background)]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-[var(--navbar-height)] max-w-[var(--page-max-width)] items-center justify-between px-[var(--page-padding-x)] md:h-[var(--navbar-height-md)]">
        {/* Logo */}
        <a
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-[var(--color-text)] md:text-xl"
        >
          {APP_CONFIG.site.name}
        </a>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-primary)]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <a
            href="/ricerca"
            aria-label="Cerca prodotti"
            className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <Search className="h-5 w-5" />
          </a>
          <a
            href="/wishlist"
            aria-label="Lista desideri"
            className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {wishlistCount}
              </span>
            )}
          </a>
          <a
            href="/carrello"
            aria-label="Carrello"
            className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {cartCount}
              </span>
            )}
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)] md:hidden"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* 🧬 DNA: Stitch divider under navbar */}
      <hr className="h-[var(--stitch-width)] w-[var(--stitch-length)] border-0 bg-[var(--stitch-color)] mx-auto" />

      {/* Mobile Menu Overlay */}
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
        {/* Mobile menu content */}
        <div className="flex h-full flex-col">
          {/* Mobile menu header */}
          <div className="flex h-[var(--navbar-height)] items-center justify-between px-[var(--page-padding-x)] border-b border-[var(--color-border)]">
            <span className="font-display text-lg font-semibold text-[var(--color-text)]">
              {APP_CONFIG.site.name}
            </span>
            <button
              onClick={closeMenu}
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
                  onClick={closeMenu}
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
              href="/ricerca"
              onClick={closeMenu}
              aria-label="Cerca"
              className="flex flex-col items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              <Search className="h-5 w-5" />
              <span className="text-xs">Cerca</span>
            </a>
            <a
              href="/wishlist"
              onClick={closeMenu}
              aria-label="Lista desideri"
              className="relative flex flex-col items-center gap-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Desideri</span>
            </a>
            <a
              href="/carrello"
              onClick={closeMenu}
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
    </header>
  );
}
