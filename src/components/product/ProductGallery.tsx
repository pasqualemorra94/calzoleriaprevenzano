import type { ReactNode, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, RefObject } from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { ShoppingBag, ZoomIn } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { usePrefersReducedMotion } from "~/lib/hooks/use-prefers-reduced-motion";

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

// ── Zoom constants ──
const ZOOM_SCALE = 2.2;
const LENS_SIZE = 180;

// ── Main Gallery Component ──

export function ProductGallery({ images, selectedIndex, onSelect, productName }: ProductGalleryProps): ReactNode {
  return (
    <div>
      <ZoomableImage
        src={images[selectedIndex]?.url}
        alt={images[selectedIndex]?.alt ?? productName}
        naturalWidth={images[selectedIndex]?.width ?? 800}
        naturalHeight={images[selectedIndex]?.height ?? 800}
        empty={!images.length}
      />

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <MagnifiableThumbnail
              key={img.id}
              src={img.url}
              alt={img.alt ?? `${productName} ${i + 1}`}
              isActive={i === selectedIndex}
              onClick={() => onSelect(i)}
              label={img.alt ?? `${productName} ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Zoomable Main Image ──

function ZoomableImage({
  src, alt, naturalWidth, naturalHeight, empty,
}: {
  src: string | undefined;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
  empty: boolean;
}): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x: Math.min(Math.max(x, 0), 100), y: Math.min(Math.max(y, 0), 100) });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!isTouch) setIsHovering(true);
  }, [isTouch]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleTouchStart = useCallback(() => {
    setIsTouch(true);
    setIsHovering(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Reset loaded state when image changes, but also detect cached images
  useEffect(() => {
    setIsLoaded(false);
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, [src]);

  if (empty) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
          <ShoppingBag className="h-16 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main image container */}
      <div
        ref={containerRef}
        className="relative aspect-square cursor-crosshair overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        role="img"
        aria-label={`${alt} — passa il mouse sopra per ingrandire`}
      >
        <img
          ref={imgRef}
          key={src}
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-100",
            !isLoaded && "opacity-0",
            isHovering && !reducedMotion && "scale-[2.2]",
          )}
          style={isHovering && !reducedMotion
            ? { transformOrigin: `${position.x}% ${position.y}%` }
            : undefined
          }
          width={naturalWidth}
          height={naturalHeight}
          onLoad={handleLoad}
        />

        {/* Zoom hint icon — only shows before first hover */}
        {isLoaded && !isHovering && !isTouch && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-opacity">
            <ZoomIn className="h-3.5 w-3.5" />
            <span>Zoom</span>
          </div>
        )}

        {/* Crosshair indicator while zooming */}
        {isHovering && !reducedMotion && (
          <div
            className="pointer-events-none absolute z-10 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60 shadow-lg transition-opacity"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          />
        )}
      </div>

      {/* Side lens panel — desktop only */}
      {isHovering && !reducedMotion && src && (
        <ZoomLensPanel
          src={src}
          alt={alt}
          position={position}
          containerRef={containerRef}
          zoomScale={ZOOM_SCALE}
          lensSize={LENS_SIZE}
        />
      )}
    </div>
  );
}

// ── Side Zoom Lens Panel ──

function ZoomLensPanel({
  src, alt, position, containerRef, zoomScale, lensSize,
}: {
  src: string;
  alt: string;
  position: { x: number; y: number };
  containerRef: RefObject<HTMLDivElement | null>;
  zoomScale: number;
  lensSize: number;
}): ReactNode {
  const lensRef = useRef<HTMLDivElement>(null);
  const [lensPos, setLensPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!containerRef.current || !lensRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Position lens relative to the viewport, aligned to the right of the main image
    const top = containerRect.top + (position.y / 100) * containerRect.height - lensSize / 2;
    const left = containerRect.right + 12;

    setLensPos({ top, left });

    // Hide if viewport is too narrow
    if (window.innerWidth - containerRect.right < lensSize + 24) {
      lensRef.current.style.opacity = "0";
      lensRef.current.style.pointerEvents = "none";
    } else {
      lensRef.current.style.opacity = "1";
      lensRef.current.style.pointerEvents = "auto";
    }
  }, [position, containerRef, lensSize]);

  return (
    <div
      ref={lensRef}
      className="fixed z-50 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl transition-opacity duration-200"
      style={{
        top: `${lensPos.top}px`,
        left: `${lensPos.left}px`,
        width: `${lensSize}px`,
        height: `${lensSize}px`,
      }}
      aria-hidden="true"
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
        draggable={false}
      />
    </div>
  );
}

// ── Magnifiable Thumbnail ──

function MagnifiableThumbnail({
  src, alt, isActive, onClick, label,
}: {
  src: string;
  alt: string;
  isActive: boolean;
  onClick: () => void;
  label: string;
}): ReactNode {
  const thumbRef = useRef<HTMLButtonElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLButtonElement>) => {
    if (!thumbRef.current) return;
    const rect = thumbRef.current.getBoundingClientRect();
    setMagnifierPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (!reducedMotion) setShowMagnifier(true);
  }, [reducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setShowMagnifier(false);
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  // Mobile long-press to activate magnifier
  const handleTouchStart = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      setShowMagnifier(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setShowMagnifier(false);
  }, []);

  const handleTouchMove = useCallback((e: ReactTouchEvent<HTMLButtonElement>) => {
    if (!thumbRef.current || !showMagnifier) return;
    const touch = e.touches[0];
    const rect = thumbRef.current.getBoundingClientRect();
    setMagnifierPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  }, [showMagnifier]);

  const MAGNIFIER_SIZE = 120;
  const MAGNIFIER_ZOOM = 3;

  return (
    <>
      <button
        ref={thumbRef}
        type="button"
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className={cn(
          "relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-all duration-200",
          isHovering && "z-20",
          isActive
            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
            : "border-transparent opacity-60 hover:opacity-100",
        )}
        title={label}
        aria-label={`${label}${isActive ? " (selezionata)" : ""}`}
        aria-pressed={isActive}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
      </button>

      {/* Floating magnifier popup near the thumbnail */}
      {showMagnifier && !reducedMotion && thumbRef.current && (
        <div
          className="fixed z-50 overflow-hidden rounded-[var(--radius-lg)] border-2 border-[var(--color-primary)]/40 bg-[var(--color-surface)] shadow-xl"
          style={{
            top: `${magnifierPos.y - MAGNIFIER_SIZE - 16}px`,
            left: `${magnifierPos.x - MAGNIFIER_SIZE / 2}px`,
            width: `${MAGNIFIER_SIZE}px`,
            height: `${MAGNIFIER_SIZE}px`,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            style={{
              transform: `scale(${MAGNIFIER_ZOOM})`,
              transformOrigin: `${(magnifierPos.x / 80) * 100}% ${(magnifierPos.y / 80) * 100}%`,
            }}
            draggable={false}
          />
          <div className="absolute inset-0 rounded-[var(--radius-lg)] ring-1 ring-inset ring-black/5" />
        </div>
      )}
    </>
  );
}


