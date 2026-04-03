import type { ReactNode } from "react";
import type { ProductForm, CategoryItem } from "./types";

interface ProductBasicInfoProps {
  form: ProductForm;
  touched: Set<string>;
  fieldErrors: { name?: boolean; description?: boolean; price?: boolean };
  inputClass: (field: "name" | "description" | "price") => string;
  labelClass: string;
  updateField: (key: keyof ProductForm, value: ProductForm[keyof ProductForm]) => void;
}

export function ProductBasicInfo({
  form, touched, fieldErrors, inputClass, labelClass, updateField,
}: ProductBasicInfoProps): ReactNode {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={`block text-xs font-medium tracking-wider text-gray-500 ${touched.has("name") && fieldErrors.name ? "text-red-600" : ""}`}>
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
            <p className="mt-1 text-xs text-gray-400">Modificabile manualmente</p>
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
            <label htmlFor="description" className={`block text-xs font-medium tracking-wider text-gray-500 ${touched.has("description") && fieldErrors.description ? "text-red-600" : ""}`}>
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
    </div>
  );
}

interface ProductPricingSidebarProps {
  form: ProductForm;
  categories: CategoryItem[];
  inputClass: (field: "name" | "description" | "price") => string;
  labelClass: string;
  updateField: (key: keyof ProductForm, value: ProductForm[keyof ProductForm]) => void;
}

export function ProductPricingSidebar({
  form, categories, inputClass, labelClass, updateField,
}: ProductPricingSidebarProps): ReactNode {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-[var(--color-text)]">
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
              className={`cursor-pointer ${inputClass("price")}`}
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
        <PricePreview form={form} />
      )}
    </div>
  );
}

function PricePreview({ form }: { form: ProductForm }): ReactNode {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
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
  );
}
