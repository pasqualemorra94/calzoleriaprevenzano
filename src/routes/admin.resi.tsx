import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Loader2, Eye, AlertTriangle } from "lucide-react";
import { $listReturnRequests } from "~/lib/admin-functions";
import type { AdminReturnRequestListItem } from "~/lib/admin-functions";

type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

export const Route = createFileRoute("/admin/resi")({
  beforeLoad: async () => {
    const data = await $listReturnRequests({ data: { page: 1, perPage: 12 } });
    return { initialReturns: data };
  },
  component: AdminResiPage,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  approved: "Approvato",
  rejected: "Rifiutato",
  completed: "Completato",
};

const STATUS_FILTERS: Array<{ label: string; value: "" | ReturnStatus }> = [
  { label: "Tutti", value: "" },
  { label: "In attesa", value: "pending" },
  { label: "Approvato", value: "approved" },
  { label: "Rifiutato", value: "rejected" },
  { label: "Completato", value: "completed" },
];

function AdminResiPage(): ReactNode {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/admin/resi") {
    return <Outlet />;
  }
  return <AdminResiList />;
}

function AdminResiList(): ReactNode {
  const { initialReturns } = Route.useRouteContext();

  const [items, setItems] = useState<AdminReturnRequestListItem[]>(initialReturns.items);
  const [totalPages, setTotalPages] = useState(initialReturns.totalPages);
  const [total, setTotal] = useState(initialReturns.total);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | ReturnStatus>("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = useCallback(
    async (
      p: number,
      s: "" | ReturnStatus,
      from: string,
      to: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await $listReturnRequests({
          data: {
            page: p,
            perPage: 12,
            status: s || undefined,
            createdFrom: from || undefined,
            createdTo: to || undefined,
          },
        });
        setItems(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di caricamento");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Skip primo render (initialReturns già caricato dal beforeLoad)
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    fetchReturns(page, status, createdFrom, createdTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, createdFrom, createdTo]);

  const handleResetFilters = () => {
    setStatus("");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
  };

  const inputClass =
    "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Gestione resi
          <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {total}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | ReturnStatus);
            setPage(1);
          }}
          className={inputClass}
          aria-label="Filtra per stato"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={createdFrom}
          onChange={(e) => {
            setCreatedFrom(e.target.value);
            setPage(1);
          }}
          className={inputClass}
          aria-label="Data da"
        />
        <input
          type="date"
          value={createdTo}
          onChange={(e) => {
            setCreatedTo(e.target.value);
            setPage(1);
          }}
          className={inputClass}
          aria-label="Data a"
        />
        <button
          type="button"
          onClick={handleResetFilters}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Reset filtri
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Ordine</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Flag</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-primary)]" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    Nessuna richiesta di reso trovata
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{r.fullName}</div>
                      <div className="text-xs text-gray-500">{r.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {r.orderNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.hasOnlyCustomItems && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                          title="Ordine contiene solo prodotti personalizzati (Art. 59.c) — soft block"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Solo personalizzati
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to="/admin/resi/$id"
                        params={{ id: r.id }}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Apri
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
            <p className="text-sm text-gray-500">{total} richieste</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="flex items-center px-3 text-sm text-gray-500">
                Pagina {page} di {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
