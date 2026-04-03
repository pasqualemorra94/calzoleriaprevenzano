"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import type { ForgotPasswordInput } from "~/lib/validators/auth";

/**
 * ForgotPasswordForm — Password reset request form.
 * Uses Better Auth's forgetPassword endpoint.
 * Always returns success to prevent email enumeration.
 */
export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<ForgotPasswordInput>({
    defaultValues: {
      email: "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setServerError(null);
      setIsLoading(true);

      try {
        await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        // Always show success to prevent email enumeration
        setEmailSent(true);
      } catch {
        setServerError("Errore di connessione. Riprova.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (emailSent) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-[var(--color-text)]">
          Email inviata
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Se l'indirizzo email è registrato nel nostro sistema, riceverai un link per reimpostare la password entro pochi minuti.
        </p>
        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          Torna al login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
      <Link
        to="/auth/login"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna al login
      </Link>

      {serverError && (
        <div className="mb-6 rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
          <p className="text-sm text-[var(--color-destructive)]">{serverError}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="block text-sm font-medium text-[var(--color-text)]">
                Indirizzo email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
                className="block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="la.tua@email.it"
              />
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-[var(--color-destructive)]">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Invia link di reset
        </button>
      </form>
    </div>
  );
}
