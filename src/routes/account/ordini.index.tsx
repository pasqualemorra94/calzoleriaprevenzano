import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Loader2, Package } from "lucide-react";
import { m } from "motion/react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product: { slug: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  totalPages: number;
}

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
  component: OrdersPage,
});

function OrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${p}&perPage=10`);
      const json = await res.json();
      if (json.ok) setData(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(page); }, [page, fetchOrders]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

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
                      {" · "}
                      {order.items.length} {order.items.length === 1 ? "articolo" : "articoli"}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Prec.
              </button>
              <span className="px-3 text-sm text-[var(--color-text-secondary)]">
                Pagina {page} di {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
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

import { cn } from "~/lib/utils/cn";
