import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import {
  Upload, Search, Grid3X3, List, Trash2, Copy, Eye,
  Image as ImageIcon, Loader2, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "~/lib/utils/cn";

export const Route = createFileRoute("/admin/media")({
  component: AdminMediaPage,
});

// ─── Types ──────────────────────────────────────────────────────────

interface MediaItem {
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
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  totalImages: number;
  folders: Array<{ name: string; count: number }>;
}

interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: MediaStats;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Component ──────────────────────────────────────────────────────

function AdminMediaPage(): ReactNode {
  const [data, setData] = useState<MediaListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const fetchMedia = useCallback(async (p: number, q: string, folder: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), perPage: "40", type: "image" });
      if (q) params.set("query", q);
      if (folder) params.set("folder", folder);
      const res = await fetch(`/api/admin/media?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore di caricamento");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia(page, searchQuery, activeFolder);
  }, [page, searchQuery, activeFolder, fetchMedia]);

  // ── Upload handling ──

  const handleUpload = async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
      if (activeFolder) formData.set("folder", activeFolder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore durante l'upload");

      // Refresh the list
      await fetchMedia(1, searchQuery, activeFolder);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Drag and drop ──

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // ── Delete ──

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questo file dalla libreria media?")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok && res.status !== 204) throw new Error(json.error?.message ?? "Errore");
      await fetchMedia(page, searchQuery, activeFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    }
  };

  // ── Copy URL ──

  const handleCopyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = item.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // ── Select ──

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Search ──

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedia(1, searchQuery, activeFolder);
  };

  // ── Render ──

  return (
    <div className="space-y-6" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-medium text-gray-900">Media Library</h1>
          {data && (
            <p className="text-xs text-gray-500">
              {data.stats.totalFiles} file · {formatFileSize(data.stats.totalSize)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) handleUpload(e.target.files); }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Carica file
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <X className="h-4 w-4 shrink-0 cursor-pointer" onClick={() => setError(null)} />
          {error}
        </div>
      )}

      {/* Toolbar: search + filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            placeholder="Cerca per nome..."
          />
        </form>

        {/* Folder filter */}
        {data && data.stats.folders.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setActiveFolder(null); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-2 text-xs font-medium transition-colors",
                !activeFolder
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              Tutti
            </button>
            {data.stats.folders.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => { setActiveFolder(f.name === "Senza cartella" ? "" : f.name); setPage(1); }}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  activeFolder === (f.name === "Senza cartella" ? "" : f.name)
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {f.name} ({f.count})
              </button>
            ))}
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-gray-200">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn("rounded-l-md p-2 transition-colors", viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50")}
            aria-label="Vista griglia"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn("rounded-r-md p-2 transition-colors", viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50")}
            aria-label="Vista lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Upload progress overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-8 shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            <p className="text-sm font-medium text-gray-700">Caricamento in corso...</p>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragCounterRef.current > 0 && !uploading && (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-12">
          <div className="flex items-center gap-3 text-[var(--color-primary)]">
            <Upload className="h-8 w-8" />
            <p className="text-lg font-medium">Rilascia i file qui per caricarli</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading && !data ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">Nessun media trovato</p>
          <p className="mb-4 text-xs text-gray-500">Carica la tua prima immagine per iniziare.</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <Upload className="h-4 w-4" />
            Carica immagine
          </button>
        </div>
      ) : data ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {data.items.map((item) => (
                <MediaGridItem
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  copied={copiedId === item.id}
                  onSelect={() => toggleSelect(item.id)}
                  onCopy={() => handleCopyUrl(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium tracking-wider text-gray-500">
                    <th className="px-4 py-3">Anteprima</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Dimensioni</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.map((item) => (
                    <MediaListItemRow
                      key={item.id}
                      item={item}
                      copied={copiedId === item.id}
                      onCopy={() => handleCopyUrl(item)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {data.total} file · Pagina {data.page} di {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ─── Grid Item ──────────────────────────────────────────────────────

function MediaGridItem({
  item, selected, copied, onSelect, onCopy, onDelete,
}: {
  item: MediaItem;
  selected: boolean;
  copied: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}): ReactNode {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md",
        selected ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "border-gray-200",
      )}
    >
      {/* Thumbnail */}
      <Link to="/admin/media/$id" params={{ id: item.id }} className="block aspect-square">
        <img
          src={item.url}
          alt={item.alt ?? item.originalName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </Link>

      {/* Selection checkbox */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          "absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
          selected
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
            : "border-white/80 bg-white/80 text-transparent opacity-0 group-hover:opacity-100",
        )}
        aria-label={selected ? "Deseleziona" : "Seleziona"}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Actions overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white",
            copied && "text-green-400",
          )}
          title={copied ? "URL copiato!" : "Copia URL"}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/admin/media/$id"
          params={{ id: item.id }}
          className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          title="Dettagli"
        >
          <Eye className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-red-500/80 hover:text-white"
          title="Elimina"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info bar */}
      <div className="border-t border-gray-100 px-2 py-1.5">
        <p className="truncate text-xs font-medium text-gray-700" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-[10px] text-gray-400">
          {item.width && item.height ? `${item.width}×${item.height}` : ""}
          {" "}{formatFileSize(item.size)}
        </p>
      </div>
    </div>
  );
}

// ─── List Item Row ──────────────────────────────────────────────────

function MediaListItemRow({
  item, copied, onCopy, onDelete,
}: {
  item: MediaItem;
  copied: boolean;
  onCopy: () => void;
  onDelete: () => void;
}): ReactNode {
  return (
    <tr className="group hover:bg-gray-50">
      <td className="px-4 py-3">
        <Link to="/admin/media/$id" params={{ id: item.id }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
            <img src={item.url} alt={item.originalName} className="h-10 w-10 rounded-md object-cover" />
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link to="/admin/media/$id" params={{ id: item.id }} className="text-sm font-medium text-gray-900 hover:text-[var(--color-primary)]">
          {item.originalName}
        </Link>
        {item.alt && (
          <p className="mt-0.5 truncate text-xs text-gray-400">{item.alt}</p>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
        {formatFileSize(item.size)}
        {item.width && item.height && (
          <span className="ml-2 text-gray-400">({item.width}×{item.height})</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
              copied && "text-green-500",
            )}
            title={copied ? "Copiato!" : "Copia URL"}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Elimina"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
