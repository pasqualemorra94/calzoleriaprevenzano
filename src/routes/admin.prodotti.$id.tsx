import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, GripVertical,
  ImageIcon, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Layers, Download,
} from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { VariantBuilder } from "~/components/admin/VariantBuilder";
import type { VariantConfig } from "~/lib/types/variant-config";

export const Route = createFileRoute("/admin/prodotti/$id")({
  component: AdminProductEditPage,
});

interface CategoryItem {
  id: string;
  name: string;
}

interface ProductVariantForm {
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

interface ProductImageForm {
  id?: string;
  url: string;
  alt: string;
  sortOrder: number;
}

interface ProductForm {
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

interface FieldErrors {
  name?: boolean;
  description?: boolean;
  price?: boolean;
}

const emptyForm: ProductForm = {
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

const emptyVariant: ProductVariantForm = {
  optionGroup: "",
  optionLabel: "",
  color: "",
  priceModifier: 0,
  stock: 0,
  sku: "",
  isActive: true,
  sortOrder: 0,
};

const emptyImage: ProductImageForm = {
  url: "",
  alt: "",
  sortOrder: 0,
};

const OPTION_GROUP_LABELS: Record<string, string> = {
  tacco: "Tacco",
  colore: "Colore",
  taglia: "Taglia",
  materiale: "Materiale",
  suola: "Suola",
  chiusura: "Chiusura",
};

function getOptionGroupLabel(group: string): string {
  return OPTION_GROUP_LABELS[group.toLowerCase()] ?? group;
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

function AdminProductEditPage(): ReactNode {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "nuovo";

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string | null }>>([]);
  const [categoryTemplateApplied, setCategoryTemplateApplied] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.ok) setCategories(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/variant-templates");
      const json = await res.json();
      if (json.ok) setTemplates(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Prodotto non trovato");
      const p = json.data;

      const mappedVariants: ProductVariantForm[] = (p.variants ?? []).map((v: {
        id: string; name: string; color: string | null; size: string | null;
        price: number | null; stock: number; sku: string | null; isActive: boolean; sortOrder: number;
      }) => {
        const [group, ...labelParts] = v.name.split(" - ");
        return {
          id: v.id,
          optionGroup: group || "",
          optionLabel: labelParts.join(" - ") || v.name,
          color: v.color ?? "",
          priceModifier: v.price ? Number(v.price) : 0,
          stock: v.stock,
          sku: v.sku ?? "",
          isActive: v.isActive,
          sortOrder: v.sortOrder,
        };
      });

      const mappedImages: ProductImageForm[] = (p.images ?? []).map((img: {
        id: string; url: string; alt: string | null; sortOrder: number;
      }) => ({
        id: img.id,
        url: img.url,
        alt: img.alt ?? "",
        sortOrder: img.sortOrder,
      }));

      setForm({
        name: p.name,
        slug: p.slug,
        description: p.description ?? "",
        shortDescription: p.shortDescription ?? "",
        price: String(p.price),
        compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
        sku: p.sku ?? "",
        stock: String(p.stock),
        weight: p.weight ? String(p.weight) : "",
        materials: p.materials ?? "",
        categoryId: p.categoryId ?? "",
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        variants: mappedVariants,
        images: mappedImages,
        variantConfig: p.variantConfig ? JSON.stringify(p.variantConfig, null, 2) : null,
      });

      const initialGroups = new Set<string>();
      for (const v of mappedVariants) {
        initialGroups.add(v.optionGroup || "Generale");
      }
      setExpandedGroups(initialGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchCategories();
    fetchProduct();
    fetchTemplates();
  }, [fetchCategories, fetchProduct, fetchTemplates]);

  const parsedVariantConfig = form.variantConfig ? (() => {
    try { return JSON.parse(form.variantConfig) as VariantConfig; }
    catch { return null; }
  })() : null;

  // Auto-apply category template when category changes on new product
  useEffect(() => {
    if (!isNew || !form.categoryId || categoryTemplateApplied || form.variantConfig) return;

    (async () => {
      try {
        const res = await fetch(`/api/admin/categories/${form.categoryId}`);
        const json = await res.json();
        if (json.ok && json.data?.variantConfig) {
          const catConfig = typeof json.data.variantConfig === "string"
            ? JSON.parse(json.data.variantConfig)
            : json.data.variantConfig;
          if (catConfig?.groups?.length > 0) {
            updateField("variantConfig", JSON.stringify(catConfig, null, 2));
            setCategoryTemplateApplied(true);
          }
        }
      } catch { /* ignore */ }
    })();
  }, [isNew, form.categoryId, categoryTemplateApplied, form.variantConfig]);

  const updateField = (key: keyof ProductForm, value: ProductForm[keyof ProductForm]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && isNew && typeof value === "string") {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
    if (key === "name" || key === "description" || key === "price") {
      setTouched((prev) => new Set(prev).add(key));
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariantForm, value: string | number | boolean) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = (group?: string) => {
    const newVariant = { ...emptyVariant, optionGroup: group ?? "", sortOrder: form.variants.length };
    setForm((prev) => ({ ...prev, variants: [...prev.variants, newVariant] }));
    if (group) {
      setExpandedGroups((prev) => new Set(prev).add(group));
    }
  };

  const removeVariant = (index: number) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));

  const addImage = () =>
    setForm((prev) => ({ ...prev, images: [...prev.images, { ...emptyImage, sortOrder: prev.images.length }] }));

  const updateImage = (index: number, field: keyof ProductImageForm, value: string | number) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, images };
    });
  };

  const removeImage = (index: number) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const images = [...prev.images];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= images.length) return prev;
      const temp = images[index];
      images[index] = images[targetIndex];
      images[targetIndex] = temp;
      return { ...prev, images: images.map((img, i) => ({ ...img, sortOrder: i })) };
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/variant-templates/${templateId}`);
      const json = await res.json();
      if (json.ok && json.data?.config) {
        const incoming: VariantConfig = typeof json.data.config === "string"
          ? JSON.parse(json.data.config)
          : json.data.config;

        // Merge: combine existing groups with template groups
        const existing: VariantConfig = parsedVariantConfig ?? { groups: [] };
        const existingGroupIds = new Map<string, number>();
        for (let i = 0; i < existing.groups.length; i++) {
          existingGroupIds.set(existing.groups[i].id, i);
        }

        const merged = [...existing.groups];
        for (const group of incoming.groups) {
          const idx = existingGroupIds.get(group.id);
          if (idx !== undefined) {
            // Replace existing group with same ID
            merged[idx] = group;
          } else {
            // Append new group
            merged.push(group);
          }
        }

        updateField("variantConfig", JSON.stringify({ groups: merged }, null, 2));
      }
    } catch { /* ignore */ }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = true;
    if (!form.description.trim()) errors.description = true;
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) errors.price = true;
    setFieldErrors(errors);
    setTouched(new Set(["name", "description", "price"]));
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setError("Compila tutti i campi obbligatori");
      return;
    }

    setSaving(true);
    try {
      const variantsPayload = form.variants.map((v) => ({
        name: v.optionGroup ? `${v.optionGroup} - ${v.optionLabel}` : v.optionLabel,
        color: v.color || null,
        size: v.optionGroup.toLowerCase() === "taglia" ? v.optionLabel : null,
        price: v.priceModifier || null,
        stock: v.stock,
        sku: v.sku || null,
        isActive: v.isActive,
        sortOrder: v.sortOrder,
      }));

      const imagesPayload = form.images
        .filter((img) => img.url.trim())
        .map((img) => ({
          url: img.url,
          alt: img.alt || null,
          sortOrder: img.sortOrder,
        }));

      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        shortDescription: form.shortDescription,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        sku: form.sku || null,
        stock: parseInt(form.stock, 10),
        weight: form.weight ? parseFloat(form.weight) : null,
        materials: form.materials || null,
        categoryId: form.categoryId || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        variants: variantsPayload,
        images: imagesPayload,
        variantConfig: form.variantConfig ? JSON.parse(form.variantConfig) : null,
      };

      let res: Response;
      if (isNew) {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore durante il salvataggio");

      setSuccess("Prodotto salvato con successo");
      setTimeout(() => navigate({ to: "/admin/prodotti" }), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field: keyof FieldErrors) =>
    cn(
      "w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-1",
      touched.has(field) && fieldErrors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
        : "border-gray-200 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]",
    );

  const labelClass = "block text-xs font-medium uppercase tracking-wider text-gray-500";

  const sectionTitle = "text-sm font-semibold text-gray-900";

  const variantGroups = groupVariantsByOptionType(form.variants);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/prodotti"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? "Nuovo Prodotto" : "Modifica Prodotto"}</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Informazioni Prodotto</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={cn(labelClass, touched.has("name") && fieldErrors.name && "text-red-600")}>
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass("name")}
                    placeholder="es. Mocassino Artigianale in Pelle"
                  />
                  {touched.has("name") && fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-500">Il nome è obbligatorio</p>
                  )}
                </div>
                <div>
                  <label htmlFor="slug" className={labelClass}>Slug</label>
                  <input id="slug" type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className={inputClass("price")} />
                  {isNew && (
                    <p className="mt-1 text-xs text-gray-400">Generato automaticamente dal nome</p>
                  )}
                </div>
                <div>
                  <label htmlFor="shortDescription" className={labelClass}>Descrizione breve</label>
                  <textarea
                    id="shortDescription"
                    value={form.shortDescription}
                    onChange={(e) => updateField("shortDescription", e.target.value)}
                    maxLength={500}
                    rows={2}
                    className={inputClass("price")}
                    placeholder="Riassunto in 1-2 frasi per i listing e i social"
                  />
                </div>
                <div>
                  <label htmlFor="description" className={cn(labelClass, touched.has("description") && fieldErrors.description && "text-red-600")}>
                    Descrizione completa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={6}
                    className={inputClass("description")}
                    placeholder="Descrizione dettagliata del prodotto, materiali, lavorazione..."
                  />
                  {touched.has("description") && fieldErrors.description && (
                    <p className="mt-1 text-xs text-red-500">La descrizione è obbligatoria</p>
                  )}
                </div>
                <div>
                  <label htmlFor="materials" className={labelClass}>Materiali</label>
                  <input
                    id="materials"
                    type="text"
                    value={form.materials}
                    onChange={(e) => updateField("materials", e.target.value)}
                    className={inputClass("price")}
                    placeholder="es. Pelle di vitello, cuoio"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className={sectionTitle}>Varianti e Opzioni</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {form.variants.length} opzioni
                </span>
              </div>

              {Object.keys(variantGroups).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(variantGroups).map(([groupName, variants]) => {
                    const isExpanded = expandedGroups.has(groupName);
                    return (
                      <div key={groupName} className="rounded-lg border border-gray-200 bg-gray-50/50">
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupName)}
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
                              {variants.map((v, vi) => (
                                <div key={vi} className="flex items-start gap-2 rounded-md bg-white p-3 shadow-sm">
                                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_80px_80px_80px]">
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-gray-500">Etichetta</label>
                                      <input
                                        value={v.optionLabel}
                                        onChange={(e) => {
                                          const globalIndex = form.variants.indexOf(v);
                                          updateVariant(globalIndex, "optionLabel", e.target.value);
                                        }}
                                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                        placeholder={groupName.toLowerCase() === "colore" ? "es. Nero" : "es. Standard"}
                                      />
                                    </div>
                                    {groupName.toLowerCase() === "colore" && (
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Codice colore</label>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="color"
                                            value={v.color || "#000000"}
                                            onChange={(e) => {
                                              const globalIndex = form.variants.indexOf(v);
                                              updateVariant(globalIndex, "color", e.target.value);
                                            }}
                                            className="h-8 w-10 cursor-pointer rounded border border-gray-200"
                                          />
                                          <input
                                            value={v.color}
                                            onChange={(e) => {
                                              const globalIndex = form.variants.indexOf(v);
                                              updateVariant(globalIndex, "color", e.target.value);
                                            }}
                                            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                            placeholder="#000000"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {groupName.toLowerCase() !== "colore" && (
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Prezzo mod.</label>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                            {v.priceModifier >= 0 ? "+" : ""}
                                          </span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={v.priceModifier || ""}
                                            onChange={(e) => {
                                              const globalIndex = form.variants.indexOf(v);
                                              updateVariant(globalIndex, "priceModifier", parseFloat(e.target.value) || 0);
                                            }}
                                            className="w-full rounded border border-gray-200 py-1.5 pl-6 pr-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                            placeholder="0.00"
                                          />
                                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">EUR</span>
                                        </div>
                                      </div>
                                    )}
                                    {groupName.toLowerCase() === "colore" && (
                                      <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-500">Prezzo mod.</label>
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                            {v.priceModifier >= 0 ? "+" : ""}
                                          </span>
                                          <input
                                            type="number"
                                            step="0.01"
                                            value={v.priceModifier || ""}
                                            onChange={(e) => {
                                              const globalIndex = form.variants.indexOf(v);
                                              updateVariant(globalIndex, "priceModifier", parseFloat(e.target.value) || 0);
                                            }}
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
                                        value={v.stock}
                                        onChange={(e) => {
                                          const globalIndex = form.variants.indexOf(v);
                                          updateVariant(globalIndex, "stock", parseInt(e.target.value, 10) || 0);
                                        }}
                                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-gray-500">SKU</label>
                                      <input
                                        value={v.sku}
                                        onChange={(e) => {
                                          const globalIndex = form.variants.indexOf(v);
                                          updateVariant(globalIndex, "sku", e.target.value);
                                        }}
                                        className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                        placeholder="OPZ-001"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const globalIndex = form.variants.indexOf(v);
                                      removeVariant(globalIndex);
                                    }}
                                    className="mt-5 rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => addVariant(groupName)}
                              className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            >
                              <Plus className="h-3 w-3" />
                              Aggiungi opzione a &quot;{getOptionGroupLabel(groupName)}&quot;
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Nuovo gruppo di opzioni</p>
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

            {/* ─── Configurazione Varianti (JSON Builder) ─── */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[var(--color-primary)]" />
                  <h2 className={sectionTitle}>Configurazione Varianti</h2>
                  {parsedVariantConfig && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {parsedVariantConfig.groups.length} gruppi
                    </span>
                  )}
                </div>
                {templates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-[var(--color-text-muted)]" />
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleApplyTemplate(e.target.value);
                        e.target.value = "";
                      }}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                    >
                      <option value="" disabled>Aggiungi Template...</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Rimuovere tutte le opzioni varianti?")) {
                          updateField("variantConfig", null);
                        }
                      }}
                      className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" />
                      Pulisci
                    </button>
                  </div>
                )}
              </div>

              <p className="mb-4 text-xs text-[var(--color-text-muted)]">
                Usa il builder visivo per definire gruppi di opzioni (colore, tacco, taglia...).
                Le opzioni di tipo "Swatches colore" mostreranno la foto del prodotto dentro ogni swatch.
                Selezionando un template dal menu, i suoi gruppi vengono <strong>aggiunti</strong> a quelli esistenti
                (gruppi con lo stesso ID vengono aggiornati). Il pulsante "Pulisci" rimuove tutto.
              </p>

              <VariantBuilder
                value={parsedVariantConfig}
                onChange={(config) => updateField("variantConfig", config ? JSON.stringify(config, null, 2) : null)}
              />
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className={sectionTitle}>Immagini</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {form.images.length} immagini
                </span>
              </div>

              {form.images.length > 0 && (
                <div className="space-y-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-white border border-gray-200">
                        {img.url ? (
                          <img
                            src={img.url}
                            alt={img.alt || "Anteprima"}
                            className="h-full w-full rounded-md object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <input
                          value={img.url}
                          onChange={(e) => updateImage(i, "url", e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          placeholder="URL immagine (es. /images/prodotto-1.jpg)"
                        />
                        <input
                          value={img.alt}
                          onChange={(e) => updateImage(i, "alt", e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                          placeholder="Testo alternativo (alt text)"
                        />
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          disabled={i === 0}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
                          title="Sposta su"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          disabled={i === form.images.length - 1}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
                          title="Sposta giù"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Rimuovi immagine"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addImage}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                <Plus className="h-4 w-4" />
                Aggiungi immagine
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Prezzo e Stock</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="price" className={cn(labelClass, touched.has("price") && fieldErrors.price && "text-red-600")}>
                    Prezzo base (EUR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className={inputClass("price")}
                    placeholder="0.00"
                  />
                  {touched.has("price") && fieldErrors.price && (
                    <p className="mt-1 text-xs text-red-500">Il prezzo è obbligatorio e deve essere positivo</p>
                  )}
                </div>
                <div>
                  <label htmlFor="compareAtPrice" className={labelClass}>Prezzo barrato (EUR)</label>
                  <input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compareAtPrice}
                    onChange={(e) => updateField("compareAtPrice", e.target.value)}
                    className={inputClass("price")}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="stock" className={labelClass}>Stock</label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => updateField("stock", e.target.value)}
                    className={inputClass("price")}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className={sectionTitle}>Dettagli</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sku" className={labelClass}>SKU</label>
                  <input id="sku" type="text" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} className={inputClass("price")} />
                </div>
                <div>
                  <label htmlFor="weight" className={labelClass}>Peso (kg)</label>
                  <input id="weight" type="number" step="0.01" min="0" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} className={inputClass("price")} />
                </div>
                <div>
                  <label htmlFor="categoryId" className={labelClass}>Categoria</label>
                  <select
                    id="categoryId"
                    value={form.categoryId}
                    onChange={(e) => updateField("categoryId", e.target.value)}
                    className={cn(inputClass("price"), "cursor-pointer")}
                  >
                    <option value="">Nessuna categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Attivo</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="isFeatured"
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => updateField("isFeatured", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">In evidenza</label>
                </div>
              </div>
            </div>

            {form.variants.length > 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className={sectionTitle}>Riepilogo Prezzi</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Prezzo base</span>
                    <span className="font-medium text-gray-900">EUR {parseFloat(form.price || "0").toFixed(2)}</span>
                  </div>
                  {form.variants
                    .filter((v) => v.priceModifier > 0)
                    .map((v, i) => (
                      <div key={i} className="flex items-center justify-between text-gray-500">
                        <span>{v.optionGroup} - {v.optionLabel}</span>
                        <span className="font-medium text-[var(--color-primary)]">
                          +EUR {v.priceModifier.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {form.variants.some((v) => v.priceModifier > 0) && (
                    <>
                      <div className="border-t border-gray-200 pt-2" />
                      <div className="flex items-center justify-between font-semibold text-gray-900">
                        <span>Prezzo max con opzioni</span>
                        <span>
                          EUR {(parseFloat(form.price || "0") + Math.max(...form.variants.map((v) => v.priceModifier))).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Salva
          </button>
          <Link
            to="/admin/prodotti"
            className="inline-flex h-10 items-center rounded-md border border-gray-300 px-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
