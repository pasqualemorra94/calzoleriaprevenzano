import type { ReactNode } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";

const SIZE_TABLE: ReadonlyArray<{ foot: string; it: string; eu: string }> = [
  { foot: "21.0", it: "33", eu: "33" },
  { foot: "21.5", it: "34", eu: "34" },
  { foot: "22.0", it: "35", eu: "35" },
  { foot: "22.5", it: "36", eu: "36" },
  { foot: "23.0", it: "37", eu: "37" },
  { foot: "23.5", it: "38", eu: "38" },
  { foot: "24.0", it: "39", eu: "39" },
  { foot: "24.5", it: "40", eu: "40" },
  { foot: "25.0", it: "41", eu: "41" },
  { foot: "25.5", it: "42", eu: "42" },
];

export function SizeTable(): ReactNode {
  return (
    <ScrollAnimatedSection
      className="bg-[var(--color-surface)] py-[var(--section-padding-y)]"
      variants={fadeInUp}
    >
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            Tabella taglie
          </p>
          <hr className="stitch-divider stitch-divider--left my-4" />
          <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight">
            Confronto misure
          </h2>

          <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-primary)] text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">Misura piede (cm)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider">IT</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider">EU</th>
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

          <p className="mt-6 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-muted)]">
            Le taglie possono variare leggermente tra i modelli. Per sandali con infradito, se sei tra due taglie ti consigliamo
            la misura inferiore. Per i modelli chiusi (schiava, cavigliera), scegli la superiore.
          </p>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
