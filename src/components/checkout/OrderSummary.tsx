import type { ReactNode } from "react";
import { ShoppingBag, ShieldCheck, Truck } from "lucide-react";

export interface CartItemDetail {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  product: { name: string; slug: string; image: string | null };
  variant: { name: string; color: string | null; size: string | null } | null;
  selectedOptions: Array<{ label: string; value: string; color?: string }> | null;
}

interface OrderSummaryProps {
  items: CartItemDetail[];
  subtotal: number;
  shippingCost: number;
  freeShippingThreshold: number;
  shippingEnabled?: boolean;
  submitStatus?: "idle" | "loading" | "success" | "error";
  isCheckout?: boolean;
  disabled?: boolean;
  discountAmount?: number;
}

export function OrderSummary({
  items, subtotal, shippingCost, freeShippingThreshold,
  shippingEnabled = true,
  submitStatus = "idle", isCheckout = false, disabled = false,
  discountAmount = 0,
}: OrderSummaryProps): ReactNode {
  const total = Math.max(0, subtotal - discountAmount) + shippingCost;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <p className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">Riepilogo ordine</p>
      <hr className="stitch-divider stitch-divider--left my-4" />

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]">
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                ) : (
                  <ShoppingBag className="h-5 w-5 text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug text-[var(--color-text)] truncate">{item.product.name}</p>
                {item.variant && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {[item.variant.color, item.variant.size].filter(Boolean).join(" / ")} · x{item.quantity}
                  </p>
                )}
                {!item.variant && <p className="text-xs text-[var(--color-text-muted)]">x{item.quantity}</p>}
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {item.selectedOptions.map((opt) => (
                      <span key={opt.label} className="inline-flex items-center gap-1 mr-2 last:mr-0">
                        {opt.color && <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: opt.color }} />}
                        {opt.value}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>
            <span className="shrink-0 text-sm font-medium text-[var(--color-text)]">€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <hr className="my-4 border-[var(--color-border)]" />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Subtotale (IVA inclusa)</span>
          <span className="font-medium">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Spedizione</span>
          {!shippingEnabled ? (
            <span className="font-medium text-green-600">Spedizione gratuita</span>
          ) : shippingCost === 0 ? (
            <span className="font-medium text-green-600">Gratis</span>
          ) : (
            <span className="font-medium">€{shippingCost.toFixed(2)}</span>
          )}
        </div>
        {shippingEnabled && !isCheckout && subtotal < freeShippingThreshold && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Aggiungi ancora €{(freeShippingThreshold - subtotal).toFixed(2)} per la spedizione gratuita</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Sconto</span>
            <span className="font-medium text-green-600">−€{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <hr className="border-[var(--color-border)]" />
        <div className="flex justify-between">
          <span className="text-base font-semibold">Totale</span>
          <span className="text-base font-bold text-[var(--color-primary)]">€{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>di cui IVA (22%)</span>
          <span>€{(Math.round((total * 22 / 122) * 100) / 100).toFixed(2)}</span>
        </div>
      </div>

      {isCheckout && (
        <>
          <button type="submit" disabled={submitStatus === "loading" || disabled}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60">
            {submitStatus === "loading" ? <ShieldCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            Conferma e paga
          </button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Pagamento sicuro con Stripe</span>
          </div>
        </>
      )}
    </div>
  );
}
