/**
 * Variant Config Types — JSON-based variant builder
 *
 * The variant config is stored as JSON on Product and Category models.
 * It defines groups of options (e.g., "Tipo di Pelle", "Colore", "Tacco", "Taglia")
 * that will be rendered as interactive form controls on the product detail page.
 *
 * Example config:
 * ```json
 * {
 *   "groups": [
 *     {
 *       "id": "skin-type",
 *       "label": "Tipo di Pelle",
 *       "type": "button",
 *       "required": true,
 *       "options": [
 *         { "value": "laminato", "label": "Laminato", "priceModifier": 0 },
 *         { "value": "liscio", "label": "Liscio", "priceModifier": 0 },
 *         { "value": "pitone", "label": "Pitone", "priceModifier": 10 }
 *       ]
 *     },
 *     {
 *       "id": "tacco",
 *       "label": "Altezza Tacco",
 *       "type": "select",
 *       "required": false,
 *       "options": [
 *         { "value": "no-tacco", "label": "No tacco", "priceModifier": 0 },
 *         { "value": "tacco-2-5", "label": "+2.5 cm", "priceModifier": 10 },
 *         { "value": "tacco-5", "label": "+5 cm", "priceModifier": 10 }
 *       ]
 *     },
 *     {
 *       "id": "taglia",
 *       "label": "Taglia",
 *       "type": "button",
 *       "required": true,
 *       "options": [
 *         { "value": "36", "label": "36" },
 *         { "value": "37", "label": "37" },
 *         { "value": "38", "label": "38" },
 *         { "value": "39", "label": "39" },
 *         { "value": "40", "label": "40" },
 *         { "value": "41", "label": "41" },
 *         { "value": "42", "label": "42" }
 *       ]
 *     }
 *   ]
 * }
 * ```
 */

/** Supported variant control types */
type VariantControlType = "button" | "select" | "color-swatch";

/** A single option within a variant group */
interface VariantOption {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional hex color for color-swatch type */
  color?: string;
  /** Optional price modifier (added to base price) */
  priceModifier?: number;
}

/** A group of variant options (e.g., "Tipo di Pelle") */
interface VariantGroup {
  /** Unique group identifier */
  id: string;
  /** Display label for the group */
  label: string;
  /** Type of control to render */
  type: VariantControlType;
  /** Whether selecting an option is required */
  required: boolean;
  /** Available options */
  options: VariantOption[];
}

/** Root variant config stored in JSON */
interface VariantConfig {
  groups: VariantGroup[];
}

// ─── Zod Validation ─────────────────────────────────────────────────────

import { z } from "zod";

const VariantOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  priceModifier: z.number().min(0).optional(),
});

const VariantGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["button", "select", "color-swatch"]),
  required: z.boolean(),
  options: z.array(VariantOptionSchema).min(1),
});

const VariantConfigSchema = z.object({
  groups: z.array(VariantGroupSchema),
});

export { VariantConfigSchema };

// ─── Default Configs ────────────────────────────────────────────────────

/** Default variant config for Sandali products */
const SANDALI_VARIANT_CONFIG: VariantConfig = {
  groups: [
    {
      id: "tipo-pelle",
      label: "Tipo di Pelle",
      type: "button",
      required: true,
      options: [
        { value: "laminato", label: "Laminato" },
        { value: "liscio", label: "Liscio" },
        { value: "pitone", label: "Pitone", priceModifier: 10 },
        { value: "camoscio", label: "Camoscio" },
      ],
    },
    {
      id: "colore",
      label: "Colore",
      type: "color-swatch",
      required: true,
      options: [
        { value: "nero", label: "Nero", color: "#1a1a1a" },
        { value: "beige", label: "Beige", color: "#d4b896" },
        { value: "marrone", label: "Marrone", color: "#5c3a1e" },
        { value: "rosso", label: "Rosso", color: "#8b2020" },
        { value: "blu", label: "Blu", color: "#1e3a5f" },
        { value: "bianco", label: "Bianco", color: "#f5f0eb" },
        { value: "verde", label: "Verde", color: "#2d4a2d" },
        { value: "arancione", label: "Arancione", color: "#c4652a" },
      ],
    },
    {
      id: "tacco",
      label: "Altezza Tacco",
      type: "select",
      required: false,
      options: [
        { value: "no-tacco", label: "No tacco", priceModifier: 0 },
        { value: "tacco-2-5", label: "+2.5 cm", priceModifier: 10 },
        { value: "tacco-5", label: "+5 cm", priceModifier: 10 },
      ],
    },
    {
      id: "taglia",
      label: "Taglia",
      type: "button",
      required: true,
      options: [
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
};

/** Default variant config for Pelletteria products */
const PELLETTERIA_VARIANT_CONFIG: VariantConfig = {
  groups: [
    {
      id: "colore",
      label: "Colore",
      type: "color-swatch",
      required: true,
      options: [
        { value: "nero", label: "Nero", color: "#1a1a1a" },
        { value: "marrone", label: "Marrone", color: "#5c3a1e" },
        { value: "beige", label: "Beige", color: "#d4b896" },
        { value: "rosso", label: "Rosso", color: "#8b2020" },
        { value: "blu", label: "Blu", color: "#1e3a5f" },
      ],
    },
  ],
};

export { SANDALI_VARIANT_CONFIG, PELLETTERIA_VARIANT_CONFIG };

export type { VariantConfig, VariantGroup, VariantOption, VariantControlType };
