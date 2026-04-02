import { ScrollAnimatedSection } from "~/components/ui/ScrollAnimatedSection";
import { StaggeredGrid, StaggeredItem } from "~/components/ui/StaggeredGrid";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

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
    image: "/images/cat-sandali.webp",
    featured: true,
  },
  {
    title: "Accessori per Calzature",
    description:
      "Solette, calzature per la cura delle scarpe e accessori tecnici per chi bada al dettaglio.",
    cta: "Scopri gli accessori",
    href: "/accessori",
    image: "/images/cat-accessori.webp",
  },
  {
    title: "Pelletteria",
    description:
      "Portafogli, cinture e borselli in pelle italiana — piccoli oggetti che raccontano la stessa artigianalità dei nostri sandali.",
    cta: "Vedi la pelletteria",
    href: "/pelletteria",
    image: "/images/cat-pelletteria.webp",
  },
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <motion.a
      href={category.href}
      className="group relative block overflow-hidden rounded-[var(--radius-lg)]"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-[var(--color-muted)]">
        <img
          src={category.image}
          alt={category.title}
          className="h-full w-full object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.05]"
          loading="lazy"
          width={800}
          height={600}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-6 md:p-8">
        <h3 className="font-display text-[var(--text-2xl)] font-semibold text-white md:text-[var(--text-3xl)]">
          {category.title}
        </h3>
        <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-white/80 md:text-base">
          {category.description}
        </p>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]">
          <span>{category.cta}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-[var(--transition-base)] group-hover:translate-x-1" />
        </div>
      </div>

      {/* 🧬 DNA: Stitch border frame */}
      <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/0 transition-colors duration-[var(--transition-base)] group-hover:border-[var(--color-accent)]/30" />
    </motion.a>
  );
}

export function CategoriesSection() {
  return (
    <ScrollAnimatedSection className="py-[var(--section-padding-y)] bg-[var(--color-background)]">
      <section className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* Section header */}
        <div className="mb-12 text-center md:mb-16">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-[var(--tracking-widest)] text-[var(--color-text-muted)]">
            Collezioni
          </span>
          <h2 className="font-display text-[var(--text-4xl)] font-semibold tracking-tight">
            Le nostre collezioni
          </h2>
        </div>

        {/* Bento Grid: 2+1 layout — featured card spans 2 cols */}
        <StaggeredGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Featured category — spans 2 cols on md+ */}
          <StaggeredItem className="md:col-span-2">
            <CategoryCard category={CATEGORIES[0]} />
          </StaggeredItem>

          {/* Secondary categories — 1 col each */}
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
