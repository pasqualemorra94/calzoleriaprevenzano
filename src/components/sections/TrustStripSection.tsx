import { ScrollCounter } from "~/components/ui/ScrollCounter";
import { m, useInView } from "motion/react";
import { useRef } from "react";
import { ShieldCheck, Truck, BadgeCheck, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
  counter?: { target: number; suffix: string };
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: ShieldCheck,
    title: "Made in Italy",
    description: "Pellami italiani, produzione artigianale napoletana",
  },
  {
    icon: BadgeCheck,
    title: "Pellami italiani certificati",
    description: "Materiali selezionati da concerie italiane di alta qualità",
  },
  {
    icon: Truck,
    title: "Spedizione rapida",
    description: "Consegniamo in tutta Italia in 2-5 giorni lavorativi",
    counter: { target: 2, suffix: "-5 gg" },
  },
  {
    icon: CreditCard,
    title: "Pagamento sicuro",
    description: "Carta di credito, PayPal, bonifico",
  },
];

function TrustCard({ item, index }: { item: TrustItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const Icon = item.icon;

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.1,
      }}
      className="group flex flex-col items-center text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:border-[var(--color-accent)]/30 group-hover:bg-white/10">
        <Icon className="h-5 w-5 text-[var(--color-accent)]" />
      </div>

      <h3 className="font-display text-base font-semibold text-white">
        {item.title}
      </h3>

      {item.counter ? (
        <div className="mt-1">
          <ScrollCounter
            target={item.counter.target}
            suffix={item.counter.suffix}
            className="text-xl font-bold text-[var(--color-accent)]"
          />
        </div>
      ) : null}

      <p className="mt-1 text-sm leading-relaxed text-white/50">
        {item.description}
      </p>
    </m.div>
  );
}

export function TrustStripSection() {
  return (
    <section className="relative bg-[var(--color-primary-dark)] py-16 md:py-20 overflow-hidden">
      {/* 🧬 DNA: Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #C9A961 1px, transparent 1px)", backgroundSize: "6px 6px" }} />

      <div className="relative mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* 🧬 DNA: Decorative stitch lines */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="h-[1px] rounded-full"
              style={{
                width: i % 2 === 0 ? "28px" : "10px",
                backgroundColor: `var(--color-accent)`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {TRUST_ITEMS.map((item, index) => (
            <TrustCard key={item.title} item={item} index={index} />
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="h-[1px] rounded-full"
              style={{
                width: i % 2 === 0 ? "28px" : "10px",
                backgroundColor: `var(--color-accent)`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
