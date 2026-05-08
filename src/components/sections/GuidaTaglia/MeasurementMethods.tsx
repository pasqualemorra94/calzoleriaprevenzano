import type { ReactNode } from "react";
import { Ruler, Footprints } from "lucide-react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";

export function MeasurementMethods(): ReactNode {
  return (
    <ScrollAnimatedSection
      className="bg-[var(--color-surface)] py-[var(--section-padding-y)]"
      variants={fadeInUp}
    >
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            Misurare a mano libera
          </p>
          <hr className="stitch-divider stitch-divider--left mx-auto my-4" />
          <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight">
            Come prendere le misure
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Card 1 — Lunghezza */}
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                <Ruler className="h-5 w-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                1. Lunghezza del piede
              </h3>
            </div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)] marker:text-[var(--color-primary)]">
              <li>Posa un foglio A4 a terra, contro un muro.</li>
              <li>Sta in piedi a piede nudo, con il tallone leggermente contro il muro.</li>
              <li>Segna con una matita la linea del tallone e la linea dell&apos;alluce più lungo.</li>
              <li>Misura con un righello la distanza in centimetri.</li>
            </ol>
            <img
              src="/images/foto-piede-misurazione.png"
              alt="Foto di un piede appoggiato su un foglio per misurare la lunghezza"
              loading="lazy"
              width={600}
              height={450}
              className="mt-5 w-full rounded-[var(--radius-md)] border border-[var(--color-border-light)] object-cover"
            />
          </article>

          {/* Card 2 — Circonferenze */}
          <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                <Footprints className="h-5 w-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)]">
                2. Circonferenze
              </h3>
            </div>
            <dl className="mt-4 space-y-3 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              <div>
                <dt className="font-medium text-[var(--color-text)]">Collo del piede</dt>
                <dd>
                  Passa un metro flessibile sopra il collo del piede e sotto la pianta. Segna la circonferenza in centimetri.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--color-text)]">Pianta</dt>
                <dd>Misura la larghezza nel punto più ampio (sotto le dita).</dd>
              </div>
            </dl>
            <img
              src="/images/foto-piede-circonferenza.png"
              alt="Foto di un piede con metro flessibile per misurare collo del piede e pianta"
              loading="lazy"
              width={600}
              height={450}
              className="mt-5 w-full rounded-[var(--radius-md)] border border-[var(--color-border-light)] object-cover"
            />
          </article>
        </div>

        <p className="mx-auto mt-8 max-w-3xl rounded-[var(--radius-md)] bg-[var(--color-accent)]/5 px-5 py-4 text-sm leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
          <strong className="font-semibold text-[var(--color-text)]">Consiglio:</strong>{" "}
          Misura entrambi i piedi alla sera (sono leggermente più gonfi) e usa la misura del piede più grande.
        </p>
      </section>
    </ScrollAnimatedSection>
  );
}
