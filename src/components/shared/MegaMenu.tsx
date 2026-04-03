"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils/cn";

interface GrandchildCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  children: GrandchildCategory[];
}

interface TopCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  children: ChildCategory[];
}

/** Static nav items — MegaMenu items loaded dynamically */
const STATIC_NAV: Array<{ label: string; to: string }> = [
  { label: "La Bottega", to: "/la-bottega" },
  { label: "Contatti", to: "/contatti" },
];

function MegaMenuPanel({ categories }: { categories: TopCategory[] }) {
  return (
    <div className="absolute left-1/2 top-full z-[var(--z-overlay)] mt-1 w-[95vw] max-w-[1100px] -translate-x-1/2 animate-[fadeIn_150ms_ease-out]">
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]">
        <div className="grid grid-cols-3 gap-0 p-6">
          {categories.map((cat) => (
            <div key={cat.id} className="border-r border-[var(--color-border-light)] last:border-r-0 px-6 first:pl-0 last:pr-0">
              {/* Parent category header */}
              <Link
                to="/catalogo"
                search={{ category: cat.slug }}
                className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
              >
                {cat.name}
                <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                  ({cat.productCount})
                </span>
              </Link>

              {/* 🧬 DNA: Golden stitch divider under parent */}
              <hr className="mb-3 h-[1px] w-8 border-0 bg-[var(--stitch-color)]/40" />

              {/* Subcategories */}
              <ul className="space-y-1.5">
                {cat.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      to="/catalogo"
                      search={{ category: child.slug }}
                      className="group/sub flex items-start justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)]/50 hover:text-[var(--color-text)]"
                    >
                      <span className="leading-snug">{child.name}</span>
                      <span className="shrink-0 text-[11px] text-[var(--color-text-muted)] tabular-nums">
                        {child.productCount}
                      </span>
                    </Link>

                    {/* Grandchildren (third level) */}
                    {child.children.length > 0 && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-[var(--color-border-light)] pl-3">
                        {child.children.map((gc) => (
                          <li key={gc.id}>
                            <Link
                              to="/catalogo"
                              search={{ category: gc.slug }}
                              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-muted)]/50 hover:text-[var(--color-text-secondary)]"
                            >
                              <span>{gc.name}</span>
                              <span className="shrink-0 text-[11px] tabular-nums">{gc.productCount}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar with CTA */}
        <div className="border-t border-[var(--color-border-light)] bg-[var(--color-muted)]/30 px-6 py-3">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
          >
            Vedi tutto il catalogo
            <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MegaMenu({ cartCount = 0 }: { cartCount?: number }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [categories, setCategories] = useState<TopCategory[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.ok) setCategories(json.data);
      } catch { /* ignore */ }
    }
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleEnter = useCallback((key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(key);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 200);
  }, []);

  const handleItemClick = useCallback(() => {
    setOpenMenu(null);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[var(--z-navbar)] border-b border-[var(--color-border-light)] bg-[var(--color-background)]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-[var(--navbar-height)] max-w-[var(--page-max-width)] items-center justify-between px-[var(--page-padding-x)] md:h-[var(--navbar-height-md)]">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-[var(--color-text)] md:text-xl"
        >
          Calzoleria Prevenzano
        </Link>

        {/* Desktop Navigation */}
        <div ref={menuRef} className="hidden items-center gap-1 md:flex">
          {/* Shop mega menu trigger */}
          <div
            className="relative"
            onMouseEnter={() => handleEnter("shop")}
            onMouseLeave={handleLeave}
          >
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-[var(--transition-fast)]",
                openMenu === "shop"
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]",
              )}
              aria-expanded={openMenu === "shop"}
              aria-haspopup="true"
            >
              Shop
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  openMenu === "shop" && "rotate-180",
                )}
              />
            </button>

            {openMenu === "shop" && categories.length > 0 && (
              <MegaMenuPanel categories={categories} />
            )}
          </div>

          {/* Static nav links */}
          {STATIC_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to as "/la-bottega" | "/contatti"}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-primary)]"
              onClick={handleItemClick}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/carrello"
            aria-label="Carrello"
            className="relative text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
          >
            <ShoppingBagIcon />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-[var(--color-primary-foreground)]">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <Link
          to="/catalogo"
          className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)] md:hidden"
          aria-label="Catalogo"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </Link>
      </nav>

      {/* 🧬 DNA: Stitch divider under navbar */}
      <hr className="h-[var(--stitch-width)] w-[var(--stitch-length)] border-0 bg-[var(--stitch-color)] mx-auto" />
    </header>
  );
}

function ShoppingBagIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}
