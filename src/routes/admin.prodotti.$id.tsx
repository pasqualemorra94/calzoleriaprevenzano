import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { ArrowLeft, Loader2, Save, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/prodotti/$id")({
  component: AdminProductEditPage,
});

interface CategoryItem {
  id: string;
  name: string;
}

interface ProductVariant {
  id?: string;
  name: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
  isActive: boolean;
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
  variants: ProductVariant[];
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
};

const emptyVariant: ProductVariant = {
  name: "",
  color: "",
  size: "",
  price: 0,
  stock: 0,
  sku: "",
  isActive: true,
  sortOrder: 0,
};

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.ok) setCategories(json.data);
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
        variants: p.variants ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [fetchCategories, fetchProduct]);

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
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => setForm((prev) => ({ ...prev, variants: [...prev.variants, { ...emptyVariant }] }));
  const removeVariant = (index: number) => setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.description.trim() || !form.price) {
      setError("Nome, descrizione e prezzo sono obbligatori");
      return;
    }

    setSaving(true);
    try {
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
        variants: form.variants,
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
      setTimeout(() => navigate({ to: "/admin/prodotti" }), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";
  const labelClass = "block text-sm font-medium text-gray-700";

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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Informazioni Prodotto</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClass}>Nome *</label>
                  <input id="name" type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="slug" className={labelClass}>Slug</label>
                  <input id="slug" type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="shortDescription" className={labelClass}>Descrizione breve</label>
                  <textarea id="shortDescription" value={form.shortDescription} onChange={(e) => updateField("shortDescription", e.target.value)} maxLength={500} rows={2} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="description" className={labelClass}>Descrizione completa *</label>
                  <textarea id="description" value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={6} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="materials" className={labelClass}>Materiali</label>
                  <input id="materials" type="text" value={form.materials} onChange={(e) => updateField("materials", e.target.value)} className={inputClass} placeholder="es. Pelle di vitello, cuoio" />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Varianti</h2>
              {form.variants.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <th className="pb-2 pr-2">Nome</th>
                        <th className="pb-2 pr-2">Colore</th>
                        <th className="pb-2 pr-2">Taglia</th>
                        <th className="pb-2 pr-2">Prezzo</th>
                        <th className="pb-2 pr-2">Stock</th>
                        <th className="pb-2 pr-2">SKU</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.variants.map((v, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-2"><input value={v.name} onChange={(e) => updateVariant(i, "name", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                          <td className="py-2 pr-2"><input value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                          <td className="py-2 pr-2"><input value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                          <td className="py-2 pr-2"><input type="number" step="0.01" value={v.price} onChange={(e) => updateVariant(i, "price", parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                          <td className="py-2 pr-2"><input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value, 10) || 0)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                          <td className="py-2 pr-2"><input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeVariant(i)} className="rounded p-1 text-red-500 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button type="button" onClick={addVariant} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <Plus className="h-4 w-4" />
                Aggiungi variante
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Prezzo e Stock</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="price" className={labelClass}>Prezzo (€) *</label>
                  <input id="price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => updateField("price", e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="compareAtPrice" className={labelClass}>Prezzo barrato (€)</label>
                  <input id="compareAtPrice" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={(e) => updateField("compareAtPrice", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="stock" className={labelClass}>Stock</label>
                  <input id="stock" type="number" min="0" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Dettagli</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sku" className={labelClass}>SKU</label>
                  <input id="sku" type="text" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="weight" className={labelClass}>Peso (kg)</label>
                  <input id="weight" type="number" step="0.01" min="0" value={form.weight} onChange={(e) => updateField("weight", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="categoryId" className={labelClass}>Categoria</label>
                  <select id="categoryId" value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} className={inputClass}>
                    <option value="">Nessuna categoria</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Attivo</label>
                </div>
                <div className="flex items-center gap-3">
                  <input id="isFeatured" type="checkbox" checked={form.isFeatured} onChange={(e) => updateField("isFeatured", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">In evidenza</label>
                </div>
              </div>
            </div>
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
