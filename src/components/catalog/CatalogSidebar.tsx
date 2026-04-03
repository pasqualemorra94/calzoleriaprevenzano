import type { ReactNode } from "react";
import { Search, X, ChevronDown, Tag } from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface CategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children: CategoryItem[];
}

function isCategoryActive(slug: string, activeCategory: string | undefined, children: CategoryItem[]): boolean {
  if (slug === activeCategory) return true;
  return children.some((child) => child.slug === activeCategory);
}

interface CatalogSidebarProps {
  categories: CategoryWithChildren[];
  activeCategory: string | undefined;
  searchInput: string;
  onCategoryChange: (slug: string | undefined) => void;
  onSearch: (e: React.FormEvent) => void;
  onClearSearch: () => void;
  onSearchInputChange: (value: string) => void;
}

export function CatalogSidebar({
  categories, activeCategory, searchInput,
  onCategoryChange, onSearch, onClearSearch, onSearchInputChange,
}: CatalogSidebarProps): ReactNode {
  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          <Search className="h-3 w-3" /> Cerca
        </span>
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Cerca prodotti..." value={searchInput} onChange={(e) => onSearchInputChange(e.target.value)}
            aria-label="Cerca prodotti"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-9 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none" />
          {searchInput && (
            <button type="button" onClick={onClearSearch} aria-label="Cancella ricerca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Category tree */}
      <nav aria-label="Categorie prodotti">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)]/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          <Tag className="h-3 w-3" /> Categorie
        </span>
        <ul className="space-y-1" role="tree">
          <li role="treeitem" aria-selected={!activeCategory}>
            <button type="button" onClick={() => onCategoryChange(undefined)}
              className={`flex w-full items-center rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors duration-[var(--transition-base)] ${
                !activeCategory ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/60 hover:text-[var(--color-text)]"
              }`}>Tutte le categorie</button>
          </li>

          {categories.map((cat) => {
            const hasChildren = cat.children.length > 0;
            const parentActive = isCategoryActive(cat.slug, activeCategory, cat.children);
            const expanded = parentActive && hasChildren;

            return (
              <li key={cat.id} role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
                <div className="flex items-center">
                  <button type="button" onClick={() => onCategoryChange(cat.slug)}
                    className={`flex min-w-0 flex-1 items-center rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors duration-[var(--transition-base)] ${
                      activeCategory === cat.slug ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-primary)]"
                        : parentActive ? "bg-[var(--color-primary)]/5 font-medium text-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]/60 hover:text-[var(--color-text)]"
                    }`}>
                    <span className="min-w-0 truncate">{cat.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-[var(--color-text-muted)]">{cat.productCount}</span>
                  </button>
                  {hasChildren && (
                    <span className="ml-1 shrink-0 px-1">
                      <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                    </span>
                  )}
                </div>

                {hasChildren && expanded && (
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-[var(--color-border-light)] pl-3" role="group">
                    <li>
                      <button type="button" onClick={() => onCategoryChange(cat.slug)}
                        className={`flex w-full items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors duration-[var(--transition-base)] ${
                          activeCategory === cat.slug ? "font-medium text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                        }`}>Tutti {cat.name}</button>
                    </li>
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <button type="button" onClick={() => onCategoryChange(child.slug)}
                          className={`flex w-full items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-xs transition-colors duration-[var(--transition-base)] ${
                            activeCategory === child.slug ? "font-medium text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                          }`}>
                          <span className="min-w-0 truncate">{child.name}</span>
                          <span className="ml-auto shrink-0 text-[var(--color-text-muted)]">{child.productCount}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
