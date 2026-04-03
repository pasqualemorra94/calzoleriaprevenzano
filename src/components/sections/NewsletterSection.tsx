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
          {/* 🧬 Section header — Correspondence themed */}
          <div className="inline-flex items-center gap-3 mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-accent)]" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
            <span className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-accent)]">
              Newsletter
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-accent)]" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
          </div>
          <h2 className="font-display text-[var(--text-xl)] font-semibold tracking-tight md:text-[var(--text-2xl)]">
            Resta aggiornato sulle nuove collezioni
          </h2>
          <p className="mt-4 text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Iscriviti alla newsletter per ricevere anteprime, offerte esclusive e storie dalla bottega. Un&apos;email al mese, niente spam.
          </p>

          {status === "success" ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p className="text-sm font-medium text-green-700">
                Iscrizione avvenuta con successo! Controlla la tua casella email per la conferma.
              </p>
            </div>
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

        {/* DNA: Decorative stitch line */}
        <div className="mt-12 flex items-center justify-center gap-2">
          {[...Array(7)].map((_, i) => (
            <span
              key={i}
              className="h-[2px] rounded-full bg-[var(--color-accent)]"
              style={{
                width: i % 2 === 0 ? "20px" : "6px",
                opacity: i % 2 === 0 ? 0.3 : 0.15,
              }}
            />
          ))}
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
