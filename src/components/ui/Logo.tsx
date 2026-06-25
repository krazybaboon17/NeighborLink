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

        {/* Handshake — two interlocking forearms meeting at the center */}
        <g
          stroke={BRAND_MAIN}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          {/* Left forearm */}
          <path d="M11 38 L24 32 L33 36" />
          {/* Right forearm */}
          <path d="M53 38 L40 32 L31 36" />
          {/* Left hand grip */}
          <path d="M24 32 L26 28 L32 28 L34 31" />
          {/* Right hand grip */}
          <path d="M40 32 L38 28 L32 28 L30 31" />
        </g>

        {/* Accent clasp at the handshake center */}
        <circle cx="32" cy="34" r="3.2" fill={BRAND_ACCENT} />
        <circle cx="32" cy="34" r="1.2" fill="#fff" />

        {/* Tiny spark — keeps the "community spark" feel */}
        <g transform="translate(46 18)" opacity="0.95">
          <path
            d="M0 -3.4 L0.9 -0.9 L3.4 0 L0.9 0.9 L0 3.4 L-0.9 0.9 L-3.4 0 L-0.9 -0.9 Z"
            fill={BRAND_ACCENT}
          />
        </g>

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
