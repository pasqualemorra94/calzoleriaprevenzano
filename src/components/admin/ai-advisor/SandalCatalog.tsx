/**
 * SandalCatalog — Full catalog browser for AI Advisor.
 *
 * Shows all sandals in a searchable grid with images.
 * Always visible as an alternative to AI suggestions.
 */

import { useState, useMemo } from "react";
import type { AdvisorProduct } from "~/lib/ai-advisor.server";
import { Search, X, Check } from "lucide-react";

interface SandalCatalogProps {
  products: AdvisorProduct[];
  onSelect: (product: AdvisorProduct) => void;
  selectedId?: string;
}

export function SandalCatalog({ products, onSelect, selectedId }: SandalCatalogProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          📦 Catalogo Completo
        </h3>
        <span className="text-sm text-gray-400">
          {filtered.length}/{products.length} sandali
        </span>
      </div>

      {/* Search — always visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome o categoria..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Cancella ricerca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Nessun sandalo trovato per "{search}"
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {filtered.map((product) => (
            <CatalogCard
              key={product.id}
              product={product}
              selected={selectedId === product.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogCard({
  product,
  selected,
  onSelect,
}: {
  product: AdvisorProduct;
  selected: boolean;
  onSelect: (product: AdvisorProduct) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(product);
      }}
      className={`group relative overflow-hidden rounded-xl border-2 p-1.5 text-left transition ${
        selected
          ? "border-[var(--color-primary)] shadow-lg ring-1 ring-[var(--color-primary)]/20"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Selected indicator */}
      {selected && (
        <div className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Product image — portrait aspect */}
      <div className="mb-1.5 aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
            👠
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
      <p className="mt-0.5 text-xs font-bold text-[var(--color-primary)]">
        €{product.price.toFixed(0)}
      </p>
    </button>
  );
}
