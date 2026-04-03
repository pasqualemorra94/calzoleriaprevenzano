import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { m, AnimatePresence } from "motion/react";
import { ShoppingBag, Minus, Plus, Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import { VariantConfigSchema } from "~/lib/types/variant-config";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
}

interface ProductVariant {
  id: string;
  name: string;
  color: string | null;
  size: string | null;
  price: number | null;
  stock: number;
  sku: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  weight: number | null;
  materials: string | null;
  variantConfig: Record<string, unknown> | null;
  category: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  image: { id: string; url: string; alt: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

interface OptionGroup {
  type: string;
  label: string;
  options: Array<{
    id: string;
    label: string;
    color: string | null;
    priceModifier: number;
    stock: number;
    imageUrl: string | null;
  }>;
  /** Conditional visibility — show only when parent group matches */
  dependsOn?: { groupId: string; optionValue: string };
}

function parseOptionGroups(variants: ProductVariant[]): OptionGroup[] {
  const groupMap = new Map<string, OptionGroup>();

  for (const v of variants) {
    const separator = v.name.includes(" - ") ? " - " : "/";
    const parts = v.name.split(separator);
    const groupType = parts.length > 1 ? parts[0].trim().toLowerCase() : "variante";
    const optionLabel = parts.length > 1 ? parts.slice(1).join(separator).trim() : v.name.trim();

    const displayLabel = capitalizeFirst(groupType);

    if (!groupMap.has(groupType)) {
      groupMap.set(groupType, { type: groupType, label: displayLabel, options: [] });
    }

    groupMap.get(groupType)!.options.push({
      id: v.id,
      label: optionLabel,
      color: v.color,
      priceModifier: v.price ? Number(v.price) : 0,
      stock: v.stock,
      imageUrl: null,
    });
  }

  return Array.from(groupMap.values());
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const Route = createFileRoute("/prodotti/$slug")({
  component: ProdottoPage,
});

function ProdottoPage(): ReactNode {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Map<string, string>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState<"idle" | "loading" | "success">("idle");
  const [customerNote, setCustomerNote] = useState("");

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/products/${slug}`);
      const json = await res.json();
      if (json.ok) {
        setProduct(json.data);
        const initial = new Map<string, string>();

        // Prefer variantConfig (JSON builder) over legacy variants
        const config = VariantConfigSchema.safeParse(json.data.variantConfig);
        if (config.success && config.data.groups.length > 0) {
          for (const g of config.data.groups) {
            if (g.required && g.options.length > 0) {
              initial.set(g.id, g.options[0].value);
            }
          }
        } else if (json.data.variants.length > 0) {
          const groups = parseOptionGroups(json.data.variants);
          for (const g of groups) {
            if (g.options.length > 0) initial.set(g.type, g.options[0].id);
          }
        }
        setSelectedOptions(initial);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [slug]);

  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const res = await fetch("/api/products?featured=true&perPage=4");
        const json = await res.json();
        if (json.ok) setRelatedProducts(json.data.items);
      } catch { /* ignore */ }
    }
    fetchRelated();
  }, []);

  // Determine which variant system to use
  const parsedConfig = useMemo(() => {
    if (!product?.variantConfig) return null;
    const result = VariantConfigSchema.safeParse(product.variantConfig);
    return result.success ? result.data : null;
  }, [product?.variantConfig]);

  // Use variantConfig when available, fall back to legacy variants
  const optionGroups = useMemo(
    () => {
      if (!product) return [];
      if (parsedConfig) {
        // Map variantConfig groups to the same OptionGroup format
        return parsedConfig.groups.map((g) => ({
          type: g.id,
          label: g.label,
          dependsOn: g.dependsOn ?? undefined,
          options: g.options.map((o) => ({
            id: o.value,
            label: o.label,
            color: o.color ?? null,
            priceModifier: o.priceModifier ?? 0,
            stock: 999, // Config-based options don't track stock per-variant
            imageUrl: o.imageUrl ?? null,
          })),
        }));
      }
      return parseOptionGroups(product.variants);
    },
    [product, parsedConfig],
  );

  // Compute which groups are currently visible based on selectedOptions
  // A group is visible if:
  // - It has NO dependsOn (always visible), OR
  // - Its dependsOn.groupId has a selected value matching dependsOn.optionValue
  const visibleGroups = useMemo(() => {
    if (!parsedConfig) return optionGroups; // Legacy variants don't have conditional groups
    return optionGroups.filter((group) => {
      if (!group.dependsOn) return true;
      const parentValue = selectedOptions.get(group.dependsOn.groupId);
      return parentValue === group.dependsOn.optionValue;
    });
  }, [optionGroups, selectedOptions, parsedConfig]);

  // Check if all visible (and required) groups have a selection
  const allVisibleGroupsSelected = visibleGroups.every((g) => selectedOptions.has(g.type));

  const selectedVariantId = useMemo(() => {
    if (optionGroups.length === 0) return null;
    if (optionGroups.length === 1) {
      return selectedOptions.get(optionGroups[0].type) ?? optionGroups[0].options[0]?.id ?? null;
    }
    const match = product?.variants.find((v) =>
      optionGroups.every((g) => selectedOptions.get(g.type) === v.id)
    );
    return match?.id ?? null;
  }, [selectedOptions, optionGroups, product]);

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId) ?? null;

  const priceBreakdown = useMemo(() => {
    const base = product?.price ?? 0;
    let optionsTotal = 0;
    for (const g of visibleGroups) {
      const selectedId = selectedOptions.get(g.type);
      if (selectedId) {
        const opt = g.options.find((o) => o.id === selectedId);
        if (opt) optionsTotal += opt.priceModifier;
      }
    }
    return { base, optionsTotal, total: base + optionsTotal };
  }, [product, visibleGroups, selectedOptions]);

  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);

  const stockStatus = effectiveStock === 0
    ? { label: "Esaurito", color: "text-[var(--color-destructive)]", bg: "bg-red-50" }
    : effectiveStock <= 3
      ? { label: `Ultimi ${effectiveStock} pezzi`, color: "text-amber-700", bg: "bg-amber-50" }
      : { label: "Disponibile", color: "text-green-700", bg: "bg-green-50" };

  const allGroupsSelected = optionGroups.length === 0 || allVisibleGroupsSelected;
  const canAddToCart = product && !product.variants.length || allGroupsSelected;

  const handleSelectOption = (groupType: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const next = new Map(prev);
      next.set(groupType, optionId);

      // When a parent group changes, reset all dependent child groups
      // and auto-select the first option of each newly visible child
      if (parsedConfig) {
        for (const group of optionGroups) {
          if (group.dependsOn && group.dependsOn.groupId === groupType) {
            // This child depends on the group that just changed
            // Only auto-select if the new value matches
            if (group.dependsOn.optionValue === optionId) {
              if (group.options.length > 0) {
                next.set(group.type, group.options[0].id);
              }
            } else {
              // Parent value doesn't match — clear child selection
              next.delete(group.type);
            }
          }
        }
      }

      return next;
    });

    if (product) {
      const variant = product.variants.find((v) => v.id === optionId);
      if (variant?.color && product.images.length > 0) {
        const colorMatch = product.images.findIndex(
          (img) => img.alt?.toLowerCase().includes(variant.color!.toLowerCase()),
        );
        if (colorMatch >= 0) setSelectedImageIndex(colorMatch);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product || !canAddToCart || effectiveStock === 0 || cartStatus === "loading") return;
    setCartStatus("loading");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, variantId: selectedVariantId, quantity }),
      });
      const json = await res.json();
      if (json.ok) {
        setCartStatus("success");
        setTimeout(() => setCartStatus("idle"), 3000);
      } else {
        setCartStatus("idle");
      }
    } catch {
      setCartStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-[var(--section-padding-y)]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="animate-pulse">
            <div className="aspect-square rounded-[var(--radius-lg)] bg-[var(--color-muted)]" />
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-[var(--color-muted)]" />
            <div className="h-8 w-3/4 rounded bg-[var(--color-muted)]" />
            <div className="h-6 w-24 rounded bg-[var(--color-muted)]" />
            <div className="h-20 w-full rounded bg-[var(--color-muted)]" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-[var(--page-padding-x)]">
        <p className="mb-4 text-7xl font-display font-bold text-[var(--color-primary)]">!</p>
        <h1 className="mb-4 text-center text-2xl font-display font-semibold text-[var(--color-text)] md:text-3xl">
          Prodotto non trovato
        </h1>
        <p className="mb-8 max-w-md text-center leading-relaxed text-[var(--color-text-secondary)]">
          Il prodotto che stai cercando non esiste o è stato rimosso.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          Vai al catalogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--color-surface)] py-4">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <nav className="text-sm text-[var(--color-text-muted)]" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[var(--color-primary)]">Home</Link>
            <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
            {product.category ? (
              <>
                <Link to="/catalogo" params={{}} className="hover:text-[var(--color-primary)]">
                  {product.category.name}
                </Link>
                <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Link to="/catalogo" params={{}} className="hover:text-[var(--color-primary)]">Catalogo</Link>
                <ChevronRight className="mx-1 inline h-3.5 w-3.5" />
              </>
            )}
            <span className="text-[var(--color-text)]">{product.name}</span>
          </nav>
        </div>
      </div>

      <section className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <m.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
                <AnimatePresence mode="wait">
                  <m.img
                    key={selectedImageIndex}
                    src={product.images[selectedImageIndex]?.url}
                    alt={product.images[selectedImageIndex]?.alt ?? product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    width={product.images[selectedImageIndex]?.width ?? 800}
                    height={product.images[selectedImageIndex]?.height ?? 800}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                {!product.images.length && (
                  <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
                    <ShoppingBag className="h-16 w-16" />
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={cn(
                        "h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition-all duration-200",
                        i === selectedImageIndex
                          ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                          : "border-transparent opacity-60 hover:opacity-100",
                      )}
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? `${product.name} ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </m.div>

            <m.div
              className="flex flex-col"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              {product.category && (
                <span className="mb-2 text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
                  {product.category.name}
                </span>
              )}

              <h1 className="font-display text-[var(--text-3xl)] font-semibold tracking-tight md:text-[var(--text-4xl)]">
                {product.name}
              </h1>

              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    <m.p
                      key={priceBreakdown.total}
                      className="text-[var(--text-2xl)] font-semibold text-[var(--color-primary)]"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      EUR {priceBreakdown.total.toFixed(2)}
                    </m.p>
                  </AnimatePresence>
                  {product.compareAtPrice && (
                    <p className="text-lg text-[var(--color-text-muted)] line-through">
                      EUR {product.compareAtPrice.toFixed(2)}
                    </p>
                  )}
                </div>
                {priceBreakdown.optionsTotal > 0 && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <span>Prezzo base: EUR {priceBreakdown.base.toFixed(2)}</span>
                    </div>
                    {optionGroups.map((g) => {
                      const selectedId = selectedOptions.get(g.type);
                      const opt = selectedId ? g.options.find((o) => o.id === selectedId) : null;
                      if (!opt || opt.priceModifier === 0) return null;
                      // Only show modifiers from visible groups
                      if (!visibleGroups.includes(g)) return null;
                      return (
                        <p key={g.type} className="text-sm text-[var(--color-text-secondary)]">
                          + {opt.label}: EUR {opt.priceModifier.toFixed(2)}
                        </p>
                      );
                    })}
                  </m.div>
                )}
              </div>

              <div className="mt-3">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", stockStatus.bg, stockStatus.color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", effectiveStock === 0 ? "bg-red-500" : effectiveStock <= 3 ? "bg-amber-500" : "bg-green-500")} />
                  {stockStatus.label}
                </span>
              </div>

              {product.shortDescription && (
                <p className="mt-4 leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
                  {product.shortDescription}
                </p>
              )}

              <hr className="stitch-divider stitch-divider--left my-6" />

              {visibleGroups.length > 0 && (
                <div className="space-y-5">
                  {visibleGroups.map((group) => {
                    const selectedId = selectedOptions.get(group.type);
                    // Determine the control type from variantConfig if available
                    const configGroup = parsedConfig?.groups.find((g) => g.id === group.type);
                    const controlType = configGroup?.type ?? (group.options.length > 8 ? "select" : "button");

                    return (
                      <AnimatePresence key={group.type} mode="wait">
                        <m.div
                          key={group.type}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="mb-2.5 block text-sm font-medium text-[var(--color-text)]">
                            {group.label}
                            {selectedId && (
                              <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                                — {group.options.find((o) => o.id === selectedId)?.label}
                              </span>
                            )}
                          </span>

                        {/* SELECT type — dropdown */}
                        {controlType === "select" ? (
                          <select
                            value={selectedId ?? ""}
                            onChange={(e) => handleSelectOption(group.type, e.target.value)}
                            className="h-10 w-full max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                          >
                            {!selectedId && <option value="">Seleziona...</option>}
                            {group.options.map((opt) => (
                              <option key={opt.id} value={opt.id} disabled={opt.stock === 0}>
                                {opt.label}
                                {opt.priceModifier > 0 ? ` (+EUR ${opt.priceModifier.toFixed(2)})` : ""}
                              </option>
                            ))}
                          </select>

                        ) : controlType === "color-swatch" ? (
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(group.type, opt.id)}
                                disabled={opt.stock === 0}
                                className={cn(
                                  "group/color relative overflow-hidden rounded-[var(--radius-lg)] border-2 transition-all duration-200 aspect-square",
                                  selectedId === opt.id
                                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 scale-105"
                                    : "border-transparent hover:border-[var(--color-border)] hover:scale-105",
                                  opt.stock === 0 && "cursor-not-allowed opacity-40",
                                )}
                                title={opt.label + (opt.priceModifier > 0 ? ` (+EUR ${opt.priceModifier.toFixed(2)})` : "")}
                                aria-label={opt.label}
                                aria-pressed={selectedId === opt.id}
                              >
                                {opt.imageUrl ? (
                                  <>
                                    {/* Product image preview */}
                                    <img
                                      src={opt.imageUrl}
                                      alt={opt.label}
                                      className="absolute inset-0 h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                    {/* Color accent strip at bottom */}
                                    <span
                                      className="absolute bottom-0 left-0 right-0 h-1.5"
                                      style={{ backgroundColor: opt.color ?? "#ccc" }}
                                    />
                                    {/* Selected checkmark overlay */}
                                    {selectedId === opt.id && (
                                      <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary)]/20">
                                        <Check className="h-4 w-4 text-white drop-shadow-md" />
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  /* Fallback: plain color circle */
                                  <span
                                    className="absolute inset-0.5 rounded-full"
                                    style={{ backgroundColor: opt.color ?? "#ccc" }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>

                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(group.type, opt.id)}
                                disabled={opt.stock === 0}
                                className={cn(
                                  "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                  selectedId === opt.id
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]",
                                  opt.stock === 0 && "cursor-not-allowed opacity-40",
                                )}
                              >
                                {opt.color && (
                                  <span
                                    className="inline-block h-4 w-4 rounded-full border border-[var(--color-border)]"
                                    style={{ backgroundColor: opt.color }}
                                  />
                                )}
                                <span>{opt.label}</span>
                                {opt.priceModifier > 0 && (
                                  <span className={cn(
                                    "text-xs font-semibold",
                                    selectedId === opt.id ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]",
                                  )}>
                                    +€{opt.priceModifier.toFixed(2)}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        </m.div>
                      </AnimatePresence>
                    );
                  })}
                </div>
              )}

              {/* Customer Note — for personalization requests */}
              {parsedConfig && (
                <div>
                  <label
                    htmlFor="customer-note"
                    className="mb-2 block text-sm font-medium text-[var(--color-text)]"
                  >
                    Note personalizzazione
                    <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">(opzionale)</span>
                  </label>
                  <textarea
                    id="customer-note"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Es: misura cm, colore specifico, incisione..."
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
                  />
                  {customerNote.length > 0 && (
                    <span className="mt-1 block text-right text-[11px] text-[var(--color-text-muted)]">
                      {customerNote.length}/500
                    </span>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-12 w-12 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                    aria-label="Diminuisci quantità"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-12 w-12 items-center justify-center text-sm font-semibold text-[var(--color-text)]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    className="flex h-12 w-12 items-center justify-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-40"
                    aria-label="Aumenta quantità"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canAddToCart || effectiveStock === 0 || cartStatus === "loading"}
                  onClick={handleAddToCart}
                  className={cn(
                    "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 text-sm font-medium transition-all duration-[var(--transition-base)] disabled:cursor-not-allowed disabled:opacity-60",
                    cartStatus === "success"
                      ? "bg-green-600 text-white"
                      : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:shadow-lg",
                  )}
                >
                  {cartStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {cartStatus === "success" ? (
                    <>
                      <Check className="h-4 w-4" />
                      Aggiunto al carrello
                    </>
                  ) : effectiveStock === 0 ? (
                    "Esaurito"
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      Aggiungi al carrello
                      {priceBreakdown.optionsTotal > 0 && (
                        <span className="ml-1 text-[var(--color-primary-light)]">
                          EUR {priceBreakdown.total.toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {product.materials && (
                <>
                  <hr className="stitch-divider stitch-divider--left my-6" />
                  <div>
                    <h2 className="mb-2 font-display text-[var(--text-lg)] font-semibold">Materiali</h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
                      {product.materials}
                    </p>
                  </div>
                </>
              )}

              {product.description && (
                <>
                  <hr className="stitch-divider stitch-divider--left my-6" />
                  <div>
                    <h2 className="mb-2 font-display text-[var(--text-lg)] font-semibold">Descrizione</h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] whitespace-pre-line text-[var(--color-text-secondary)]">
                      {product.description}
                    </p>
                  </div>
                </>
              )}
            </m.div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y)]">
          <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
            <div className="mb-10 text-center">
              <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
                Potrebbe piacerti anche
              </span>
              <h2 className="font-display text-[var(--text-3xl)] font-semibold tracking-tight">
                Prodotti correlati
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
              {relatedProducts
                .filter((rp) => rp.id !== product.id)
                .slice(0, 4)
                .map((rp) => (
                  <RelatedProductCard key={rp.id} product={rp} />
                ))}
            </div>
          </section>
        </ScrollAnimatedSection>
      )}
    </>
  );
}

function RelatedProductCard({ product }: { product: ProductListItem }) {
  return (
    <m.article
      className="group"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-muted)]">
        {product.image ? (
          <img
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
            loading="lazy"
            width={400}
            height={533}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
      </div>
      <div className="mt-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 font-display text-[var(--text-base)] font-semibold leading-snug text-[var(--color-text)]">
          <a href={`/prodotti/${product.slug}`} className="hover:text-[var(--color-primary)]">
            {product.name}
          </a>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--color-primary)]">
            EUR {product.price.toFixed(2)}
          </p>
          {product.compareAtPrice && (
            <p className="text-sm text-[var(--color-text-muted)] line-through">
              EUR {product.compareAtPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </m.article>
  );
}
