import type { ReactNode } from "react";
import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface MobileImageZoomModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Mobile-only image zoom modal con pinch-zoom nativo browser
 * (touch-action: pinch-zoom + max-w/max-h object-contain).
 * Tap fuori dall'immagine, tasto X o tasto ESC chiudono.
 */
export function MobileImageZoomModal({
  src,
  alt,
  onClose,
}: MobileImageZoomModalProps): ReactNode {
  // Body scroll lock + ESC handler
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Click solo sul backdrop chiude (non sull'immagine stessa)
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Immagine ingrandita"
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi zoom"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        style={{ touchAction: "pinch-zoom" }}
        draggable={false}
      />
    </div>
  );
}
