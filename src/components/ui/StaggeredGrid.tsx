import { m } from "motion/react";
import type { ReactNode } from "react";
import { staggerContainer, staggerItem } from "~/lib/animation-variants";
import { useSafeVariants } from "~/lib/animation-variants";

interface StaggeredGridProps {
  children: ReactNode;
  className?: string;
}

export function StaggeredGrid({ children, className }: StaggeredGridProps): ReactNode {
  const safeContainer = useSafeVariants(staggerContainer);

  return (
    <m.div
      className={className}
      variants={safeContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </m.div>
  );
}

export function StaggeredItem({ children, className }: StaggeredGridProps): ReactNode {
  const safeItem = useSafeVariants(staggerItem);

  return (
    <m.div variants={safeItem} className={className}>
      {children}
    </m.div>
  );
}
