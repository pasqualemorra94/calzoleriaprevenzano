import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { m } from "motion/react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";
import { SizeGrid } from "~/components/sections/GuidaTaglia/SizeGrid";
import { MeasurementMethods } from "~/components/sections/GuidaTaglia/MeasurementMethods";
import { TutorialVideo } from "~/components/sections/GuidaTaglia/TutorialVideo";
import { SizeTable } from "~/components/sections/GuidaTaglia/SizeTable";

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/guida-alla-taglia")({
  component: GuidaAllaTagliaPage,
});

// ─── Page Component ─────────────────────────────────────────────────

function GuidaAllaTagliaPage(): ReactNode {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--color-hero)] py-[var(--section-padding-y-lg)] border-b border-[var(--stitch-color)]/20">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <span className="mb-3 inline-block text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Guida alla taglia
            </span>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
              Trova la tua misura perfetta
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              Stampa il PDF della tua taglia o segui i nostri tutorial passo passo per misurare il piede.
            </p>
          </m.div>
        </div>
      </section>

      <SizeGrid />
      <MeasurementMethods />
      <TutorialVideo />
      <SizeTable />

      {/* Final CTA */}
      <ScrollAnimatedSection
        className="bg-[var(--color-hero)] py-[var(--section-padding-y-lg)] border-t border-[var(--stitch-color)]/20"
        variants={fadeInUp}
      >
        <section className="mx-auto max-w-2xl px-[var(--page-padding-x)] text-center">
          <h3 className="font-display text-[var(--text-lg)] font-semibold tracking-tight">
            Hai dubbi sulla taglia? Scrivici
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Il nostro team artigiano risponde su misure e personalizzazione entro 24 ore.
          </p>
          <Link
            to="/contatti"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-primary-dark)]"
          >
            Contattaci
          </Link>
        </section>
      </ScrollAnimatedSection>
    </>
  );
}
