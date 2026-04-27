import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp, slideInLeft } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/guida-taglia")({
  component: GuidaTagliaPage,
});

// ─── Data ────────────────────────────────────────────────────────────

const SIZE_TABLE: { foot: string; it: string; eu: string }[] = [
  { foot: "23.5", it: "36", eu: "36" },
  { foot: "24.0", it: "37", eu: "37" },
  { foot: "24.5", it: "38", eu: "38" },
  { foot: "25.0", it: "39", eu: "39" },
  { foot: "25.5", it: "40", eu: "40" },
  { foot: "26.0", it: "41", eu: "41" },
  { foot: "26.5", it: "42", eu: "42" },
  { foot: "27.0", it: "43", eu: "43" },
  { foot: "27.5", it: "44", eu: "44" },
];

const STEPS = [
  {
    title: "Misurare il piede",
    description: "Stai in piedi e appoggia il piede nudo su un foglio di carta. Disegna una linea diritta in corrispondenza del tallone e un'altra in corrispondenza dell'alluce più lungo.",
  },
  {
    title: "Misurare la distanza",
    description: "Con un righello, misura la distanza in centimetri tra la linea del tallone e quella dell'alluce. Annota il risultato.",
  },
  {
    title: "Confronta la tabella",
    description: "Cerca la misura nella tabella sottostante per trovare la tua taglia corrispondente. Se sei tra due taglie, ti consigliamo di prendere la superiore.",
  },
];

// ─── Page Component ─────────────────────────────────────────────────

function GuidaTagliaPage(): ReactNode {
  return (
    <>
      {/* Page hero */}
      <section className="bg-[var(--color-hero)] py-[var(--section-padding-y-lg)] border-b border-[var(--stitch-color)]/20">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <span className="mb-3 inline-block text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Guida
            </span>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
              Guida alla Taglia — Trova la misura perfetta
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              Segui i semplici passaggi per misurare il tuo piede e trovare la taglia giusta per i nostri sandali artigianali.
            </p>
          </m.div>
        </div>
      </section>

      {/* Instructions + Image */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
            {/* Left — Tutorial image */}
            <MeasurementImage />

            {/* Right — Steps */}
            <div className="lg:pt-4">
              <p className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">
                Come prendere le misure
              </p>
              <hr className="stitch-divider stitch-divider--left my-4" />

              <ol className="space-y-6">
                {STEPS.map((step, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-[var(--color-text)]">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-8 rounded-[var(--radius-md)] bg-[var(--color-accent)]/5 px-4 py-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                <strong>Consiglio:</strong> Misura entrambi i piedi, poiché spesso uno è leggermente più grande dell'altro.
                Usa la misura del piede più grande per scegliere la taglia.
              </p>
            </div>
          </div>
        </section>
      </ScrollAnimatedSection>

      {/* Size table */}
      <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y)]" variants={fadeInUp}>
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-medium tracking-wider text-[var(--color-text-muted)]">
              Tabella taglie
            </p>
            <hr className="stitch-divider stitch-divider--left my-4" />

            {/* Table */}
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-primary)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
                      Misura piede (cm)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider">
                      IT
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider">
                      EU
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_TABLE.map((row, index) => (
                    <tr
                      key={row.foot}
                      className={`border-b border-[var(--color-border-light)] last:border-0 ${
                        index % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-background)]"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">{row.foot}</td>
                      <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">{row.it}</td>
                      <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">{row.eu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Le taglie possono variare leggermente tra i modelli. Per sandali con infradito, se sei tra due taglie
              ti consigliamo la misura inferiore. Per i modelli chiusi (schiava, cavigliera), scegli la superiore.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Hai dubbi? Contattaci su{" "}
              <a
                href="https://wa.me/390810410442"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-primary)] underline underline-offset-2 transition-colors hover:text-[var(--color-primary-dark)]"
              >
                WhatsApp
              </a>{" "}
              e ti aiuteremo a scegliere la misura perfetta.
            </p>
          </div>
        </section>
      </ScrollAnimatedSection>
    </>
  );
}

// ─── Measurement Image Component ────────────────────────────────────

function MeasurementImage(): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <m.div
      ref={ref}
      variants={slideInLeft}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="relative"
    >
      <div className="overflow-hidden rounded-[var(--radius-lg)]">
        <img
          src="/images/tutorial-misurazione-piede.png"
          alt="Tutorial: come misurare il piede per trovare la taglia giusta dei sandali"
          className="w-full object-cover"
          loading="lazy"
          width={700}
          height={500}
        />
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-3 -right-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3 shadow-lg">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Taglie</p>
        <p className="font-display text-lg font-bold text-[var(--color-primary)]">33 — 42</p>
      </div>
    </m.div>
  );
}
