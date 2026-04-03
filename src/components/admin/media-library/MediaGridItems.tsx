import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Copy, Eye, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils/cn";

export interface MediaItem {
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export { formatFileSize, formatDate };

export function MediaGridItem({
  item, selected, copied, onSelect, onCopy, onDelete,
}: {
  item: MediaItem; selected: boolean; copied: boolean;
  onSelect: () => void; onCopy: () => void; onDelete: () => void;
}): ReactNode {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md",
      selected ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "border-gray-200",
    )}>
      <Link to="/admin/media/$id" params={{ id: item.id }} className="block aspect-square">
        <img src={item.url} alt={item.alt ?? item.originalName} className="h-full w-full object-cover" loading="lazy" />
      </Link>

      <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn("absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all",
          selected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-white/80 bg-white/80 text-transparent opacity-0 group-hover:opacity-100")}
        aria-label={selected ? "Deseleziona" : "Seleziona"}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={onCopy}
          className={cn("rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white", copied && "text-green-400")}
          title={copied ? "URL copiato!" : "Copia URL"}>
          <Copy className="h-3.5 w-3.5" />
        </button>
        <Link to="/admin/media/$id" params={{ id: item.id }}
          className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white" title="Dettagli">
          <Eye className="h-3.5 w-3.5" />
        </Link>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-red-500/80 hover:text-white" title="Elimina">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="border-t border-gray-100 px-2 py-1.5">
        <p className="truncate text-xs font-medium text-gray-700" title={item.originalName}>{item.originalName}</p>
        <p className="text-[10px] text-gray-400">
          {item.width && item.height ? `${item.width}×${item.height}` : ""} {formatFileSize(item.size)}
        </p>
      </div>
    </div>
  );
}

export function MediaListItemRow({
  item, copied, onCopy, onDelete,
}: {
  item: MediaItem; copied: boolean; onCopy: () => void; onDelete: () => void;
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
        <Link to="/admin/media/$id" params={{ id: item.id }} className="text-sm font-medium text-gray-900 hover:text-[var(--color-primary)]">{item.originalName}</Link>
        {item.alt && <p className="mt-0.5 truncate text-xs text-gray-400">{item.alt}</p>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
        {formatFileSize(item.size)}{item.width && item.height && <span className="ml-2 text-gray-400">({item.width}×{item.height})</span>}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={onCopy}
            className={cn("rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600", copied && "text-green-500")}
            title={copied ? "Copiato!" : "Copia URL"}>
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Elimina">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
