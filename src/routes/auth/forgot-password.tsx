import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "~/components/auth/ForgotPasswordForm";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-[var(--page-padding-x)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-lg font-semibold text-[var(--color-text)]">
            Password dimenticata
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
