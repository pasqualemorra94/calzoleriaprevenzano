import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { fadeInUp, slideInLeft, slideInRight } from "~/lib/animation-variants";
import { m, useInView } from "motion/react";
import { useRef } from "react";

// ─── Route ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/la-bottega")({
  component: LaBottegaPage,
});

// ─── Copy — improved from reference site ─────────────────────────────

const ABOUT_COPY = {
  headline: "Dal 1984, l'arte del sandalo nel cuore di Napoli",
  paragraphs: [
    "Calzoleria Prevenzano è fondata nel 1984 dal maestro Vincenzo Prevenzano in un quartiere residenziale di Napoli. L'attività principale è la riparazione di scarpe, borse e valigie — e sin da subito il maestro Vincenzo si fa notare per la maestria, l'amore e la passione con cui si dedicava a questo stupendo mestiere, diventando presto un punto di riferimento per gli abitanti della zona.",
    "Successivamente crea la sua prima linea di sandali su misura, riscuotendo un notevole e apprezzato successo. Il figlio Nunzio Prevenzano, sin da piccolo, frequenta la bottega rimanendo sempre più ammaliato dalle abilità del padre. Al termine degli studi al liceo, decide di entrare anch'egli nella bottega e intraprende contemporaneamente gli studi presso l'Accademia della Moda di Napoli come modellista di calzature.",
    "Nel 2018 Nunzio apre una nuova sede nel centro storico di Napoli, a pochi passi da Piazza del Plebiscito, dove farà da padrone la creatività e la manualità dell'arte del sandalo. Successivamente entra a far parte dell'attività anche la piccola di casa, Francesca Prevenzano, che si distingue subito per la sua bravura nel restauro di scarpe e borse.",
    "Calzoleria Prevenzano esporta il suo marchio in tutto il mondo, contraddistinguendosi per l'accuratezza nei dettagli. Tutti i materiali utilizzati provengono dal territorio nazionale: pellami pregiati per la tomaia, cuoio toscano certificato per le suole, cristalli Swarovski e pietre preziose per impreziosire ogni creazione. Il tutto certificato.",
  ],
  cta: "Scopri le nostre collezioni",
  ctaHref: "/sandali",
} as const;

// ─── Team Members ───────────────────────────────────────────────────

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  imageAlt: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Nunzio Prevenzano",
    role: "Sandal Maker & Modellista",
    description:
      "Seconda generazione dell'arte calzolaia. Formatosi presso l'Accademia della Moda di Napoli, unisce la tradizione paterna alle nuove tecniche di lavorazione. Ha aperto la sede storica in centro nel 2018.",
    image: "/uploads/2026/04/nunzio-team.jpg",
    imageAlt: "Nunzio Prevenzano — sandal maker e modellista di calzature",
  },
  {
    name: "Francesca Prevenzano",
    role: "Restauro & Pulizia",
    description:
      "La terza generazione della famiglia. Si è distinta per la sua bravura nel restauro di scarpe e borse, portando competenza e passione nell'arte della cura e del recupero della pelletteria.",
    image: "/uploads/2026/04/francesca-team.jpg",
    imageAlt: "Francesca Prevenzano — restauro e pulizia scarpe e borse",
  },
];

// ─── Page Component ─────────────────────────────────────────────────

function LaBottegaPage(): ReactNode {
  return (
    <>
      {/* Page hero */}
      <section className="bg-[var(--color-hero)] py-[var(--section-padding-y-lg)] border-b border-[var(--stitch-color)]/20">
        <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <m.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <span className="mb-4 inline-block text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              La nostra storia
            </span>
            <h1 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
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

      {/* Team section */}
      <ScrollAnimatedSection className="bg-[var(--color-surface)] py-[var(--section-padding-y-lg)]" variants={fadeInUp}>
        <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
          <div className="mb-14 text-center md:mb-16">
            <span className="mb-3 inline-block text-xs font-medium tracking-[var(--tracking-widest)] text-[var(--color-accent)]">
              Il nostro team
            </span>
            <h2 className="font-display text-[var(--text-lg)] font-semibold tracking-tight md:text-[var(--text-xl)]">
              Le mani dietro ogni sandalo
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
              Due generazioni di artigiani che portano avanti la tradizione calzolaia napoletana con passione e competenza.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-2">
            {TEAM_MEMBERS.map((member, index) => (
              <TeamCard key={member.name} member={member} index={index} />
            ))}
          </div>
        </section>
      </ScrollAnimatedSection>

      {/* Info block */}
      <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]" variants={fadeInUp}>
        <BottegaInfoBlock />
      </ScrollAnimatedSection>
    </>
  );
}

// ─── Team Card ──────────────────────────────────────────────────────

function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const variants = index % 2 === 0 ? slideInLeft : slideInRight;

  return (
    <m.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={member.image}
          alt={member.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width={600}
          height={792}
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold tracking-tight">{member.name}</h3>
        <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">{member.role}</p>
        <hr className="stitch-divider stitch-divider--left my-4" />
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {member.description}
        </p>
      </div>
    </m.div>
  );
}

// ─── Bottega Info Block ─────────────────────────────────────────────

function BottegaInfoBlock(): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <m.img
          src="/uploads/2026/04/nunzio-ritratto.jpg"
          alt="Nunzio Prevenzano al lavoro nella bottega di Via Chiaia, Napoli"
          className="aspect-[4/3] w-full rounded-[var(--radius-lg)] object-cover"
          loading="lazy"
          width={800}
          height={600}
          initial={{ opacity: 0, x: -32 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
        <m.div
          initial={{ opacity: 0, x: 32 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 32 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.15 }}
        >
          <h2 className="font-display text-[var(--text-xl)] font-semibold tracking-tight">
            La nostra bottega
          </h2>
          <hr className="stitch-divider stitch-divider--left my-4" />
          <p className="text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Nel cuore di Napoli, a due passi da Via Chiaia e Piazza del Plebiscito, la nostra bottega è il luogo dove la tradizione artigianale incontra la creatività. Qui puoi toccare con mano la qualità dei materiali, provare i modelli e vedere gli artigiani al lavoro.
          </p>
          <p className="mt-4 text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Oltre alla creazione di sandali su misura, offriamo servizi di lavaggio, tintura e recrafting su calzature di lusso come Church's, Edward Green e Tricker's.
          </p>
          <dl className="mt-8 space-y-4">
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm font-medium text-[var(--color-text-muted)]">Sede principale</dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">Via Chiaia, 104 — 80121 Napoli (NA)</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm font-medium text-[var(--color-text-muted)]">Seconda sede</dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">Via Michelangelo Schipa, 111 — 80122 Napoli (NA)</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-28 shrink-0 text-sm font-medium text-[var(--color-text-muted)]">Telefono</dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">081 0410442 — 081 19526465</dd>
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
