/**
 * /admin/spedizione — Pannello admin configurazione spedizione
 *
 * Form TanStack Form con 3 campi (cost, freeThreshold, enabled).
 * Validation via zod adapter (`updateShippingConfigSchema`).
 * Toggle "enabled" custom button-based con role="switch" + aria-checked
 * (no shadcn/Radix Switch da installare per restare lean in quick mode).
 * Auth guard ereditato da `/admin` parent route + difesa in profondità
 * via `requireAdmin()` nelle server function chiamate.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { ReactNode } from "react";
import { useState } from "react";
import { Loader2, Save, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  $getShippingConfig,
  $updateShippingConfig,
} from "~/lib/admin-functions";
import { updateShippingConfigSchema } from "~/lib/validators/admin";

export const Route = createFileRoute("/admin/spedizione")({
  beforeLoad: async () => {
    const config = await $getShippingConfig();
    return { initialConfig: config };
  },
  component: AdminShippingPage,
});

interface ShippingFormValues {
  cost: number;
  freeThreshold: number;
  costEstero: number;
  freeThresholdEstero: number;
  enabled: boolean;
}

function AdminShippingPage(): ReactNode {
  const { initialConfig } = Route.useRouteContext();
  const [saving, setSaving] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<ShippingFormValues>({
    defaultValues: {
      cost: initialConfig.cost,
      freeThreshold: initialConfig.freeThreshold,
      costEstero: initialConfig.costEstero,
      freeThresholdEstero: initialConfig.freeThresholdEstero,
      enabled: initialConfig.enabled,
    },
    validatorAdapter: zodValidator(),
    validators: { onSubmit: updateShippingConfigSchema },
    onSubmit: async ({ value }: { value: ShippingFormValues }) => {
      setSaving(true);
      try {
        await $updateShippingConfig({ data: value });
        toast.success("Configurazione spedizione salvata");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
      } finally {
        setSaving(false);
      }
    },
  });

  const inputClass =
    "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60";
  const labelClass = "block text-sm font-medium text-gray-700";
  const helperClass = "text-xs text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="h-5 w-5 text-[var(--color-primary)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Configurazione spedizione
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="max-w-2xl rounded-lg bg-white p-6 shadow-sm space-y-6"
      >
        <p className="text-sm text-gray-600">
          Configura il costo della spedizione, la soglia per la spedizione gratuita
          e l'attivazione globale. Le modifiche sono immediate su carrello e
          checkout.
        </p>

        {/* Toggle enabled */}
        <form.Field name="enabled">
          {(field) => (
            <div className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-4">
              <div className="space-y-1">
                <label htmlFor="ship-enabled" className={labelClass}>
                  Spedizione attiva
                </label>
                <p className={helperClass}>
                  Quando disattivata, la spedizione è gratuita per tutti gli ordini
                  (€0,00) indipendentemente dalla soglia.
                </p>
              </div>
              <button
                id="ship-enabled"
                type="button"
                role="switch"
                aria-checked={field.state.value}
                onClick={() => field.handleChange(!field.state.value)}
                className={
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors " +
                  (field.state.value ? "bg-[var(--color-primary)]" : "bg-gray-300")
                }
              >
                <span
                  className={
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform " +
                    (field.state.value ? "translate-x-5" : "translate-x-0.5")
                  }
                />
              </button>
            </div>
          )}
        </form.Field>

        {/* cost */}
        <form.Field
          name="cost"
          validators={{
            onChange: ({ value }: { value: number }) => {
              if (value < 0) return "Il costo non può essere negativo";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className={labelClass}>
                Costo spedizione (€)
              </label>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className={inputClass}
              />
              <p className={helperClass}>
                Costo applicato sotto la soglia di spedizione gratuita.
              </p>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* costEstero */}
        <form.Field
          name="costEstero"
          validators={{
            onChange: ({ value }: { value: number }) => {
              if (value < 0) return "Il costo non può essere negativo";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className={labelClass}>
                Costo spedizione estero (€)
              </label>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className={inputClass}
              />
              <p className={helperClass}>
                Vale per ordini con spedizione fuori Italia, sotto la soglia estero.
              </p>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* freeThreshold */}
        <form.Field
          name="freeThreshold"
          validators={{
            onChange: ({ value }: { value: number }) => {
              if (value < 0) return "La soglia non può essere negativa";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className={labelClass}>
                Soglia spedizione gratuita (€)
              </label>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className={inputClass}
              />
              <p className={helperClass}>
                Per ordini di importo superiore o uguale a questa soglia, la
                spedizione è gratuita.
              </p>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* freeThresholdEstero */}
        <form.Field
          name="freeThresholdEstero"
          validators={{
            onChange: ({ value }: { value: number }) => {
              if (value < 0) return "La soglia non può essere negativa";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <label htmlFor={field.name} className={labelClass}>
                Soglia spedizione gratuita estero (€)
              </label>
              <input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className={inputClass}
              />
              <p className={helperClass}>
                Vale per ordini con spedizione fuori Italia: oltre questa soglia la
                spedizione estero è gratuita.
              </p>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-600">{String(field.state.meta.errors[0])}</p>
              )}
            </div>
          )}
        </form.Field>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva configurazione
          </button>
        </div>
      </form>
    </div>
  );
}
