/**
 * /newsletter/conferma — Landing page per double opt-in confirm
 *
 * Loader pattern: useEffect on mount → POST /api/newsletter/confirm con token da search.
 * Mostra loading/success/error states.
 *
 * URL: /newsletter/conferma?token=XXX
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const validateSearch = (search: Record<string, unknown>): { token: string } => ({
  token: typeof search.token === "string" ? search.token : "",
});

export const Route = createFileRoute("/newsletter/conferma")({
  validateSearch,
  component: ConfirmPage,
});

type State = "loading" | "success" | "error";

function ConfirmPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Link non valido: token mancante.");
      return;
    }
    fetch("/api/newsletter/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as {
          data?: { message?: string };
          error?: { message?: string };
        };
        if (res.ok) {
          setState("success");
          setMessage(json?.data?.message ?? "Iscrizione confermata!");
        } else {
          setState("error");
          setMessage(json?.error?.message ?? "Errore durante la conferma");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Errore di connessione");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-lg px-[var(--page-padding-x)] py-24 text-center">
      {state === "loading" && (
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--color-primary)]" />
      )}
      {state === "success" && (
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
      )}
      {state === "error" && (
        <XCircle className="mx-auto h-16 w-16 text-red-600" />
      )}
      <h1 className="mt-6 font-display text-2xl font-semibold text-[var(--color-text)]">
        {state === "loading" && "Confermando..."}
        {state === "success" && "Iscrizione confermata"}
        {state === "error" && "Conferma non riuscita"}
      </h1>
      <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{message}</p>
      {state !== "loading" && (
        <a
          href="/"
          className="mt-8 inline-block text-sm font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Torna alla home
        </a>
      )}
    </div>
  );
}
