import type { ReactNode } from "react";
import { useEffect, useRef, useCallback, useState } from "react";
import { ZoomIn, ShoppingBag } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import type { ProductImage } from "./ProductGallery";
import { MobileImageZoomModal } from "./MobileImageZoomModal";

interface MobileImageCarouselProps {
  images: ProductImage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  productName: string;
  className?: string;
}

/**
 * Carousel mobile con scroll-snap CSS nativo + IntersectionObserver per sync indice.
 * Edge-to-edge tramite negative margin sul --page-padding-x.
 * Tap zoom icon apre il MobileImageZoomModal con pinch-zoom nativo.
 */
export function MobileImageCarousel({
  images,
  selectedIndex,
  onSelect,
  productName,
  className,
}: MobileImageCarouselProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<Array<HTMLImageElement | null>>([]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const programmaticScrollRef = useRef(false);

  // Sync selectedIndex parent state via IntersectionObserver (threshold 0.6)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollRef.current) return;
        const visible = entries.find((e) => e.intersectionRatio > 0.6);
        if (visible) {
          const idxAttr = visible.target.getAttribute("data-index");
          if (idxAttr === null) return;
          const index = Number(idxAttr);
          if (!Number.isNaN(index) && index !== selectedIndex) {
            onSelect(index);
          }
        }
      },
      { root: containerRef.current, threshold: [0.6] },
    );
    for (const slide of slidesRef.current) {
      if (slide) observer.observe(slide);
    }
    return () => observer.disconnect();
  }, [selectedIndex, onSelect]);

  // Programmatic scroll quando selectedIndex cambia da esterno (es. variant selection)
  useEffect(() => {
    const target = slidesRef.current[selectedIndex];
    if (!target) return;
    programmaticScrollRef.current = true;
    target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const t = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  const handleDotClick = useCallback(
    (i: number) => {
      onSelect(i);
    },
    [onSelect],
  );

  if (!images.length) {
    return (
      <div
        className={cn(
          "relative aspect-square overflow-hidden bg-[var(--color-muted)]",
          className,
        )}
      >
        <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
          <ShoppingBag className="h-16 w-16" />
        </div>
      </div>
    );
  }

  const current = images[selectedIndex];

  return (
    <div className={cn("relative", className)}>
      {/* Carousel scroll container (edge-to-edge negative margin) */}
      <div
        ref={containerRef}
        className="mob-carousel-scroll relative -mx-[var(--page-padding-x)] flex overflow-x-auto"
        style={{
          scrollSnapType: "x mandatory",
          scrollSnapStop: "always",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`
          .mob-carousel-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        {images.map((img, i) => (
          <img
            key={img.id}
            ref={(el) => {
              slidesRef.current[i] = el;
            }}
            data-index={i}
            src={img.url}
            alt={img.alt ?? `${productName} ${i + 1}`}
            className="aspect-square w-full flex-shrink-0 object-cover"
            style={{ scrollSnapAlign: "center" }}
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        {/* Zoom icon overlay */}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label="Ingrandisci immagine"
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Dots + counter sotto */}
      {images.length > 1 && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => handleDotClick(i)}
                aria-label={`Vai a immagine ${i + 1}`}
                aria-current={i === selectedIndex}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === selectedIndex
                    ? "bg-[var(--color-primary)] w-4"
                    : "bg-[var(--color-border)] hover:bg-[var(--color-text-muted)] w-2",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            {selectedIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Zoom modal */}
      {zoomOpen && current && (
        <MobileImageZoomModal
          src={current.url}
          alt={current.alt ?? productName}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
