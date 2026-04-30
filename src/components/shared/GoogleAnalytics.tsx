/// <reference types="vite/client" />
/**
 * GoogleAnalytics — side-effect-only component.
 *
 * Inietta GA4 (gtag.js) SOLO dopo consenso `analytics` via `loadScriptWithConsent`.
 * Auto-disattiva (no-op) se `VITE_GA4_MEASUREMENT_ID` e' assente o vuoto.
 * Su revoca successiva del consenso analytics, ricarica la pagina per pulire i cookie `_ga`.
 *
 * Consent Mode v2 "basic": NESSUNA chiamata a gtag prima del consenso (no denied pings).
 */
import { useEffect } from "react";
import { loadScriptWithConsent } from "~/lib/cookieConsent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

export function GoogleAnalytics(): null {
  // Loader: aggancia gtag.js dopo consenso analytics.
  useEffect(() => {
    if (!MEASUREMENT_ID) return;

    const loadGtag = (): void => {
      // Idempotenza injection script
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function gtag(...args: unknown[]): void {
          (window.dataLayer as unknown[]).push(args);
        };

      window.gtag("js", new Date());
      window.gtag("config", MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    };

    loadScriptWithConsent("analytics", loadGtag);
  }, []);

  // Listener revoke: se utente revoca analytics post-load, reload per pulire cookie _ga.
  useEffect(() => {
    if (!MEASUREMENT_ID) return;

    const handler = (e: Event): void => {
      if (!(e instanceof CustomEvent)) return;
      const detail = e.detail as { category?: string; consented?: boolean } | null;
      if (
        detail?.category === "analytics" &&
        detail.consented === false &&
        typeof window.gtag === "function"
      ) {
        window.location.reload();
      }
    };

    window.addEventListener("consent-update", handler);
    return () => window.removeEventListener("consent-update", handler);
  }, []);

  return null;
}
