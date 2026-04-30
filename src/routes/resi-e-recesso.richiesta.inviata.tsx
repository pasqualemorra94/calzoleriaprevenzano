import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/resi-e-recesso/richiesta/inviata")({
  component: ReturnRequestSentPage,
});

function ReturnRequestSentPage(): ReactNode {
  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-[var(--color-primary)]" />
        <h1 className="mb-3 text-lg font-semibold text-[var(--color-text)]">
          Richiesta inviata
        </h1>
        <div className="mx-auto mb-6 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />
        <p className="mb-8 leading-relaxed text-[var(--color-text-secondary)]">
          Grazie. Abbiamo ricevuto la tua richiesta. Il nostro team la valuterà e ti
          contatterà via email entro 14 giorni con le istruzioni di restituzione o
          l&apos;esito della valutazione.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            Torna alla home
          </Link>
          <Link
            to="/termini"
            className="inline-flex items-center justify-center rounded-md border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)]"
          >
            Vai ai termini di vendita
          </Link>
        </div>
      </div>
    </div>
  );
}
