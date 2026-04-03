"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import type { ResetPasswordInput } from "~/lib/validators/auth";

/**
 * ResetPasswordForm — New password form after password reset.
 * Uses Better Auth's resetPassword endpoint.
 * Reads the token from URL search params.
 */
export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<ResetPasswordInput>({
    defaultValues: {
      token: new URLSearchParams(window.location.search).get("token") ?? "",
      password: "",
      confirmPassword: "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setServerError(null);
      setIsLoading(true);

      try {
        const { error } = await authClient.resetPassword({
          newPassword: value.password,
          token: value.token,
        });

        if (error) {
          setServerError(error.message ?? "Errore durante il reset. Il link potrebbe essere scaduto.");
          return;
        }

        setSuccess(true);
      } catch {
        setServerError("Errore di connessione. Riprova.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (success) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="font-display text-base font-semibold text-[var(--color-text)]">
          Password aggiornata!
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          La tua password è stata reimpostata con successo.
          Ora puoi accedere con la nuova password.
        </p>
        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          Accedi
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
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
        <form.Field name="password">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="block text-sm font-medium text-[var(--color-text)]">
                Nuova password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  className="block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="Min. 12 caratteri, maiuscola + numero + simbolo"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-[var(--color-destructive)]">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor="new-confirm-password" className="block text-sm font-medium text-[var(--color-text)]">
                Conferma nuova password
              </label>
              <input
                id="new-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
                className="block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="Ripeti la nuova password"
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
          Reimposta password
        </button>
      </form>
    </div>
  );
}
