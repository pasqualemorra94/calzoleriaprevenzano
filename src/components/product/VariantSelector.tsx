import type { ReactNode } from "react";
import { useState, useCallback, useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { Check, ChevronRight, ChevronDown, Minus, Plus, ShoppingBag, Loader2, ZoomIn, X } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import type { VariantConfig } from "~/lib/types/variant-config";

export interface ProductVariant {
  id: string;
  name: string;
  color: string | null;
  size: string | null;
  price: number | null;
  stock: number;
  sku: string | null;
}

export interface OptionGroup {
  type: string;
  label: string;
  options: Array<{
    id: string;
    label: string;
    color: string | null;
    priceModifier: number;
    stock: number;
    imageUrl: string | null;
  }>;
  dependsOn?: { groupId: string; optionValue: string };
}

interface VariantSelectorProps {
  visibleGroups: OptionGroup[];
  selectedOptions: Map<string, string>;
  collapsedGroups: Set<string>;
  parsedConfig: VariantConfig | null;
  allVisibleGroupsSelected: boolean;
  effectiveStock: number;
  priceBreakdown: { base: number; optionsTotal: number; total: number };
  quantity: number;
  cartStatus: "idle" | "loading" | "success";
  canAddToCart: boolean;
  onSelectOption: (groupType: string, optionId: string) => void;
  onToggleCollapse: (groupType: string) => void;
  onSetQuantity: (q: number) => number;
  onAddToCart: () => void;
  customerNote: string;
  onSetCustomerNote: (note: string) => void;
}

export function VariantSelector({
  visibleGroups, selectedOptions, collapsedGroups, parsedConfig,
  effectiveStock, priceBreakdown, quantity, cartStatus, canAddToCart,
  onSelectOption, onToggleCollapse, onSetQuantity, onAddToCart,
  customerNote, onSetCustomerNote,
}: VariantSelectorProps): ReactNode {
  return (
    <>
      <div className="mt-4 space-y-1">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <m.p
              key={priceBreakdown.total}
              className="text-base font-semibold text-[var(--color-primary)]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              EUR {priceBreakdown.total.toFixed(2)}
            </m.p>
          </AnimatePresence>
        </div>
        {priceBreakdown.optionsTotal > 0 && (
          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-0.5 overflow-hidden">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <span>Prezzo base: EUR {priceBreakdown.base.toFixed(2)}</span>
            </div>
          </m.div>
        )}
      </div>

      <div className="mt-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          effectiveStock === 0 ? "text-[var(--color-destructive)] bg-red-50"
            : effectiveStock <= 3 ? "text-amber-700 bg-amber-50" : "text-green-700 bg-green-50")}>
          <span className={cn("h-1.5 w-1.5 rounded-full",
            effectiveStock === 0 ? "bg-red-500" : effectiveStock <= 3 ? "bg-amber-500" : "bg-green-500")} />
          {effectiveStock === 0 ? "Esaurito" : effectiveStock <= 3 ? `Ultimi ${effectiveStock} pezzi` : "Disponibile"}
        </span>
      </div>

      {visibleGroups.length > 0 && (
        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <AnimatePresence key={group.type} mode="wait">
              <m.div key={group.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <button type="button" onClick={() => onToggleCollapse(group.type)} className="mb-2.5 flex w-full items-center gap-2 text-left">
                  {collapsedGroups.has(group.type) ? (
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                  )}
                  <span className="text-sm font-medium text-[var(--color-text)]">{group.label}</span>
                  {selectedOptions.get(group.type) && (
                    <span className="text-xs font-normal text-[var(--color-text-muted)]">
                      — {group.options.find((o) => o.id === selectedOptions.get(group.type))?.label}
                    </span>
                  )}
                </button>
                {!collapsedGroups.has(group.type) && (
                  <OptionGroupControl
                    group={group}
                    selectedId={selectedOptions.get(group.type)}
                    parsedConfig={parsedConfig}
                    onSelect={(id) => onSelectOption(group.type, id)}
                  />
                )}
              </m.div>
            </AnimatePresence>
          ))}
        </div>
      )}

      {parsedConfig && (
        <div>
          <label htmlFor="customer-note" className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
            Note personalizzazione
            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">(opzionale)</span>
          </label>
          <textarea
            id="customer-note" value={customerNote} onChange={(e) => onSetCustomerNote(e.target.value)}
            placeholder="Es: misura cm, colore specifico, incisione..." rows={2} maxLength={500}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
          />
          {customerNote.length > 0 && (
            <span className="mt-1 block text-right text-[11px] text-[var(--color-text-muted)]">{customerNote.length}/500</span>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)]">
          <button type="button" onClick={() => onSetQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1 || effectiveStock === 0}
            className="flex h-12 w-12 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40" aria-label="Diminuisci quantità">
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex h-12 w-12 items-center justify-center text-sm font-semibold text-[var(--color-text)]">{quantity}</span>
          <button type="button" onClick={() => onSetQuantity(Math.min(10, quantity + 1))} disabled={quantity >= 10 || effectiveStock === 0}
            className="flex h-12 w-12 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40" aria-label="Aumenta quantità">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {effectiveStock === 0 ? (
          <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-8 text-sm font-medium text-[var(--color-destructive)]">
            Non disponibile al momento
          </div>
        ) : (
          <button type="button" disabled={!canAddToCart || cartStatus === "loading"} onClick={onAddToCart}
            className={cn("inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 text-sm font-medium transition-all duration-[var(--transition-base)] disabled:cursor-not-allowed disabled:opacity-60",
              cartStatus === "success" ? "bg-green-600 text-white" : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:shadow-lg")}>
            {cartStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : cartStatus === "success" ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            {cartStatus === "success" ? "Aggiunto!" : "Aggiungi al carrello"}
          </button>
        )}
      </div>
    </>
  );
}


function OptionGroupControl({ group, selectedId, parsedConfig, onSelect }: {
  group: OptionGroup;
  selectedId: string | undefined;
  parsedConfig: VariantConfig | null;
  onSelect: (id: string) => void;
}): ReactNode {
  const configGroup = parsedConfig?.groups.find((g) => g.id === group.type);
  const controlType = configGroup?.type ?? (group.options.length > 8 ? "select" : "button");

  if (controlType === "select") {
    return (
      <select value={selectedId ?? ""} onChange={(e) => onSelect(e.target.value)}
        className="h-10 w-full max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors focus:border-[var(--color-primary)] focus:outline-none">
        {!selectedId && <option value="">Seleziona...</option>}
        {group.options.map((opt) => (
          <option key={opt.id} value={opt.id} disabled={opt.stock === 0}>
            {opt.label}{opt.priceModifier > 0 ? ` (+EUR ${opt.priceModifier.toFixed(2)})` : ""}
          </option>
        ))}
      </select>
    );
  }

  if (controlType === "color-swatch") {
    return (
      <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8">
        {group.options.map((opt) => (
          <SwatchWithZoom
            key={opt.id}
            option={opt}
            isSelected={selectedId === opt.id}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {group.options.map((opt) => (
        <button key={opt.id} type="button" onClick={() => onSelect(opt.id)} disabled={opt.stock === 0}
          className={cn("flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm font-medium transition-all duration-200",
            selectedId === opt.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]",
            opt.stock === 0 && "cursor-not-allowed opacity-40")}>
          {opt.color && <span className="inline-block h-4 w-4 rounded-full border border-[var(--color-border)]" style={{ backgroundColor: opt.color }} />}
          <span>{opt.label}</span>
          {opt.priceModifier > 0 && (
            <span className={cn("text-xs font-semibold", selectedId === opt.id ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]")}>
              +€{opt.priceModifier.toFixed(2)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Swatch with Zoom Modal ──

function SwatchZoomModal({ imageUrl, label, onClose }: { imageUrl: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <m.div
          className="relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-2xl">
            <img
              src={imageUrl}
              alt={label}
              className="max-h-[80vh] max-w-[85vw] object-contain"
            />
          </div>
          <span className="rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4 text-[var(--color-text)]" />
          </button>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}

function SwatchWithZoom({ option, isSelected, onSelect }: {
  option: OptionGroup["options"][number];
  isSelected: boolean;
  onSelect: () => void;
}): ReactNode {
  const [zoomOpen, setZoomOpen] = useState(false);
  const hasImage = !!option.imageUrl;

  const handleZoomClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasImage) setZoomOpen(true);
  }, [hasImage]);

  return (
    <>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group/color flex flex-col items-center gap-1.5 transition-all duration-200",
          isSelected && "scale-[1.02]",
          option.stock === 0 && "cursor-not-allowed opacity-40",
        )}
        title={option.label + (option.priceModifier > 0 ? ` (+EUR ${option.priceModifier.toFixed(2)})` : "")}
        aria-label={option.label}
        aria-pressed={isSelected}
      >
        <span className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] transition-all duration-200",
          isSelected
            ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)] shadow-md"
            : "ring-1 ring-[var(--color-border)] hover:ring-[var(--color-primary)]/50 hover:shadow-sm",
        )}>
          {option.imageUrl ? (
            <img
              src={option.imageUrl}
              alt={option.label}
              className="h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <span className="absolute inset-1 rounded-full" style={{ backgroundColor: option.color ?? "#ccc" }} />
          )}
          {isSelected && (
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary)]/25">
              <Check className="h-5 w-5 text-white drop-shadow-lg" />
            </span>
          )}
          {hasImage && (
            <button
              type="button"
              onClick={handleZoomClick}
              className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover/color:opacity-100 hover:bg-black/70"
              aria-label={`Ingrandisci ${option.label}`}
            >
              <ZoomIn className="h-3 w-3 text-white" />
            </button>
          )}
        </span>
        <span className={cn("w-full truncate text-center text-[11px] leading-tight transition-colors",
          isSelected ? "font-semibold text-[var(--color-primary)]" : "text-[var(--color-text-secondary)]")}>
          {option.label}
        </span>
        {option.priceModifier > 0 && <span className="text-[10px] font-medium text-[var(--color-text-muted)]">+€{option.priceModifier.toFixed(0)}</span>}
      </button>

      {zoomOpen && option.imageUrl && (
        <SwatchZoomModal
          imageUrl={option.imageUrl}
          label={option.label}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </>
  );
}
