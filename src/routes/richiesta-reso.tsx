import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/richiesta-reso")({
  component: ReturnRequestPage,
});

interface ReturnRequestInput {
  fullName: string;
  email: string;
  orderNumber: string;
  reason: string;
  acceptedPolicy: boolean;
}

const inputClass =
  "block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60";

/** Estrae il primo messaggio di errore di un field TanStack Form come stringa stampabile. */
function firstErrorMessage(errors: unknown): string | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first: unknown = errors[0];
  if (first == null) return null;
  if (typeof first === "string") return first;
  if (typeof first === "object" && "message" in first) {
    const msg = (first as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return String(first);
}

function ReturnRequestPage(): ReactNode {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // @ts-expect-error — TanStack Form v1.28 strict generic typing; works at runtime
  const form = useForm<ReturnRequestInput>({
    defaultValues: {
      fullName: "",
      email: "",
      orderNumber: "",
      reason: "",
      acceptedPolicy: false,
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }: { value: ReturnRequestInput }) => {
      setServerError(null);
      setIsLoading(true);
      try {
        const res = await fetch("/api/return-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: { message?: string };
        };
        if (!res.ok) {
          const msg = json.error?.message ?? "Errore durante l'invio. Riprova.";
          setServerError(msg);
          toast.error(msg);
          return;
        }
        toast.success("Richiesta inviata. Controlla la tua email.");
        navigate({ to: "/richiesta-inviata" });
      } catch {
        const msg = "Errore di connessione. Riprova tra qualche istante.";
        setServerError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <Link
        to="/resi-e-recesso"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
      >
        &larr; Torna a Resi e Recesso
      </Link>

      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">
        Richiesta di reso
      </h1>
      <div className="mb-6 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />
      <p className="mb-8 max-w-2xl text-sm text-[var(--color-text-secondary)]">
        Compila il modulo per esercitare il diritto di recesso ai sensi
        dell&apos;Art. 52 D.Lgs. 206/2005. Riceverai una conferma via email entro 14
        giorni con le istruzioni di restituzione.
      </p>

      {serverError && (
        <div className="mb-6 max-w-xl rounded-md border border-[var(--color-destructive)]/20 bg-[var(--color-destructive)]/5 p-4">
          <p className="text-sm text-[var(--color-destructive)]">{serverError}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="max-w-xl space-y-5"
        noValidate
      >
        <form.Field
          name="fullName"
          validators={{
            onChange: z.string().trim().min(2, "Nome troppo corto").max(100),
          }}
        >
          {(field) => {
            const errMsg = firstErrorMessage(field.state.meta.errors);
            return (
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-[var(--color-text)]"
                >
                  Nome e cognome{" "}
                  <span className="text-[var(--color-destructive)]">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={errMsg !== null}
                  disabled={isLoading}
                  className={inputClass}
                />
                {errMsg && (
                  <p className="text-xs text-[var(--color-destructive)]">{errMsg}</p>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field
          name="email"
          validators={{ onChange: z.string().email("Email non valida") }}
        >
          {(field) => {
            const errMsg = firstErrorMessage(field.state.meta.errors);
            return (
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[var(--color-text)]"
                >
                  Email{" "}
                  <span className="font-normal text-[var(--color-text-secondary)]">
                    (deve coincidere con quella dell&apos;ordine)
                  </span>{" "}
                  <span className="text-[var(--color-destructive)]">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={errMsg !== null}
                  disabled={isLoading}
                  className={inputClass}
                />
                {errMsg && (
                  <p className="text-xs text-[var(--color-destructive)]">{errMsg}</p>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field
          name="orderNumber"
          validators={{
            onChange: z
              .string()
              .trim()
              .regex(
                /^CP-\d{4}-\d{4}$/,
                "Formato non valido (es. CP-2026-0001)",
              ),
          }}
        >
          {(field) => {
            const errMsg = firstErrorMessage(field.state.meta.errors);
            return (
              <div className="space-y-1.5">
                <label
                  htmlFor="orderNumber"
                  className="block text-sm font-medium text-[var(--color-text)]"
                >
                  Numero ordine{" "}
                  <span className="text-[var(--color-destructive)]">*</span>
                </label>
                <input
                  id="orderNumber"
                  name="orderNumber"
                  type="text"
                  placeholder="CP-2026-0001"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={errMsg !== null}
                  disabled={isLoading}
                  className={inputClass}
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Lo trovi nella conferma d&apos;ordine ricevuta via email.
                </p>
                {errMsg && (
                  <p className="text-xs text-[var(--color-destructive)]">{errMsg}</p>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field
          name="reason"
          validators={{
            onChange: z
              .string()
              .trim()
              .min(10, "Almeno 10 caratteri")
              .max(500, "Massimo 500 caratteri"),
          }}
        >
          {(field) => {
            const errMsg = firstErrorMessage(field.state.meta.errors);
            return (
              <div className="space-y-1.5">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-[var(--color-text)]"
                >
                  Motivazione{" "}
                  <span className="text-[var(--color-destructive)]">*</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={5}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={errMsg !== null}
                  disabled={isLoading}
                  className={inputClass}
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Descrivi il motivo della richiesta (max 500 caratteri).
                </p>
                {errMsg && (
                  <p className="text-xs text-[var(--color-destructive)]">{errMsg}</p>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field
          name="acceptedPolicy"
          validators={{
            onChange: z.literal(true, {
              message: "Devi accettare la procedura di reso",
            }),
          }}
        >
          {(field) => {
            const errMsg = firstErrorMessage(field.state.meta.errors);
            return (
              <div>
                <div className="flex items-start gap-2">
                  <input
                    id="acceptedPolicy"
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    disabled={isLoading}
                    aria-required="true"
                    aria-invalid={errMsg !== null}
                    className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] disabled:opacity-60"
                  />
                  <label
                    htmlFor="acceptedPolicy"
                    className="text-sm leading-relaxed text-[var(--color-text-secondary)]"
                  >
                    Ho letto e accetto la{" "}
                    <Link
                      to="/resi-e-recesso"
                      className="text-[var(--color-primary)] underline underline-offset-2"
                    >
                      procedura di reso
                    </Link>{" "}
                    e dichiaro di esercitare il diritto di recesso ai sensi
                    dell&apos;Art. 52 D.Lgs. 206/2005.
                  </label>
                </div>
                {errMsg && (
                  <p className="mt-1 text-xs text-[var(--color-destructive)]">
                    {errMsg}
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? "Invio in corso…" : "Invia richiesta"}
        </button>
      </form>

      <div className="mt-12 max-w-xl rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text)]">In alternativa</strong>,
          puoi inviare la richiesta via email a{" "}
          <a
            href="mailto:resi@calzoleriaprevenzano.it"
            className="text-[var(--color-primary)] underline underline-offset-2"
          >
            resi@calzoleriaprevenzano.it
          </a>{" "}
          o tramite raccomandata A/R a Calzoleria Prevenzano, Via Chiaia 104 &mdash;
          80121 Napoli (NA), come previsto dall&apos;Art. 49 c. 1 lett. h e Art. 54
          D.Lgs. 206/2005.
        </p>
      </div>
    </div>
  );
}
