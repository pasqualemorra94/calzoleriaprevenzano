"use client";

import type { ReactNode } from "react";

interface CookiePreferencesPanelProps {
  analyticsEnabled: boolean;
  marketingEnabled: boolean;
  onAnalyticsChange: (checked: boolean) => void;
  onMarketingChange: (checked: boolean) => void;
}

/**
 * Granular cookie preferences panel with toggle switches.
 * Extracted from CookieBanner to respect 200 LOC limit.
 */
export function CookiePreferencesPanel({
  analyticsEnabled,
  marketingEnabled,
  onAnalyticsChange,
  onMarketingChange,
}: CookiePreferencesPanelProps): ReactNode {
  return (
    <div className="mb-5 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-4">
      {/* Necessary — always enabled */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">Cookie necessari</p>
          <p className="text-xs text-[var(--color-text-muted)]">Richiesti per il funzionamento del sito</p>
        </div>
        <div className="flex h-5 w-9 items-center rounded-full bg-[var(--color-primary)] px-0.5">
          <div className="h-4 w-4 translate-x-4 rounded-full bg-white shadow-sm" />
        </div>
        <span className="ml-2 text-xs text-[var(--color-text-muted)]">Sempre attivi</span>
      </div>

      {/* Analytics */}
      <label className="flex items-center justify-between cursor-pointer group">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">Cookie analitici</p>
          <p className="text-xs text-[var(--color-text-muted)]">Ci aiutano a capire come usi il sito</p>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            checked={analyticsEnabled}
            onChange={(e) => onAnalyticsChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="h-5 w-9 rounded-full bg-[var(--color-muted)] peer-checked:bg-[var(--color-primary)] transition-colors" />
          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
      </label>

      {/* Marketing */}
      <label className="flex items-center justify-between cursor-pointer group">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">Cookie di marketing</p>
          <p className="text-xs text-[var(--color-text-muted)]">Per mostrarti contenuti pertinenti</p>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            checked={marketingEnabled}
            onChange={(e) => onMarketingChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="h-5 w-9 rounded-full bg-[var(--color-muted)] peer-checked:bg-[var(--color-primary)] transition-colors" />
          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
      </label>
    </div>
  );
}
