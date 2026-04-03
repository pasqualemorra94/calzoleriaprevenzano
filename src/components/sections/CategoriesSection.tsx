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
    href: "/sandali",
    image: "/images/cat-sandali.svg",
    featured: true,
  },
  {
    title: "Accessori per Calzature",
    description:
      "Solette, calzature per la cura delle scarpe e accessori tecnici per chi bada al dettaglio.",
    cta: "Scopri gli accessori",
    href: "/catalogo",
    image: "/images/cat-accessori.svg",
  },
  {
    title: "Pelletteria",
    description:
      "Portafogli, cinture e borselli in pelle italiana — piccoli oggetti che raccontano la stessa artigianalità dei nostri sandali.",
    cta: "Vedi la pelletteria",
    href: "/catalogo",
    image: "/images/cat-pelletteria.svg",
  },
];

function CategoryCard({ category }: { category: Category }) {
  const isFeatured = category.featured ?? false;
  return (
    <m.a
      href={category.href}
      className={`group relative block overflow-hidden rounded-[var(--radius-xl)] ${isFeatured ? "" : "rounded-[var(--radius-lg)]"}`}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Image */}
      <div className={`overflow-hidden bg-[var(--color-muted)] ${isFeatured ? "aspect-[21/9] md:aspect-[21/9]" : "aspect-[4/3]"}`}>
        <img
          src={category.image}
          alt={category.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          loading="lazy"
          width={isFeatured ? 1200 : 800}
          height={isFeatured ? 514 : 600}
        />
      </div>

      {/* Overlay with better gradient */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 md:p-8">
        {/* Label */}
        <span className="mb-2 inline-block w-fit rounded-[var(--radius-sm)] bg-[var(--color-accent)]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-foreground)]">
          Collezione
        </span>
        <h3 className={`font-display font-semibold text-white ${isFeatured ? "text-[var(--text-3xl)] md:text-[var(--text-4xl)]" : "text-[var(--text-2xl)] md:text-[var(--text-3xl)]"}`}>
          {category.title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
          {category.description}
        </p>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
          <span>{category.cta}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </div>
      </div>

      {/* Hover border frame */}
      <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-xl)] border border-white/0 transition-all duration-300 group-hover:border-[var(--color-accent)]/30" />
    </m.a>
  );
}

export function CategoriesSection() {
  return (
    <ScrollAnimatedSection className="bg-[var(--color-background)] py-[var(--section-padding-y-lg)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header */}
        <div className="mb-14 text-center md:mb-20">
          <span className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Le nostre collezioni
          </span>
          <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
            Artigianato che racconta
          </h2>
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