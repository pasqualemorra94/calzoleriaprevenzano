import type { ReactNode } from "react";
import { Layers, Download, Trash2 } from "lucide-react";
import { VariantBuilder } from "~/components/admin/VariantBuilder";
import type { VariantConfig } from "~/lib/types/variant-config";

interface VariantConfigSectionProps {
  parsedVariantConfig: VariantConfig | null;
  templates: Array<{ id: string; name: string }>;
  onUpdateVariantConfig: (json: string | null) => void;
  onApplyTemplate: (templateId: string) => void;
  onClearConfig: () => void;
}

export function VariantConfigSection({
  parsedVariantConfig,
  templates, onUpdateVariantConfig, onApplyTemplate, onClearConfig,
}: VariantConfigSectionProps): ReactNode {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[var(--color-primary)]" />
          {parsedVariantConfig && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {parsedVariantConfig.groups.length} gruppi
            </span>
          )}
        </div>
        {templates.length > 0 && (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[var(--color-text-muted)]" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) onApplyTemplate(e.target.value);
                e.target.value = "";
              }}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="" disabled>Aggiungi Template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (confirm("Rimuovere tutte le opzioni varianti?")) {
                  onClearConfig();
                }
              }}
              className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="mr-1 inline h-3 w-3" />
              Pulisci
            </button>
          </div>
        )}
      </div>

      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        Usa il builder visivo per definire gruppi di opzioni (colore, tacco, taglia...).
        Le opzioni di tipo &quot;Swatches colore&quot; mostreranno la foto del prodotto dentro ogni swatch.
        Selezionando un template dal menu, i suoi gruppi vengono <strong>aggiunti</strong> a quelli esistenti
        (gruppi con lo stesso ID vengono aggiornati). Il pulsante &quot;Pulisci&quot; rimuove tutto.
      </p>

      <VariantBuilder
        value={parsedVariantConfig}
        onChange={(config) => onUpdateVariantConfig(config ? JSON.stringify(config, null, 2) : null)}
      />
    </div>
  );
}
