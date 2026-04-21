/**
 * TryOnPreview — Virtual try-on result viewer.
 *
 * Shows the generated try-on image with:
 * - Loading state during generation
 * - Error handling
 * - Download / share options
 */

import { Loader2, Download, Share2, RotateCcw, AlertCircle } from "lucide-react";

interface TryOnPreviewProps {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  productName: string;
  onRetry: () => void;
}

export function TryOnPreview({ imageUrl, loading, error, productName, onRetry }: TryOnPreviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        👠 Prova Virtuale — {productName}
      </h3>

      {/* Loading state */}
      {loading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-gray-50">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary)]" />
          <p className="mt-3 text-sm text-gray-500">Generazione prova virtuale in corso...</p>
          <p className="mt-1 text-xs text-gray-400">Può richiedere 5-15 secondi</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-red-50 p-6">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700">Errore nella generazione</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 transition hover:bg-red-100"
          >
            <RotateCcw className="h-4 w-4" />
            Riprova
          </button>
        </div>
      )}

      {/* Result */}
      {imageUrl && !loading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <img
            src={imageUrl}
            alt={`Prova virtuale: ${productName}`}
            className="h-auto max-h-[500px] w-full object-contain"
          />
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              ⚠️ Immagine generata da AI — approssimazione visiva, non una foto reale
            </p>
            <div className="flex gap-2">
              <a
                href={imageUrl}
                download={`tryon-${productName.toLowerCase().replace(/\s+/g, "-")}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
              >
                <Download className="h-3.5 w-3.5" />
                Salva
              </a>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Condividi
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
