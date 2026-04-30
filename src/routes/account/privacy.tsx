import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { useState } from "react";
import { m } from "motion/react";
import { Download, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TypeConfirmDialog } from "~/components/admin/TypeConfirmDialog";

// ─── Server function: storico consensi ultimi 20 per userId corrente ──────

interface ConsentLogItem {
  id: string;
  type: string;
  granted: boolean;
  createdAt: string;
}

const $getConsentHistory = createServerFn({ method: "GET" }).handler(async (): Promise<ConsentLogItem[]> => {
  const request = getRequest();
  const { getUser } = await import("~/lib/sdk-auth.server");
  const user = await getUser(request);
  if (!user) return [];
  const { prisma } = await import("~/lib/db.server");
  const logs = await prisma.consentLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return logs.map((l) => ({
    id: l.id,
    type: l.type,
    granted: l.granted,
    createdAt: l.createdAt.toISOString(),
  }));
});

export const Route = createFileRoute("/account/privacy")({
  beforeLoad: async () => {
    const consentHistory = await $getConsentHistory();
    return { consentHistory };
  },
  component: PrivacyPage,
});

// ─── Type label mapping (IT) ──────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  cookie: "Cookie",
  preferences: "Preferenze",
  analytics: "Analytics",
  marketing: "Marketing",
  privacy: "Privacy",
};

function PrivacyPage() {
  const { consentHistory } = Route.useRouteContext();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Export ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/user/export", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        toast.error(err?.error?.message ?? "Errore durante l'export");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prevenzano-dati-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download avviato");
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setExporting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ confirm: "CANCELLA" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        toast.error(err?.error?.message ?? "Errore durante la cancellazione");
        setDeleting(false);
        return;
      }
      toast.success("Account cancellato. Sarai reindirizzato.");
      setConfirmOpen(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      toast.error("Errore di connessione");
      setDeleting(false);
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-6">
        Privacy e dati
      </h1>

      <div className="space-y-6 max-w-2xl">
        {/* ─── Sezione 1: I tuoi dati ─── */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
                I tuoi dati
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Esercita il tuo diritto di accesso e portabilità (Art. 15/20 GDPR). Scarica un dump JSON di tutti i tuoi dati: profilo, ordini, indirizzi, wishlist, recensioni e storico consensi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Generazione in corso..." : "Scarica i miei dati (JSON)"}
          </button>
        </section>

        {/* ─── Sezione 2: Cancella account ─── */}
        <section className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50/30 p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
                Cancella account
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Questa azione è irreversibile. I tuoi dati personali verranno anonimizzati: email, nome, indirizzi, wishlist, carrello e recensioni saranno cancellati. Gli ordini esistenti restano in archivio per obblighi di legge fiscale (10 anni, DPR 633/72) ma con dati anonimizzati.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Cancella definitivamente account
          </button>
        </section>

        {/* ─── Sezione 3: Storico consensi ─── */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-text-secondary)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">
                Storico consensi
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Ultimi 20 consensi registrati per il tuo account.
              </p>
            </div>
          </div>

          {consentHistory.length === 0 ? (
            <p className="py-4 text-sm text-[var(--color-text-muted)] italic">
              Nessun consenso registrato finora.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-light)] text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {consentHistory.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--color-border-light)] last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-[var(--color-text-secondary)]">
                        {new Date(log.createdAt).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 text-[var(--color-text)]">
                        {TYPE_LABELS[log.type] ?? log.type}
                      </td>
                      <td className="py-2.5">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ─── TypeConfirmDialog per delete account ─── */}
      <TypeConfirmDialog
        open={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        onConfirm={handleDelete}
        title="Conferma cancellazione account"
        message="Email, nome, indirizzi, wishlist, carrello e recensioni saranno cancellati. Gli ordini restano (anonimi) per obblighi fiscali."
        confirmText="CANCELLA"
        confirmLabel="Cancella account"
        danger
        isLoading={deleting}
      />
    </m.div>
  );
}
