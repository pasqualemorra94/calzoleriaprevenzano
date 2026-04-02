import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { slideInLeft, slideInRight, fadeInUp } from "~/lib/animation-variants";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface PersonalizationStep {
  number: string;
  title: string;
  description: string;
}

const STEPS: PersonalizationStep[] = [
  {
    number: "01",
    title: "Scegli il modello",
    description:
      "Infradito, cavigliera, fascia, treccia: trova la forma che si adatta al tuo stile.",
  },
  {
    number: "02",
    title: "Scegli la pelle",
    description:
      "Vitello, camoscio, cuoio: ogni materiale ha la sua texture, il suo profumo, la sua storia.",
  },
  {
    number: "03",
    title: "Personalizza i dettagli",
    description:
      "Colore, altezza del tacco, tipo di cucitura e il gioiello che rende il sandalo tuo.",
  },
];

function StepCard({ step, index }: { step: PersonalizationStep; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const variants = index % 2 === 0 ? slideInLeft : slideInRight;

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="relative flex flex-col items-center text-center"
    >
      {/* Large number in Cormorant Garamond */}
      <span className="font-display text-[var(--text-6xl)] font-bold leading-none text-[var(--color-accent)]">
        {step.number}
      </span>

      {/* 🧬 DNA: Stitch divider under number */}
      <hr className="stitch-divider my-6" />

      {/* Title */}
      <h3 className="font-display text-[var(--text-2xl)] font-semibold tracking-tight md:text-[var(--text-3xl)]">
        {step.title}
      </h3>

      {/* Description */}
      <p className="mt-3 max-w-xs text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
        {step.description}
      </p>
    </motion.div>
  );
}

export function PersonalizationSection() {
  return (
    <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]" variants={fadeInUp}>
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header */}
        <div className="mb-16 text-center md:mb-20">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            Su misura
          </span>
          <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
            Crea il tuo sandalo in 3 passi
          </h2>
        </div>

        {/* 3 steps — horizontal on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="/personalizzazione"
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-accent)] px-8 text-sm font-medium text-[var(--color-primary)] transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-accent)]/10"
          >
            Inizia a personalizzare
          </a>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
