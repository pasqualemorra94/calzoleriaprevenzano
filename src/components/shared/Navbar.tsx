"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { Menu, X, ShoppingBag, Heart, Search } from "lucide-react";
import { APP_CONFIG } from "~/lib/constants/app";
import type { NavItem } from "~/lib/types/models";
import { MobileMenu } from "./MobileMenu";

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setIsOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

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
          <a href="/ricerca" aria-label="Cerca prodotti" className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]">
            <Search className="h-5 w-5" />
          </a>
          <a href="/wishlist" aria-label="Lista desideri" className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {wishlistCount}
              </span>
            )}
          </a>
          <a href="/carrello" aria-label="Carrello" className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]">
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

      <MobileMenu isOpen={isOpen} onClose={closeMenu} cartCount={cartCount} menuRef={menuRef} />
    </header>
  );
}
