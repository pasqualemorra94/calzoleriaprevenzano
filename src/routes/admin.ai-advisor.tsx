/**
 * AI Foot Advisor — Admin page for in-store tablet.
 *
 * Flow:
 *  1. Capture foot photo (camera or upload)
 *  2. AI analyzes foot shape → shows profile + recommendations
 *  3. User selects a sandal (from suggestions or full catalog)
 *  4. Optionally customize variants (color, heel, leather)
 *  5. Generate virtual try-on preview
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Loader2, Wand2, RotateCcw } from "lucide-react";
import { FootCamera } from "~/components/admin/ai-advisor/FootCamera";
import { FootAnalysis } from "~/components/admin/ai-advisor/FootAnalysis";
import { SandalSuggestions } from "~/components/admin/ai-advisor/SandalSuggestions";
import { SandalCatalog } from "~/components/admin/ai-advisor/SandalCatalog";
import { VariantSelector } from "~/components/admin/ai-advisor/VariantSelector";
import { TryOnPreview } from "~/components/admin/ai-advisor/TryOnPreview";
import { $getAdvisorCatalog } from "~/lib/admin-functions";
import type { AIFootAnalysisResult } from "~/lib/ai.server";
import type { ProductMatch, AdvisorProduct } from "~/lib/ai-advisor.server";

export const Route = createFileRoute("/admin/ai-advisor")({
  beforeLoad: async () => {
    const catalog = await $getAdvisorCatalog();
    return { catalog: catalog as unknown as AdvisorProduct[] };
  },
  component: AIAdvisorPage,
});

type Step = "capture" | "analyzing" | "results" | "tryon";

interface AIAdvisorContext {
  catalog: AdvisorProduct[];
}

function AIAdvisorPage() {
  const { catalog } = Route.useRouteContext() as AIAdvisorContext;

  // State machine
  const [step, setStep] = useState<Step>("capture");
  const [footImage, setFootImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIFootAnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<ProductMatch[]>([]);

  // Selected sandal
  const [selectedSandal, setSelectedSandal] = useState<AdvisorProduct | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { id: string; label: string; color?: string }>>({});

  // Try-on state
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonImage, setTryonImage] = useState<string | null>(null);
  const [tryonError, setTryonError] = useState<string | null>(null);

  // Show full catalog?
  const [showCatalog, setShowCatalog] = useState(false);

  // ── Step 1: Capture foot photo ──
  const handleCapture = useCallback((base64Image: string) => {
    setFootImage(base64Image);
    setStep("analyzing");
    analyzeFoot(base64Image);
  }, []);

  // ── Step 2: Analyze foot ──
  const analyzeFoot = useCallback(async (base64Image: string) => {
    try {
      const res = await fetch("/api/admin/ai/analyze-foot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();

      if (!data.ok) {
        setStep("capture");
        alert(`Errore analisi: ${data.error?.message ?? "Errore sconosciuto"}`);
        return;
      }

      setAnalysis(data.data.footProfile);
      setSuggestions(data.data.suggestions);
      setStep("results");
    } catch {
      setStep("capture");
      alert("Errore di connessione. Riprova.");
    }
  }, []);

  // ── Select sandal from suggestions ──
  const handleSuggestionSelect = useCallback((product: ProductMatch) => {
    // Find the full product from catalog
    const fullProduct = catalog.find((p) => p.id === product.id);
    if (fullProduct) {
      setSelectedSandal(fullProduct);
      setSelectedOptions({});
      setTryonImage(null);
      setTryonError(null);
      setStep("tryon");
    }
  }, [catalog]);

  // ── Select sandal from full catalog ──
  const handleCatalogSelect = useCallback((product: AdvisorProduct) => {
    setSelectedSandal(product);
    setSelectedOptions({});
    setTryonImage(null);
    setTryonError(null);
    setStep("tryon");
  }, []);

  // ── Variant option change ──
  const handleOptionChange = useCallback((groupId: string, optionId: string, optionLabel: string, optionColor?: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (prev[groupId]?.id === optionId) {
        delete next[groupId];
      } else {
        next[groupId] = { id: optionId, label: optionLabel, color: optionColor };
      }
      return next;
    });
  }, []);

  // ── Generate try-on ──
  const handleTryOn = useCallback(async () => {
    if (!footImage || !selectedSandal) return;

    setTryonLoading(true);
    setTryonError(null);
    setTryonImage(null);

    try {
      const res = await fetch("/api/admin/ai/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImage: footImage,
          productSlug: selectedSandal.slug,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setTryonError(data.error?.message ?? "Errore sconosciuto");
        return;
      }

      setTryonImage(data.data.imageUrl);
    } catch {
      setTryonError("Errore di connessione. Riprova.");
    } finally {
      setTryonLoading(false);
    }
  }, [footImage, selectedSandal]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setStep("capture");
    setFootImage(null);
    setAnalysis(null);
    setSuggestions([]);
    setSelectedSandal(null);
    setSelectedOptions({});
    setTryonImage(null);
    setTryonError(null);
    setTryonLoading(false);
    setShowCatalog(false);
  }, []);

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Advisor</span>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Il Tuo Sandalo Perfetto</h2>
        </div>
        {step !== "capture" && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Nuova Analisi
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(["capture", "results", "tryon"] as const).map((s, i) => {
          const isActive = step === s || (s === "results" && step === "analyzing");
          const isDone = (s === "capture" && step !== "capture") ||
                         (s === "results" && step === "tryon");
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`h-0.5 w-8 ${isDone ? "bg-[var(--color-primary)]" : "bg-gray-200"}`} />}
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                isActive ? "bg-[var(--color-primary)] text-white" :
                isDone ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" :
                "bg-gray-100 text-gray-400"
              }`}>
                {isDone ? "✓" : i + 1}. {s === "capture" ? "Foto" : s === "results" ? "Analisi" : "Prova"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step: Capture / Analyzing */}
      {step === "capture" && (
        <FootCamera onCapture={handleCapture} />
      )}

      {step === "analyzing" && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-gray-50">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary)]" />
          <p className="mt-3 text-sm font-medium text-gray-600">Analisi del piede in corso...</p>
          <p className="mt-1 text-xs text-gray-400">L'AI sta analizzando forma, arco e larghezza</p>
        </div>
      )}

      {/* Step: Results — Analysis + Suggestions + Catalog */}
      {(step === "results" || step === "tryon") && analysis && (
        <>
          {/* Foot analysis card */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <FootAnalysis analysis={analysis} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && step !== "tryon" && (
            <SandalSuggestions
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
              selectedId={selectedSandal?.id}
            />
          )}

          {/* Toggle full catalog */}
          {step !== "tryon" && (
            <div>
              {!showCatalog ? (
                <button
                  type="button"
                  onClick={() => setShowCatalog(true)}
                  className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                >
                  Cerca nel catalogo completo →
                </button>
              ) : (
                <SandalCatalog
                  products={catalog}
                  onSelect={handleCatalogSelect}
                  selectedId={selectedSandal?.id}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Step: Try-on — Selected sandal + variant selector + try-on preview */}
      {step === "tryon" && selectedSandal && (
        <div className="space-y-6">
          {/* Selected sandal info */}
          <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
            {selectedSandal.imageUrl && (
              <img
                src={selectedSandal.imageUrl}
                alt={selectedSandal.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900">{selectedSandal.name}</p>
              <p className="text-sm text-[var(--color-primary)]">€{selectedSandal.price.toFixed(0)}</p>
              <p className="text-xs text-gray-400">{selectedSandal.categoryName}</p>
            </div>
          </div>

          {/* Variant selector */}
          {!!selectedSandal.variantConfig && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <VariantSelector
                variantConfig={selectedSandal.variantConfig}
                onOptionChange={handleOptionChange}
                selectedOptions={selectedOptions}
              />
            </div>
          )}

          {/* Generate try-on button */}
          <button
            type="button"
            onClick={handleTryOn}
            disabled={tryonLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {tryonLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5" />
            )}
            {tryonLoading ? "Generazione in corso..." : "Genera Prova Virtuale"}
          </button>

          {/* Try-on preview */}
          <TryOnPreview
            imageUrl={tryonImage}
            loading={tryonLoading}
            error={tryonError}
            productName={selectedSandal.name}
            onRetry={handleTryOn}
          />

          {/* Back to suggestions */}
          <button
            type="button"
            onClick={() => {
              setStep("results");
              setTryonImage(null);
              setTryonError(null);
            }}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Torna ai suggerimenti
          </button>
        </div>
      )}
    </div>
  );
}
