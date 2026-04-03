/**
 * MediaPicker — Reusable modal for selecting media from the library.
 *
 * Used in:
 * - Product edit form (image section)
 * - Category edit form
 * - Any admin form that needs image selection
 *
 * Props:
 *   open: boolean — controlled open state
 *   onClose: () => void — close handler
 *   onSelect: (items: SelectedMedia[]) => void — selection handler
 *   multiple?: boolean — allow multi-select (default: true)
 *   maxSelections?: number — max items selectable
 *   initialSelected?: string[] — pre-selected media IDs
 */

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import {
  X, Search, Upload, Loader2, ImageIcon, Check,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "~/lib/utils/cn";

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

export interface SelectedMedia {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  originalName: string;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (items: SelectedMedia[]) => void;
  multiple?: boolean;
  maxSelections?: number;
  initialSelected?: string[];
}

// ─── Component ──────────────────────────────────────────────────────

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = true,
  maxSelections = 10,
  initialSelected = [],
}: MediaPickerProps): ReactNode {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSelectedRef = useRef(initialSelected);
  initialSelectedRef.current = initialSelected;

  // ── Fetch media ──

  const fetchMedia = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), perPage: "24", type: "image" });
      if (q) params.set("query", q);
      const res = await fetch(`/api/admin/media?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Errore");
      setItems(json.data.items);
      setTotalPages(json.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSelected(new Set(initialSelectedRef.current));
    setSearchQuery("");
    fetchMedia(1, "");
  }, [open, fetchMedia]);

  // ── Search with debounce ──

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchMedia(1, value);
    }, 300);
  };

  // ── Select ──

  const toggleSelect = (item: MediaItem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else if (multiple && next.size >= maxSelections) {
        return prev; // Don't exceed max
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  // ── Upload ──

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
      if (!json.ok) throw new Error(json.error?.message ?? "Errore upload");

      // Refresh and auto-select uploaded items
      await fetchMedia(1, searchQuery);
      if (json.data?.uploaded) {
        setSelected((prev) => {
          const next = new Set(prev);
          for (const m of json.data.uploaded) {
            if (multiple ? next.size < maxSelections : next.size === 0) {
              next.add(m.id);
            }
          }
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Drag & Drop ──

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); dragCounterRef.current += 1; };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dragCounterRef.current -= 1; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); dragCounterRef.current = 0; if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files); };

  // ── Confirm selection ──

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => selected.has(item.id));
    const mapped: SelectedMedia[] = selectedItems.map((item) => ({
      id: item.id,
      url: item.url,
      alt: item.alt,
      width: item.width,
      height: item.height,
      originalName: item.originalName,
    }));
    onSelect(mapped);
    onClose();
  };

  // ── Keyboard ──

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const selectionCount = selected.size;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seleziona media"
        className="relative z-10 flex h-[85vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Seleziona immagine</h2>
            <p className="text-xs text-gray-500">
              {multiple ? `${selectionCount}/${maxSelections} selezionati` : "Seleziona un'immagine"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={multiple}
              className="hidden"
              onChange={(e) => { if (e.target.files) handleUpload(e.target.files); }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Carica
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-[var(--color-primary)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              placeholder="Cerca immagini..."
              autoFocus
            />
          </div>
        </div>

        {/* Grid content */}
        <div
          className="flex-1 overflow-y-auto p-6"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {dragCounterRef.current > 0 && (
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5">
              <div className="flex items-center gap-3 text-[var(--color-primary)]">
                <Upload className="h-6 w-6" />
                <p className="text-sm font-medium">Rilascia per caricare</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
          )}

          {loading && items.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <ImageIcon className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Nessuna immagine trovata</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <Upload className="h-3.5 w-3.5" />
                Carica la prima immagine
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all focus:outline-none",
                      selected.has(item.id)
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                        : "border-transparent hover:border-gray-300",
                    )}
                    aria-label={`Seleziona ${item.originalName}`}
                    aria-pressed={selected.has(item.id)}
                  >
                    <img
                      src={item.url}
                      alt={item.alt ?? item.originalName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {/* Selection indicator */}
                    {selected.has(item.id) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary)]/20">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); fetchMedia(Math.max(1, page - 1), searchQuery); }}
                    disabled={page <= 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); fetchMedia(Math.min(totalPages, page + 1), searchQuery); }}
                    disabled={page >= totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500">
            {selectionCount > 0
              ? `${selectionCount} ${selectionCount === 1 ? "immagine selezionata" : "immagini selezionate"}`
              : "Nessuna selezione"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectionCount === 0}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Conferma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
