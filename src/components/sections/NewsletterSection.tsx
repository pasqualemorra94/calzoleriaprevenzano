import { useState } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";
import { m } from "motion/react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <ScrollAnimatedSection className="bg-[var(--color-muted)] py-[var(--section-padding-y)]" variants={fadeInUp}>
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <m.div
          className="mx-auto max-w-xl text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            Newsletter
          </span>
          <h2 className="font-display text-[var(--text-3xl)] font-semibold tracking-tight md:text-[var(--text-4xl)]">
            Resta aggiornato sulle nuove collezioni
          </h2>
          <p className="mt-4 text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Iscriviti alla newsletter per ricevere anteprime, offerte esclusive e storie dalla bottega. Un&apos;email al mese, niente spam.
          </p>

          {status === "success" ? (
            <p className="mt-8 text-sm font-medium text-green-700">
              Iscrizione avvenuta con successo! Controlla la tua casella email per la conferma.
            </p>
          ) : (
            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-0"
              onSubmit={handleSubmit}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Indirizzo email"
                aria-label="Indirizzo email per la newsletter"
                required
                disabled={status === "loading"}
                className="h-12 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none sm:rounded-r-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-12 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-l-none sm:rounded-r-[var(--radius-md)]"
              >
                {status === "loading" ? "Iscrizione..." : "Iscriviti — ricevi il 10% sul primo ordine"}
              </button>
            </form>
          )}

          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Inviamo al massimo 1 email al mese. Puoi cancellarti in qualsiasi momento.
          </p>
        </m.div>

        {/* DNA: Stitch divider */}
        <hr className="stitch-divider mt-12" />
      </section>
    </ScrollAnimatedSection>
  );
}
