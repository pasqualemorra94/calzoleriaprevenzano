/**
 * FootAnalysis — Displays AI sandal recommendations (no foot profile).
 *
 * Shows ONLY:
 * - AI recommendation text (which sandals to choose)
 * - Best sandal features to look for
 * - Features to avoid
 *
 * The detailed foot profile (arch, width, shape, etc.) is used internally
 * for product matching but is NOT displayed to the user.
 */

import type { AIFootAnalysisResult } from "~/lib/ai.server";
import { CheckCircle, XCircle, Sparkles } from "lucide-react";

interface FootAnalysisProps {
  analysis: AIFootAnalysisResult;
}

export function FootAnalysis({ analysis }: FootAnalysisProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
        <h3 className="text-lg font-semibold text-gray-900">Consigli per Te</h3>
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
            Tipologie di sandalo consigliate
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
            Tipologie da evitare
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
