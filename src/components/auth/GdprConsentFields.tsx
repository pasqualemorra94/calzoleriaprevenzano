"use client";

// TanStack Form v1.28 doesn't export stable FieldApi types for render props.
// The form.Field component infers field types from the parent useForm generic.
// This is safe — type checking is enforced at the useForm level in RegisterForm.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormApi = any;

interface GdprConsentFieldsProps {
  form: FormApi;
}

/**
 * GDPR consent checkboxes required for Italian registration.
 * Extracted from RegisterForm to respect 200 LOC limit.
 */
export function GdprConsentFields({ form }: GdprConsentFieldsProps) {
  return (
    <div className="space-y-4 border-t border-[var(--color-border)] pt-5">
      {/* Privacy policy — REQUIRED */}
      <form.Field
        name="privacyPolicy"
        validators={{
          onChange: ({ value }: { value: boolean }) => {
            if (!value) return "Devi accettare l'Informativa sulla Privacy";
            return undefined;
          },
        }}
      >
        {(field: { state: { value: boolean; meta: { errors: string[] } }; handleChange: (v: boolean) => void }) => (
          <div className="flex items-start gap-3">
            <input
              id="privacyPolicy"
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked as true)}
              aria-required="true"
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <label htmlFor="privacyPolicy" className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Ho letto e accetto l&apos;{" "}
              <a href="/privacy" className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-dark)]">
                Informativa sulla Privacy
              </a>{" "}
              e i{" "}
              <a href="/termini" className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-dark)]">
                Termini di Servizio
              </a>{" "}
              <span className="text-[var(--color-destructive)]">*</span>
            </label>
          </div>
        )}
      </form.Field>

      {/* Age confirmation — REQUIRED */}
      <form.Field
        name="ageConfirmation"
        validators={{
          onChange: ({ value }: { value: boolean }) => {
            if (!value) return "Devi dichiarare di avere almeno 16 anni";
            return undefined;
          },
        }}
      >
        {(field: { state: { value: boolean }; handleChange: (v: boolean) => void }) => (
          <div className="flex items-start gap-3">
            <input
              id="ageConfirmation"
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked as true)}
              aria-required="true"
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <label htmlFor="ageConfirmation" className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Dichiaro di avere almeno 16 anni{" "}
              <span className="text-[var(--color-destructive)]">*</span>
            </label>
          </div>
        )}
      </form.Field>

      {/* Marketing consent — OPTIONAL */}
      <form.Field name="marketingConsent">
        {(field: { state: { value: boolean }; handleChange: (v: boolean) => void }) => (
          <div className="flex items-start gap-3">
            <input
              id="marketingConsent"
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked as true)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <label htmlFor="marketingConsent" className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Acconsento al ricevimento di comunicazioni promozionali via email{" "}
              <span className="text-[var(--color-text-muted)]">(facoltativo)</span>
            </label>
          </div>
        )}
      </form.Field>
    </div>
  );
}
