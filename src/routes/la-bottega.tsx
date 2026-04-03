import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";

export const Route = createFileRoute("/la-bottega")({
  component: LaBottegaPage,
});

const ABOUT_COPY = {
  headline: "Una tradizione che si rinnova, un sandalo alla volta",
  paragraphs: [
    "Calzoleria Prevenzano è nata a Napoli come bottega artigianale specializzata nella lavorazione della pelle. Dalle mani dei nostri artigiani sono usciti generazioni di sandali, cinture e accessori — ognuno pensato per durare, ognuno diverso dall'altro perché fatto a mano, non in serie.",
    "Oggi portiamo avanti la stessa filosofia, con un occhio al presente. La personalizzazione è il cuore del nostro lavoro: non vendiamo un prodotto finito, ma lo costruiamo insieme a chi lo indossa. Dal tipo di pelle al colore, dal tacco al dettaglio gioiello — ogni scelta è parte del sandalo che uscirà dal nostro laboratorio.",
    "La nostra sede è in Via Chiaia 104, nel cuore di Napoli — due punti vendita dove toccare con mano la qualità dei materiali e vedere gli artigiani al lavoro. Per chi è lontano, l'e-commerce porta la stessa cura artigianale direttamente a casa, con spedizioni in tutta Italia e un servizio clienti attento e disponibile.",
    "Crediamo che la bellezza stia nei dettagli. Una cucitura a mano, una pelle conciata al vegetale, un gioiello applicato con precisione. Sono le piccole cose che fanno la differenza — e che trasformano un sandalo in un pezzo che si ama indossare.",
  ],
  cta: "Scopri le nostre collezioni",
  ctaHref: "/sandali",
} as const;

function LaBottegaPage(): ReactNode {
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
            <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Chi Siamo
            </span>
            <h1 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight md:text-[var(--text-5xl)]">
              {ABOUT_COPY.headline}
            </h1>
          </m.div>
        </div>
      </section>

      {/* Story content */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6">
              {ABOUT_COPY.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)] first-of-type:text-[var(--text-lg)]"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <hr className="stitch-divider stitch-divider--left my-12" />

            <a
              href={ABOUT_COPY.ctaHref}
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-8 text-sm font-medium text-white transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-primary-dark)]"
            >
              {ABOUT_COPY.cta}
            </a>
          </div>
        </section>
      </ScrollAnimatedSection>

      {/* Image + info block */}
      <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y)]" variants={fadeInUp}>
        <BottegaInfoBlock />
      </ScrollAnimatedSection>
    </>
  );
}

function BottegaInfoBlock(): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <m.img
          src="/images/bottega-interna.svg"
          alt="L'interno della bottega Calzoleria Prevenzano"
          className="aspect-[4/3] w-full rounded-[var(--radius-lg)] object-cover"
          loading="lazy"
          width={800}
          height={600}
          initial={{ opacity: 0, x: -32 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <m.div
          initial={{ opacity: 0, x: 32 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 32 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <h2 className="font-display text-[var(--text-xl)] font-semibold tracking-tight">
            Via Chiaia 104, Napoli
          </h2>
          <hr className="stitch-divider stitch-divider--left my-4" />
          <p className="text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Due punti vendita nel cuore di Napoli dove puoi toccare con mano la qualità dei materiali, provare i modelli e vedere gli artigiani al lavoro. Ti aspettiamo in bottega.
          </p>
          <dl className="mt-8 space-y-4">
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm font-medium text-[var(--color-text-muted)]">Indirizzo</dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">Via Chiaia, 104 — 80132 Napoli (NA)</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm font-medium text-[var(--color-text-muted)]">P.Iva</dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">04590921211</dd>
            </div>
          </dl>
        </m.div>
      </div>
    </section>
  );
}
