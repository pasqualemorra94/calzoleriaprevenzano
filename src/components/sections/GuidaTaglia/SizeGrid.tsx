import type { ReactNode } from "react";
import { m } from "motion/react";
import { Download } from "lucide-react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";

const SIZES = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42] as const;

export function SizeGrid(): ReactNode {
  return (
    <ScrollAnimatedSection
      className="bg-[var(--color-background)] py-[var(--section-padding-y)]"
      variants={fadeInUp}
    >
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            PDF stampabili
          </p>
          <hr className="stitch-divider stitch-divider--left mx-auto my-4" />
          <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight">
            Trova la tua taglia con i nostri PDF
          </h2>
          <p className="mt-3 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Scarica il PDF della tua taglia, stampalo e posa il piede sulla sagoma per verificare la misura.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-5 py-4 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
          <strong className="font-semibold text-[var(--color-text)]">Importante:</strong>{" "}
          Stampa il PDF in formato A4, <strong>al 100% (NO scale to fit, NO &quot;adatta alla pagina&quot;)</strong>,
          e verifica con un righello che il quadrato di calibrazione misuri esattamente 5&nbsp;cm prima di posarci sopra il piede.
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {SIZES.map((n) => (
            <m.a
              key={n}
              href={`/guide-taglia/taglia-${n}.pdf`}
              download
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors duration-[var(--transition-base)] hover:border-[var(--color-primary)] hover:shadow-md"
            >
              <span className="font-display text-2xl font-semibold text-[var(--color-text)]">{n}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)]">
                <Download className="h-3 w-3" /> PDF
              </span>
            </m.a>
          ))}
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
