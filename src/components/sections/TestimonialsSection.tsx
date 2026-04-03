import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { Quote } from "lucide-react";
import { m } from "motion/react";

interface Testimonial {
  text: string;
  author: string;
  city: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    text: "Ho preso i sandali gioiello personalizzati — pelle camoscio beige con tacco basso. Leggerissimi, sembra di camminare sulle nuvole. Li ho già ordinati in un altro colore.",
    author: "Maria Carmela R.",
    city: "Napoli",
  },
  {
    text: "La qualità della pelle si sente subito. Ho comprato sandali artigianali in giro per l'Italia, ma questi sono diversi — cuciture perfette, plantare comodo fin dal primo giorno.",
    author: "Antonio D.",
    city: "Roma",
  },
  {
    text: "Ho regalato un paio a mia madre — ha scelto ogni dettaglio sul sito e li ha ricevuti in tre giorni. È rimasta felicissima, dice che sono i sandali più belli che abbia mai avuto.",
    author: "Francesca B.",
    city: "Milano",
  },
  {
    text: "Non è solo un negozio, è una bottega dove entri e senti l'odore della pelle buona. Il personale ti aiuta a scegliere e ti spiega ogni materiale. Esperienza rara.",
    author: "Luca M.",
    city: "Napoli",
  },
  {
    text: "Ordino online da due anni ormai. Sempre puntuali, sempre ben confezionati. L'anno scorso ho fatto un reso ed è stato semplicissimo.",
    author: "Giulia P.",
    city: "Torino",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <m.article
      className="group relative rounded-[var(--radius-lg)] border border-[var(--color-border-light)] bg-[var(--color-surface)] p-6 md:p-8 transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      {/* Quote icon */}
      <Quote className="mb-4 h-6 w-6 text-[var(--color-accent)]" />

      {/* Text */}
      <p className="text-[var(--text-sm)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)] italic">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        {/* Avatar with initials */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] font-display text-sm font-semibold text-white">
          {testimonial.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {testimonial.author}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {testimonial.city}
          </p>
        </div>
      </div>

      {/* 🧬 DNA: Stitch corner accents */}
      <div className="absolute left-4 top-0 h-4 w-4 border-l-2 border-t-2 border-[var(--color-accent)]/20 rounded-tl-sm md:left-6" />
      <div className="absolute right-4 bottom-0 h-4 w-4 border-b-2 border-r-2 border-[var(--color-accent)]/20 rounded-br-sm md:right-6" />
    </m.article>
  );
}

export function TestimonialsSection() {
  return (
    <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* 🧬 Section header — Customer voices themed */}
        <div className="mb-12 text-center md:mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <Quote className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
              Clienti
            </span>
          </div>
          <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
            Cosa dicono di noi
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--text-base)] leading-[var(--leading-relaxed)] text-[var(--color-text-secondary)]">
            Le parole di chi ci ha scelto — da Napoli a Torino, le storie
            di chi cammina con i nostri sandali.
          </p>
        </div>

        {/* Staggered grid: 1 col mobile, 2 col md, 3 col lg */}
        <StaggeredGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <StaggeredItem key={testimonial.author}>
              <TestimonialCard testimonial={testimonial} />
            </StaggeredItem>
          ))}
        </StaggeredGrid>
      </section>
    </ScrollAnimatedSection>
  );
}
