import type { ReactNode } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, ImageIcon, FolderOpen,
} from "lucide-react";
import type { ProductEditCallbacks, ProductImageForm } from "./types";

interface ImageGalleryManagerProps {
  onAddImage: () => void;
  onMediaPickerOpen: () => void;
  callbacks: ProductEditCallbacks;
}

export function ImageGalleryManager({ onAddImage, onMediaPickerOpen, callbacks }: ImageGalleryManagerProps): ReactNode {
  const { form, updateImage, removeImage, moveImage } = callbacks;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-end">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {form.images.length} immagini
        </span>
      </div>

      {form.images.length > 0 && (
        <div className="space-y-3">
          {form.images.map((img, i) => (
            <ImageRow
              key={img.id ?? i}
              image={img}
              index={i}
              total={form.images.length}
              onUpdate={(field, value) => updateImage(i, field, value)}
              onRemove={() => removeImage(i)}
              onMove={(dir) => moveImage(i, dir)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onMediaPickerOpen}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <FolderOpen className="h-4 w-4" />
        Scegli dalla libreria
      </button>
      <button
        type="button"
        onClick={onAddImage}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <Plus className="h-4 w-4" />
        Inserisci URL manuale
      </button>
    </div>
  );
}

interface ImageRowProps {
  image: ProductImageForm;
  index: number;
  total: number;
  onUpdate: (field: keyof ProductImageForm, value: string | number) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

function ImageRow({ image, index, total, onUpdate, onRemove, onMove }: ImageRowProps): ReactNode {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-white border border-gray-200">
        {image.url ? (
          <img
            src={image.url}
            alt={image.alt || "Anteprima"}
            className="h-full w-full rounded-md object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-gray-300" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <input
          value={image.url}
          onChange={(e) => onUpdate("url", e.target.value)}
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          placeholder="URL immagine (es. /images/prodotto-1.jpg)"
        />
        <input
          value={image.alt}
          onChange={(e) => onUpdate("alt", e.target.value)}
          className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          placeholder="Testo alternativo (alt text)"
        />
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
          title="Sposta su"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30"
          title="Sposta giù"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Rimuovi immagine"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
