/**
 * SandalSuggestions — Grid of AI-recommended sandals.
 *
 * Shows scored recommendations with match reasons and product images.
 * Clicking a sandal selects it for try-on.
 */

import type { ProductMatch } from "~/lib/ai-advisor.server";
import { Star, Check } from "lucide-react";

interface SandalSuggestionsProps {
  suggestions: ProductMatch[];
  onSelect: (product: ProductMatch) => void;
  selectedId?: string;
}

export function SandalSuggestions({ suggestions, onSelect, selectedId }: SandalSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        🎯 Sandali Consigliati per Te
        <span className="ml-2 text-sm font-normal text-gray-400">({suggestions.length} risultati)</span>
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {suggestions.map((product) => (
          <SuggestionCard
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

function SuggestionCard({
  product,
  selected,
  onSelect,
}: {
  product: ProductMatch;
  selected: boolean;
  onSelect: () => void;
}) {
  const scoreColor = product.score >= 70
    ? "bg-green-500"
    : product.score >= 40
      ? "bg-yellow-500"
      : "bg-gray-400";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative overflow-hidden rounded-xl border-2 p-2 text-left transition ${
        selected
          ? "border-[var(--color-primary)] shadow-lg ring-1 ring-[var(--color-primary)]/20"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Selected overlay */}
      {selected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-primary)]/5">
          <div className="flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white shadow">
            <Check className="h-3 w-3" />
            Selezionato
          </div>
        </div>
      )}

      {/* Score badge */}
      <div className={`absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full ${scoreColor} px-2 py-0.5 text-xs font-bold text-white shadow-sm`}>
        <Star className="h-3 w-3" />
        {product.score}%
      </div>

      {/* Product image */}
      <div className="mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
            👠
          </div>
        )}
      </div>

      {/* Product info */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
      <p className="mt-1 text-sm font-bold text-[var(--color-primary)]">
        €{product.price.toFixed(0)}
      </p>

      {/* Match reasons — show on hover or when selected */}
      {product.reasons.length > 0 && (
        <div className={`mt-1.5 space-y-0.5 transition ${selected ? "max-h-20 opacity-100" : "max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100"}`}>
          {product.reasons.slice(0, 3).map((reason) => (
            <p key={reason} className="text-[11px] leading-tight text-gray-500">{reason}</p>
          ))}
        </div>
      )}
    </button>
  );
}
