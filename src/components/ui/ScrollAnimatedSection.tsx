import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";
import { fadeInUp } from "~/lib/animation-variants";
import { useSafeVariants } from "~/lib/animation-variants";

interface ScrollAnimatedSectionProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  /** Threshold: how much of the element must be visible to trigger (0-1) */
  threshold?: number;
  /** Only animate once (default true — best for most sections) */
  once?: boolean;
  /** Delay before animation starts, in seconds */
  delay?: number;
}

export function ScrollAnimatedSection({
  children,
  className,
  variants = fadeInUp,
  threshold = 0.15,
  once = true,
  delay = 0,
}: ScrollAnimatedSectionProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: threshold, once });
  const safeVariants = useSafeVariants(variants);

  return (
    <motion.div
      ref={ref}
      variants={safeVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </motion.div>
  );
}
