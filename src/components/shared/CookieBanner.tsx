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

  // Body scroll lock + ESC handler quando il modal preferenze mobile è aperto
  useEffect(() => {
    if (!showPreferences) return;
    const original = document.body.style.overflow;
    const mq = window.matchMedia("(max-width: 767px)");
    if (mq.matches) {
      document.body.style.overflow = "hidden";
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPreferences(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [showPreferences]);

  if (consent !== null || !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consenso Cookie"
      className={cn("fixed bottom-0 left-0 right-0 z-[var(--z-toast)] p-3 md:p-6", className)}
    >
      <div className="mx-auto max-w-[var(--page-max-width)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6 shadow-lg">
        <button
          onClick={handleRejectAll}
          aria-label="Chiudi banner cookie"
          className="absolute right-4 top-4 hidden md:block rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Mobile: testo conciso, no h3 */}
        <div className="flex-1 mb-3 md:hidden">
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Usiamo cookie tecnici e, con il tuo consenso, analitici.{" "}
            <a href="/cookie" className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-dark)]">
              Cookie Policy
            </a>
          </p>
        </div>

        {/* Desktop: layout completo invariato */}
        <div className="hidden md:block flex-1 mb-5 pr-8">
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

        {/* DESKTOP: pannello inline (≥md) */}
        {showPreferences && (
          <div className="hidden md:block">
            <CookiePreferencesPanel
              analyticsEnabled={analyticsEnabled}
              marketingEnabled={marketingEnabled}
              onAnalyticsChange={setAnalyticsEnabled}
              onMarketingChange={setMarketingEnabled}
            />
          </div>
        )}

        {/* MOBILE: modal full-screen (<md) */}
        {showPreferences && (
          <div
            className="md:hidden fixed inset-0 z-[var(--z-modal)] bg-black/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Preferenze cookie"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPreferences(false);
            }}
          >
            <div className="bg-[var(--color-surface)] rounded-lg w-[90vw] max-w-md max-h-[80vh] overflow-y-auto p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                  Preferenze cookie
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  aria-label="Chiudi preferenze"
                  className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CookiePreferencesPanel
                analyticsEnabled={analyticsEnabled}
                marketingEnabled={marketingEnabled}
                onAnalyticsChange={setAnalyticsEnabled}
                onMarketingChange={setMarketingEnabled}
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="flex-1 h-10 rounded-md border border-[var(--color-border)] bg-transparent text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-muted)]"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="flex-1 h-10 rounded-md bg-[var(--color-primary)] text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)]"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE: 2 bottoni primari + link Personalizza sotto */}
        {!showPreferences && (
          <div className="md:hidden">
            <div className="flex gap-2">
              <button
                onClick={handleRejectAll}
                className="flex-1 h-10 rounded-md border border-[var(--color-border)] bg-transparent text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
              >
                Rifiuta
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 h-10 rounded-md bg-[var(--color-primary)] text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Accetta
              </button>
            </div>
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowPreferences(true)}
                className="text-xs underline text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Personalizza preferenze
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP: layout esistente invariato (3 bottoni in fila + showPreferences logic) */}
        <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
