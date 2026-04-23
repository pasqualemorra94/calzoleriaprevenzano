import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useCallback, type ReactNode } from "react";
import {
  Upload, Search, Grid3X3, List,
  Image as ImageIcon, Loader2, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { toast } from "sonner";
import { $getAdminMedia } from "~/lib/admin-functions";
import { MediaGridItem, MediaListItemRow, type MediaItem } from "~/components/admin/media-library";
import { ConfirmDialog } from "~/components/admin/ConfirmDialog";

// ─── Types ──────────────────────────────────────────────────────────

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

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/media")({
  beforeLoad: async () => {
    const initialData = await $getAdminMedia({ data: { page: 1, perPage: 40, query: undefined, folder: undefined, type: "image" } });
    return { initialData };
  },
  component: AdminMediaPage,
});

// ─── Page orchestrator (Outlet pattern for child route /admin/media/$id) ──

function AdminMediaPage(): ReactNode {
  const { initialData } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/admin/media") {
    return <Outlet />;
  }

  return <AdminMediaList initialData={initialData as MediaListResponse} />;
}

// ─── Media list component ──────────────────────────────────────────

function AdminMediaList({ initialData }: { initialData: MediaListResponse }): ReactNode {
  const [data, setData] = useState<MediaListResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const fetchMedia = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await $getAdminMedia({
        data: { page: p, perPage: 40, query: q || undefined, type: "image" },
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Upload handling ──

  const handleUpload = async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore durante l'upload");

      setPage(1);
      await fetchMedia(1, searchQuery);
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
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok && res.status !== 204) throw new Error(json.error?.message ?? "Errore");
      await fetchMedia(page, searchQuery);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante l'eliminazione");
    }
  };

  // ── Copy URL ──

  const handleCopyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
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
    fetchMedia(1, searchQuery);
  };

  // ── Render ──

  return (
    <div className="space-y-6" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Media Library
            {data && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {data.stats.totalFiles}
              </span>
            )}
          </span>
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

      {/* Toolbar: search + view toggle */}
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
                  onDelete={() => setDeleteTargetId(item.id)}
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
                      onDelete={() => setDeleteTargetId(item.id)}
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

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Elimina file"
        message="Eliminare questo file dalla libreria media?"
        confirmLabel="Elimina"
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
