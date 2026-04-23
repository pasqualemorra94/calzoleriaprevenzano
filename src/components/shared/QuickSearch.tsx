import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, Loader2, ShoppingBag } from "lucide-react";
import { cn } from "~/lib/utils/cn";

// ─── Types ──────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
}

type QuickSearchVariant = "nav" | "mobile";

// ─── Component ──────────────────────────────────────────────────────

export function QuickSearch({ variant = "nav" }: { variant?: QuickSearchVariant }): ReactNode {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isNav = variant === "nav";

  // ── Debounced fetch ──

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        perPage: "6",
        page: "1",
      });
      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (json.ok) {
        const data = json.data as { items: SearchResult[] };
        setResults(data.items);
        setOpen(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce input
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    setHighlightIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }, [search]);

  // ── Close on click outside ──

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Keyboard navigation ──

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && results[highlightIndex]) {
          setOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [open, results, highlightIndex]);

  const showDropdown = open && query.length >= 2;

  return (
    <div
      ref={containerRef}
      className={cn("relative", isNav ? "w-44 lg:w-52" : "flex-1 min-w-0")}
    >
      {/* Input */}
      <div className="relative">
        <Search className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]",
          isNav ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4",
        )} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Cerca..."
          aria-label="Cerca prodotti"
          aria-expanded={showDropdown}
          aria-activedescendant={highlightIndex >= 0 ? `quick-result-${highlightIndex}` : undefined}
          className={cn(
            "w-full rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-all duration-200 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20",
            isNav
              ? "h-7 pl-7 pr-7 text-[11px] py-1"
              : "h-9 pl-9 pr-9 text-[13px] py-2",
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]",
              isNav ? "right-1.5" : "right-2.5",
            )}
            aria-label="Cancella ricerca"
          >
            <X className={isNav ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className={cn(
          "absolute left-0 right-0 top-full z-[var(--z-overlay)] mt-1 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]",
          isNav ? "min-w-[320px] lg:min-w-[360px]" : "min-w-[300px]",
        )}>
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            </div>
          )}

          {/* Results */}
          {!loading && results.length > 0 && (
            <ul role="listbox" className="max-h-[340px] overflow-y-auto py-1">
              {results.map((product, index) => (
                <li
                  key={product.id}
                  id={`quick-result-${index}`}
                  role="option"
                  aria-selected={index === highlightIndex}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 transition-colors",
                    index === highlightIndex
                      ? "bg-[var(--color-muted)]"
                      : "hover:bg-[var(--color-muted)]/60",
                  )}
                >
                  <Link
                    to="/prodotti/$slug"
                    params={{ slug: product.slug }}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    {/* Thumbnail */}
                    {product.image ? (
                      <img
                        src={product.image.url}
                        alt={product.image.alt ?? product.name}
                        className="h-11 w-11 shrink-0 rounded-[var(--radius-sm)] object-cover"
                        loading="lazy"
                        width={44}
                        height={44}
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-muted)] text-[var(--color-text-muted)]">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {product.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--color-primary)]">
                          €{product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-[var(--color-text-muted)] line-through">
                            €{product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* No results */}
          {!loading && results.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Nessun prodotto per &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {/* Footer — link to catalog */}
          {!loading && results.length > 0 && (
            <div className="border-t border-[var(--color-border-light)]">
              <Link
                to="/catalogo"
                search={{ query }}
                onClick={() => { setOpen(false); setQuery(""); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)]"
              >
                Vedi tutti i risultati
                <Search className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
