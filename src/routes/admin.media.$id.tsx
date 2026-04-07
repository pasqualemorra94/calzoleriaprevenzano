import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft, Save, Trash2, Loader2, AlertCircle, CheckCircle,
  ImageIcon, HardDrive, Calendar, User, FileText,
} from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/admin/ConfirmDialog";

export const Route = createFileRoute("/admin/media/$id")({
  component: AdminMediaDetailPage,
});

// ─── Types ──────────────────────────────────────────────────────────

interface MediaDetail {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  folder: string;
  url: string;
  createdAt: string;
  uploadedById: string | null;
  uploadedByName: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ──────────────────────────────────────────────────────

function AdminMediaDetailPage(): ReactNode {
  const { id } = Route.useParams();

  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editable fields
  const [alt, setAlt] = useState("");
  const [folder, setFolder] = useState("");
  const [originalName, setOriginalName] = useState("");

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/${id}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Media non trovato");
      const m = json.data as MediaDetail;
      setMedia(m);
      setAlt(m.alt ?? "");
      setFolder(m.folder);
      setOriginalName(m.originalName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: alt || null, folder: folder || null, originalName }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore durante il salvataggio");
      setMedia(json.data);
      setSuccess("Salvato con successo");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (res.status === 204 || res.ok) {
        toast.success("File eliminato");
        window.history.back();
      } else {
        const json = await res.json();
        toast.error(json.error?.message ?? "Errore durante l'eliminazione");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    }
  };

  const handleCopyUrl = async () => {
    if (!media) return;
    try {
      await navigator.clipboard.writeText(media.url);
    } catch {
      const el = document.createElement("textarea");
      el.value = media.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (error && !media) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/media"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!media) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/media"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Link>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Dettaglio media</span>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4">
              <img
                src={media.url}
                alt={media.alt ?? media.originalName}
                className="max-h-[500px] max-w-full rounded-md object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right: Details & Edit */}
        <div className="space-y-6">
          {/* File info */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900" title={media.originalName}>
                    {media.originalName}
                  </p>
                  <p className="text-xs text-gray-400">{media.mimeType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={<HardDrive className="h-4 w-4" />} label="Dimensione" value={formatFileSize(media.size)} />
                {media.width && media.height && (
                  <InfoItem icon={<ImageIcon className="h-4 w-4" />} label="Risoluzione" value={`${media.width} × ${media.height}`} />
                )}
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Caricato" value={new Date(media.createdAt).toLocaleDateString("it-IT")} />
                {media.uploadedByName && (
                  <InfoItem icon={<User className="h-4 w-4" />} label="Da" value={media.uploadedByName} />
                )}
              </div>

              {/* URL */}
              <div>
                <label className="mb-1 block text-xs font-medium tracking-wider text-gray-500">URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    {media.url}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={cn(
                      "shrink-0 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                      copied
                        ? "border-green-200 bg-green-50 text-green-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {copied ? "Copiato!" : "Copia"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500">
              <FileText className="h-4 w-4" />
              MODIFICA
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="originalName" className="mb-1 block text-xs font-medium text-gray-500">Nome file</label>
                <input
                  id="originalName"
                  value={originalName}
                  onChange={(e) => setOriginalName(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="alt" className="mb-1 block text-xs font-medium text-gray-500">Testo alternativo</label>
                <textarea
                  id="alt"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Descrizione dell'immagine per accessibilità..."
                />
              </div>
              <div>
                <label htmlFor="folder" className="mb-1 block text-xs font-medium text-gray-500">Cartella</label>
                <input
                  id="folder"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder='es. "prodotti", "categorie"'
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salva
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Elimina file"
          message="Eliminare questo file dalla libreria media?"
          confirmLabel="Elimina"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}

// ─── Info item ──────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }): ReactNode {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-[10px] font-medium tracking-wider text-gray-400">{label.toUpperCase()}</p>
        <p className="text-sm text-gray-700">{value}</p>
      </div>
    </div>
  );
}
