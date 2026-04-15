import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Loader2, Package } from "lucide-react";
import { m } from "motion/react";
import { cn } from "~/lib/utils/cn";
import { $getUserOrders } from "~/lib/account-functions";
import type { OrderListItem } from "~/lib/account-functions";
import type { PaginatedData } from "~/lib/types/api";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confermato", className: "bg-blue-100 text-blue-800" },
  processing: { label: "In lavorazione", className: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Spedito", className: "bg-green-100 text-green-800" },
  delivered: { label: "Consegnato", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annullato", className: "bg-red-100 text-red-800" },
  refunded: { label: "Rimborsato", className: "bg-gray-100 text-gray-800" },
};

export const Route = createFileRoute("/account/ordini/")({
  beforeLoad: async () => {
    const ordersData = await $getUserOrders({ data: { page: 1, perPage: 10 } });
    return { ordersData };
  },
  component: OrdersPage,
});

function OrdersPage() {
  const { ordersData: ssrData } = Route.useRouteContext();
  const [data, setData] = useState<PaginatedData<OrderListItem> | null>(ssrData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await $getUserOrders({ data: { page: p, perPage: 10 } });
      if (result) setData(result);
    } catch { /* ignore — SSR data still shown */ }
    setLoading(false);
  }, []);

  const goToPage = (p: number) => { setPage(p); fetchOrders(p); };

  if (!data) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-6">
        I miei ordini
      </h1>

      {data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-16 text-center">
          <Package className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
          <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">Nessun ordine</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
            Non hai ancora effettuato nessun ordine.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Esplora il catalogo
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((order) => {
              const status = STATUS_LABELS[order.status] ?? { label: order.status, className: "bg-gray-100 text-gray-800" };
              return (
                <Link
                  key={order.id}
                  to="/account/ordini/$orderId"
                  params={{ orderId: order.id }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 transition-colors hover:border-[var(--color-primary)]/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                        #{order.orderNumber}
                      </p>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.className)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                      €{order.total.toFixed(2)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronLeft className="h-4 w-4" />}
                Prec.
              </button>
              <span className="px-3 text-sm text-[var(--color-text-secondary)]">
                Pagina {page} di {data.totalPages}
              </span>
              <button
                onClick={() => goToPage(Math.min(data.totalPages, page + 1))}
                disabled={page >= data.totalPages || loading}
                className="flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Succ.
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </m.div>
  );
}
