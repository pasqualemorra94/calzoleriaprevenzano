import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Loader2, Save, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/resi/$id")({
  component: AdminReturnRequestDetailPage,
});

type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

interface DetailItem {
  name: string;
  quantity: number;
  price: number;
  categorySlug: string | null;
  parentCategorySlug: string | null;
}

interface ReturnRequestDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  fullName: string;
  email: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  hasOnlyCustomItems: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    createdAt: string;
    items: DetailItem[];
  };
}

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

const ALL_STATUSES: Array<{ value: ReturnStatus; label: string }> = [
  { value: "pending", label: "In attesa" },
  { value: "approved", label: "Approvato" },
  { value: "rejected", label: "Rifiutato" },
  { value: "completed", label: "Completato" },
];

function AdminReturnRequestDetailPage(): ReactNode {
  const { id } = Route.useParams();
  const [detail, setDetail] = useState<ReturnRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState<ReturnStatus>("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/return-requests/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          data?: ReturnRequestDetail;
          error?: { message?: string };
        };
        if (!json.ok || !json.data) {
          throw new Error(json.error?.message ?? "Errore di caricamento");
        }
        const d = json.data;
        setDetail(d);
        const statusValue: ReturnStatus =
          d.status === "approved" || d.status === "rejected" || d.status === "completed"
            ? d.status
            : "pending";
        setNewStatus(statusValue);
        setAdminNotes(d.adminNotes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di caricamento");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/return-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes.trim() === "" ? null : adminNotes.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: { message?: string };
      };
      if (!json.ok) {
        throw new Error(json.error?.message ?? "Errore durante l'aggiornamento");
      }
      setSuccessMsg("Richiesta aggiornata con successo");
      toast.success("Richiesta aggiornata");
      // Aggiorna lo stato locale per riflettere il cambio
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              adminNotes:
                adminNotes.trim() === "" ? null : adminNotes.trim(),
              updatedAt: new Date().toISOString(),
              resolvedAt:
                newStatus === "pending"
                  ? null
                  : new Date().toISOString(),
            }
          : prev,
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante il salvataggio";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

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
        <Link
          to="/admin/resi"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Torna alla lista
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          Richiesta di reso non trovata
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/resi"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Torna alla lista
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error ?? "Impossibile caricare la richiesta"}
        </div>
      </div>
    );
  }

  const fmt = (v: number) => `€${v.toFixed(2)}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/admin/resi"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla lista
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Reso ordine {detail.orderNumber}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_COLORS[detail.status] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {STATUS_LABELS[detail.status] ?? detail.status}
          </span>
        </div>
        <span className="ml-auto text-sm text-gray-500">{fmtDate(detail.createdAt)}</span>
      </div>

      {detail.hasOnlyCustomItems && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>Attenzione:</strong> l&apos;ordine contiene SOLO prodotti
            personalizzati, esclusi dal diritto di recesso ai sensi dell&apos;Art. 59
            lett. c D.Lgs. 206/2005. Valutare caso per caso (es. cortesia commerciale).
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Card Cliente */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Dati cliente</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium text-gray-900">{detail.fullName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd>
                  <a
                    href={`mailto:${detail.email}`}
                    className="font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {detail.email}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Richiesta inviata</dt>
                <dd className="text-gray-900">{fmtDate(detail.createdAt)}</dd>
              </div>
              {detail.resolvedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Risolta il</dt>
                  <dd className="text-gray-900">{fmtDate(detail.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Card Ordine collegato */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Ordine collegato — {detail.order.orderNumber}
              </h2>
              <Link
                to="/admin/ordini/$id"
                params={{ id: detail.order.id }}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Apri ordine completo
              </Link>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Creato il {fmtDate(detail.order.createdAt)} — Totale {fmt(detail.order.total)}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium tracking-wider text-gray-500">
                    <th className="pb-2 pr-4">Prodotto</th>
                    <th className="pb-2 pr-4">Categoria</th>
                    <th className="pb-2 pr-4 text-right">Prezzo</th>
                    <th className="pb-2 pr-4 text-right">Q.tà</th>
                    <th className="pb-2 text-right">Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detail.order.items.map((it, idx) => (
                    <tr key={`${it.name}-${idx}`}>
                      <td className="py-3 pr-4 font-medium text-gray-900">{it.name}</td>
                      <td className="py-3 pr-4 text-xs text-gray-500">
                        {it.categorySlug ?? "—"}
                        {it.parentCategorySlug && (
                          <span className="ml-1 text-gray-400">({it.parentCategorySlug})</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-900">{fmt(it.price)}</td>
                      <td className="py-3 pr-4 text-right text-gray-900">{it.quantity}</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {fmt(it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Motivazione */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Motivazione del cliente</h2>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-4 text-sm text-gray-700">
              {detail.reason}
            </pre>
          </div>
        </div>

        {/* Pannello Gestione */}
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Gestione</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Stato
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReturnStatus)}
                  disabled={saving}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-60"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="adminNotes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Note interne admin
                </label>
                <textarea
                  id="adminNotes"
                  rows={6}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={saving}
                  maxLength={2000}
                  placeholder="Note visibili solo allo staff (es. esito valutazione, accordi presi via email)"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {adminNotes.length} / 2000 caratteri
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
