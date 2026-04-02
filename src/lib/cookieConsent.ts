/**
 * Cookie Consent Management — client + server
 *
 * Handles GDPR-compliant script loading based on user consent.
 * Technical cookies (session, CSRF) are exempt from consent.
 */

export type ConsentCategory = "necessary" | "preferences" | "analytics" | "marketing";

export interface CookieConsent {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: number;
}

const CONSENT_KEY = "consent_preferences";
const CONSENT_VERSION = 1;

/**
 * Get current consent from cookie header (server-side).
 */
export function getConsentFromCookie(cookieHeader: string | null): CookieConsent | null {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/consent_preferences=([^;]+)/);
  if (!match) return null;

  try {
    const data = JSON.parse(decodeURIComponent(match[1])) as CookieConsent;
    if (data.version !== CONSENT_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Build Set-Cookie header value for consent preferences.
 */
export function setConsentCookie(consent: Omit<CookieConsent, "version">): string {
  const fullConsent: CookieConsent = { ...consent, version: CONSENT_VERSION };
  const value = encodeURIComponent(JSON.stringify(fullConsent));
  return `consent_preferences=${value}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
}

/**
 * Check if specific category is consented (client-side).
 */
export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as { consent: CookieConsent; version: number };
    if (data.version !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    return data.consent;
  } catch {
    return null;
  }
}

export function saveConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ consent, version: CONSENT_VERSION }));
}

export function hasConsent(category: Exclude<ConsentCategory, "necessary">): boolean {
  const consent = getConsent();
  return consent?.[category] ?? false;
}

/**
 * Load script only if consent is given (client-side).
 */
export function loadScriptWithConsent(
  category: Exclude<ConsentCategory, "necessary">,
  scriptLoader: () => void,
): void {
  if (typeof window === "undefined") return;

  if (hasConsent(category)) {
    scriptLoader();
    return;
  }

  const handleConsentChange = (e: StorageEvent | CustomEvent) => {
    if ("key" in e && e.key === CONSENT_KEY && hasConsent(category)) {
      scriptLoader();
      window.removeEventListener("storage", handleConsentChange as EventListener);
      window.removeEventListener("consent-update", handleConsentChange as EventListener);
    } else if ("detail" in e && e.detail.category === category && e.detail.consented) {
      scriptLoader();
      window.removeEventListener("storage", handleConsentChange as EventListener);
      window.removeEventListener("consent-update", handleConsentChange as EventListener);
    }
  };

  window.addEventListener("storage", handleConsentChange as EventListener);
  window.addEventListener("consent-update", handleConsentChange as EventListener);
}

export function dispatchConsentUpdate(category: string, consented: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("consent-update", { detail: { category, consented } }),
  );
}
