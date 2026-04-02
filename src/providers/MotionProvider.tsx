/**
 * Motion Provider — wraps the app with framer-motion LazyMotion
 *
 * Uses domAnimation feature bundle for SSR-compatible rendering.
 * All motion components inside must use `m` instead of `motion`.
 *
 * This prevents hydration mismatches caused by framer-motion rendering
 * different inline styles on server vs client.
 */

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
