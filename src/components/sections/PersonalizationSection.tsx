import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { slideInLeft, slideInRight, fadeInUp } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";

interface PersonalizationStep {
  number: string;
  title: string;
  description: string;
  icon: string;
}

const STEPS: PersonalizationStep[] = [
  {
    number: "01",
    title: "Scegli il modello",
    description:
      "Infradito, cavigliera, fascia, treccia: trova la forma che si adatta al tuo stile.",
    icon: "shoe",
  },
  {
    number: "02",
    title: "Scegli la pelle",
    description:
      "Vitello, camoscio, cuoio: ogni materiale ha la sua texture, il suo profumo, la sua storia.",
    icon: "leather",
  },
  {
    number: "03",
    title: "Personalizza i dettagli",
    description:
      "Colore, altezza del tacco, tipo di cucitura e il gioiello che rende il sandalo tuo.",
    icon: "gem",
  },
];

function StepIcon({ type }: { type: string }) {
  if (type === "shoe") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]" aria-hidden="true">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="20" y2="22" />
      </svg>
    );
  }
  if (type === "leather") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 3v18" />
      </svg>
    );
  }
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]" aria-hidden="true">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M11 3L2 9l10 13 10-13-9-6" />
      <path d="M2 9h20" />
    </svg>
  );
}

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
          <StepIcon type={step.icon} />
        </div>
        {/* Floating number */}
        <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
          {step.number}
        </span>
      </div>

      {/* 🧬 DNA: Stitch divider under icon */}
      <hr className="stitch-divider mb-4" />

      {/* Title */}
      <h3 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight md:text-[var(--text-3xl)]">
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
  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]" variants={fadeInUp}>
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* 🧬 Section header — Craftsmanship themed */}
        <div className="mb-16 text-center md:mb-20">
          <div className="inline-flex items-center gap-4 mb-6">
            <span className="h-px w-8 bg-[var(--color-accent)]/40" />
            <span className="text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-accent)]">
              Su misura
            </span>
            <span className="h-px w-8 bg-[var(--color-accent)]/40" />
          </div>
          <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
            Crea il tuo sandalo in 3 passi
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Come in bottega: scegli il modello, la pelle e i dettagli. Le tue mani scelgono,
            le nostre realizzano.
          </p>
        </div>

        {/* Connecting line behind cards (desktop only) */}
        <div className="relative">
          <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-px bg-[var(--color-accent)]/15 md:block" />

          {/* 3 steps — horizontal on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
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
