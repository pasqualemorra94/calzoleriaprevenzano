import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "~/components/auth/ResetPasswordForm";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-[var(--page-padding-x)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-lg font-semibold text-[var(--color-text)]">
            Reimposta la password
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Scegli una nuova password sicura per il tuo account
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
