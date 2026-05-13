import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { m } from "motion/react";
import { ShoppingBag, Minus, Plus, Trash2, Loader2, ArrowRight } from "lucide-react";
import { OrderSummary } from "~/components/checkout/OrderSummary";
import type { CartItemDetail } from "~/components/checkout/OrderSummary";
import { $getPublicShippingConfig } from "~/lib/shipping-functions";
import { computeShippingCost, type ShippingConfigShape } from "~/lib/utils/shipping";

interface CartResult {
  id: string;
  items: CartItemDetail[];
  itemCount: number;
  subtotal: number;
}

export const Route = createFileRoute("/carrello")({
  component: CarrelloPage,
});

function CarrelloPage(): ReactNode {
  const [cart, setCart] = useState<CartResult | null>(null);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfigShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const [cartRes, configRes] = await Promise.all([
        fetch("/api/cart").then((r) => r.json()),
        $getPublicShippingConfig().catch(() => null),
      ]);
      if (cartRes.ok) setCart(cartRes.data);
      if (configRes) {
        setShippingConfig({
          cost: configRes.cost,
          freeThreshold: configRes.freeThreshold,
          enabled: configRes.enabled,
        });
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: newQuantity }) });
      const json = await res.json();
      if (json.ok) { setCart(json.data); window.dispatchEvent(new Event("cart-updated")); }
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) { setCart(json.data); window.dispatchEvent(new Event("cart-updated")); }
    } catch { /* ignore */ }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-[var(--color-muted)]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-24 w-24 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-muted)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-[var(--color-muted)]" />
                <div className="h-3 w-1/3 rounded bg-[var(--color-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <section className="bg-[var(--color-hero)] py-[var(--section-padding-y)] border-b border-[var(--stitch-color)]/20">
          <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
            <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
              <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">Carrello</h1>
            </m.div>
          </div>
        </section>
        <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
          <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
            <div className="flex flex-col items-center py-16 text-center">
              <ShoppingBag className="mb-6 h-16 w-16 text-[var(--color-text-muted)]" />
              <p className="mb-2 text-sm text-gray-500">Il tuo carrello è vuoto</p>
              <p className="mb-8 max-w-md text-[var(--color-text-secondary)]">Aggiungi i tuoi sandali preferiti al carrello e procedi all'acquisto quando sei pronto.</p>
              <Link to="/catalogo" className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]">
                Esplora il catalogo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const shippingCost = shippingConfig
    ? computeShippingCost(cart.subtotal, shippingConfig)
    : 0;

  return (
    <>
      <section className="bg-[var(--color-hero)] py-[var(--section-padding-y)] border-b border-[var(--stitch-color)]/20">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">Carrello</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">{cart.itemCount} {cart.itemCount === 1 ? "articolo" : "articoli"}</p>
          </m.div>
        </div>
      </section>

      <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-16">
            <div className="space-y-0 divide-y divide-[var(--color-border)]">
              {cart.items.map((item) => {
                const isUpdating = updatingId === item.id;
                return (
                  <m.div key={item.id} className="flex gap-4 py-6 first:pt-0" layout initial={false}>
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-muted)]">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="flex h-full w-full items-center justify-center p-4 text-[var(--color-text-muted)]" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-display text-[var(--text-base)] font-semibold leading-snug">
                          <Link to="/prodotti/$slug" params={{ slug: item.product.slug }} className="hover:text-[var(--color-primary)]">{item.product.name}</Link>
                        </h3>
                        {item.variant && (
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{[item.variant.color, item.variant.size].filter(Boolean).join(" / ")}</p>
                        )}
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            {item.selectedOptions.map((opt) => (
                              <span key={opt.label} className="inline-flex items-center gap-1 mr-3 last:mr-0">
                                {opt.color && <span className="inline-block h-3 w-3 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: opt.color }} />}
                                {opt.value}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)]">
                          <button type="button" disabled={item.quantity <= 1 || isUpdating} onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40" aria-label="Diminuisci quantità">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          {isUpdating ? (
                            <Loader2 className="mx-2 h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-[var(--color-text)]">{item.quantity}</span>
                          )}
                          <button type="button" disabled={item.quantity >= 10 || isUpdating} onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40" aria-label="Aumenta quantità">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-[var(--color-text)]">€{item.price.toFixed(2)}</span>
                          <span className="text-sm font-semibold text-[var(--color-text)]">€{(item.price * item.quantity).toFixed(2)}</span>
                          <button type="button" disabled={isUpdating} onClick={() => handleRemoveItem(item.id)}
                            className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-destructive)] disabled:opacity-40" aria-label="Rimuovi dal carrello">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>

            <div className="lg:sticky lg:top-24">
              <OrderSummary
                items={cart.items} subtotal={cart.subtotal} shippingCost={shippingCost}
                freeShippingThreshold={shippingConfig?.freeThreshold ?? 199}
                shippingEnabled={shippingConfig?.enabled ?? true}
              />
              <Link to="/checkout" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]">
                Procedi al checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
