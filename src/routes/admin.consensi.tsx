/**
 * /admin/consensi — Pannello admin read-only registro ConsentLog
 *
 * Mirror semplificato di admin.ordini.tsx (no bulk, no row navigation, no soft-delete).
 * Filtri: type (5 categorie) + range date (createdFrom/createdTo).
 * Pagination: 12/page con Prev/Next + indicatore "Pagina X di Y" + count totale.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { $listConsentLogs } from "~/lib/admin-functions";
import type { AdminConsentLogItem } from "~/lib/admin-functions";

type ConsentType = "cookie" | "preferences" | "analytics" | "marketing" | "privacy";

const TYPE_FILTERS: ReadonlyArray<{ label: string; value: "" | ConsentType }> = [
  { label: "Tutti", value: "" },
  { label: "Cookie", value: "cookie" },
  { label: "Preferenze", value: "preferences" },
  { label: "Analytics", value: "analytics" },
  { label: "Marketing", value: "marketing" },
  { label: "Privacy", value: "privacy" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  cookie: "Cookie",
  preferences: "Preferenze",
  analytics: "Analytics",
  marketing: "Marketing",
  privacy: "Privacy",
};

export const Route = createFileRoute("/admin/consensi")({
  beforeLoad: async () => {
    const data = await $listConsentLogs({ data: { page: 1, perPage: 12 } });
    return { initialLogs: data };
  },
  component: AdminConsentLogsPage,
});

function AdminConsentLogsPage(): ReactNode {
  const { initialLogs } = Route.useRouteContext();

  const [items, setItems] = useState<AdminConsentLogItem[]>(initialLogs.items);
  const [total, setTotal] = useState(initialLogs.total);
  const [totalPages, setTotalPages] = useState(initialLogs.totalPages);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"" | ConsentType>("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (p: number, t: "" | ConsentType, from: string, to: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await $listConsentLogs({
          data: {
            page: p,
            perPage: 12,
            type: t || undefined,
            createdFrom: from || undefined,
            createdTo: to || undefined,
          },
        });
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di caricamento");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Skip primo render (initialLogs già caricato)
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    fetchLogs(page, type, createdFrom, createdTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type, createdFrom, createdTo]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Registro consensi</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit trail GDPR: tutti i consensi (cookie, marketing, privacy, ecc.) registrati
          dagli utenti del sito. Read-only.
        </p>
      </header>

      {/* ─── Filtri ─── */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="type-filter" className="text-xs font-medium text-gray-700">
            Tipo consenso
          </label>
          <select
            id="type-filter"
            value={type}
            onChange={(e) => {
              setType(e.target.value as "" | ConsentType);
              setPage(1);
            }}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="created-from" className="text-xs font-medium text-gray-700">
            Data dal
          </label>
          <input
            id="created-from"
            type="date"
            value={createdFrom}
            onChange={(e) => {
              setCreatedFrom(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="created-to" className="text-xs font-medium text-gray-700">
            Data al
          </label>
          <input
            id="created-to"
            type="date"
            value={createdTo}
            onChange={(e) => {
              setCreatedTo(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>

        {(type || createdFrom || createdTo) && (
          <button
            type="button"
            onClick={() => {
              setType("");
              setCreatedFrom("");
              setCreatedTo("");
              setPage(1);
            }}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Reset filtri
          </button>
        )}

        <div className="ml-auto text-xs text-gray-500">
          {total} {total === 1 ? "consenso" : "consensi"} totali
        </div>
      </div>

      {/* ─── Tabella ─── */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading && (
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Caricamento...
          </div>
        )}
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            Nessun consenso registrato per i filtri selezionati.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Utente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {log.userEmail ? (
                        <a
                          href={`mailto:${log.userEmail}`}
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {log.userEmail}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {TYPE_LABELS[log.type] ?? log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.granted
                            ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                            : "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                        }
                      >
                        {log.granted ? "Concesso" : "Revocato"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {log.ip ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={log.userAgent ?? undefined}>
                      {log.userAgent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Precedente
          </button>
          <span className="text-sm text-gray-600">
            Pagina {page} di {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || loading}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Successiva
          </button>
        </div>
      )}
    </div>
  );
}
