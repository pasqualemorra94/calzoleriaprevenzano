import type { ReactNode } from "react";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  type ProductEditCallbacks,
  type ProductVariantForm,
  getOptionGroupLabel,
  OPTION_GROUP_LABELS,
} from "./types";

interface VariantSectionProps {
  callbacks: ProductEditCallbacks;
}

export function VariantSection({ callbacks }: VariantSectionProps): ReactNode {
  const {
    form, updateVariant, addVariant, removeVariant,
    expandedGroups, toggleGroup,
  } = callbacks;

  const variantGroups = groupVariantsByOptionType(form.variants);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-end">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {form.variants.length} opzioni
        </span>
      </div>

      {Object.keys(variantGroups).length > 0 && (
        <div className="space-y-3">
          {Object.entries(variantGroups).map(([groupName, variants]) => {
            const isExpanded = expandedGroups.has(groupName);
            return (
              <VariantGroupCard
                key={groupName}
                groupName={groupName}
                variants={variants}
                allVariants={form.variants}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(groupName)}
                onUpdateVariant={updateVariant}
                onRemoveVariant={removeVariant}
                onAddVariant={() => addVariant(groupName)}
              />
            );
          })}
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-medium text-gray-500 tracking-wider">Nuovo gruppo di opzioni</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(OPTION_GROUP_LABELS)
            .filter(([key]) => !(key.toLowerCase() in variantGroups))
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => addVariant(key)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Plus className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          <button
            type="button"
            onClick={() => addVariant("")}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Altro...
          </button>
        </div>
      </div>
    </div>
  );
}

function groupVariantsByOptionType(variants: ProductVariantForm[]): Record<string, ProductVariantForm[]> {
  const groups: Record<string, ProductVariantForm[]> = {};
  for (const v of variants) {
    const key = v.optionGroup || "Generale";
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  }
  return groups;
}

interface VariantGroupCardProps {
  groupName: string;
  variants: ProductVariantForm[];
  allVariants: ProductVariantForm[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateVariant: (index: number, field: keyof ProductVariantForm, value: string | number | boolean) => void;
  onRemoveVariant: (index: number) => void;
  onAddVariant: () => void;
}

function VariantGroupCard({
  groupName, variants, allVariants, isExpanded,
  onToggle, onUpdateVariant, onRemoveVariant, onAddVariant,
}: VariantGroupCardProps): ReactNode {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {getOptionGroupLabel(groupName)}
          </span>
          <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
            {variants.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="space-y-3">
            {variants.map((v) => (
              <VariantRow
                key={v.id ?? `${v.optionGroup}-${v.optionLabel}`}
                variant={v}
                groupName={groupName}
                allVariants={allVariants}
                onUpdate={onUpdateVariant}
                onRemove={onRemoveVariant}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onAddVariant}
            className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Plus className="h-3 w-3" />
            Aggiungi opzione a &quot;{getOptionGroupLabel(groupName)}&quot;
          </button>
        </div>
      )}
    </div>
  );
}

interface VariantRowProps {
  variant: ProductVariantForm;
  groupName: string;
  allVariants: ProductVariantForm[];
  onUpdate: (index: number, field: keyof ProductVariantForm, value: string | number | boolean) => void;
  onRemove: (index: number) => void;
}

function VariantRow({ variant, groupName, allVariants, onUpdate, onRemove }: VariantRowProps): ReactNode {
  const globalIndex = allVariants.indexOf(variant);
  const isColorGroup = groupName.toLowerCase() === "colore";

  return (
    <div className="flex items-start gap-2 rounded-md bg-white p-3 shadow-sm">
      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_80px_80px_80px]">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Etichetta</label>
          <input
            value={variant.optionLabel}
            onChange={(e) => onUpdate(globalIndex, "optionLabel", e.target.value)}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            placeholder={isColorGroup ? "es. Nero" : "es. Standard"}
          />
        </div>
        {isColorGroup && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Codice colore</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={variant.color || "#000000"}
                onChange={(e) => onUpdate(globalIndex, "color", e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-gray-200"
              />
              <input
                value={variant.color}
                onChange={(e) => onUpdate(globalIndex, "color", e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="#000000"
              />
            </div>
          </div>
        )}
        {!isColorGroup && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Prezzo mod.</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {variant.priceModifier >= 0 ? "+" : ""}
              </span>
              <input
                type="number"
                step="0.01"
                value={variant.priceModifier || ""}
                onChange={(e) => onUpdate(globalIndex, "priceModifier", parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-200 py-1.5 pl-6 pr-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="0.00"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">EUR</span>
            </div>
          </div>
        )}
        {isColorGroup && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Prezzo mod.</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {variant.priceModifier >= 0 ? "+" : ""}
              </span>
              <input
                type="number"
                step="0.01"
                value={variant.priceModifier || ""}
                onChange={(e) => onUpdate(globalIndex, "priceModifier", parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-gray-200 py-1.5 pl-6 pr-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="0.00"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">EUR</span>
            </div>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Stock</label>
          <input
            type="number"
            value={variant.stock}
            onChange={(e) => onUpdate(globalIndex, "stock", parseInt(e.target.value, 10) || 0)}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            min="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">SKU</label>
          <input
            value={variant.sku}
            onChange={(e) => onUpdate(globalIndex, "sku", e.target.value)}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            placeholder="OPZ-001"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(globalIndex)}
        className="mt-5 rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
