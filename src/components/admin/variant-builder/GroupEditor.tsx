import { useState, useCallback } from "react";
import {
  Plus, Trash2, GripVertical, Copy,
  ImageIcon, X, ChevronDown, ChevronUp, ChevronRight, FolderOpen,
} from "lucide-react";
import type { VariantGroup, VariantOption, VariantControlType } from "~/lib/types/variant-config";
import { CONTROL_TYPE_LABELS } from "./presets";
import { MediaPicker } from "~/components/admin/MediaPicker";
import type { SelectedMedia } from "~/components/admin/MediaPicker";

interface GroupEditorProps {
  group: VariantGroup;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updates: Partial<VariantGroup>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddOption: () => void;
  onRemoveOption: (optIndex: number) => void;
  onUpdateOption: (optIndex: number, updates: Partial<VariantOption>) => void;
  onMoveOption: (optIndex: number, direction: -1 | 1) => void;
}

export function GroupEditor({
  group,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onMoveOption,
}: GroupEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<number | null>(null);

  const handleMediaSelect = useCallback((items: SelectedMedia[]) => {
    if (mediaPickerTarget === null || items.length === 0) {
      setMediaPickerTarget(null);
      return;
    }
    const selected = items[0];
    onUpdateOption(mediaPickerTarget, { imageUrl: selected.url });
    setMediaPickerTarget(null);
  }, [mediaPickerTarget, onUpdateOption]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Group header — clickable to collapse */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-3 border-b border-[var(--color-border-light)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-muted)]/20"
      >
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[var(--color-text-muted)] active:cursor-grabbing" />
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
        )}
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">#{index + 1}</span>
        <span className="flex-1 truncate text-sm font-semibold text-[var(--color-text)]">{group.label || "Gruppo senza nome"}</span>
        <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
          {group.options.length} opzioni
        </span>
        <span className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
          {group.type}
        </span>
      </button>

      {/* Collapsible body */}
      {!collapsed && (
        <>
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-light)] px-4 py-2">
            <input
              type="text"
              value={group.id}
              onChange={(e) => onUpdate({ id: e.target.value })}
              placeholder="ID gruppo"
              className="h-7 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs font-mono text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            <input
              type="text"
              value={group.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Label"
              className="h-7 w-32 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            <select
              value={group.type}
              onChange={(e) => onUpdate({ type: e.target.value as VariantControlType })}
              className="h-7 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {Object.entries(CONTROL_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <input type="checkbox" checked={group.required} onChange={(e) => onUpdate({ required: e.target.checked })} className="h-3 w-3 rounded" />
              Obblig.
            </label>
            {/* Reorder buttons */}
            <button type="button" onClick={onMoveUp} disabled={isFirst} className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] disabled:opacity-20" title="Sposta su" aria-label="Sposta gruppo su">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={isLast} className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] disabled:opacity-20" title="Sposta giù" aria-label="Sposta gruppo giù">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onDuplicate} className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" title="Duplica" aria-label="Duplica gruppo">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onRemove} className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]" title="Elimina" aria-label="Elimina gruppo">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-[var(--color-text-muted)]">Opzioni ({group.options.length})</span>
              <button type="button" onClick={onAddOption} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
                <Plus className="h-3 w-3" /> Aggiungi
              </button>
            </div>

            <div className="space-y-2">
              {group.options.map((opt, optIndex) => (
                <div key={opt.value} className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-muted)]/10 p-2">
                  {/* Main option row */}
                  <div className="flex items-center gap-2">
                    {group.type === "color-swatch" && (
                      <div className="relative">
                        {opt.imageUrl ? (
                          <img src={opt.imageUrl} alt={opt.label} className="h-7 w-7 shrink-0 rounded border border-[var(--color-border)] object-cover" />
                        ) : (
                          <input type="color" value={opt.color ?? "#000000"} onChange={(e) => onUpdateOption(optIndex, { color: e.target.value })} className="h-7 w-7 shrink-0 cursor-pointer rounded border border-[var(--color-border)]" />
                        )}
                      </div>
                    )}
                    <input type="text" value={opt.value} onChange={(e) => onUpdateOption(optIndex, { value: e.target.value })} placeholder="Valore" className="h-7 w-28 shrink-0 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs font-mono text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none" />
                    <input type="text" value={opt.label} onChange={(e) => onUpdateOption(optIndex, { label: e.target.value })} placeholder="Label" className="h-7 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--color-text-muted)]">€</span>
                      <input type="number" min={0} step={0.01} value={opt.priceModifier ?? 0} onChange={(e) => onUpdateOption(optIndex, { priceModifier: parseFloat(e.target.value) || 0 })} className="h-7 w-16 shrink-0 rounded border border-[var(--color-border)] bg-transparent px-2 text-right text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    {/* Option reorder */}
                    <button type="button" onClick={() => onMoveOption(optIndex, -1)} disabled={optIndex === 0} className="rounded p-0.5 text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] disabled:opacity-20" title="Sposta su" aria-label="Sposta opzione su">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => onMoveOption(optIndex, 1)} disabled={optIndex === group.options.length - 1} className="rounded p-0.5 text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] disabled:opacity-20" title="Sposta giù" aria-label="Sposta opzione giù">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => onRemoveOption(optIndex)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]" aria-label="Rimuovi opzione">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {/* Image URL — available for all option types */}
                  <div className="mt-1.5 flex items-center gap-2 pl-1">
                    <ImageIcon className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
                    <input type="text" value={opt.imageUrl ?? ""} onChange={(e) => onUpdateOption(optIndex, { imageUrl: e.target.value || undefined })} placeholder="/images/products/foto-opzione.jpg" className="h-6 flex-1 rounded border border-[var(--color-border)] bg-transparent px-2 text-[11px] font-mono text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none" />
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget(optIndex)}
                      className="inline-flex h-6 items-center gap-1 rounded border border-[var(--color-border)] px-1.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      title="Scegli dalla libreria"
                      aria-label="Scegli immagine dalla libreria"
                    >
                      <FolderOpen className="h-3 w-3" />
                    </button>
                    {opt.imageUrl && (
                      <button type="button" onClick={() => onUpdateOption(optIndex, { imageUrl: undefined })} className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]" aria-label="Rimuovi immagine">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Media Picker for swatch image selection */}
      <MediaPicker
        open={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        multiple={false}
        maxSelections={1}
      />
    </div>
  );
}
