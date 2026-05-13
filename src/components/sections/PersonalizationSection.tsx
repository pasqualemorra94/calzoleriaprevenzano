import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { slideInLeft, slideInRight, fadeInUp } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

// ─── Steps Data ──────────────────────────────────────────────────────

interface PersonalizationStep {
  number: string;
  title: string;
  description: string;
}

const STEPS: PersonalizationStep[] = [
  {
    number: "01",
    title: "Scegli il modello",
    description: "Infradito, cavigliera, fascia, treccia, schiava — la forma che parla di te.",
  },
  {
    number: "02",
    title: "Scegli la pelle",
    description: "Vitello, camoscio, cuoio toscano certificato — la materia che diventa identità.",
  },
  {
    number: "03",
    title: "Personalizza i dettagli",
    description: "Tacco, cuciture, Swarovski applicati a mano — l'ultimo tocco è solo tuo.",
  },
];

// ─── Component ──────────────────────────────────────────────

export function PersonalizationSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <ScrollAnimatedSection
      className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]"
      variants={fadeInUp}
    >
      <section ref={ref} className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          {/* ═════════ COLUMN 1 — Photo (dominant on desktop) ═════════ */}
          <m.div
            variants={slideInLeft}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative order-2 lg:order-1"
          >
            {/* Gold border ring */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[3px] rounded-[var(--radius-xl)] z-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(201,169,97,0.55) 0%, rgba(201,169,97,0) 50%, rgba(201,169,97,0.35) 100%)",
              }}
            />
            <div
              className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-muted)]"
              style={{
                boxShadow:
                  "0 30px 80px -20px rgba(45,45,45,0.35), 0 8px 24px -8px rgba(45,45,45,0.18)",
                aspectRatio: "3 / 4",
              }}
            >
              <img
                src="/images/personalizzazione-bella1.webp"
                alt="Sandalo artigianale Calzoleria Prevenzano — personalizzazione su misura"
                width={1200}
                height={2000}
                className="block h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Caption pill — overlapping bottom-left */}
            <div className="absolute -bottom-5 left-6 z-20 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 shadow-[var(--shadow-md)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              <span className="font-display text-[11px] italic tracking-tight text-[var(--color-foreground)]">
                Fatto a mano · Napoli · Dal 1984
              </span>
            </div>

            {/* Decorative sparkle */}
            <m.svg
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              initial={{ opacity: 0, scale: 0, rotate: -15 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              width="34"
              height="34"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="absolute -right-3 top-[12%] z-20"
            >
              <path
                d="M8 1L9.5 6.5L15 8L9.5 9.5L8 15L6.5 9.5L1 8L6.5 6.5L8 1Z"
                fill="#C9A961"
              />
            </m.svg>
          </m.div>

          {/* ═════════ COLUMN 2 — Editorial text + 3 steps ═════════ */}
          <m.div
            variants={slideInRight}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative order-1 lg:order-2"
          >
            {/* Eyebrow */}
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              Su misura
            </span>

            {/* Massive editorial headline */}
            <h2
              className="mt-4 font-display font-semibold leading-[0.95] tracking-[-0.025em] text-[var(--color-text)]"
              style={{ fontSize: "clamp(2.4rem, 4.5vw, 4.5rem)" }}
            >
              Crea il <span className="italic font-medium text-[var(--color-primary)]">tuo</span> sandalo
              <br />
              <span className="font-medium">in 3 passi</span>
            </h2>

            {/* Stitch ornament */}
            <div className="mt-6 flex items-center gap-2" aria-hidden="true">
              <span className="h-[2px] w-16 bg-[var(--color-accent)]" />
              <span className="h-[2px] w-2 bg-[var(--color-accent)]/55" />
              <span className="h-[2px] w-1 bg-[var(--color-accent)]/25" />
            </div>

            {/* Lead */}
            <p className="mt-6 max-w-[36ch] text-[15px] leading-[1.7] text-[var(--color-text-secondary)]">
              Come in calzoleria: scegli il modello, la pelle, i dettagli. Le tue mani scelgono,
              le nostre realizzano.
            </p>

            {/* 3 steps — vertical list with huge serif numerals */}
            <div className="mt-10 space-y-7">
              {STEPS.map((step, i) => (
                <m.div
                  key={step.number}
                  initial={{ opacity: 0, x: 24 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-5"
                >
                  <span
                    className="font-display italic font-medium leading-[0.9] text-[var(--color-accent)]"
                    style={{ fontSize: "clamp(2.6rem, 3.6vw, 3.4rem)" }}
                  >
                    {step.number}
                  </span>
                  <div className="flex-1 border-l border-[var(--color-accent)]/30 pl-5 pt-1">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--color-text)] md:text-xl">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-[1.6] text-[var(--color-text-secondary)]">
                      {step.description}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>

            {/* CTA */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="mt-10"
            >
              <a
                href="/catalogo"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[var(--color-foreground)] px-7 py-3.5 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[var(--color-primary)] hover:shadow-[0_14px_36px_rgba(45,45,45,0.25)]"
              >
                Scopri il catalogo
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </m.div>
          </m.div>
        </div>
      </section>
    </ScrollAnimatedSection>
  );
}
