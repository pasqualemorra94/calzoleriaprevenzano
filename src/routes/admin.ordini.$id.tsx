import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/ordini/$id")({
  component: AdminOrderDetailPage,
});

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  discountAmount: number;
  shippingMethod: string;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  items: {
    id: string;
    name: string;
    variantName: string | null;
    price: number;
    quantity: number;
    sku: string | null;
    selectedOptions: Array<{ label: string; value: string; color?: string }> | null;
  }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
  }[];
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

const ALL_STATUSES = [
  { value: "pending", label: "In attesa" },
  { value: "confirmed", label: "Confermato" },
  { value: "processing", label: "In lavorazione" },
  { value: "shipped", label: "Spedito" },
  { value: "delivered", label: "Consegnato" },
  { value: "cancelled", label: "Annullato" },
  { value: "refunded", label: "Rimborsato" },
] as const;

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  completed: "Completato",
  failed: "Fallito",
  refunded: "Rimborsato",
};

function AdminOrderDetailPage(): ReactNode {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const json = await res.json();
        if (!json.ok) throw new Error(json.error?.message ?? "Errore");
        const o = json.data;
        setOrder(o);
        setNewStatus(o.status);
        setTrackingNumber(o.trackingNumber ?? "");
        setNotes(o.notes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di caricamento");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const patchOrder = async (body: Record<string, string>, label: string) => {
    setSaving(label);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore");
      setOrder(json.data);
      setSuccessMsg(`${label} aggiornato con successo`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'aggiornamento");
    } finally {
      setSaving(null);
    }
  };

  const labelClass = "block text-sm font-medium text-gray-700";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Link to="/admin/ordini" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Torna alla lista
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">Ordine non trovato</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link to="/admin/ordini" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Torna alla lista
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error ?? "Impossibile caricare l'ordine"}</div>
      </div>
    );
  }

  const fmt = (v: number) => `€${v.toFixed(2)}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/ordini" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
          Torna alla lista
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Ordine {order.orderNumber}</span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <span className="ml-auto text-sm text-gray-500">{fmtDate(order.createdAt)}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{successMsg}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium tracking-wider text-gray-500">
                    <th className="pb-2 pr-4">Nome</th>
                    <th className="pb-2 pr-4">Variante</th>
                    <th className="pb-2 pr-4">SKU</th>
                    <th className="pb-2 pr-4 text-right">Prezzo</th>
                    <th className="pb-2 pr-4 text-right">Quantità</th>
                    <th className="pb-2 text-right">Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {item.selectedOptions && item.selectedOptions.length > 0
                          ? item.selectedOptions.map((o: { label: string; value: string; color?: string }) => (
                              <span key={o.label} className="inline-flex items-center gap-1 mr-2 last:mr-0 text-xs">
                                {o.color && (
                                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.color }} />
                                )}
                                {o.value}
                              </span>
                            ))
                          : (item.variantName ?? "—")}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{item.sku ?? "—"}</td>
                      <td className="py-3 pr-4 text-right text-gray-900">{fmt(item.price)}</td>
                      <td className="py-3 pr-4 text-right text-gray-900">{item.quantity}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{fmt(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="ml-auto w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotale</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Spedizione</span>
                  <span>{fmt(order.shippingCost)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Sconto</span>
                    <span>-{fmt(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>IVA</span>
                  <span>{fmt(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <span>Totale</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {order.payments.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-sm">

              <div className="divide-y divide-gray-100">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fmt(p.amount)}</p>
                      <p className="text-xs text-gray-500">{p.method}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "completed" ? "bg-green-100 text-green-800" : p.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                      <p className="mt-1 text-xs text-gray-400">{fmtDate(p.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium text-gray-900">{order.user.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{order.user.email}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Stato corrente</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Metodo spedizione</dt>
                <dd className="font-medium text-gray-900">{order.shippingMethod}</dd>
              </div>
              {order.trackingNumber && (
                <div>
                  <dt className="text-gray-500">Tracking</dt>
                  <dd className="font-medium text-gray-900">{order.trackingNumber}</dd>
                </div>
              )}
              {order.notes && (
                <div>
                  <dt className="text-gray-500">Note</dt>
                  <dd className="font-medium text-gray-900">{order.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Creato</dt>
                <dd className="text-gray-900">{fmtDate(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Aggiornato</dt>
                <dd className="text-gray-900">{fmtDate(order.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">

            <div className="space-y-4">
              <div>
                <label htmlFor="status-select" className={labelClass}>Aggiorna stato</label>
                <div className="mt-1 flex gap-2">
                  <select id="status-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none">
                    {ALL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button
                    onClick={() => patchOrder({ status: newStatus }, "Stato")}
                    disabled={saving === "Stato" || newStatus === order.status}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving === "Stato" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="tracking-input" className={labelClass}>Numero tracking</label>
                <div className="mt-1 flex gap-2">
                  <input id="tracking-input" type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none" placeholder="Inserisci numero..." />
                  <button
                    onClick={() => patchOrder({ trackingNumber }, "Tracking")}
                    disabled={saving === "Tracking"}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving === "Tracking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="notes-input" className={labelClass}>Note</label>
                <div className="mt-1 flex gap-2">
                  <textarea id="notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none" />
                  <button
                    onClick={() => patchOrder({ notes }, "Note")}
                    disabled={saving === "Note"}
                    className="inline-flex h-9 self-end items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving === "Note" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
