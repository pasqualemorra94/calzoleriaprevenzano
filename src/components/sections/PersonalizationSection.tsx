import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { slideInLeft, slideInRight, fadeInUp } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";

// ─── Customization Icons (from reference site) ───────────────────────

function CustomizationIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 object-contain"
      loading="lazy"
      width={40}
      height={40}
    />
  );
}

// ─── Steps Data ──────────────────────────────────────────────────────

interface PersonalizationStep {
  number: string;
  title: string;
  description: string;
  iconSrc: string;
  iconAlt: string;
}

const STEPS: PersonalizationStep[] = [
  {
    number: "01",
    title: "Scegli il modello",
    description:
      "Infradito, cavigliera, fascia, treccia, schiava: trova la forma che si adatta al tuo stile tra le nostre collezioni.",
    iconSrc: "/uploads/2026/04/icon-sandalo.png",
    iconAlt: "Sandali artigianali personalizzabili",
  },
  {
    number: "02",
    title: "Scegli la pelle",
    description:
      "Vitello, camoscio, cuoio toscano certificato: ogni materiale ha la sua texture, il suo profumo, la sua storia.",
    iconSrc: "/uploads/2026/04/icon-pelle.png",
    iconAlt: "Scegli il tipo e colore di pelle",
  },
  {
    number: "03",
    title: "Personalizza i dettagli",
    description:
      "Colore, altezza del tacco, tipo di cucitura e il gioiello Swarovski che rende il sandalo unico e tuo.",
    iconSrc: "/uploads/2026/04/icon-gioiello.png",
    iconAlt: "Scegli il gioiello",
  },
];

function StepCard({ step, index }: { step: PersonalizationStep; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const variants = index % 2 === 0 ? slideInLeft : slideInRight;

  return (
    <m.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="group relative flex flex-col items-center text-center"
    >
      {/* Number + Icon circle */}
      <div className="relative mb-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-surface)] shadow-sm transition-all duration-300 group-hover:border-[var(--color-accent)]/40 group-hover:shadow-md">
          <CustomizationIcon src={step.iconSrc} alt={step.iconAlt} />
        </div>
        {/* Floating number */}
        <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
          {step.number}
        </span>
      </div>

      {/* DNA: Stitch divider under icon */}
      <hr className="stitch-divider mb-4" />

      {/* Title */}
      <h3 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
        {step.title}
      </h3>

      {/* Description */}
      <p className="mt-3 max-w-xs text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
        {step.description}
      </p>
    </m.div>
  );
}

export function PersonalizationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]" variants={fadeInUp}>
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header — Craftsmanship themed */}
        <div className="mb-16 text-center md:mb-20">
          <div className="inline-flex items-center gap-4 mb-6">
            <span className="h-px w-8 bg-[var(--color-accent)]/40" />
            <span className="text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-accent)]">
              Su misura
            </span>
            <span className="h-px w-8 bg-[var(--color-accent)]/40" />
          </div>
          <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
            Crea il tuo sandalo in 3 passi
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Come in bottega: scegli il modello, la pelle e i dettagli. Le tue mani scelgono,
            le nostre realizzano.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16 mb-16">
          {/* Left — Personalization showcase image */}
          <m.div
            variants={slideInLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative order-2 lg:order-1"
          >
            <div className="overflow-hidden rounded-[var(--radius-lg)]">
              <img
                src="/uploads/2026/04/personalizzazione-sandalo.jpg"
                alt="Sandalo personalizzabile — scegli pelle, tacco e gioiello Swarovski"
                className="w-full object-cover"
                loading="lazy"
                width={700}
                height={819}
              />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-5 py-3 shadow-lg md:-bottom-6 md:-right-6 md:px-6 md:py-4">
              <p className="font-display text-lg font-bold text-[var(--color-primary)]">100%</p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">Fatto a mano</p>
            </div>
          </m.div>

          {/* Right — 3 Steps */}
          <m.div
            variants={slideInRight}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="order-1 lg:order-2"
          >
            {/* Connecting line behind cards (desktop only) */}
            <div className="relative">
              <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-px bg-[var(--color-accent)]/15 md:block" />

              {/* 3 steps */}
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                {STEPS.map((step, index) => (
                  <StepCard key={step.number} step={step} index={index} />
                ))}
              </div>
            </div>
          </m.div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/catalogo"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-accent)] px-8 text-sm font-medium text-[var(--color-primary)] transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-accent)]/10"
          >
            Scopri il catalogo
          </a>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
