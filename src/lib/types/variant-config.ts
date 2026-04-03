/**
 * Variant Config Types — JSON-based variant builder with conditional support
 *
 * The variant config is stored as JSON on Product and Category models.
 * It defines groups of options (e.g., "Tipo di Pelle", "Colore", "Tacco", "Taglia")
 * that will be rendered as interactive form controls on the product detail page.
 *
 * Supports CONDITIONAL VISIBILITY: a group can depend on another group's
 * selected value via `dependsOn`. Example: "Colore Pelle Classica" depends on
 * "Tipo di Pelle" = "classica".
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
 *         { "value": "classica", "label": "Classica" },
 *         { "value": "camoscio", "label": "Camoscio" },
 *         { "value": "pitonato", "label": "Pitonato" },
 *         { "value": "laminato", "label": "Laminato" }
 *       ]
 *     },
 *     {
 *       "id": "colore-classica",
 *       "label": "Pelle Classica",
 *       "type": "color-swatch",
 *       "required": true,
 *       "dependsOn": { "groupId": "skin-type", "optionValue": "classica" },
 *       "options": [
 *         { "value": "viola", "label": "Viola", "color": "#6a1b6d", "imageUrl": "/images/swatches/Viola_pelle-quadrata.jpg" },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 * }
 * ```
 */

/** Supported variant control types */
type VariantControlType = "button" | "select" | "color-swatch";

/** Conditional visibility rule — show this group only when parent has a specific value */
interface VariantDependsOn {
  /** ID of the parent group this depends on */
  groupId: string;
  /** Value of the parent option that triggers visibility */
  optionValue: string;
}

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
  /** Optional image URL — product photo for this specific variant */
  imageUrl?: string;
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
  /** Optional conditional visibility — show only when parent matches */
  dependsOn?: VariantDependsOn;
}

/** Root variant config stored in JSON */
interface VariantConfig {
  groups: VariantGroup[];
}

// ─── Zod Validation ─────────────────────────────────────────────────────

import { z } from "zod";

const VariantDependsOnSchema = z.object({
  groupId: z.string().min(1),
  optionValue: z.string().min(1),
});

const VariantOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  priceModifier: z.number().min(0).optional(),
  imageUrl: z.string().min(1).optional(),
});

const VariantGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["button", "select", "color-swatch"]),
  required: z.boolean(),
  options: z.array(VariantOptionSchema).min(1),
  dependsOn: VariantDependsOnSchema.optional(),
});

const VariantConfigSchema = z.object({
  groups: z.array(VariantGroupSchema),
});

export { VariantConfigSchema, VariantGroupSchema, VariantOptionSchema, VariantDependsOnSchema };

export type { VariantConfig, VariantGroup, VariantOption, VariantControlType, VariantDependsOn };
