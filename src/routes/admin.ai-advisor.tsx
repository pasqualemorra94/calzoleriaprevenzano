/**
 * AI Foot Advisor — Admin page for in-store tablet.
 *
 * Flow:
 *  1. Capture foot photo (camera or upload) — OR resume from history
 *  2. AI analyzes foot → shows sandal suggestions + types to choose
 *  3. User selects a sandal (from suggestions or full catalog)
 *  4. Optionally customize variants (color, leather, heel)
 *  5. Generate virtual try-on preview (with selected variants applied)
 *  6. ALL generated try-ons are preserved in a scrollable gallery
 *
 * The AI analysis is used internally for matching but the detailed
 * foot profile (arch, width, shape) is NOT shown to the user.
 * Only recommendations and best/avoid features are displayed.
 *
 * Sessions are saved to DB — the user can resume a previous session
 * and skip directly to step 3 (select sandal + try-on).
 * Each session preserves ALL try-on history — generating a new try-on
 * with a different sandal does NOT overwrite previous results.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Loader2, Wand2, RotateCcw, History, ChevronLeft, ImageIcon } from "lucide-react";
import { FootCamera } from "~/components/admin/ai-advisor/FootCamera";
import { FootAnalysis } from "~/components/admin/ai-advisor/FootAnalysis";
import { SandalSuggestions } from "~/components/admin/ai-advisor/SandalSuggestions";
import { SandalCatalog } from "~/components/admin/ai-advisor/SandalCatalog";
import { VariantSelector } from "~/components/admin/ai-advisor/VariantSelector";
import { TryOnPreview } from "~/components/admin/ai-advisor/TryOnPreview";
import { SessionHistory } from "~/components/admin/ai-advisor/SessionHistory";
import { $getAdvisorCatalog } from "~/lib/admin-functions";
import type { AIFootAnalysisResult } from "~/lib/ai.server";
import type { ProductMatch, AdvisorProduct } from "~/lib/ai-advisor.server";
import type { TryOnHistoryEntry } from "~/lib/ai-sessions.server";

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

/** Selected variant option from the VariantSelector */
interface SelectedOption {
  id: string;
  label: string;
  groupLabel: string;
  imageUrl?: string;
}

function AIAdvisorPage() {
  const { catalog } = Route.useRouteContext() as AIAdvisorContext;

  // State machine
  const [step, setStep] = useState<Step>("capture");
  const [footImage, setFootImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIFootAnalysisResult | null>(null);
  const [suggestions, setSuggestions] = useState<ProductMatch[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Selected sandal
  const [selectedSandal, setSelectedSandal] = useState<AdvisorProduct | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption>>({});

  // Try-on state
  const [tryonLoading, setTryonLoading] = useState(false);
  const [tryonError, setTryonError] = useState<string | null>(null);

  // Try-on history (ALL generated images — preserved across sandal changes)
  const [tryonHistory, setTryonHistory] = useState<TryOnHistoryEntry[]>([]);

  // The currently viewed try-on image (latest by default, but can browse history)
  const [activeTryonImage, setActiveTryonImage] = useState<string | null>(null);

  // Show session history panel?
  const [showHistory, setShowHistory] = useState(false);

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
      setCurrentSessionId(data.data.sessionId ?? null);
      setStep("results");
    } catch {
      setStep("capture");
      alert("Errore di connessione. Riprova.");
    }
  }, []);

  // ── Resume session from history ──
  const handleResumeSession = useCallback(async (sessionId: string) => {
    setShowHistory(false);

    try {
      const res = await fetch(`/api/admin/ai/sessions/${sessionId}`);
      const data = await res.json();

      if (!data.ok) {
        alert("Sessione non trovata.");
        return;
      }

      const session = data.data;

      // Restore state from saved session
      setFootImage(session.footImage);
      setAnalysis(session.footProfile as AIFootAnalysisResult);
      setSuggestions((session.suggestions ?? []) as ProductMatch[]);
      setCurrentSessionId(sessionId);
      setSelectedSandal(null);
      setSelectedOptions({});
      setTryonError(null);
      setTryonLoading(false);

      // Restore try-on history (ALL previous try-ons, not just the latest)
      const history = Array.isArray(session.tryonHistory) ? session.tryonHistory as TryOnHistoryEntry[] : [];
      setTryonHistory(history);

      if (history.length > 0) {
        // Show the most recent try-on as the active image
        setActiveTryonImage(history[history.length - 1].imageUrl);
      } else {
        setActiveTryonImage(null);
      }

      // If session has try-ons, go directly to try-on step
      // (user can still browse catalog from there)
      if (history.length > 0) {
        const latest = history[history.length - 1];
        const product = catalog.find((p) => p.slug === latest.productSlug);
        if (product) {
          setSelectedSandal(product);
        }
        setStep("tryon");
      } else {
        setStep("results");
      }
    } catch {
      alert("Errore nel caricamento della sessione.");
    }
  }, [catalog]);

  // ── Select sandal from suggestions ──
  const handleSuggestionSelect = useCallback((product: ProductMatch) => {
    const fullProduct = catalog.find((p) => p.id === product.id);
    if (fullProduct) {
      setSelectedSandal(fullProduct);
      setSelectedOptions({});
      setTryonError(null);
      setStep("tryon");
    }
  }, [catalog]);

  // ── Select sandal from full catalog ──
  const handleCatalogSelect = useCallback((product: AdvisorProduct) => {
    setSelectedSandal(product);
    setSelectedOptions({});
    setTryonError(null);
    setStep("tryon");
  }, []);

  // ── Variant option change ──
  const handleOptionChange = useCallback((
    groupId: string,
    groupLabel: string,
    optionId: string,
    optionLabel: string,
    optionImageUrl?: string,
  ) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (prev[groupId]?.id === optionId) {
        delete next[groupId];
      } else {
        next[groupId] = { id: optionId, label: optionLabel, groupLabel, imageUrl: optionImageUrl };
      }
      return next;
    });
  }, []);

  // ── Generate try-on (with selected variants) ──
  const handleTryOn = useCallback(async () => {
    if (!footImage || !selectedSandal) return;

    setTryonLoading(true);
    setTryonError(null);

    try {
      const body: Record<string, unknown> = {
        personImage: footImage,
        productSlug: selectedSandal.slug,
      };
      if (currentSessionId) {
        body.sessionId = currentSessionId;
      }

      // Pass selected variants (with group label + imageUrl) for intelligent prompt
      const variantsArray = Object.values(selectedOptions);
      if (variantsArray.length > 0) {
        body.selectedVariants = variantsArray.map((opt) => {
          const groupId = Object.keys(selectedOptions).find((k) => selectedOptions[k]?.id === opt.id) ?? "";
          return {
            groupId,
            groupLabel: opt.groupLabel,
            optionId: opt.id,
            optionLabel: opt.label,
            optionImageUrl: opt.imageUrl,
          };
        });
      }

      const res = await fetch("/api/admin/ai/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.ok) {
        setTryonError(data.error?.message ?? "Errore sconosciuto");
        return;
      }

      const newImageUrl = data.data.imageUrl;
      setActiveTryonImage(newImageUrl);

      // Update try-on history (append, don't replace)
      if (data.data.tryonHistory && Array.isArray(data.data.tryonHistory)) {
        setTryonHistory(data.data.tryonHistory as TryOnHistoryEntry[]);
      }
    } catch {
      setTryonError("Errore di connessione. Riprova.");
    } finally {
      setTryonLoading(false);
    }
  }, [footImage, selectedSandal, currentSessionId, selectedOptions]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    setStep("capture");
    setFootImage(null);
    setAnalysis(null);
    setSuggestions([]);
    setSelectedSandal(null);
    setSelectedOptions({});
    setActiveTryonImage(null);
    setTryonError(null);
    setTryonLoading(false);
    setCurrentSessionId(null);
    setTryonHistory([]);
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
        <div className="flex items-center gap-2">
          {!showHistory && (
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <History className="h-4 w-4" />
              Storico
            </button>
          )}
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
      </div>

      {/* Session history panel — overlay, visible from any step */}
      {showHistory ? (
        <div className="rounded-xl bg-gray-50 p-5">
          <SessionHistory
            onResume={handleResumeSession}
            onClose={() => setShowHistory(false)}
          />
        </div>
      ) : (
        <>
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
                    {isDone ? "✓" : i + 1}. {s === "capture" ? "Foto" : s === "results" ? "Suggerimenti" : "Prova"}
                  </div>
                </div>
              );
            })}
            {currentSessionId && (
              <>
                <div className="h-0.5 w-4 bg-green-200" />
                <div className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-600">
                  {tryonHistory.length > 0
                    ? `${tryonHistory.length} prove salvate`
                    : "Sessione salvata"}
                </div>
              </>
            )}
          </div>

          {/* Step: Capture / Analyzing */}
          {step === "capture" && (
            <FootCamera onCapture={handleCapture} />
          )}

          {step === "analyzing" && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl bg-gray-50">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary)]" />
              <p className="mt-3 text-sm font-medium text-gray-600">Analisi in corso...</p>
              <p className="mt-1 text-xs text-gray-400">L'AI sta cercando i sandali più adatti per te</p>
            </div>
          )}

          {/* Step: Results — Recommendations + Suggestions + Catalog */}
          {(step === "results" || step === "tryon") && analysis && (
            <>
              {/* AI recommendations (NO foot profile — only suggestions) */}
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <FootAnalysis analysis={analysis} />
              </div>

              {/* Suggested sandals */}
              {suggestions.length > 0 && step !== "tryon" && (
                <SandalSuggestions
                  suggestions={suggestions}
                  onSelect={handleSuggestionSelect}
                  selectedId={selectedSandal?.id}
                />
              )}

              {/* Full catalog — always visible */}
              {step !== "tryon" && (
                <SandalCatalog
                  products={catalog}
                  onSelect={handleCatalogSelect}
                  selectedId={selectedSandal?.id}
                />
              )}
            </>
          )}

          {/* Step: Try-on — Selected sandal + variant selector + history + try-on preview */}
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

              {/* Active variants summary */}
              {Object.keys(selectedOptions).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Varianti selezionate:</span>
                  {Object.values(selectedOptions).map((opt) => (
                    <span
                      key={opt.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]"
                    >
                      {opt.imageUrl && (
                        <img src={opt.imageUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                      )}
                      {opt.groupLabel}: {opt.label}
                    </span>
                  ))}
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
                {tryonLoading
                  ? "Generazione in corso..."
                  : tryonHistory.length > 0
                    ? "Genera Nuova Prova Virtuale"
                    : Object.keys(selectedOptions).length > 0
                      ? "Genera Prova Virtuale con Varianti"
                      : "Genera Prova Virtuale"}
              </button>

              {/* Try-on preview (latest / active) */}
              <TryOnPreview
                imageUrl={activeTryonImage}
                loading={tryonLoading}
                error={tryonError}
                productName={selectedSandal.name}
                onRetry={handleTryOn}
              />

              {/* Try-on history gallery */}
              {tryonHistory.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    📸 Prove precedenti ({tryonHistory.length - 1})
                  </h4>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {[...tryonHistory].reverse().slice(1).map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setActiveTryonImage(entry.imageUrl)}
                        className={`group relative overflow-hidden rounded-lg border-2 transition ${
                          activeTryonImage === entry.imageUrl
                            ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <div className="aspect-[3/4] overflow-hidden">
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              alt={`Prova: ${entry.productName}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-50">
                              <ImageIcon className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-1.5">
                          <p className="truncate text-[10px] font-medium text-gray-700">{entry.productName}</p>
                          {entry.selectedVariants && entry.selectedVariants.length > 0 && (
                            <p className="truncate text-[9px] text-gray-400">
                              {entry.selectedVariants.map((v) => v.optionLabel).join(", ")}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep("results");
                    setTryonError(null);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Torna ai suggerimenti
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
