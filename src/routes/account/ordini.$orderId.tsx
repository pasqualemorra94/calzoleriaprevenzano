import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Package, CreditCard, Truck } from "lucide-react";
import { m } from "motion/react";
import { cn } from "~/lib/utils/cn";
import { $getOrderDetail } from "~/lib/account-functions";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confermato", className: "bg-blue-100 text-blue-800" },
  processing: { label: "In lavorazione", className: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Spedito", className: "bg-green-100 text-green-800" },
  delivered: { label: "Consegnato", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annullato", className: "bg-red-100 text-red-800" },
  refunded: { label: "Rimborsato", className: "bg-gray-100 text-gray-800" },
};

export const Route = createFileRoute("/account/ordini/$orderId")({
  beforeLoad: async ({ params }) => {
    const order = await $getOrderDetail({ data: { orderId: params.orderId } });
    return { order };
  },
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { order } = Route.useRouteContext();
  const router = useRouter();

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Ordine non trovato.</p>
        <button
          onClick={() => router.navigate({ to: "/account/ordini" })}
          className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
        >
          Torna agli ordini
        </button>
      </div>
    );
  }

  const status = STATUS_LABELS[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-800" };

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      <button
        onClick={() => router.navigate({ to: "/account/ordini" })}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mb-6 transition-colors hover:text-[var(--color-primary)]"
      >
        ← Torna agli ordini
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
              Ordine #{order.orderNumber}
            </h1>
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.className)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            effettuato il {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Shipping / Tracking */}
      {(order.shippingMethod || order.trackingNumber) && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="font-display text-base font-semibold text-[var(--color-text)]">Spedizione</h2>
          </div>
          <div className="space-y-1 text-sm">
            {order.shippingMethod && (
              <p className="text-[var(--color-text-secondary)]">
                Metodo: <span className="font-medium text-[var(--color-text)]">{order.shippingMethod}</span>
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-[var(--color-text-secondary)]">
                Tracking: <span className="font-medium text-[var(--color-primary)]">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border-light)]">
          <h2 className="font-display text-base font-semibold text-[var(--color-text)]">Articoli</h2>
        </div>
        <div className="divide-y divide-[var(--color-border-light)]">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <Link
                  to="/prodotti/$slug"
                  params={{ slug: item.product.slug }}
                  className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {item.name}
                </Link>
                {item.variantName && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.variantName}</p>
                )}
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Qtà: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[var(--color-text)] shrink-0">
                €{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="font-display text-base font-semibold text-[var(--color-text)]">Riepilogo</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Subtotale</span>
            <span className="tabular-nums text-[var(--color-text)]">€{order.subtotal.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Sconto</span>
              <span className="tabular-nums text-green-600">-€{order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Spedizione</span>
            <span className="tabular-nums text-[var(--color-text)]">
              {order.shippingCost === 0 ? "Gratuita" : `€${order.shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[var(--color-border-light)]">
            <span className="font-semibold text-[var(--color-text)]">Totale</span>
            <span className="font-semibold text-[var(--color-primary)] tabular-nums">€{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payments */}
        {order.payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Pagamenti</p>
            {order.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm py-1">
                <span className="text-[var(--color-text-secondary)]">
                  {new Date(payment.createdAt).toLocaleDateString("it-IT")}
                  {payment.method && ` · ${payment.method}`}
                </span>
                <span className={cn("font-medium", payment.status === "completed" ? "text-green-600" : "text-[var(--color-text-muted)]")}>
                  €{payment.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </m.div>
  );
}
