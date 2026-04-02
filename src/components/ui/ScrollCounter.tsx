import { useRef, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useInView, animate } from "motion/react";

interface ScrollCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function ScrollCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
}: ScrollCounterProps): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value: number) => setDisplayValue(Math.round(value)),
    });

    return () => controls.stop();
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
