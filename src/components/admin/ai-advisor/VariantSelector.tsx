/**
 * VariantSelector — Sandal customization selector.
 *
 * Reads the product's variantConfig JSON and renders
 * interactive option groups (color-swatch, button, radio).
 *
 * Supports:
 *  - "color-swatch" type: round image swatches (click to select one)
 *  - "button" type: pill buttons with label + image
 *  - "radio" type: pill buttons with label only
 */

interface VariantSelectorProps {
  variantConfig: unknown;
  onOptionChange: (groupId: string, optionId: string, optionLabel: string, optionColor?: string) => void;
  selectedOptions: Record<string, { id: string; label: string; color?: string }>;
}

interface VariantGroup {
  id: string;
  label: string;
  type: "color-swatch" | "button" | "radio";
  required: boolean;
  options: Array<{
    id: string;
    label: string;
    value: string;
    color?: string;
    imageUrl?: string;
    priceModifier?: number;
  }>;
}

export function VariantSelector({ variantConfig, onOptionChange, selectedOptions }: VariantSelectorProps) {
  const groups = parseVariantConfig(variantConfig);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
        Questo sandalo non ha opzioni di personalizzazione
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">🛠️ Personalizza il Sandalo</h3>
      {groups.map((group) => (
        <div key={group.id}>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-medium text-gray-700">{group.label}</p>
            {group.required && <span className="text-[10px] text-red-400">*</span>}
            {selectedOptions[group.id] && (
              <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                {selectedOptions[group.id].label}
              </span>
            )}
          </div>

          {/* Color swatch type — round image buttons */}
          {group.type === "color-swatch" ? (
            <div className="flex flex-wrap gap-3">
              {group.options.map((option) => {
                const isSelected = selectedOptions[group.id]?.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOptionChange(group.id, option.id, option.label, option.imageUrl);
                    }}
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={isSelected}
                    className={`group relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 transition ${
                      isSelected
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {option.imageUrl ? (
                      <img
                        src={option.imageUrl}
                        alt={option.label}
                        className="h-full w-full object-cover"
                      />
                    ) : option.color ? (
                      <span
                        className="block h-full w-full rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        ?
                      </span>
                    )}
                    {/* Label tooltip */}
                    <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                      {option.label}
                      {option.priceModifier ? ` (${option.priceModifier > 0 ? "+" : ""}€${option.priceModifier})` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Button / Radio type — pill buttons */
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedOptions[group.id]?.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOptionChange(group.id, option.id, option.label, option.imageUrl);
                    }}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt=""
                        className="h-6 w-6 rounded object-cover"
                      />
                    )}
                    <span>{option.label}</span>
                    {option.priceModifier ? (
                      <span className="ml-1 text-xs text-gray-400">
                        {option.priceModifier > 0 ? `+€${option.priceModifier}` : `-€${Math.abs(option.priceModifier)}`}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function parseVariantConfig(config: unknown): VariantGroup[] {
  if (!config || typeof config !== "object") return [];
  const cfg = config as Record<string, unknown>;
  const groups = cfg.groups;

  if (!Array.isArray(groups)) return [];

  return groups.map((g: Record<string, unknown>) => {
    const rawType = String(g.type ?? "radio");
    // Normalize: "color-swatch" → "color-swatch", "button" → "button", else → "radio"
    const type: VariantGroup["type"] =
      rawType === "color-swatch" ? "color-swatch" :
      rawType === "button" ? "button" : "radio";

    return {
      id: String(g.id ?? ""),
      label: String(g.label ?? ""),
      type,
      required: g.required === true,
      options: Array.isArray(g.options)
        ? g.options.map((o: Record<string, unknown>) => ({
            id: String(o.id ?? ""),
            label: String(o.label ?? ""),
            value: String(o.value ?? ""),
            color: typeof o.color === "string" ? o.color : undefined,
            imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : undefined,
            priceModifier: typeof o.priceModifier === "number" ? o.priceModifier : undefined,
          }))
        : [],
    };
  });
}
