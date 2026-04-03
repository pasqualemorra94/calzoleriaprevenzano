"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { authClient } from "~/lib/auth-client";
import type { RegisterInput } from "~/lib/validators/auth";
import { GdprConsentFields } from "./GdprConsentFields";
import { RegisterSuccessView } from "./RegisterSuccessView";
import { FormField } from "./FormField";

/**
 * RegisterForm — Registration page component.
 * Uses @tanstack/react-form with Zod validation.
 * Submits to Better Auth via authClient.signUp.email().
 * GDPR consent checkboxes are handled client-side (Italian requirement).
 */
export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<RegisterInput>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      privacyPolicy: false,
      ageConfirmation: false,
      marketingConsent: false,
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      setServerError(null);
      setIsLoading(true);
      try {
        const { error } = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });

        if (error) {
          const message = error.message ?? "Errore durante la registrazione. Riprova.";
          setServerError(message);
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

  if (success) return <RegisterSuccessView />;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna allo shop
      </Link>

      {serverError && (
        <div className="mb-6 rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
          <p className="text-sm text-[var(--color-destructive)]">{serverError}</p>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="space-y-5"
      >
        <form.Field name="name">
          {(field) => (
            <FormField
              id="name" label="Nome completo" type="text" autoComplete="name"
              placeholder="Mario Rossi" value={field.state.value}
              onChange={field.handleChange} onBlur={field.handleBlur}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <FormField
              id="register-email" label="Email" type="email" autoComplete="email"
              placeholder="la.tua@email.it" value={field.state.value}
              onChange={field.handleChange} onBlur={field.handleBlur}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormField
              id="register-password" label="Password"
              type={showPassword ? "text" : "password"} autoComplete="new-password"
              placeholder="Min. 12 caratteri, maiuscola + numero + simbolo"
              value={field.state.value} onChange={field.handleChange}
              onBlur={field.handleBlur} errors={field.state.meta.errors}
            >
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </FormField>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <FormField
              id="confirmPassword" label="Conferma password"
              type={showPassword ? "text" : "password"} autoComplete="new-password"
              placeholder="Ripeti la password" value={field.state.value}
              onChange={field.handleChange} onBlur={field.handleBlur}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <GdprConsentFields form={form} />

        <button
          type="submit" disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
        Hai già un account?{" "}
        <Link to="/auth/login" className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]">
          Accedi
        </Link>
      </p>
    </div>
  );
}
