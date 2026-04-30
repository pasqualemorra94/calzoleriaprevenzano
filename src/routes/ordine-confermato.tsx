import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { m } from "motion/react";
import { Check, Package, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { hasConsent } from "~/lib/cookieConsent";

export const Route = createFileRoute("/ordine-confermato")({
  validateSearch: (search: Record<string, unknown>) => {
    return { session_id: (search.session_id as string) ?? "" };
  },
  component: OrderConfirmedPage,
});

interface OrderData {
  orderNumber: string;
  status: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  createdAt: string;
}

function OrderConfirmedPage(): ReactNode {
  const { session_id } = useSearch({ strict: false }) as { session_id?: string };
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const purchaseFiredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!session_id) { setLoading(false); setError(true); return; }
    (async () => {
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(session_id)}`);
        const json = await res.json();
        if (json.ok && json.data) {
          setOrder(json.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [session_id]);

  // GA4 purchase conversion event — gated by analytics consent + idempotent (StrictMode safe)
  useEffect(() => {
    if (!order) return;
    if (purchaseFiredRef.current) return;
    if (!hasConsent("analytics")) return;
    if (typeof window.gtag !== "function") return;
    purchaseFiredRef.current = true;
    window.gtag("event", "purchase", {
      transaction_id: order.orderNumber,
      value: order.total,
      currency: "EUR",
      items: order.items.map((item, idx) => ({
        item_id: `${order.orderNumber}-${idx}`,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }, [order]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Verifica pagamento in corso...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Package className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="mb-2 font-display text-[var(--text-xl)] font-semibold">Pagamento in elaborazione</h1>
          <p className="mb-6 text-[var(--color-text-secondary)]">
            Il tuo pagamento e stato ricevuto ma la conferma potrebbe richiedere qualche istante.
            Controlla la tua email per i dettagli dell&apos;ordine.
          </p>
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Torna alla homepage <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center md:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mb-2 font-display text-[var(--text-xl)] font-semibold">Ordine confermato!</h1>
          <p className="mb-1 text-[var(--color-text-secondary)]">
            Grazie per il tuo acquisto.
          </p>
          <p className="mb-6 text-[var(--color-text-secondary)]">
            Numero ordine: <span className="font-semibold text-[var(--color-text)]">{order.orderNumber}</span>
          </p>

          <div className="mb-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-left">
            <p className="mb-3 text-xs font-medium tracking-wider text-[var(--color-text-muted)]">Riepilogo</p>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[var(--color-text)]">{item.name} <span className="text-[var(--color-text-muted)]">x{item.quantity}</span></span>
                  <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr className="border-[var(--color-border)]" />
              <div className="flex justify-between text-base font-bold">
                <span>Totale</span>
                <span className="text-[var(--color-primary)]">€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
            <ShieldCheck className="h-4 w-4" />
            <span>Pagamento sicuro elaborato da Stripe</span>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              Continua lo shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </m.div>
    </div>
  );
}
