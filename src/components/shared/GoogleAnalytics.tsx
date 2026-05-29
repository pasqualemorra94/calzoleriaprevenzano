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

// Letto a runtime dal meta tag iniettato SSR in __root.tsx.
// Necessario perché Railway non passa env vars al build Docker,
// quindi import.meta.env.VITE_* viene risolto a undefined al build.
function getMeasurementId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const meta = document.querySelector('meta[name="x-ga4-id"]');
  const content = meta?.getAttribute("content");
  return content && content.length > 0 ? content : undefined;
}

export function GoogleAnalytics(): null {
  // Loader: aggancia gtag.js dopo consenso analytics.
  useEffect(() => {
    const MEASUREMENT_ID = getMeasurementId();
    // eslint-disable-next-line no-console
    console.info("[GA4] init", { hasMeasurementId: Boolean(MEASUREMENT_ID), id: MEASUREMENT_ID });
    if (!MEASUREMENT_ID) return;

    const loadGtag = (): void => {
      // eslint-disable-next-line no-console
      console.info("[GA4] loadGtag fired — consent OK");

      // Init dataLayer + gtag stub PRIMA dell'append (pattern Google ufficiale)
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        (function gtag(): void {
          // biome-ignore lint/style/noArguments: gtag.js richiede l'oggetto arguments nativo (pattern ufficiale Google), non un array — vedi diagnosi /collect
          (window.dataLayer as unknown[]).push(arguments);
        } as (...args: unknown[]) => void);

      window.gtag("js", new Date());
      window.gtag("config", MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });

      // eslint-disable-next-line no-console
      console.info("[GA4] dataLayer dopo config", window.dataLayer);

      // Idempotenza injection script
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        // eslint-disable-next-line no-console
        console.info("[GA4] gtag.js già presente, skip injection");
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      script.onload = () => {
        // eslint-disable-next-line no-console
        console.info("[GA4] gtag.js caricato", { dataLayerLen: window.dataLayer?.length });
      };
      script.onerror = (err) => {
        // eslint-disable-next-line no-console
        console.error("[GA4] gtag.js FALLITO il caricamento", err);
      };
      document.head.appendChild(script);
      // eslint-disable-next-line no-console
      console.info("[GA4] script appeso al DOM:", script.src);
    };

    // eslint-disable-next-line no-console
    console.info("[GA4] in attesa di consenso analytics…");
    loadScriptWithConsent("analytics", loadGtag);
  }, []);

  // Listener revoke: se utente revoca analytics post-load, reload per pulire cookie _ga.
  useEffect(() => {
    if (!getMeasurementId()) return;

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
