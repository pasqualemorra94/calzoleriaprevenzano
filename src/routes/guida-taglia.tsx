import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";
import { m } from "motion/react";

export const Route = createFileRoute("/guida-taglia")({
  component: GuidaTagliaPage,
});

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
  "Metti il piede su un foglio di carta e traccia il contorno con una penna",
  "Misura la distanza dal tallone all'alluce più lungo (in cm)",
  "Confronta la misura con la tabella sottostante",
  "Se sei tra due taglie, ti consigliamo di prendere la superiore",
];

function GuidaTagliaPage(): ReactNode {
  return (
    <>
      {/* Page hero */}
      <section className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Guida
            </span>
            <h1 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight md:text-[var(--text-5xl)]">
              Guida alla Taglia — Trova la misura perfetta
            </h1>
          </m.div>
        </div>
      </section>

      {/* Instructions */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight">
              Come misurare il piede
            </h2>
            <hr className="stitch-divider stitch-divider--left my-6" />

            <ol className="space-y-4">
              {STEPS.map((step, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </ScrollAnimatedSection>

      {/* Size table */}
      <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y)]" variants={fadeInUp}>
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="mx-auto max-w-xl">
            <h2 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight">
              Tabella taglie
            </h2>
            <hr className="stitch-divider stitch-divider--left my-6" />

            {/* Table */}
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--color-primary)] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Misura piede (cm)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      IT
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
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
              Le taglie possono variare leggermente tra i modelli. Se hai dubbi, contattaci su WhatsApp e ti aiuteremo a scegliere.
            </p>
          </div>
        </section>
      </ScrollAnimatedSection>
    </>
  );
}
