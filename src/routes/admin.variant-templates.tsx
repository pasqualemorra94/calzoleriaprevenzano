import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Layers, ChevronRight, Search } from "lucide-react";

interface TemplateListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  groupCount: number;
  isActive: boolean;
  createdAt: string;
}

export const Route = createFileRoute("/admin/variant-templates")({
  component: VariantTemplatesPage,
});

/**
 * Layout wrapper: renders child route (edit page) or template list.
 * Without <Outlet />, navigating to /admin/variant-templates/$id
 * would show the list instead of the edit form.
 */
export default function VariantTemplatesPage(): ReactNode {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/admin/variant-templates") {
    return <Outlet />;
  }

  return <VariantTemplatesList />;
}

function VariantTemplatesList(): ReactNode {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/variant-templates");
      const json = await res.json();
      if (json.ok) setTemplates(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare il template "${name}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/variant-templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    );
  }, [templates, search]);

  return (
    <div className="space-y-4">
      {/* Toolbar: title + search + create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Variant templates
          <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {filteredTemplates.length}
          </span>
        </span>

        <div className="flex items-center gap-2">
          {/* Search filter */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca template..."
              className="h-8 w-52 rounded-md border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
              aria-label="Filtra template per nome, slug o descrizione"
            />
          </div>

          {/* Create button */}
          <Link
            to="/admin/variant-templates/$id"
            params={{ id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo
          </Link>
        </div>
      </div>

      {/* Info hint */}
      <p className="text-[11px] leading-relaxed text-gray-500">
        I template definiscono gruppi di opzioni riutilizzabili (colore, tacco, taglia…).
        Una volta creati, puoi applicarli ai prodotti dal form di modifica prodotto.
      </p>

      {/* Template list */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Nessun template creato</p>
          <p className="mt-1 text-xs text-gray-400">
            Crea il tuo primo template per definire le opzioni di variante dei prodotti
          </p>
          <Link
            to="/admin/variant-templates/$id"
            params={{ id: "new" }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Crea Template
          </Link>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <Search className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          <p className="text-xs text-gray-500">
            Nessun template corrisponde a &ldquo;{search}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-2 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
          >
            Resetta filtro
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                  <Layers className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">{t.slug}</span>
                    <span>{t.groupCount} gruppi</span>
                    {t.description && (
                      <span className="max-w-[200px] truncate">{t.description}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Link
                  to="/admin/variant-templates/$id"
                  params={{ id: t.id }}
                  className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Edit className="h-3 w-3" />
                  Modifica
                  <ChevronRight className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  disabled={deleting === t.id}
                  onClick={() => handleDelete(t.id, t.name)}
                  className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {deleting === t.id ? "…" : "Elimina"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
