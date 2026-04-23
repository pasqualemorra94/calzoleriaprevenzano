/**
 * SessionHistory — List of previous AI analysis sessions.
 *
 * Shows saved sessions with date, thumbnail, and try-on status.
 * Allows resuming a session (skip analysis → go directly to try-on)
 * or deleting old sessions.
 */

import { useState, useEffect, useCallback } from "react";
import { History, Trash2, Play, ChevronRight, X, Loader2 } from "lucide-react";

interface SessionSummary {
  id: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  tryonCount: number;
  tryonProductName: string | null;
  analysisCost: number | null;
}

interface SessionHistoryProps {
  onResume: (sessionId: string) => void;
  onClose: () => void;
}

export function SessionHistory({ onResume, onClose }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<{ totalUsd: number; sessionCount: number } | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("[SessionHistory] loadSessions — fetching /api/admin/ai/sessions");
    try {
      const res = await fetch("/api/admin/ai/sessions");
      console.log("[SessionHistory] response status:", res.status, res.ok);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(`Errore server: ${res.status} — ${text.slice(0, 200)}`);
        console.error("[SessionHistory] fetch failed:", res.status, text);
        return;
      }
      const data = await res.json();
      console.log("[SessionHistory] parsed data:", data.ok, "sessions:", data.data?.sessions?.length);
      if (data.ok) {
        setSessions(data.data.sessions);
        setTotalCost(data.data.totalCost);
      } else {
        setError(data.error?.message ?? "Errore nel caricamento");
        console.error("[SessionHistory] API returned error:", data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore di connessione";
      setError(msg);
      console.error("[SessionHistory] fetch exception:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Eliminare questa sessione? I dati non potranno essere recuperati.")) return;

    setDeleting(id);
    try {
      await fetch(`/api/admin/ai/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Errore nell'eliminazione della sessione.");
    } finally {
      setDeleting(null);
    }
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${time}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-white shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Sessioni precedenti</h3>
          {totalCost && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {totalCost.sessionCount} sessioni · ${totalCost.totalUsd.toFixed(4)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Chiudi storico"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {sessions.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Nessuna sessione salvata. Analizza un piede per iniziare.
        </p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={loadSessions}
            className="mt-2 text-xs font-medium text-[var(--color-primary)] underline"
          >
            Riprova
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onResume(session.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:border-[var(--color-primary)]/30 hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                👣
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {session.label ?? "Analisi piede"}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{formatDate(session.createdAt)}</span>
                  {session.tryonCount > 0 && (
                    <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                      ✓ {session.tryonCount} {session.tryonCount === 1 ? "prova" : "prove"}
                    </span>
                  )}
                  {session.analysisCost != null && (
                    <span>${session.analysisCost.toFixed(4)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">
                  Riprendi
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, session.id)}
                  disabled={deleting === session.id}
                  className="rounded-md p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  aria-label={`Elimina sessione ${session.label ?? session.id}`}
                >
                  {deleting === session.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New analysis CTA */}
      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <Play className="h-4 w-4" />
        Nuova analisi
      </button>
    </div>
  );
}
