import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Layers, ChevronRight } from "lucide-react";

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
  component: VariantTemplatesListPage,
});

export default function VariantTemplatesListPage(): ReactNode {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-4 w-4 text-[var(--color-primary)]" />
            <h1 className="text-sm font-medium text-gray-900">Variant templates</h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {templates.length}
            </span>
          </div>
          <Link
            to="/admin/variant-templates/$id"
            params={{ id: "new" }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <Plus className="h-4 w-4" />
            Nuovo template
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="mx-auto max-w-5xl px-6 py-4">
        <p className="text-sm text-gray-500">
          I template definiscono gruppi di opzioni riutilizzabili (colore, tacco, taglia...).
          Una volta creati, puoi applicarli ai prodotti dal form di modifica prodotto.
          Ogni opzione può avere un'immagine associata che verrà mostrata al cliente.
        </p>
      </div>

      {/* Template list */}
      <div className="mx-auto max-w-5xl px-6 pb-12">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Layers className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">Nessun template creato</p>
            <p className="mt-1 text-xs text-gray-400">
              Crea il tuo primo template per definire le opzioni di variante dei prodotti
            </p>
            <Link
              to="/admin/variant-templates/$id"
              params={{ id: "new" }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <Plus className="h-4 w-4" />
              Crea Template
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                    <Layers className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5">{t.slug}</span>
                      <span>{t.groupCount} gruppi</span>
                      {t.description && <span className="max-w-xs truncate">{t.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/variant-templates/$id"
                    params={{ id: t.id }}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Modifica
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    disabled={deleting === t.id}
                    onClick={() => handleDelete(t.id, t.name)}
                    className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting === t.id ? "..." : "Elimina"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
