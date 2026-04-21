/**
 * SandalCatalog — Full catalog browser for AI Advisor.
 *
 * Shows all sandals in a searchable/filterable grid.
 * Used when the user wants to browse beyond AI suggestions.
 */

import { useState, useMemo } from "react";
import type { AdvisorProduct } from "~/lib/ai-advisor.server";
import { Search } from "lucide-react";

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
        p.categoryName.toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          📦 Catalogo Completo
        </h3>
        <span className="text-sm text-gray-400">
          {filtered.length} sandali
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca sandalo per nome..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {filtered.map((product) => (
          <CatalogCard
            key={product.id}
            product={product}
            selected={selectedId === product.id}
            onSelect={() => onSelect(product)}
          />
        ))}
      </div>
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
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-lg border-2 p-1 text-left transition ${
        selected
          ? "border-[var(--color-primary)] shadow-sm"
          : "border-transparent bg-white hover:border-gray-200"
      }`}
    >
      <div className="mb-1 aspect-square overflow-hidden rounded bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">
            👠
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-900 line-clamp-1">{product.name}</p>
      <p className="text-xs font-semibold text-[var(--color-primary)]">
        €{product.price.toFixed(0)}
      </p>
    </button>
  );
}
