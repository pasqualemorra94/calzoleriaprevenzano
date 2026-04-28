import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { ArrowRight } from "lucide-react";
import { m } from "motion/react";

interface Category {
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  featured?: boolean;
}

const CATEGORIES: Category[] = [
  {
    title: "Sandali Artigianali",
    description:
      "La collezione completa — dal classico infradito al modello gioiello. Ogni sandalo è personalizzabile nei materiali e nei dettagli.",
    cta: "Esplora i sandali",
    href: "/catalogo?category=sandali",
    image: "/images/sandali.jpg",
    featured: true,
  },
  {
    title: "Pelletteria",
    description:
      "Portafogli, cinture e borselli in pelle italiana — piccoli oggetti che raccontano la stessa artigianalità dei nostri sandali.",
    cta: "Vedi la pelletteria",
    href: "/catalogo?category=pelletteria",
    image: "/images/pelletteria.jpg",
  },
  {
    title: "Accessori per Calzature",
    description:
      "Solette, calzature per la cura delle scarpe e accessori tecnici per chi bada al dettaglio.",
    cta: "Scopri gli accessori",
    href: "/catalogo?category=articoli-calzature",
    image: "/images/accessori-calzature.jpg",
  },
];

function CategoryCard({ category }: { category: Category }) {
  const isFeatured = category.featured ?? false;
  return (
    <m.a
      href={category.href}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image */}
      <div className={`overflow-hidden bg-[var(--color-muted)] ${isFeatured ? "aspect-[21/9]" : "aspect-[4/3]"}`}>
        <img
          src={category.image}
          alt={category.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          loading="lazy"
          width={isFeatured ? 1200 : 800}
          height={isFeatured ? 514 : 600}
        />
      </div>

      {/* Text panel — readable on solid surface */}
      <div className={`flex flex-1 flex-col ${isFeatured ? "p-5 md:p-10" : "p-4 md:p-7"}`}>
        <span className="mb-2 inline-block w-fit rounded-[var(--radius-sm)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.18em] uppercase text-[var(--color-accent)] md:mb-3 md:px-3 md:py-1 md:text-[10px] md:tracking-[0.15em]">
          Collezione
        </span>
        <h3 className={`font-display font-semibold tracking-tight text-[var(--color-foreground)] ${isFeatured ? "text-[1.15rem] md:text-[var(--text-2xl)]" : "text-[1rem] md:text-[var(--text-xl)]"}`}>
          {category.title}
        </h3>
        <p className="mt-2 max-w-md text-[12px] leading-relaxed text-[var(--color-text-secondary)] md:mt-3 md:text-base">
          {category.description}
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[12px] font-medium text-[var(--color-accent)] md:gap-2 md:pt-5 md:text-sm">
          <span>{category.cta}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 md:h-4 md:w-4" />
        </div>
      </div>
    </m.a>
  );
}

export function CategoriesSection() {
  return (
    <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y-lg)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* 🧬 Section header — Napoli-themed with stitch + Vesuvio silhouette motif */}
        <div className="mb-10 text-center md:mb-20">
          <div className="mb-4 inline-flex items-center gap-3 md:mb-6 md:gap-4">
            <span className="h-px w-8 bg-[var(--color-accent)]/50 md:w-12" />
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[var(--color-accent)] md:text-xs md:normal-case">
              Le nostre collezioni
            </span>
            <span className="h-px w-8 bg-[var(--color-accent)]/50 md:w-12" />
          </div>
          <h2 className="font-display text-[1.3rem] font-semibold tracking-tight md:text-[var(--text-xl)]">
            Artigianato che racconta
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-[1.65] text-[var(--color-text-secondary)] md:mt-4 md:text-[var(--text-base)] md:leading-[var(--leading-relaxed)]">
            Tre anime del nostro lavoro — dal sandalo al complemento, ogni pezzo
            nasce dalle mani della famiglia Prevenzano, in bottega a Napoli dal 1984.
          </p>
          {/* 🧬 DNA: Decorative stitch pattern */}
          <div className="mt-8 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="h-[2px] rounded-full"
                style={{
                  width: i % 2 === 0 ? "24px" : "8px",
                  backgroundColor: `var(--color-accent)`,
                  opacity: i % 2 === 0 ? 0.6 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bento Grid: featured card full-width + 2 cards side by side */}
        <StaggeredGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          <StaggeredItem className="md:col-span-2">
            <CategoryCard category={CATEGORIES[0]} />
          </StaggeredItem>
          {CATEGORIES.slice(1).map((category) => (
            <StaggeredItem key={category.title}>
              <CategoryCard category={category} />
            </StaggeredItem>
          ))}
        </StaggeredGrid>
      </section>
    </ScrollAnimatedSection>
  );
}
