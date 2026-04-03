import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { MediaPicker } from "~/components/admin/MediaPicker";
import type { SelectedMedia } from "~/components/admin/MediaPicker";
import type { VariantConfig } from "~/lib/types/variant-config";
import {
  VariantSection,
  ImageGalleryManager,
  VariantConfigSection,
  ProductBasicInfo,
  ProductPricingSidebar,
  emptyForm,
  emptyVariant,
  emptyImage,
} from "~/components/admin/product-edit";
import type { ProductForm, CategoryItem, FieldErrors } from "~/components/admin/product-edit";

export const Route = createFileRoute("/admin/prodotti/$id")({
  component: AdminProductEditPage,
});

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
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryTemplateApplied, setCategoryTemplateApplied] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // ── Fetchers ──

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

      const mappedVariants = (p.variants ?? []).map((v: {
        id: string; name: string; color: string | null; size: string | null;
        price: number | null; stock: number; sku: string | null; isActive: boolean; sortOrder: number;
      }) => {
        const [group, ...labelParts] = v.name.split(" - ");
        return {
          id: v.id, optionGroup: group || "",
          optionLabel: labelParts.join(" - ") || v.name,
          color: v.color ?? "", priceModifier: v.price ? Number(v.price) : 0,
          stock: v.stock, sku: v.sku ?? "", isActive: v.isActive, sortOrder: v.sortOrder,
        };
      });

      const mappedImages = (p.images ?? []).map((img: {
        id: string; url: string; alt: string | null; sortOrder: number; mediaId: string | null;
      }) => ({
        id: img.id, url: img.url, alt: img.alt ?? "", sortOrder: img.sortOrder, mediaId: img.mediaId,
      }));

      setForm({
        name: p.name, slug: p.slug,
        description: p.description ?? "", shortDescription: p.shortDescription ?? "",
        price: String(p.price), compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
        sku: p.sku ?? "", stock: String(p.stock),
        weight: p.weight ? String(p.weight) : "", materials: p.materials ?? "",
        categoryId: p.categoryId ?? "", isActive: p.isActive, isFeatured: p.isFeatured,
        variants: mappedVariants, images: mappedImages,
        variantConfig: p.variantConfig ? JSON.stringify(p.variantConfig, null, 2) : null,
      });

      const initialGroups = new Set<string>();
      for (const v of mappedVariants) initialGroups.add(v.optionGroup || "Generale");
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
            ? JSON.parse(json.data.variantConfig) : json.data.variantConfig;
          if (catConfig?.groups?.length > 0) {
            updateField("variantConfig", JSON.stringify(catConfig, null, 2));
            setCategoryTemplateApplied(true);
          }
        }
      } catch { /* ignore */ }
    })();
  }, [isNew, form.categoryId, categoryTemplateApplied, form.variantConfig]);

  // ── Form handlers ──

  const updateField = (key: keyof ProductForm, value: ProductForm[keyof ProductForm]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && isNew && typeof value === "string") {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return next;
    });
    if (key === "name" || key === "description" || key === "price") {
      setTouched((prev) => new Set(prev).add(key));
    }
  };

  const updateVariant = (index: number, field: keyof typeof emptyVariant, value: string | number | boolean) =>
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });

  const addVariant = (group?: string) => {
    const newV = { ...emptyVariant, optionGroup: group ?? "", sortOrder: form.variants.length };
    setForm((prev) => ({ ...prev, variants: [...prev.variants, newV] }));
    if (group) setExpandedGroups((prev) => new Set(prev).add(group));
  };

  const removeVariant = (index: number) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));

  const addImage = () =>
    setForm((prev) => ({ ...prev, images: [...prev.images, { ...emptyImage, sortOrder: prev.images.length }] }));

  const addImagesFromMedia = (selected: SelectedMedia[]) =>
    setForm((prev) => {
      const startOrder = prev.images.length;
      const newImages = selected.map((m, i) => ({
        id: undefined, url: m.url, alt: m.alt ?? m.originalName,
        sortOrder: startOrder + i, mediaId: m.id,
      }));
      return { ...prev, images: [...prev.images, ...newImages] };
    });

  const updateImage = (index: number, field: keyof typeof emptyImage, value: string | number) =>
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, images };
    });

  const removeImage = (index: number) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const moveImage = (index: number, direction: -1 | 1) =>
    setForm((prev) => {
      const images = [...prev.images];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= images.length) return prev;
      const temp = images[index];
      images[index] = images[targetIndex];
      images[targetIndex] = temp;
      return { ...prev, images: images.map((img, i) => ({ ...img, sortOrder: i })) };
    });

  const toggleGroup = (group: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/variant-templates/${templateId}`);
      const json = await res.json();
      if (json.ok && json.data?.config) {
        const incoming: VariantConfig = typeof json.data.config === "string"
          ? JSON.parse(json.data.config) : json.data.config;
        const existing: VariantConfig = parsedVariantConfig ?? { groups: [] };
        const existingGroupIds = new Map<string, number>();
        for (let i = 0; i < existing.groups.length; i++) existingGroupIds.set(existing.groups[i].id, i);
        const merged = [...existing.groups];
        for (const group of incoming.groups) {
          const idx = existingGroupIds.get(group.id);
          if (idx !== undefined) merged[idx] = group; else merged.push(group);
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
    if (!validateForm()) { setError("Compila tutti i campi obbligatori"); return; }

    setSaving(true);
    try {
      const variantsPayload = form.variants.map((v) => ({
        name: v.optionGroup ? `${v.optionGroup} - ${v.optionLabel}` : v.optionLabel,
        color: v.color || null,
        size: v.optionGroup.toLowerCase() === "taglia" ? v.optionLabel : null,
        price: v.priceModifier || null, stock: v.stock, sku: v.sku || null,
        isActive: v.isActive, sortOrder: v.sortOrder,
      }));

      const imagesPayload = form.images
        .filter((img) => img.url.trim())
        .map((img) => ({ url: img.url, alt: img.alt || null, sortOrder: img.sortOrder, mediaId: img.mediaId || null }));

      const body = {
        name: form.name, slug: form.slug, description: form.description, shortDescription: form.shortDescription,
        price: parseFloat(form.price), compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        sku: form.sku || null, stock: parseInt(form.stock, 10), weight: form.weight ? parseFloat(form.weight) : null,
        materials: form.materials || null, categoryId: form.categoryId || null,
        isActive: form.isActive, isFeatured: form.isFeatured,
        variants: variantsPayload, images: imagesPayload,
        variantConfig: form.variantConfig ? JSON.parse(form.variantConfig) : null,
      };

      let res: Response;
      if (isNew) {
        res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        res = await fetch(`/api/admin/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  // ── Helpers ──

  const inputClass = (field: keyof FieldErrors) =>
    cn(
      "w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-1",
      touched.has(field) && fieldErrors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
        : "border-gray-200 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]",
    );

  const labelClass = "block text-xs font-medium tracking-wider text-gray-500";

  // ── Render ──

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
        <Link to="/admin/prodotti" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Link>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          {isNew ? "Nuovo prodotto" : "Modifica prodotto"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />{success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ProductBasicInfo
              form={form} touched={touched} fieldErrors={fieldErrors}
              inputClass={inputClass} labelClass={labelClass} updateField={updateField}
            />
            <VariantSection
              callbacks={{
                form, updateField, updateVariant, addVariant, removeVariant,
                updateImage, removeImage, moveImage, addImagesFromMedia,
                expandedGroups, toggleGroup, touched, fieldErrors,
              }}
            />
            <VariantConfigSection
              parsedVariantConfig={parsedVariantConfig}
              templates={templates}
              onUpdateVariantConfig={(json) => updateField("variantConfig", json)}
              onApplyTemplate={handleApplyTemplate}
              onClearConfig={() => updateField("variantConfig", null)}
            />
            <ImageGalleryManager
              onAddImage={addImage}
              onMediaPickerOpen={() => setMediaPickerOpen(true)}
              callbacks={{
                form, updateField, updateVariant, addVariant, removeVariant,
                updateImage, removeImage, moveImage, addImagesFromMedia,
                expandedGroups, toggleGroup, touched, fieldErrors,
              }}
            />
          </div>

          <ProductPricingSidebar
            form={form} categories={categories}
            inputClass={inputClass} labelClass={labelClass} updateField={updateField}
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Salva
          </button>
          <Link to="/admin/prodotti" className="inline-flex h-10 items-center rounded-md border border-gray-300 px-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Annulla
          </Link>
        </div>

        <MediaPicker
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={addImagesFromMedia}
          multiple={true}
          maxSelections={20}
        />
      </form>
    </div>
  );
}
