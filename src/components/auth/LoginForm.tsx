"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import type { LoginInput } from "~/lib/validators/auth";

/**
 * LoginForm — Login page component.
 * Uses @tanstack/react-form with Zod validation.
 * Submits to Better Auth via authClient.signIn.email().
 */
export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setServerError(null);
      setIsLoading(true);

      try {
        const { error } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (error) {
          const message = error.message ?? "Errore durante il login. Riprova.";
          setServerError(message);
          return;
        }

        // Redirect after successful login
        window.location.href = "/";
      } catch {
        setServerError("Errore di connessione. Riprova.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
      {/* Back link */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna allo shop
      </Link>

      {/* Error alert */}
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
        {/* Email field */}
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "L'email è obbligatoria";
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email non valida";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)]">
                Email
              </label>
              <input
                id="email"
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
                <p className="text-xs text-[var(--color-destructive)]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Password field */}
        <form.Field name="password">
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                  className="block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  placeholder="••••••••••••"
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
                <p className="text-xs text-[var(--color-destructive)]">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            to="/auth/forgot-password"
            className="text-sm text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
          >
            Password dimenticata?
          </Link>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Accedi
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Non hai un account?{" "}
        <Link
          to="/auth/register"
          className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
        >
          Registrati
        </Link>
      </p>
    </div>
  );
}
