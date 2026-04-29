import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { ArrowLeft, Loader2, RotateCcw, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { $getAdminOrders } from "~/lib/admin-functions";
import type { AdminOrderListItem } from "~/lib/admin-functions";
import { TypeConfirmDialog } from "~/components/admin/TypeConfirmDialog";

export const Route = createFileRoute("/admin/ordini/cestino")({
  loader: async () => {
    const initial = await $getAdminOrders({ data: { page: 1, perPage: 20, view: "trash" } });
    return { initialOrders: initial };
  },
  component: AdminOrdiniCestinoPage,
});

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

function AdminOrdiniCestinoPage(): ReactNode {
  const { initialOrders } = Route.useLoaderData();

  const [orders, setOrders] = useState<AdminOrderListItem[]>(initialOrders.items);
  const [total, setTotal] = useState(initialOrders.total);
  const [totalPages, setTotalPages] = useState(initialOrders.totalPages);
  const [page, setPage] = useState(1);
  const [emailContains, setEmailContains] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);

  // Debounce email 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(emailContains), 300);
    return () => clearTimeout(t);
  }, [emailContains]);

  // PITFALL CRITICO (RESEARCH §10): reset selection su page/filter change
  useEffect(() => {
    setSelected(new Set());
  }, [page, debouncedEmail, createdFrom, createdTo]);

  // Refetch su filtri/page change (skip primo render: initialOrders gia' caricato)
  const [hasMounted, setHasMounted] = useState(false);
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await $getAdminOrders({ data: {
        page,
        perPage: 20,
        view: "trash",
        emailContains: debouncedEmail || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
      } });
      setOrders(r.items);
      setTotal(r.total);
      setTotalPages(r.totalPages);
    } catch {
      toast.error("Errore nel caricamento del cestino");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedEmail, createdFrom, createdTo]);

  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedEmail, createdFrom, createdTo]);

  const allVisibleSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const toggleAllVisible = (checked: boolean) => {
    const next = new Set(selected);
    if (checked) orders.forEach((o) => next.add(o.id));
    else orders.forEach((o) => next.delete(o.id));
    setSelected(next);
  };
  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  async function bulkAction(action: "restore" | "hard-delete") {
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      if (!res.ok) throw new Error("Bulk fallito");
      const json = (await res.json()) as { data?: { count: number } };
      const count = json.data?.count ?? ids.length;
      toast.success(
        action === "restore"
          ? `${count} ordini ripristinati`
          : `${count} ordini eliminati definitivamente`,
      );
      setSelected(new Set());
      setHardDeleteOpen(false);
      await refetch();
    } catch {
      toast.error(
        action === "restore" ? "Impossibile ripristinare" : "Impossibile eliminare definitivamente",
      );
    } finally {
      setBulkLoading(false);
    }
  }

  const inputClass = "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Cestino ordini
            <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {total}
            </span>
          </span>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Ordini cestinati</h1>
        </div>
        <Link
          to="/admin/ordini"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Torna agli ordini
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="email"
          placeholder="Filtra per email..."
          value={emailContains}
          onChange={(e) => { setEmailContains(e.target.value); setPage(1); }}
          className={`${inputClass} sm:w-64 flex-1`}
        />
        <input
          type="date"
          value={createdFrom}
          onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }}
          className={inputClass}
          aria-label="Data da"
        />
        <input
          type="date"
          value={createdTo}
          onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }}
          className={inputClass}
          aria-label="Data a"
        />
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm text-gray-700">{selected.size} ordini selezionati</span>
          <div className="flex gap-2">
            <button
              onClick={() => bulkAction("restore")}
              disabled={bulkLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Ripristina
            </button>
            <button
              onClick={() => setHardDeleteOpen(true)}
              disabled={bulkLoading}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Cancella definitivamente
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleAllVisible(e.target.checked)}
                    aria-label="Seleziona tutti"
                  />
                </th>
                <th className="px-4 py-3">Numero ordine</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Articoli</th>
                <th className="px-4 py-3 text-right">Totale</th>
                <th className="px-4 py-3">Stato</th>
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
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-500">
                    Il cestino è vuoto
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={(e) => toggleRow(order.id, e.target.checked)}
                        aria-label={`Seleziona ordine ${order.orderNumber}`}
                      />
                    </td>
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
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>

      <TypeConfirmDialog
        open={hardDeleteOpen}
        onClose={() => setHardDeleteOpen(false)}
        onConfirm={() => bulkAction("hard-delete")}
        title="Eliminare definitivamente?"
        message={`${selected.size} ordini saranno eliminati permanentemente. Questa azione è irreversibile.`}
        confirmText="CANCELLA"
        confirmLabel="Elimina definitivamente"
        isLoading={bulkLoading}
      />
    </div>
  );
}
