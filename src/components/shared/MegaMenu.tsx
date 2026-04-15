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

function MegaMenuPanel({ categories }: { categories: TopCategory[] }) {
  return (
    <div className="absolute left-1/2 top-full z-[var(--z-overlay)] mt-1 w-[95vw] max-w-[1100px] -translate-x-1/2 animate-[fadeIn_150ms_ease-out]">
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]">
        <div className="grid grid-cols-3 gap-0 p-6">
          {categories.map((cat) => (
            <div key={cat.id} className="border-r border-[var(--color-border-light)] last:border-r-0 px-6 first:pl-0 last:pr-0">
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

              <hr className="mb-3 h-[1px] w-8 border-0 bg-[var(--stitch-color)]/40" />

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

        <div className="border-t border-[var(--color-border-light)] bg-[var(--color-muted)]/30 px-6 py-3">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
          >
            Vedi tutto il catalogo
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Social + Contact icons ─────────────────────────────────

function InstagramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function MegaMenu({ cartCount = 0 }: { cartCount?: number }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<TopCategory[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [cartTotal, setCartTotal] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch("/api/cart");
        const json = await res.json();
        if (json.ok && json.data.items.length > 0) {
          setCartTotal(json.data.subtotal);
        } else {
          setCartTotal(null);
        }
      } catch { /* ignore */ }
    }
    loadCart();
    const handleStorage = () => loadCart();
    window.addEventListener("cart-updated", handleStorage);
    return () => window.removeEventListener("cart-updated", handleStorage);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleItemClick = useCallback(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }, []);

  const navLinkClass =
    "px-5 py-2 text-[13px] font-medium tracking-[0.06em] text-[var(--color-text-secondary)] uppercase transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-primary)] whitespace-nowrap";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[var(--z-navbar)] transition-all duration-300",
        scrolled
          ? "bg-[var(--color-background)]/97 shadow-[0_4px_24px_rgba(0,0,0,0.10)] backdrop-blur-md"
          : "bg-[var(--color-background)] shadow-[0_2px_12px_rgba(0,0,0,0.07)]",
      )}
    >
      {/* ── DESKTOP ─────────────────────────────────────── */}
      <div className="hidden md:block">

        {/* ── Row 1: Social left · Logo · Contacts right ── */}
        <div
          className="mx-auto grid max-w-[var(--page-max-width)] grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--color-border-light)]/50 px-[var(--page-padding-x)]"
          style={{ height: "5.5rem" }}
        >
          {/* Left — social icons */}
          <div className="flex items-center gap-1">
            <a
              href="https://www.instagram.com/calzoleriaprevenzano"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.facebook.com/calzoleriaprevenzano"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://wa.me/390817645183"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <WhatsAppIcon />
            </a>

            <div className="mx-3 h-5 w-[1px] bg-[var(--color-border)]" />

            <span className="font-display text-[11px] italic text-[var(--color-text-muted)]">
              Artigianato napoletano dal 1984
            </span>
          </div>

          {/* Center — Logo */}
          <Link
            to="/"
            className="flex items-center justify-center px-10 py-3"
            aria-label="Calzoleria Prevenzano — Torna alla homepage"
            onClick={handleItemClick}
          >
            <img
              src="/images/logo.png"
              alt="Calzoleria Prevenzano"
              className="h-[4.2rem] w-auto transition-opacity duration-200 hover:opacity-80"
              width={320}
              height={195}
            />
          </Link>

          {/* Right — contacts */}
          <div className="flex items-center justify-end gap-5">
            <a
              href="tel:+390817645183"
              className="flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              <PhoneIcon />
              <span>081 764 5183</span>
            </a>

            <div className="h-4 w-[1px] bg-[var(--color-border)]" />

            <a
              href="/contatti"
              className="flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              <MapPinIcon />
              <span>Via Chiaia, 104 · Napoli</span>
            </a>

            <div className="h-4 w-[1px] bg-[var(--color-border)]" />

            {/* Cart */}
            <Link
              to="/carrello"
              aria-label={`Carrello${cartCount > 0 ? ` — ${cartCount} articoli` : ""}`}
              className="relative flex h-8 items-center gap-1.5 rounded-full px-2 py-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-semibold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              {cartTotal !== null && (
                <span className="text-[11px] font-semibold tabular-nums">€{cartTotal.toFixed(2)}</span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Row 2: Navigation menu ── */}
        <nav
          ref={menuRef}
          className="mx-auto flex max-w-[var(--page-max-width)] items-center justify-center px-[var(--page-padding-x)]"
          style={{ height: "3rem" }}
        >
          {/* Shop mega menu */}
          <div
            className="relative"
            onMouseEnter={() => handleEnter("shop")}
            onMouseLeave={handleLeave}
          >
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 px-5 py-2 text-[13px] font-medium tracking-[0.06em] uppercase transition-colors duration-[var(--transition-fast)]",
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
                  "h-3 w-3 transition-transform duration-200",
                  openMenu === "shop" && "rotate-180",
                )}
              />
            </button>

            {openMenu === "shop" && categories.length > 0 && (
              <MegaMenuPanel categories={categories} />
            )}
          </div>

          {/* Dot separator */}
          <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]/50" />

          <Link to="/sandali" search={{ category: undefined, query: undefined, page: undefined }} className={navLinkClass} onClick={handleItemClick}>
            Sandali
          </Link>

          <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]/50" />

          <Link to="/catalogo" className={navLinkClass} onClick={handleItemClick}>
            Catalogo
          </Link>

          <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]/50" />

          <Link to="/la-bottega" className={navLinkClass} onClick={handleItemClick}>
            La Bottega
          </Link>

          <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]/50" />

          <Link to="/contatti" className={navLinkClass} onClick={handleItemClick}>
            Contatti
          </Link>

          <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]/50" />

          <Link to="/account" className={navLinkClass} onClick={handleItemClick}>
            Il mio account
          </Link>
        </nav>

        {/* 🧬 DNA: Stitch divider */}
        <hr className="h-[var(--stitch-width)] w-[var(--stitch-length)] border-0 bg-[var(--stitch-color)] mx-auto" />
      </div>

      {/* ── MOBILE ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:hidden" style={{ height: "var(--navbar-height)" }}>
        <Link to="/" aria-label="Calzoleria Prevenzano" onClick={handleItemClick}>
          <img
            src="/images/logo.png"
            alt="Calzoleria Prevenzano"
            className="h-10 w-auto"
            width={160}
            height={97}
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/carrello"
            aria-label={`Carrello${cartCount > 0 ? ` — ${cartCount} articoli` : ""}`}
            className="relative flex items-center gap-1 text-[var(--color-text-secondary)]"
          >
            <div className="relative">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            {cartTotal !== null && (
              <span className="text-[11px] font-semibold tabular-nums">€{cartTotal.toFixed(2)}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
            aria-label="Apri menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-y-0 right-0 z-[calc(var(--z-overlay)+1)] w-[85vw] max-w-sm bg-[var(--color-surface)] shadow-2xl md:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-6 py-4">
                <Link to="/" onClick={handleItemClick}>
                  <img
                    src="/images/logo.png"
                    alt="Calzoleria Prevenzano"
                    className="h-8 w-auto"
                    width={160}
                    height={97}
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)]"
                  aria-label="Chiudi menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-6">
                {/* Shop — expandable */}
                <div className="mb-2">
                  {categories.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setOpenMenu(openMenu === "mobile-shop" ? null : "mobile-shop")}
                        className={cn(
                          "flex w-full items-center justify-between rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium tracking-wide uppercase transition-colors",
                          openMenu === "mobile-shop"
                            ? "bg-[var(--color-muted)] text-[var(--color-primary)]"
                            : "text-[var(--color-text)] hover:bg-[var(--color-muted)]",
                        )}
                      >
                        Shop
                        <ChevronDown className={cn("h-4 w-4 transition-transform", openMenu === "mobile-shop" && "rotate-180")} />
                      </button>
                      {openMenu === "mobile-shop" && (
                        <div className="mt-1 ml-2 space-y-1 border-l-2 border-[var(--color-accent)]/30 pl-4">
                          {categories.map((cat) => (
                            <div key={cat.id} className="py-1">
                              <Link
                                to="/catalogo"
                                search={{ category: cat.slug }}
                                onClick={handleItemClick}
                                className="block text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                              >
                                {cat.name}
                                <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">({cat.productCount})</span>
                              </Link>
                              {cat.children.map((child) => (
                                <Link
                                  key={child.id}
                                  to="/catalogo"
                                  search={{ category: child.slug }}
                                  onClick={handleItemClick}
                                  className="block py-0.5 pl-3 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                                >
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          ))}
                          <Link
                            to="/catalogo"
                            onClick={handleItemClick}
                            className="mt-2 block text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                          >
                            Vedi tutto il catalogo →
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/catalogo"
                      onClick={handleItemClick}
                      className="block rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium tracking-wide uppercase text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                    >
                      Shop
                    </Link>
                  )}
                </div>

                <div className="h-px bg-[var(--color-border-light)]" />

                <Link
                  to="/sandali"
                  search={{ category: undefined, query: undefined, page: undefined }}
                  onClick={handleItemClick}
                  className="block rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium tracking-wide uppercase text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                >
                  Sandali
                </Link>

                <div className="h-px bg-[var(--color-border-light)]" />

                <Link
                  to="/catalogo"
                  onClick={handleItemClick}
                  className="block rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium tracking-wide uppercase text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                >
                  Catalogo
                </Link>

                <div className="h-px bg-[var(--color-border-light)]" />

                <Link
                  to="/la-bottega"
                  onClick={handleItemClick}
                  className="block rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium tracking-wide uppercase text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                >
                  La Bottega
                </Link>

                <div className="h-px bg-[var(--color-border-light)]" />

                <Link
                  to="/contatti"
                  onClick={handleItemClick}
                  className="block rounded-[var(--radius-md)] px-4 py-3 text-[15px] font-medium tracking-wide uppercase text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                >
                  Contatti
                </Link>
              </nav>

              <div className="border-t border-[var(--color-border-light)] px-6 py-5">
                <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
                  <a
                    href="https://www.instagram.com/calzoleriaprevenzano"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                  >
                    <InstagramIcon />
                  </a>
                  <a
                    href="https://www.facebook.com/calzoleriaprevenzano"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                  >
                    <FacebookIcon />
                  </a>
                  <a
                    href="https://wa.me/390817645183"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                  >
                    <WhatsAppIcon />
                  </a>
                </div>
                <a
                  href="tel:+390817645183"
                  className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                >
                  <PhoneIcon />
                  <span>081 764 5183</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
