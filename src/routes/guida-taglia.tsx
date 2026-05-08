import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect permanente verso lo slug canonico /guida-alla-taglia
// (continuità SEO con il vecchio sito WordPress + preserva tutti i link interni esistenti).
export const Route = createFileRoute("/guida-taglia")({
  beforeLoad: () => {
    throw redirect({ to: "/guida-alla-taglia" });
  },
});
