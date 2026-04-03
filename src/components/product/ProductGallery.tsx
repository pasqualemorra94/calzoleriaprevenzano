import type { ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { m } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { cn } from "~/lib/utils/cn";

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

interface ProductGalleryProps {
  images: ProductImage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  productName: string;
}

export function ProductGallery({ images, selectedIndex, onSelect, productName }: ProductGalleryProps): ReactNode {
  return (
    <m.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        <AnimatePresence mode="wait">
          <m.img
            key={selectedIndex}
            src={images[selectedIndex]?.url}
            alt={images[selectedIndex]?.alt ?? productName}
            className="absolute inset-0 h-full w-full object-cover"
            width={images[selectedIndex]?.width ?? 800}
            height={images[selectedIndex]?.height ?? 800}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        {!images.length && (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <ShoppingBag className="h-16 w-16" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-all duration-200",
                i === selectedIndex
                  ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <img
                src={img.url}
                alt={img.alt ?? `${productName} ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </m.div>
  );
}
