"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils/cn";

type CookieConsent = "accepted" | "rejected" | null;

const COOKIE_CONSENT_KEY = "cookie-consent";

interface CookieBannerProps {
  className?: string;
}

export function CookieBanner({ className }: CookieBannerProps): ReactNode {
  const [consent, setConsent] = useState<CookieConsent>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Read consent from localStorage
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsent | null;
    if (stored) {
      setConsent(stored);
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
    setIsVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setConsent("rejected");
    setIsVisible(false);
  }, []);

  // Don't render if consent already given
  if (consent !== null || !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consenso Cookie"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[var(--z-toast)] p-4 md:p-6",
        className,
      )}
    >
      <div className="mx-auto max-w-[var(--page-max-width)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg md:flex md:items-center md:justify-between md:gap-8">
        {/* Close button */}
        <button
          onClick={handleReject}
          aria-label="Chiudi banner cookie"
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] md:hidden"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 mb-4 md:mb-0 md:pr-8">
          <p className="text-sm text-[var(--color-text)] leading-relaxed">
            Utilizziamo cookie tecnici necessari al funzionamento del sito e, previo tuo consenso,
            cookie di profilazione per migliorare la tua esperienza.
            Per saperne di più consulta la nostra{" "}
            <a
              href="/cookie"
              className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-dark)]"
            >
              Cookie Policy
            </a>
            .
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]"
          >
            Rifiuta
          </button>
          <button
            onClick={handleAccept}
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  );
}
