"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

interface CategoryChild {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount: number;
  children: Array<CategoryChild & { children: CategoryChild[] }>;
}

interface SuggestedCategory {
  label: string;
  description: string;
  slug: string;
}

const SANDALI_SLUG = "sandali";

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

interface CategoryBrowseListProps {
  onNavigate: () => void;
}

export function CategoryBrowseList({ onNavigate }: CategoryBrowseListProps): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const [sandali, setSandali] = useState<CategoryItem | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/categories", { signal: ctrl.signal });
        const json = (await res.json()) as { ok: boolean; data: CategoryItem[] };
        if (json.ok) {
          const found = json.data.find((c) => c.slug === SANDALI_SLUG) ?? null;
          setSandali(found);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    })();
    return () => ctrl.abort();
  }, []);

  const sandaliChildren = sandali?.children ?? [];

  return (
    <>
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
            {cat.slug === SANDALI_SLUG ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls="sandali-subcats"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex w-full items-center justify-between py-4 text-left transition-colors active:bg-[var(--color-muted)]/30"
                >
                  <div className="min-w-0">
                    <p className="font-display text-xl font-semibold tracking-tight text-[var(--color-text)]">
                      {cat.label}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
                      {cat.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 shrink-0 text-[var(--color-accent)] transition-transform ${
                      expanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <m.div
                      id="sandali-subcats"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pb-4">
                        {sandaliChildren.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {sandaliChildren.map((child) => (
                              <Link
                                key={child.id}
                                to="/catalogo"
                                search={{ category: child.slug }}
                                onClick={onNavigate}
                                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[13px] text-[var(--color-text-secondary)] transition-colors active:bg-[var(--color-muted)] active:text-[var(--color-primary)]"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                        <Link
                          to="/catalogo"
                          search={{ category: SANDALI_SLUG }}
                          onClick={onNavigate}
                          className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-accent)] ${
                            sandaliChildren.length > 0 ? "mt-3" : ""
                          }`}
                        >
                          Vedi tutti i sandali
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/catalogo"
                search={{ category: cat.slug }}
                onClick={onNavigate}
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
            )}
          </m.li>
        ))}
      </ul>
    </>
  );
}
