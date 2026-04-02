import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { slideInLeft, slideInRight } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const BORTEGA_COPY = {
  headline: "La Bottega Prevenzano",
  paragraphs: [
    "Nel cuore di Napoli, a due passi da Via Chiaia, la nostra calzoleria porta avanti una tradizione che affonda le radici nella maestria artigianale napoletana. Qui la pelle non è un materiale — è una storia da raccontare con le mani.",
    "Ogni sandalo che esce dal nostro laboratorio attraversa le stesse mani che lo hanno pensato: taglio, cucitura, finitura. Nessun passaggio è delegato a una macchina che non sappiamo controllare. È questo che rende ogni paio diverso dall'altro — e ogni cliente, parte della famiglia.",
    "La personalizzazione non è un'opzione aggiuntiva: è il modo in cui lavoriamo da sempre. Quando entri in bottega — o quando ordini online — scegli esattamente il sandalo che hai in mente. E noi lo realizziamo, con la stessa cura di chi lo indossa.",
  ],
  cta: "Scopri la nostra storia",
  ctaHref: "/la-bottega",
} as const;

export function LaBottegaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]" variants={slideInLeft}>
      <section
        ref={ref}
        className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          {/* Left — Text (40%) */}
          <m.div
            variants={slideInLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Dal 1950
            </span>
            <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
              {BORTEGA_COPY.headline}
            </h2>

            {/* 🧬 DNA: Stitch divider */}
            <hr className="stitch-divider stitch-divider--left my-8" />

            {/* Story paragraphs */}
            <div className="space-y-5">
              {BORTEGA_COPY.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* CTA */}
            <a
              href={BORTEGA_COPY.ctaHref}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-primary-dark)]"
            >
              {BORTEGA_COPY.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </m.div>

          {/* Right — Image (60%) with 🧬 DNA: gentle scale-reveal */}
          <m.div
            variants={slideInRight}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative"
          >
            <div className="overflow-hidden rounded-[var(--radius-lg)]">
              <img
                src="/images/bottega-laboratorio.webp"
                alt="Il laboratorio artigianale di Calzoleria Prevenzano a Napoli"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                width={800}
                height={600}
              />
            </div>

            {/* 🧬 DNA: Stitch frame */}
            <div className="pointer-events-none absolute -inset-3 rounded-[var(--radius-xl)] border border-[var(--color-accent)]/20" />

            {/* Floating proof badge */}
            <div className="absolute -bottom-4 -left-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-5 py-3 shadow-lg md:-bottom-6 md:-left-6 md:px-6 md:py-4">
              <p className="font-display text-2xl font-bold text-[var(--color-primary)]">70+</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Anni di tradizione</p>
            </div>
          </m.div>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
