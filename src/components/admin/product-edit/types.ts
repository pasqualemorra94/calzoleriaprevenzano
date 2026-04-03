import type { SelectedMedia } from "~/components/admin/MediaPicker";

export interface CategoryItem {
  id: string;
  name: string;
}

export interface ProductVariantForm {
  id?: string;
  optionGroup: string;
  optionLabel: string;
  color: string;
  priceModifier: number;
  stock: number;
  sku: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductImageForm {
  id?: string;
  url: string;
  alt: string;
  sortOrder: number;
  mediaId: string | null;
}

export interface ProductForm {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stock: string;
  weight: string;
  materials: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  variants: ProductVariantForm[];
  images: ProductImageForm[];
  variantConfig: string | null;
}

export interface FieldErrors {
  name?: boolean;
  description?: boolean;
  price?: boolean;
}

export const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: "",
  compareAtPrice: "",
  sku: "",
  stock: "0",
  weight: "",
  materials: "",
  categoryId: "",
  isActive: true,
  isFeatured: false,
  variants: [],
  images: [],
  variantConfig: null,
};

export const emptyVariant: ProductVariantForm = {
  optionGroup: "",
  optionLabel: "",
  color: "",
  priceModifier: 0,
  stock: 0,
  sku: "",
  isActive: true,
  sortOrder: 0,
};

export const emptyImage: ProductImageForm = {
  url: "",
  alt: "",
  sortOrder: 0,
  mediaId: null,
};

export const OPTION_GROUP_LABELS: Record<string, string> = {
  tacco: "Tacco",
  colore: "Colore",
  taglia: "Taglia",
  materiale: "Materiale",
  suola: "Suola",
  chiusura: "Chiusura",
};

export function getOptionGroupLabel(group: string): string {
  return OPTION_GROUP_LABELS[group.toLowerCase()] ?? group;
}

export function groupVariantsByOptionType(variants: ProductVariantForm[]): Record<string, ProductVariantForm[]> {
  const groups: Record<string, ProductVariantForm[]> = {};
  for (const v of variants) {
    const key = v.optionGroup || "Generale";
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  }
  return groups;
}

export interface ProductEditCallbacks {
  form: ProductForm;
  updateField: (key: keyof ProductForm, value: ProductForm[keyof ProductForm]) => void;
  updateVariant: (index: number, field: keyof ProductVariantForm, value: string | number | boolean) => void;
  addVariant: (group?: string) => void;
  removeVariant: (index: number) => void;
  updateImage: (index: number, field: keyof ProductImageForm, value: string | number) => void;
  removeImage: (index: number) => void;
  moveImage: (index: number, direction: -1 | 1) => void;
  addImagesFromMedia: (selected: SelectedMedia[]) => void;
  expandedGroups: Set<string>;
  toggleGroup: (group: string) => void;
  touched: Set<string>;
  fieldErrors: FieldErrors;
}
