/**
 * VariantSelector — Sandal customization selector.
 *
 * Reads the product's variantConfig JSON and renders
 * interactive option groups (color, heel, leather, etc.)
 * for the selected sandal.
 */

interface VariantSelectorProps {
  variantConfig: unknown;
  onOptionChange: (groupId: string, optionId: string, optionLabel: string, optionColor?: string) => void;
  selectedOptions: Record<string, { id: string; label: string; color?: string }>;
}

interface VariantGroup {
  id: string;
  label: string;
  type: "color" | "radio" | "toggle";
  options: Array<{
    id: string;
    label: string;
    value: string;
    color?: string;
    imageUrl?: string;
    modifier?: number;
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">🛠️ Personalizza il Sandalo</h3>
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 text-sm font-medium text-gray-700">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isSelected = selectedOptions[group.id]?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onOptionChange(group.id, option.id, option.label, option.color)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {group.type === "color" && option.color && (
                    <span
                      className="h-5 w-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                  {option.modifier ? (
                    <span className="ml-1 text-xs text-gray-400">
                      {option.modifier > 0 ? `+€${option.modifier}` : `-€${Math.abs(option.modifier)}`}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
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

  return groups.map((g) => ({
    id: String(g.id ?? ""),
    label: String(g.label ?? ""),
    type: (g.type === "color" ? "color" : g.type === "toggle" ? "toggle" : "radio") as VariantGroup["type"],
    options: Array.isArray(g.options)
      ? g.options.map((o: Record<string, unknown>) => ({
          id: String(o.id ?? ""),
          label: String(o.label ?? ""),
          value: String(o.value ?? ""),
          color: typeof o.color === "string" ? o.color : undefined,
          imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : undefined,
          modifier: typeof o.modifier === "number" ? o.modifier : undefined,
        }))
      : [],
  }));
}
