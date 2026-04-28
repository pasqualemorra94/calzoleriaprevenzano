"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
}

interface SuggestedCategory {
  label: string;
  description: string;
  slug: string;
}

const SUGGESTED_CATEGORIES: SuggestedCategory[] = [
  {
    label: "Sandali",
    description: "Personalizzabili — dal classico al gioiello",
    slug: "sandali",
  },
  {
    label: "Pelletteria",
    description: "Borselli, cinture e accessori in pelle",
    slug: "pelletteria",
  },
  {
    label: "Accessori",
    description: "Solette e cura della scarpa",
    slug: "articoli-calzature",
  },
];

const POPULAR_QUERIES = [
  "Sandalo gioiello",
  "Borsello cuoio",
  "Cintura uomo",
  "Sandalo classico",
  "Soletta",
];

export function MobileSearchOverlay(): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Open from anywhere via global event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-mobile-search", handler);
    return () => window.removeEventListener("open-mobile-search", handler);
  }, []);

  // Body scroll lock + autofocus
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: q,
        perPage: "10",
        page: "1",
      });
      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (json.ok) {
        const data = json.data as { items: SearchResult[] };
        setResults(data.items);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 280);
    },
    [search],
  );

  const handlePopular = useCallback(
    (q: string) => {
      setQuery(q);
      search(q);
      inputRef.current?.focus();
    },
    [search],
  );

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setQuery("");
      setResults([]);
      setLoading(false);
    }, 280);
  }, []);

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length >= 2;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[var(--z-modal)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Cerca nel catalogo"
        >
          {/* Solid background */}
          <div className="absolute inset-0 bg-[var(--color-background)]" />

          {/* Decorative editorial corner ornament */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-40px] top-[-40px] h-48 w-48 rounded-full opacity-[0.06]"
            style={{
              background:
                "radial-gradient(circle at center, var(--color-accent), transparent 65%)",
            }}
          />

          <m.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full flex-col"
          >
            {/* Header */}
            <div className="shrink-0 px-5 pt-5">
              <div className="flex items-center gap-3">
                <div aria-hidden="true" className="flex items-center gap-1.5">
                  <span className="h-[1px] w-6 bg-[var(--stitch-color)]" />
                  <span className="h-[1px] w-1 bg-[var(--stitch-color)]/60" />
                </div>
                <span className="font-display text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] uppercase">
                  Cerca
                </span>
                <span className="ml-auto" />
                <button
                  type="button"
                  onClick={close}
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors active:bg-[var(--color-muted)] active:text-[var(--color-primary)]"
                  aria-label="Chiudi"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Editorial input */}
              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-accent)]" />
                <input
                  ref={inputRef}
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Cosa stai cercando?"
                  aria-label="Ricerca prodotti"
                  className="w-full border-0 border-b-2 border-[var(--color-border)] bg-transparent pb-3 pl-9 pr-10 font-display text-lg italic text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70 transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[var(--color-text-muted)] transition-colors active:text-[var(--color-text)]"
                    aria-label="Cancella"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Empty state — categories + popular queries */}
              {!showResults && (
                <div className="px-5 pb-12 pt-7">
                  <div className="mb-4 flex items-baseline gap-3">
                    <p className="text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] uppercase">
                      Sfoglia per categoria
                    </p>
                    <span className="h-[1px] flex-1 bg-[var(--stitch-color)]/30" />
                  </div>

                  <ul className="space-y-2">
                    {SUGGESTED_CATEGORIES.map((cat, i) => (
                      <m.li
                        key={cat.slug}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 + i * 0.06, duration: 0.3 }}
                      >
                        <Link
                          to="/catalogo"
                          search={{ category: cat.slug }}
                          onClick={close}
                          className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-colors active:bg-[var(--color-muted)]/50"
                        >
                          <div className="min-w-0">
                            <p className="font-display text-xl font-semibold tracking-tight text-[var(--color-text)]">
                              {cat.label}
                            </p>
                            <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
                              {cat.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-accent)] transition-transform group-active:translate-x-1" />
                        </Link>
                      </m.li>
                    ))}
                  </ul>

                  <div className="mb-4 mt-9 flex items-baseline gap-3">
                    <p className="text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] uppercase">
                      Più cercati
                    </p>
                    <span className="h-[1px] flex-1 bg-[var(--stitch-color)]/30" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {POPULAR_QUERIES.map((q, i) => (
                      <m.button
                        key={q}
                        type="button"
                        onClick={() => handlePopular(q)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.04, duration: 0.25 }}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors active:bg-[var(--color-muted)] active:text-[var(--color-primary)]"
                      >
                        {q}
                      </m.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {showResults && loading && results.length === 0 && (
                <div className="flex items-center justify-center px-5 py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-muted)]" />
                </div>
              )}

              {/* Results */}
              {showResults && !loading && results.length > 0 && (
                <div className="px-5 pb-8 pt-5">
                  <p className="mb-3 text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] uppercase">
                    {results.length} {results.length === 1 ? "risultato" : "risultati"}
                  </p>

                  <ul className="-mx-2 space-y-1">
                    {results.map((r, i) => (
                      <m.li
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.22 }}
                      >
                        <Link
                          to="/prodotti/$slug"
                          params={{ slug: r.slug }}
                          onClick={close}
                          className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors active:bg-[var(--color-muted)]"
                        >
                          {r.image ? (
                            <img
                              src={r.image.url}
                              alt={r.image.alt ?? r.name}
                              className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] object-cover"
                              loading="lazy"
                              width={56}
                              height={56}
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] text-[var(--color-text-muted)]">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium text-[var(--color-text)]">
                              {r.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--color-primary)]">
                                €{r.price.toFixed(2)}
                              </span>
                              {r.compareAtPrice && (
                                <span className="text-[12px] text-[var(--color-text-muted)] line-through">
                                  €{r.compareAtPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                        </Link>
                      </m.li>
                    ))}
                  </ul>

                  <Link
                    to="/catalogo"
                    search={{ query }}
                    onClick={close}
                    className="mt-5 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[13px] font-medium text-[var(--color-primary)] transition-colors active:bg-[var(--color-muted)]"
                  >
                    Vedi tutti i risultati per &ldquo;{query}&rdquo;
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* No results */}
              {showResults && !loading && results.length === 0 && (
                <div className="px-5 py-14 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="font-display text-xl italic text-[var(--color-text-secondary)]">
                    Nessun prodotto per &ldquo;{query}&rdquo;
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-[13px] text-[var(--color-text-muted)]">
                    Prova con termini più generici come <em>sandalo</em> o <em>borsello</em>, oppure sfoglia il catalogo.
                  </p>
                  <Link
                    to="/catalogo"
                    onClick={close}
                    className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-primary)]"
                  >
                    Sfoglia tutto il catalogo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
