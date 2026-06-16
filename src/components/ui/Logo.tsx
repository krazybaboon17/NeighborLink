import { motion } from "framer-motion";
import { useBrand, BRAND_ACCENT, BRAND_MAIN } from "@/contexts/BrandContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/**
 * Sprouting leaf + spark logo.
 * Symbolizes young helpers growing in the neighborhood.
 */
export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const dims = { sm: 28, md: 36, lg: 48 }[size];
  const textClass = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const { mainPart, accentPart } = useBrand();

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <motion.svg
        width={dims}
        height={dims}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={{ scale: 1.1, rotate: -6 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        aria-label="App logo"
      >
        {/* Stem */}
        <path
          d="M32 58 C 32 46, 30 38, 24 32"
          stroke={BRAND_MAIN}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Leaf body */}
        <path
          d="M32 38 C 14 36, 8 22, 14 8 C 30 8, 40 18, 38 34 C 36 38, 34 38, 32 38 Z"
          fill="url(#leaf-grad)"
          stroke={BRAND_MAIN}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Leaf vein */}
        <path
          d="M14 10 C 22 18, 28 26, 34 34"
          stroke={BRAND_MAIN}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
          fill="none"
        />
        {/* Spark (4-point star) */}
        <g transform="translate(46 14)">
          <path
            d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"
            fill={BRAND_ACCENT}
          />
          <circle cx="0" cy="0" r="1.6" fill="#fff" />
        </g>
        {/* Tiny secondary spark */}
        <circle cx="42" cy="28" r="1.8" fill={BRAND_ACCENT} opacity="0.85" />
        <defs>
          <linearGradient id="leaf-grad" x1="8" y1="8" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C68450" />
            <stop offset="100%" stopColor={BRAND_ACCENT} />
          </linearGradient>
        </defs>
      </motion.svg>
      {showText && (
        <span className={`${textClass} font-bold tracking-tight leading-none`}>
          <span style={{ color: BRAND_MAIN }}>{mainPart}</span>
          <span style={{ color: BRAND_ACCENT }}>{accentPart}</span>
        </span>
      )}
    </span>
  );
};
