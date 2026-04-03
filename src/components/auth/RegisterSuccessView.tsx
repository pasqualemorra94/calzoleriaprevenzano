"use client";

import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Registration success view — shown after successful account creation.
 * Extracted from RegisterForm to respect 200 LOC limit.
 */
export function RegisterSuccessView() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <Check className="h-6 w-6 text-green-600" />
      </div>
      <h2 className="font-display text-base font-semibold text-[var(--color-text)]">
        Registrazione completata!
      </h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Controlla la tua casella email per verificare l&apos;indirizzo.
        Ti abbiamo inviato un link di conferma.
      </p>
      <Link
        to="/auth/login"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
      >
        Vai al login
      </Link>
    </div>
  );
}
