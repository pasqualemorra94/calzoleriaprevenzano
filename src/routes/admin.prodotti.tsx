import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Plus, Search, Loader2, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/prodotti")({
  component: AdminProductsPage,
});

/**
 * Layout wrapper: renders child route (edit page) or product list.
 * Without <Outlet />, navigating to /admin/prodotti/$id would show
 * the list instead of the edit form.
 */
function AdminProductsPage(): ReactNode {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/admin/prodotti") {
    return <Outlet />;
  }

  return <AdminProductsList />;
}

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  deletedAt: string | null;
  category: { id: string; name: string } | null;
  image: { id: string; url: string } | null;
  createdAt: string;
}

const STATUS_FILTERS = [
  { label: "Tutti", value: "all" },
  { label: "Attivi", value: "active" },
  { label: "Inattivi", value: "inactive" },
  { label: "Eliminati", value: "deleted" },
] as const;

const SORT_OPTIONS = [
  { label: "Più recenti", value: "newest" },
  { label: "Nome A-Z", value: "name" },
  { label: "Prezzo crescente", value: "price_asc" },
  { label: "Prezzo decrescente", value: "price_desc" },
] as const;

function AdminProductsList(): ReactNode {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "20",
        query,
        status,
        sort,
      });
      const res = await fetch(`/api/admin/products?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore");
      setProducts(json.data.items);
      setTotalPages(json.data.totalPages);
      setTotal(json.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, [page, query, status, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Eliminare il prodotto "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok && json.error) throw new Error(json.error.message);
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    }
  };

  const statusBadge = (product: ProductListItem) => {
    if (product.deletedAt) {
      return <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Eliminato</span>;
    }
    if (product.isActive) {
      return <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Attivo</span>;
    }
    return <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Inattivo</span>;
  };

  const inputClass = "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";
  const selectClass = "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-base font-medium text-gray-900">Gestione prodotti</h1>
        <Link
          to="/admin/prodotti/$id"
          params={{ id: "nuovo" }}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <Plus className="h-4 w-4" />
          Nuovo prodotto
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
          {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className={selectClass}>
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                <th className="px-4 py-3">Immagine</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Prezzo</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-primary)]" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">Nessun prodotto trovato</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      {product.image ? (
                        <img src={product.image.url} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">—</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{product.category?.name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">€{product.price.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">{product.stock}</td>
                    <td className="whitespace-nowrap px-4 py-3">{statusBadge(product)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/prodotti/$id"
                          params={{ id: product.id }}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 px-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifica
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-red-300 px-2.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">{total} prodotti</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedente
              </button>
              <span className="flex items-center px-3 text-sm text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Successiva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
