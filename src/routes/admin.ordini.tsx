import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useCallback, type ReactNode } from "react";
import { Search, Loader2, Eye } from "lucide-react";
import { $getAdminOrders } from "~/lib/admin-functions";
import type { AdminOrderListItem } from "~/lib/admin-functions";

export const Route = createFileRoute("/admin/ordini")({
  beforeLoad: async () => {
    const data = await $getAdminOrders({ data: { page: 1, perPage: 20, status: "", query: "", sort: "newest" } });
    return { initialOrders: data };
  },
  component: AdminOrdersPage,
});

function AdminOrdersPage(): ReactNode {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/admin/ordini") {
    return <Outlet />;
  }

  return <AdminOrdersList />;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  processing: "In lavorazione",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
  refunded: "Rimborsato",
};

const STATUS_FILTERS = [
  { label: "Tutti", value: "" },
  { label: "In attesa", value: "pending" },
  { label: "Confermato", value: "confirmed" },
  { label: "In lavorazione", value: "processing" },
  { label: "Spedito", value: "shipped" },
  { label: "Consegnato", value: "delivered" },
  { label: "Annullato", value: "cancelled" },
  { label: "Rimborsato", value: "refunded" },
] as const;

const SORT_OPTIONS = [
  { label: "Più recenti", value: "newest" },
  { label: "Numero ordine", value: "order_number" },
] as const;

function AdminOrdersList(): ReactNode {
  const { initialOrders } = Route.useRouteContext();

  const [orders, setOrders] = useState<AdminOrderListItem[]>(initialOrders.items);
  const [totalPages, setTotalPages] = useState(initialOrders.totalPages);
  const [total, setTotal] = useState(initialOrders.total);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (p: number, q: string, s: string, sortBy: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await $getAdminOrders({ data: { page: p, perPage: 20, status: s, query: q, sort: sortBy } });
      setOrders(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrders(newPage, query, status, sort);
  };

  const inputClass = "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";
  const selectClass = "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  return (
    <div className="space-y-6">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Gestione ordini
        <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          {total}
        </span>
      </span>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca ordini..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
          {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className={selectClass}>
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                <th className="px-4 py-3">Numero ordine</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Articoli</th>
                <th className="px-4 py-3 text-right">Totale</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-primary)]" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-500">Nessun ordine trovato</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                      <div className="text-xs text-gray-500">{order.user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">{order.itemCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">€{order.total.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{order.trackingNumber ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to="/admin/ordini/$id"
                        params={{ id: order.id }}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Dettagli
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">{total} ordini</p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
