import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "~/components/auth/RegisterForm";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-[var(--page-padding-x)] py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-[var(--color-text)]">
            Crea il tuo account
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Registrati per gestire ordini, wishlist e personalizzazioni
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
