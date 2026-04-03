import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { slideInLeft, slideInRight } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const BOTTEGA_COPY = {
  headline: "La Bottega Prevenzano",
  paragraphs: [
    "Nel cuore di Napoli, a due passi da Via Chiaia, la nostra calzoleria porta avanti una tradizione che affonda le radici nella maestria artigianale napoletana. Qui la pelle non è un materiale — è una storia da raccontare con le mani.",
    "Ogni sandalo che esce dal nostro laboratorio attraversa le stesse mani che lo hanno pensato: taglio, cucitura, finitura. Nessun passaggio è delegato a una macchina che non sappiamo controllare. È questo che rende ogni paio diverso dall'altro — e ogni cliente, parte della famiglia.",
    "La personalizzazione non è un'opzione aggiuntiva: è il modo in cui lavoriamo da sempre. Quando entri in bottega — o quando ordini online — scegli esattamente il sandalo che hai in mente. E noi lo realizziamo, con la stessa cura di chi lo indossa.",
  ],
  cta: "Scopri la nostra storia",
  ctaHref: "/la-bottega",
} as const;

const BOTTEGA_IMAGE = "/uploads/2026/04/personalizzazione-sandalo.jpg";

interface LaBottegaSectionProps {
  imageUrl?: string;
}

export function LaBottegaSection({ imageUrl }: LaBottegaSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]" variants={slideInLeft}>
      <section
        ref={ref}
        className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]"
      >
        {/* 🧬 Section header — Heritage/Story themed */}
        <div className="mb-14 md:mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]" aria-hidden="true">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.3" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <span className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              La nostra storia
            </span>
          </div>
          <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
            {BOTTEGA_COPY.headline}
          </h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          {/* Left — Text (40%) */}
          <m.div
            variants={slideInLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {/* 🧬 DNA: Stitch divider */}
            <hr className="stitch-divider stitch-divider--left mb-8" />

            {/* Story paragraphs */}
            <div className="space-y-5">
              {BOTTEGA_COPY.paragraphs.map((paragraph, index) => (
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
              href={BOTTEGA_COPY.ctaHref}
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition-colors duration-[var(--transition-base)] hover:text-[var(--color-primary-dark)]"
            >
              {BOTTEGA_COPY.cta}
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
                src={imageUrl ?? BOTTEGA_IMAGE}
                alt="Sandalo artigianale personalizzabile con dettagli in pelle e gioiello — Calzoleria Prevenzano"
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
              <p className="font-display text-lg font-bold text-[var(--color-primary)]">70+</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Anni di tradizione</p>
            </div>
          </m.div>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
