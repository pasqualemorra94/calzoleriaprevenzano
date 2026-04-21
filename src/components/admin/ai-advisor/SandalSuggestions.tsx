/**
 * SandalSuggestions — Grid of AI-recommended sandals.
 *
 * Shows scored recommendations with match reasons.
 * Clicking a sandal selects it for try-on.
 */

import type { ProductMatch } from "~/lib/ai-advisor.server";
import { Star } from "lucide-react";

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
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border-2 p-2 text-left transition ${
        selected
          ? "border-[var(--color-primary)] shadow-md"
          : "border-transparent bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* Score badge */}
      <div className={`absolute right-2 top-2 flex items-center gap-1 rounded-full ${scoreColor} px-2 py-0.5 text-xs font-bold text-white`}>
        <Star className="h-3 w-3" />
        {product.score}%
      </div>

      {/* Product image */}
      <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            👠
          </div>
        )}
      </div>

      {/* Product info */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--color-primary)]">
        €{product.price.toFixed(0)}
      </p>

      {/* Match reasons */}
      {product.reasons.length > 0 && selected && (
        <div className="mt-2 space-y-0.5">
          {product.reasons.slice(0, 3).map((reason) => (
            <p key={reason} className="text-xs text-gray-500">{reason}</p>
          ))}
        </div>
      )}
    </button>
  );
}
