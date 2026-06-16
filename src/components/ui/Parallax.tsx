import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  /** Pixels to translate over the scroll range. Positive = moves down slower (further), negative = faster. */
  offset?: number;
  className?: string;
}

/** Scroll-driven vertical translate. Wrap any decorative or content block. */
export const Parallax = ({ children, offset = -80, className }: ParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

interface ScrollScaleProps {
  children: ReactNode;
  className?: string;
}

/** Section that scales/fades in as it enters and slightly out as it leaves. */
export const ScrollScale = ({ children, className }: ScrollScaleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "end 0.2"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.97]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.7]);
  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
};

/** Top-of-page scroll progress bar. */
export const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent to-primary origin-left z-[60]"
      style={{ scaleX: scrollYProgress as MotionValue<number> }}
      aria-hidden
    />
  );
};
