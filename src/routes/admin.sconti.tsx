/**
 * /admin/sconti — Pannello admin codici sconto (percentuale)
 *
 * Form TanStack Form per creare un codice sconto + tabella di tutti i codici
 * con utilizzi (usedCount/maxUses) e toggle attiva/disattiva senza reload.
 * Validation via zod adapter (`createDiscountCodeSchema`). Toggle custom
 * button role="switch" (no shadcn/Radix Switch). Auth guard ereditato da
 * `/admin` parent + difesa in profondità via `requireAdmin()` nelle server fn.
 * Logica di business interamente nel server layer (admin-discounts.server.ts).
 */

import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { ReactNode } from "react";
import { useState } from "react";
import { Loader2, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  $listDiscountCodes,
  $createDiscountCode,
  $toggleDiscountCode,
  type DiscountCodeListItem,
} from "~/lib/admin-functions";

export const Route = createFileRoute("/admin/sconti")({
  beforeLoad: async () => ({ initialCodes: await $listDiscountCodes() }),
  component: AdminDiscountsPage,
});

interface DiscountFormValues {
  code: string;
  value: number;
  startsAt: string;
  expiresAt: string;
  minOrder: string;
  maxUses: string;
}

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "block text-sm font-medium text-gray-700";
const helperClass = "text-xs text-gray-500";

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function formatDateIT(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT");
}

function AdminDiscountsPage(): ReactNode {
  const { initialCodes } = Route.useRouteContext();
  const [codes, setCodes] = useState<DiscountCodeListItem[]>(initialCodes);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<DiscountFormValues>({
    defaultValues: {
      code: "",
      value: 10,
      startsAt: isoDate(0),
      expiresAt: isoDate(30),
      minOrder: "",
      maxUses: "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }: { value: DiscountFormValues }) => {
      setCreating(true);
      try {
        const created = await $createDiscountCode({
          data: {
            code: value.code,
            value: Number(value.value),
            startsAt: new Date(value.startsAt),
            expiresAt: new Date(value.expiresAt),
            minOrder: value.minOrder === "" ? undefined : Number(value.minOrder),
            maxUses: value.maxUses === "" ? undefined : Number(value.maxUses),
          },
        });
        setCodes((prev) => [created, ...prev]);
        form.reset();
        toast.success("Codice sconto creato");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore creazione codice");
      } finally {
        setCreating(false);
      }
    },
  });

  async function handleToggle(c: DiscountCodeListItem): Promise<void> {
    setTogglingId(c.id);
    try {
      const updated = await $toggleDiscountCode({ data: { id: c.id, isActive: !c.isActive } });
      setCodes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore aggiornamento");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Ticket className="h-5 w-5 text-[var(--color-primary)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Codici sconto
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="max-w-3xl rounded-lg bg-white p-6 shadow-sm space-y-6"
      >
        <p className="text-sm text-gray-600">
          Crea un codice sconto in percentuale. I codici sono salvati in maiuscolo e
          subito utilizzabili al checkout (entro la finestra di validità e nel rispetto
          di ordine minimo e limite utilizzi).
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="code">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className={labelClass}>Codice</label>
                <input
                  id={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="ESTATE10"
                  className={inputClass + " font-mono uppercase"}
                />
                <p className={helperClass}>Lettere, numeri, trattino e underscore.</p>
              </div>
            )}
          </form.Field>

          <form.Field name="value">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className={labelClass}>Sconto (%)</label>
                <input
                  id={field.name}
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                  className={inputClass}
                />
                <p className={helperClass}>Percentuale applicata al subtotale.</p>
              </div>
            )}
          </form.Field>

          <form.Field name="startsAt">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className={labelClass}>Inizio validità</label>
                <input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="expiresAt">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className={labelClass}>Scadenza</label>
                <input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="minOrder">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className={labelClass}>Ordine minimo (€)</label>
                <input
                  id={field.name}
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Nessuno"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="maxUses">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className={labelClass}>Limite utilizzi</label>
                <input
                  id={field.name}
                  type="number"
                  step="1"
                  min="1"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Illimitato"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crea codice sconto
          </button>
        </div>
      </form>

      <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3 font-medium">Codice</th>
              <th className="px-4 py-3 font-medium">Sconto</th>
              <th className="px-4 py-3 font-medium">Validità</th>
              <th className="px-4 py-3 font-medium">Ordine min</th>
              <th className="px-4 py-3 font-medium">Utilizzi</th>
              <th className="px-4 py-3 font-medium text-right">Stato</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nessun codice sconto creato
                </td>
              </tr>
            ) : (
              codes.map((c) => (
                <DiscountRow
                  key={c.id}
                  code={c}
                  toggling={togglingId === c.id}
                  onToggle={() => void handleToggle(c)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiscountRow({
  code,
  toggling,
  onToggle,
}: {
  code: DiscountCodeListItem;
  toggling: boolean;
  onToggle: () => void;
}): ReactNode {
  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="px-4 py-3 font-mono font-medium text-gray-900">{code.code}</td>
      <td className="px-4 py-3 text-gray-700">{code.value}%</td>
      <td className="px-4 py-3 text-gray-600">
        {formatDateIT(code.startsAt)} → {formatDateIT(code.expiresAt)}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {code.minOrder !== null ? `€${code.minOrder.toFixed(2)}` : "—"}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {code.usedCount}/{code.maxUses ?? "∞"}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={code.isActive}
            disabled={toggling}
            onClick={onToggle}
            className={
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
              (code.isActive ? "bg-[var(--color-primary)]" : "bg-gray-300")
            }
          >
            <span
              className={
                "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform " +
                (code.isActive ? "translate-x-5" : "translate-x-0.5")
              }
            />
          </button>
        </div>
      </td>
    </tr>
  );
}
