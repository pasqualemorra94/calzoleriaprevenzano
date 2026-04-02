import { motion } from "motion/react";
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
    <motion.div
      className={className}
      variants={safeContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className }: StaggeredGridProps): ReactNode {
  const safeItem = useSafeVariants(staggerItem);

  return (
    <motion.div variants={safeItem} className={className}>
      {children}
    </motion.div>
  );
}
