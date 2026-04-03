"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical, Copy, ImageIcon, X } from "lucide-react";
import type { VariantConfig, VariantGroup, VariantOption, VariantControlType } from "~/lib/types/variant-config";
import { VariantConfigSchema } from "~/lib/types/variant-config";

const CONTROL_TYPE_LABELS: Record<VariantControlType, string> = {
  button: "Pulsanti",
  select: "Menu a tendina",
  "color-swatch": "Swatches colore",
};

const PRESETS: Array<{ label: string; config: VariantConfig }> = [
  {
    label: "Sandali (4 pelli + colore + tacco + taglia)",
    config: {
      groups: [
        {
          id: "tipo-pelle",
          label: "Tipo di Pelle",
          type: "button",
          required: true,
          options: [
            { value: "classica", label: "Classica" },
            { value: "camoscio", label: "Camoscio" },
            { value: "pitonato", label: "Pitonato" },
            { value: "laminato", label: "Laminato" },
          ],
        },
        {
          id: "tacco",
          label: "Tacco",
          type: "button",
          required: true,
          options: [
            { value: "no-tacco", label: "No tacco" },
            { value: "tacco-2-5", label: "Tacco 2.5 cm", priceModifier: 10 },
            { value: "tacco-5", label: "Tacco 5 cm", priceModifier: 10 },
          ],
        },
        {
          id: "taglia",
          label: "Taglia",
          type: "button",
          required: true,
          options: [
            { value: "32", label: "32" },
            { value: "33", label: "33" },
            { value: "34", label: "34" },
            { value: "35", label: "35" },
            { value: "36", label: "36" },
            { value: "37", label: "37" },
            { value: "38", label: "38" },
            { value: "39", label: "39" },
            { value: "40", label: "40" },
            { value: "41", label: "41" },
            { value: "42", label: "42" },
          ],
        },
      ],
    },
  },
  {
    label: "Gioiello/Sole (colore diretto + tacco + taglia)",
    config: {
      groups: [
        {
          id: "colore",
          label: "Colore",
          type: "color-swatch",
          required: true,
          options: [
            { value: "argento", label: "Argento" },
            { value: "oro", label: "Oro" },
            { value: "rosa", label: "Rosa" },
          ],
        },
        {
          id: "tacco",
          label: "Tacco",
          type: "button",
          required: true,
          options: [
            { value: "no-tacco", label: "No tacco" },
            { value: "tacco-2-5", label: "Tacco 2.5 cm", priceModifier: 10 },
            { value: "tacco-5", label: "Tacco 5 cm", priceModifier: 10 },
          ],
        },
        {
          id: "taglia",
          label: "Taglia",
          type: "button",
          required: true,
          options: [
            { value: "32", label: "32" },
            { value: "33", label: "33" },
            { value: "34", label: "34" },
            { value: "35", label: "35" },
            { value: "36", label: "36" },
            { value: "37", label: "37" },
            { value: "38", label: "38" },
            { value: "39", label: "39" },
            { value: "40", label: "40" },
            { value: "41", label: "41" },
            { value: "42", label: "42" },
          ],
        },
      ],
    },
  },
  {
    label: "Simple (solo tacco + taglia)",
    config: {
      groups: [
        {
          id: "tacco",
          label: "Tacco",
          type: "button",
          required: true,
          options: [
            { value: "no-tacco", label: "No tacco" },
            { value: "tacco-2-5", label: "Tacco 2.5 cm", priceModifier: 10 },
            { value: "tacco-5", label: "Tacco 5 cm", priceModifier: 10 },
          ],
        },
        {
          id: "taglia",
          label: "Taglia",
          type: "button",
          required: true,
          options: [
            { value: "32", label: "32" },
            { value: "33", label: "33" },
            { value: "34", label: "34" },
            { value: "35", label: "35" },
            { value: "36", label: "36" },
            { value: "37", label: "37" },
            { value: "38", label: "38" },
            { value: "39", label: "39" },
            { value: "40", label: "40" },
            { value: "41", label: "41" },
            { value: "42", label: "42" },
          ],
        },
      ],
    },
  },
];

interface VariantBuilderProps {
  value: VariantConfig | null;
  onChange: (config: VariantConfig | null) => void;
  error?: string;
}

export function VariantBuilder({ value, onChange, error }: VariantBuilderProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const groups = value?.groups ?? [];

  const addGroup = useCallback(() => {
    const newGroup: VariantGroup = {
      id: `group-${Date.now()}`,
      label: "Nuovo Gruppo",
      type: "button",
      required: true,
      options: [
        { value: "opzione-1", label: "Opzione 1" },
        { value: "opzione-2", label: "Opzione 2" },
      ],
    };
    onChange({ groups: [...groups, newGroup] });
    setLocalError(null);
  }, [groups, onChange]);

  const removeGroup = useCallback((groupId: string) => {
    const filtered = groups.filter((g) => g.id !== groupId);
    onChange(filtered.length > 0 ? { groups: filtered } : null);
    setLocalError(null);
  }, [groups, onChange]);

  const duplicateGroup = useCallback((group: VariantGroup) => {
    const now = Date.now();
    const newGroup: VariantGroup = {
      ...group,
      id: `${group.id}-copy-${now}`,
      label: `${group.label} (copia)`,
      options: group.options.map((o) => ({
        ...o,
        value: `${o.value}-copy-${now}`,
      })),
    };
    onChange({ groups: [...groups, newGroup] });
    setLocalError(null);
  }, [groups, onChange]);

  const updateGroup = useCallback((groupId: string, updates: Partial<VariantGroup>) => {
    onChange({
      groups: groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    });
    setLocalError(null);
  }, [groups, onChange]);

  const addOption = useCallback((groupId: string) => {
    onChange({
      groups: groups.map((g) => {
        if (g.id !== groupId) return g;
        const newOpt: VariantOption = {
          value: `opzione-${g.options.length + 1}`,
          label: `Opzione ${g.options.length + 1}`,
        };
        return { ...g, options: [...g.options, newOpt] };
      }),
    });
    setLocalError(null);
  }, [groups, onChange]);

  const removeOption = useCallback((groupId: string, optIndex: number) => {
    onChange({
      groups: groups.map((g) => {
        if (g.id !== groupId) return g;
        const opts = g.options.filter((_, i) => i !== optIndex);
        return { ...g, options: opts };
      }),
    });
    setLocalError(null);
  }, [groups, onChange]);

  const updateOption = useCallback((groupId: string, optIndex: number, updates: Partial<VariantOption>) => {
    onChange({
      groups: groups.map((g) => {
        if (g.id !== groupId) return g;
        const opts = g.options.map((o, i) => (i === optIndex ? { ...o, ...updates } : o));
        return { ...g, options: opts };
      }),
    });
    setLocalError(null);
  }, [groups, onChange]);

  const loadPreset = useCallback((config: VariantConfig) => {
    onChange(JSON.parse(JSON.stringify(config)));
    setLocalError(null);
  }, [onChange]);

  const validate = useCallback(() => {
    if (!value) return true;
    const result = VariantConfigSchema.safeParse(value);
    if (!result.success) {
      const firstError = result.error.issues[0];
      setLocalError(firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Config non valido");
      return false;
    }
    setLocalError(null);
    return true;
  }, [value]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Configurazione Varianti</h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Definisci i gruppi di opzioni che il cliente può scegliere (tipo pelle, colore, tacco, taglia...)
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <Plus className="h-3.5 w-3.5" />
          Aggiungi gruppo
        </button>
      </div>

      {/* Presets */}
      {groups.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4">
          <p className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">
            Partendo da un preset:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => loadPreset(preset.config)}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group, groupIndex) => (
          <GroupEditor
            key={group.id}
            group={group}
            index={groupIndex}
            onUpdate={(updates) => updateGroup(group.id, updates)}
            onRemove={() => removeGroup(group.id)}
            onDuplicate={() => duplicateGroup(group)}
            onAddOption={() => addOption(group.id)}
            onRemoveOption={(optIdx) => removeOption(group.id, optIdx)}
            onUpdateOption={(optIdx, updates) => updateOption(group.id, optIdx, updates)}
          />
        ))}
      </div>

      {/* JSON Preview */}
      {groups.length > 0 && (
        <details className="group/details">
          <summary className="cursor-pointer text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
            Anteprima JSON
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-muted)] p-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      )}

      {(localError || error) && (
        <p className="text-xs text-[var(--color-destructive)]">
          {localError ?? error}
        </p>
      )}

      {/* Hidden validate trigger for form submission */}
      <ValidateTrigger validate={validate} />
    </div>
  );
}

/** Triggers validation when form submits — parent form can call this */
function ValidateTrigger({ validate: _validate }: { validate: () => boolean }) {
  return <input type="hidden" data-variant-validate="true" />;
}

/** Single variant group editor */
function GroupEditor({
  group,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: {
  group: VariantGroup;
  index: number;
  onUpdate: (updates: Partial<VariantGroup>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAddOption: () => void;
  onRemoveOption: (optIndex: number) => void;
  onUpdateOption: (optIndex: number, updates: Partial<VariantOption>) => void;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Group header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border-light)] px-4 py-3">
        <GripVertical className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">#{index + 1}</span>
        <input
          type="text"
          value={group.id}
          onChange={(e) => onUpdate({ id: e.target.value })}
          placeholder="ID gruppo (es. tipo-pelle)"
          className="h-8 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs font-mono text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none"
        />
        <input
          type="text"
          value={group.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Label (es. Tipo di Pelle)"
          className="h-8 w-40 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs font-medium text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none"
        />
        <select
          value={group.type}
          onChange={(e) => onUpdate({ type: e.target.value as VariantControlType })}
          className="h-8 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          {Object.entries(CONTROL_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <input
            type="checkbox"
            checked={group.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-[var(--color-border)]"
          />
          Obbligatorio
        </label>
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
          aria-label="Duplica gruppo"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
          aria-label="Rimuovi gruppo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Options */}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Opzioni ({group.options.length})
          </span>
          <button
            type="button"
            onClick={onAddOption}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
          >
            <Plus className="h-3 w-3" />
            Aggiungi
          </button>
        </div>

        <div className="space-y-2">
          {group.options.map((opt, optIndex) => (
            <div key={opt.value} className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-muted)]/10 p-2">
              {/* Main option row */}
              <div className="flex items-center gap-2">
                {/* Color preview for color-swatch type */}
                {group.type === "color-swatch" && (
                  <div className="relative">
                    {opt.imageUrl ? (
                      <img
                        src={opt.imageUrl}
                        alt={opt.label}
                        className="h-7 w-7 shrink-0 rounded border border-[var(--color-border)] object-cover"
                      />
                    ) : (
                      <input
                        type="color"
                        value={opt.color ?? "#000000"}
                        onChange={(e) => onUpdateOption(optIndex, { color: e.target.value })}
                        className="h-7 w-7 shrink-0 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => onUpdateOption(optIndex, { value: e.target.value })}
                  placeholder="Valore"
                  className="h-7 w-28 shrink-0 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs font-mono text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none"
                />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => onUpdateOption(optIndex, { label: e.target.value })}
                  placeholder="Label"
                  className="h-7 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)]">€</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={opt.priceModifier ?? 0}
                    onChange={(e) => onUpdateOption(optIndex, { priceModifier: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-7 w-16 shrink-0 rounded border border-[var(--color-border)] bg-transparent px-2 text-right text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveOption(optIndex)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
                  aria-label="Rimuovi opzione"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Image URL row for color-swatch type */}
              {group.type === "color-swatch" && (
                <div className="mt-1.5 flex items-center gap-2 pl-1">
                  <ImageIcon className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={opt.imageUrl ?? ""}
                    onChange={(e) => onUpdateOption(optIndex, { imageUrl: e.target.value || undefined })}
                    placeholder="/images/products/colore-nero.jpg"
                    className="h-6 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 text-[11px] font-mono text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)]/40 focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  {opt.imageUrl && (
                    <button
                      type="button"
                      onClick={() => onUpdateOption(optIndex, { imageUrl: undefined })}
                      className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
                      aria-label="Rimuovi immagine"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
