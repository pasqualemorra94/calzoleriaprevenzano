import type { VariantConfig, VariantControlType } from "~/lib/types/variant-config";

export const CONTROL_TYPE_LABELS: Record<VariantControlType, string> = {
  button: "Pulsanti",
  select: "Menu a tendina",
  "color-swatch": "Swatches colore",
};

export const PRESETS: Array<{ label: string; config: VariantConfig }> = [
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
