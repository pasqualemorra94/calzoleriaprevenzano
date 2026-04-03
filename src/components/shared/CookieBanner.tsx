"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { X, Settings } from "lucide-react";
import { cn } from "~/lib/utils/cn";
import {
  getConsent,
  saveConsent,
  dispatchConsentUpdate,
  type CookieConsent,
} from "~/lib/cookieConsent";
import { CookiePreferencesPanel } from "./CookiePreferencesPanel";

interface CookieBannerProps {
  className?: string;
}

export function CookieBanner({ className }: CookieBannerProps): ReactNode {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const stored = getConsent();
    if (stored) {
      setConsent(stored);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const persistAndClose = useCallback(
    (preferences: Omit<CookieConsent, "version">) => {
      const fullConsent: CookieConsent = { ...preferences, version: 1 };
      saveConsent(fullConsent);
      setConsent(fullConsent);
      setIsVisible(false);
      setShowPreferences(false);
      dispatchConsentUpdate("analytics", preferences.analytics);
      dispatchConsentUpdate("marketing", preferences.marketing);
      fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      }).catch(() => { /* Server logging is best-effort */ });
    },
    [],
  );

  const handleAcceptAll = useCallback(() => {
    persistAndClose({
      necessary: true, preferences: true,
      analytics: true, marketing: true, timestamp: Date.now(),
    });
  }, [persistAndClose]);

  const handleRejectAll = useCallback(() => {
    persistAndClose({
      necessary: true, preferences: false,
      analytics: false, marketing: false, timestamp: Date.now(),
    });
  }, [persistAndClose]);

  const handleSavePreferences = useCallback(() => {
    persistAndClose({
      necessary: true, preferences: true,
      analytics: analyticsEnabled, marketing: marketingEnabled, timestamp: Date.now(),
    });
  }, [analyticsEnabled, marketingEnabled, persistAndClose]);

  if (consent !== null || !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consenso Cookie"
      className={cn("fixed bottom-0 left-0 right-0 z-[var(--z-toast)] p-4 md:p-6", className)}
    >
      <div className="mx-auto max-w-[var(--page-max-width)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <button
          onClick={handleRejectAll}
          aria-label="Chiudi banner cookie"
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 mb-5 pr-8">
          <h3 className="font-display text-base font-semibold text-[var(--color-text)] mb-2">
            Rispettiamo la tua privacy
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Utilizziamo cookie tecnici necessari al funzionamento del sito e, previo tuo consenso,
            cookie analitici e di marketing per migliorare la tua esperienza.
            Per saperne di più consulta la nostra{" "}
            <a href="/cookie" className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-dark)]">
              Cookie Policy
            </a>
            .
          </p>
        </div>

        {showPreferences && (
          <CookiePreferencesPanel
            analyticsEnabled={analyticsEnabled}
            marketingEnabled={marketingEnabled}
            onAnalyticsChange={setAnalyticsEnabled}
            onMarketingChange={setMarketingEnabled}
          />
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {showPreferences && (
            <button
              onClick={handleSavePreferences}
              className="order-2 sm:order-1 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              Salva preferenze
            </button>
          )}

          {showPreferences ? (
            <button
              onClick={() => setShowPreferences(false)}
              className="order-1 sm:order-2 rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
            >
              Indietro
            </button>
          ) : (
            <button
              onClick={() => setShowPreferences(true)}
              className="order-1 sm:order-2 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <Settings className="h-3.5 w-3.5" />
              Personalizza
            </button>
          )}

          {!showPreferences && (
            <>
              <button
                onClick={handleRejectAll}
                className="order-1 rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
              >
                Rifiuta tutto
              </button>
              <button
                onClick={handleAcceptAll}
                className="order-3 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Accetta tutti
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
