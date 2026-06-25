import { motion } from "framer-motion";
import { useBrand, BRAND_ACCENT, BRAND_MAIN } from "@/contexts/BrandContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/**
 * Standalone handshake mark in a bordered, rounded-square badge.
 * Reads as a complete logo on its own — safe to drop onto avatars,
 * favicons, app icons, business cards, or social posts.
 */
export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const dims = { sm: 32, md: 40, lg: 56 }[size];
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
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        role="img"
        aria-label="Taskify logo"
      >
        {/* Bordered badge background */}
        <rect
          x="2.5"
          y="2.5"
          width="59"
          height="59"
          rx="14"
          fill="url(#badge-grad)"
          stroke={BRAND_MAIN}
          strokeWidth="2.5"
        />
        {/* Inner subtle hairline */}
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="11"
          fill="none"
          stroke={BRAND_MAIN}
          strokeOpacity="0.18"
          strokeWidth="1"
        />

        {/* Handshake — two clasped hands, bold and legible at any size */}
        <g
          stroke={BRAND_MAIN}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* Left forearm + hand */}
          <path d="M10 40 L22 34" />
          <path d="M22 34 C 26 30, 30 30, 34 34" />
          {/* Right forearm + hand */}
          <path d="M54 40 L42 34" />
          <path d="M42 34 C 38 30, 34 30, 30 34" />
          {/* Thumb crease left */}
          <path d="M26 31 L29 33" strokeWidth="2.5" />
          {/* Thumb crease right */}
          <path d="M38 31 L35 33" strokeWidth="2.5" />
        </g>

        {/* Accent clasp dot — the "spark" of community */}
        <circle cx="32" cy="34" r="2.8" fill={BRAND_ACCENT} stroke={BRAND_MAIN} strokeWidth="1.5" />

        <defs>
          <linearGradient id="badge-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBF6EE" />
            <stop offset="100%" stopColor="#F2E6D2" />
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
