import type { ReactNode } from "react";
import { Minus, Plus, ShoppingBag, Loader2, Check } from "lucide-react";
import { cn } from "~/lib/utils/cn";

interface MobileStickyAddToCartProps {
  price: number;
  quantity: number;
  onSetQuantity: (q: number) => void;
  cartStatus: "idle" | "loading" | "success";
  canAddToCart: boolean;
  onAddToCart: () => void;
  effectiveStock: number;
  allOptionsSelected: boolean;
}

/**
 * Sticky bottom bar mobile-only (md:hidden) per pagina prodotto.
 * Layout: prezzo + quantity stepper + CTA dinamico (5 stati).
 * z-index: var(--z-sticky) — sotto cookie banner (--z-toast) e modal (--z-modal),
 * sopra contenuto pagina.
 */
export function MobileStickyAddToCart({
  price,
  quantity,
  onSetQuantity,
  cartStatus,
  canAddToCart,
  onAddToCart,
  effectiveStock,
  allOptionsSelected,
}: MobileStickyAddToCartProps): ReactNode {
  const isOutOfStock = effectiveStock === 0;
  const isLoading = cartStatus === "loading";
  const isSuccess = cartStatus === "success";
  const isDisabled = !canAddToCart || isLoading || isOutOfStock;

  // Determina label + icon CTA secondo i 5 stati documentati in spec § 3.2
  let ctaLabel: string;
  let CtaIcon: typeof ShoppingBag | typeof Loader2 | typeof Check | null;
  let ctaBg: string;
  if (isOutOfStock) {
    ctaLabel = "Esaurito";
    CtaIcon = null;
    ctaBg = "bg-[var(--color-text-muted)]";
  } else if (!allOptionsSelected) {
    ctaLabel = "Seleziona opzioni";
    CtaIcon = null;
    ctaBg = "bg-[var(--color-text-muted)]";
  } else if (isLoading) {
    ctaLabel = "Aggiungo...";
    CtaIcon = Loader2;
    ctaBg = "bg-[var(--color-primary)]";
  } else if (isSuccess) {
    ctaLabel = "Aggiunto!";
    CtaIcon = Check;
    ctaBg = "bg-green-600";
  } else {
    ctaLabel = "Aggiungi al carrello";
    CtaIcon = ShoppingBag;
    ctaBg = "bg-[var(--color-primary)]";
  }

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] border-t border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur"
      style={{ boxShadow: "0 -4px 12px rgba(0,0,0,0.06)" }}
      role="region"
      aria-label="Aggiungi al carrello"
    >
      <div className="flex items-center gap-3">
        {/* Prezzo */}
        <div className="flex-shrink-0">
          <p className="text-base font-semibold text-[var(--color-primary)]">
            EUR {price.toFixed(2)}
          </p>
        </div>

        {/* Quantity stepper */}
        <div className="flex flex-shrink-0 items-center rounded-md border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => onSetQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isOutOfStock}
            aria-label="Diminuisci quantità"
            className="flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="flex h-10 w-8 items-center justify-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onSetQuantity(Math.min(10, quantity + 1))}
            disabled={quantity >= 10 || isOutOfStock}
            aria-label="Aumenta quantità"
            className="flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)] disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* CTA dinamico */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isDisabled}
          className={cn(
            "flex flex-1 h-11 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            ctaBg,
          )}
        >
          {CtaIcon && (
            <CtaIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
          )}
          <span>{ctaLabel}</span>
        </button>
      </div>
    </div>
  );
}
