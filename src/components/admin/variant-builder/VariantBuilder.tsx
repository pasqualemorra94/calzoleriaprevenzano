"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import type { VariantConfig, VariantGroup, VariantOption } from "~/lib/types/variant-config";
import { PRESETS } from "./presets";
import { GroupEditor } from "./GroupEditor";

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

  const moveGroup = useCallback((groupIndex: number, direction: -1 | 1) => {
    const target = groupIndex + direction;
    if (target < 0 || target >= groups.length) return;
    const reordered = [...groups];
    [reordered[groupIndex], reordered[target]] = [reordered[target], reordered[groupIndex]];
    onChange({ groups: reordered });
  }, [groups, onChange]);

  const moveOption = useCallback((groupId: string, optIndex: number, direction: -1 | 1) => {
    onChange({
      groups: groups.map((g) => {
        if (g.id !== groupId) return g;
        const target = optIndex + direction;
        if (target < 0 || target >= g.options.length) return g;
        const opts = [...g.options];
        [opts[optIndex], opts[target]] = [opts[target], opts[optIndex]];
        return { ...g, options: opts };
      }),
    });
  }, [groups, onChange]);

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
            isFirst={groupIndex === 0}
            isLast={groupIndex === groups.length - 1}
            onUpdate={(updates) => updateGroup(group.id, updates)}
            onRemove={() => removeGroup(group.id)}
            onDuplicate={() => duplicateGroup(group)}
            onMoveUp={() => moveGroup(groupIndex, -1)}
            onMoveDown={() => moveGroup(groupIndex, 1)}
            onAddOption={() => addOption(group.id)}
            onRemoveOption={(optIdx) => removeOption(group.id, optIdx)}
            onUpdateOption={(optIdx, updates) => updateOption(group.id, optIdx, updates)}
            onMoveOption={(optIdx, dir) => moveOption(group.id, optIdx, dir)}
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

    </div>
  );
}
