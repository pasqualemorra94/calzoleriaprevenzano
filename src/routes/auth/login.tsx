import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "~/components/auth/LoginForm";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-[var(--page-padding-x)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-[var(--color-text)]">
            Accedi
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Accedi al tuo account per gestire ordini e wishlist
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
