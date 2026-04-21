/**
 * FootAnalysis — Displays the AI foot analysis results.
 *
 * Shows:
 * - Visual foot profile (arch, width, shape)
 * - AI recommendation text
 * - Suggested sandal features to look for
 * - Features to avoid
 * - Confidence score
 */

import type { AIFootAnalysisResult } from "~/lib/ai.server";
import { CheckCircle, XCircle, Info, Brain } from "lucide-react";

interface FootAnalysisProps {
  analysis: AIFootAnalysisResult;
}

const LABELS: Record<string, string> = {
  high: "Alto",
  medium: "Medio",
  low: "Basso",
  flat: "Piatto",
  narrow: "Stretto",
  normal: "Normale",
  wide: "Largo",
  "extra-wide": "Molto largo",
  greek: "Greco (2° dito lungo)",
  egyptian: "Egiziano (alluce dominante)",
  roman: "Romano (dita uguali)",
  square: "Quadrato",
  tapered: "Affusolato",
  long: "Lunghe",
  average: "Medie",
  short: "Corte",
};

export function FootAnalysis({ analysis }: FootAnalysisProps) {
  const confidencePercent = Math.round(analysis.confidence * 100);
  const isLowConfidence = analysis.confidence < 0.5;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-[var(--color-primary)]" />
        <h3 className="text-lg font-semibold text-gray-900">Profilo Piede</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          isLowConfidence ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
        }`}>
          Affidabilità {confidencePercent}%
        </span>
      </div>

      {isLowConfidence && (
        <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>La foto potrebbe non essere ideale. Per risultati migliori, scatta la foto del piede su un sfondo chiaro, dall'alto, con buona illuminazione.</p>
        </div>
      )}

      {/* Profile metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ProfileCard label="Arco" value={LABELS[analysis.arch] ?? analysis.arch} />
        <ProfileCard label="Larghezza" value={LABELS[analysis.width] ?? analysis.width} />
        <ProfileCard label="Forma" value={LABELS[analysis.shape] ?? analysis.shape} />
        <ProfileCard label="Collo" value={LABELS[analysis.instep] ?? analysis.instep} />
        <ProfileCard label="Dita" value={LABELS[analysis.toes] ?? analysis.toes} />
      </div>

      {/* Recommendation */}
      <div className="rounded-lg bg-[var(--color-primary)]/5 p-4">
        <p className="text-sm leading-relaxed text-gray-700">{analysis.recommendation}</p>
      </div>

      {/* Best features / Avoid features */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-green-800">
            <CheckCircle className="h-4 w-4" />
            Cerca questi dettagli
          </h4>
          <ul className="space-y-1">
            {analysis.bestSandalFeatures.map((feature) => (
              <li key={feature} className="text-sm text-green-700">• {feature}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-red-800">
            <XCircle className="h-4 w-4" />
            Evita se possibile
          </h4>
          <ul className="space-y-1">
            {analysis.avoidFeatures.map((feature) => (
              <li key={feature} className="text-sm text-red-700">• {feature}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
