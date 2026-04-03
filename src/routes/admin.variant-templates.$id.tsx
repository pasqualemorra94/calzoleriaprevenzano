import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { VariantBuilder } from "~/components/admin/VariantBuilder";
import type { VariantConfig } from "~/lib/types/variant-config";

export const Route = createFileRoute("/admin/variant-templates/$id")({
  component: VariantTemplateEditPage,
});

export default function VariantTemplateEditPage(): ReactNode {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<VariantConfig | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing template
  useEffect(() => {
    if (isNew) return;
    async function load() {
      try {
        const res = await fetch(`/api/admin/variant-templates/${id}`);
        const json = await res.json();
        if (json.ok) {
          setName(json.data.name);
          setSlug(json.data.slug);
          setDescription(json.data.description ?? "");
          setConfig(json.data.config as VariantConfig);
        } else {
          setError("Template non trovato");
        }
      } catch {
        setError("Errore di caricamento");
      }
      setLoading(false);
    }
    load();
  }, [id, isNew]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Il nome è obbligatorio");
      return;
    }
    const finalSlug = slug.trim() || generateSlug(name.trim());
    if (!finalSlug) {
      setError("Lo slug è obbligatorio");
      return;
    }
    if (!config) {
      setError("Aggiungi almeno un gruppo di opzioni");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const body = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || null,
      config,
    };

    try {
      const url = isNew
        ? "/api/admin/variant-templates"
        : `/api/admin/variant-templates/${id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess(true);
        if (isNew) {
          router.navigate({ to: "/admin/variant-templates/$id", params: { id: json.data.id } });
        }
      } else {
        setError(json.error?.message ?? "Errore durante il salvataggio");
      }
    } catch {
      setError("Errore di rete");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link
            to="/admin/variant-templates"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-medium text-gray-900">
            {isNew ? "Nuovo Template" : "Modifica Template"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Basic info */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="space-y-4">

            <div>
              <label htmlFor="tpl-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Nome *
              </label>
              <input
                id="tpl-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(generateSlug(e.target.value));
                }}
                placeholder="es. Gioiello Samantha Colori"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="tpl-slug" className="mb-1.5 block text-sm font-medium text-gray-700">
                Slug *
              </label>
              <input
                id="tpl-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="gioiello-samantha-colori"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div>
              <label htmlFor="tpl-desc" className="mb-1.5 block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                id="tpl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Note opzionali su questo template..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
              />
            </div>
          </div>
        </div>

        {/* Variant Builder */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <VariantBuilder
            value={config}
            onChange={setConfig}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/admin/variant-templates"
            className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Annulla
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Salvato!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salva Template
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Usage hint */}
        <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Come usare questo template</p>
          <ol className="mt-1 ml-4 list-decimal space-y-0.5">
            <li>Definisci i gruppi di opzioni (colore, tacco, taglia...)</li>
            <li>Per ogni opzione colore, puoi aggiungere un URL immagine</li>
            <li>Salva il template</li>
            <li>Vai su un prodotto → sezione varianti → &quot;Applica Template&quot;</li>
            <li>Il template viene copiato sul prodotto — puoi personalizzarlo senza modificare il template</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
