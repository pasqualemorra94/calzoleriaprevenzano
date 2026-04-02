import { ScrollCounter } from "~/components/ui/ScrollCounter";
import { m, useInView } from "motion/react";
import { useRef } from "react";
import { ShieldCheck, Truck, RotateCcw, CreditCard } from "lucide-react";
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
    icon: RotateCcw,
    title: "Reso facile",
    description: "30 giorni per ripensarci, reso senza complicazioni",
    counter: { target: 30, suffix: " giorni" },
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
      className="flex flex-col items-center text-center"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        <Icon className="h-5 w-5 text-[var(--color-accent)]" />
      </div>

      <h3 className="font-display text-sm font-semibold text-white md:text-base">
        {item.title}
      </h3>

      {item.counter ? (
        <div className="mt-1">
          <ScrollCounter
            target={item.counter.target}
            suffix={item.counter.suffix}
            className="text-xl font-bold text-[var(--color-accent)] md:text-2xl"
          />
        </div>
      ) : null}

      <p className="mt-1 text-xs leading-relaxed text-white/60 md:text-sm">
        {item.description}
      </p>
    </m.div>
  );
}

export function TrustStripSection() {
  return (
    <section className="bg-[var(--color-primary-dark)] py-12">
      <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)]">
        {/* 🧬 DNA: Stitch lines top and bottom */}
        <hr className="mx-auto mb-8 h-[var(--stitch-width)] w-[var(--stitch-length)] border-0 bg-[var(--color-accent)]/40" />

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {TRUST_ITEMS.map((item, index) => (
            <TrustCard key={item.title} item={item} index={index} />
          ))}
        </div>

        <hr className="mx-auto mt-8 h-[var(--stitch-width)] w-[var(--stitch-length)] border-0 bg-[var(--color-accent)]/40" />
      </div>
    </section>
  );
}
