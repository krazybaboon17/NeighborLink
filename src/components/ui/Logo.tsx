import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import { useBrand, BRAND_ACCENT, BRAND_MAIN } from "@/contexts/BrandContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/**
 * Taskify mark: a chunky handshake glyph on a brand-brown rounded-square
 * badge with a soft inner highlight. Designed to read as a handshake at
 * every size — from favicon to billboard — without any surrounding chrome.
 */
export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const dims = { sm: 32, md: 40, lg: 56 }[size];
  // Icon takes ~65% of the badge — big enough to read instantly.
  const iconSize = Math.round(dims * 0.62);
  const textClass = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const { mainPart, accentPart } = useBrand();

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <motion.span
        className="relative inline-flex items-center justify-center overflow-hidden"
        style={{
          width: dims,
          height: dims,
          borderRadius: Math.round(dims * 0.28),
          background: `linear-gradient(140deg, ${BRAND_ACCENT} 0%, #6F4421 100%)`,
          boxShadow: `0 1px 0 0 rgba(255,255,255,0.35) inset, 0 0 0 1.5px ${BRAND_MAIN} inset, 0 2px 6px -1px rgba(20,12,4,0.25)`,
        }}
        whileHover={{ scale: 1.06, rotate: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        role="img"
        aria-label="Taskify logo — a handshake"
      >
        {/* Soft top-light highlight for depth */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "45%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        <Handshake
          size={iconSize}
          color="#FBF6EE"
          strokeWidth={2.4}
          aria-hidden="true"
          style={{ position: "relative", zIndex: 1 }}
        />
      </motion.span>
      {showText && (
        <span className={`${textClass} font-bold tracking-tight leading-none`}>
          <span style={{ color: BRAND_MAIN }}>{mainPart}</span>
          <span style={{ color: BRAND_ACCENT }}>{accentPart}</span>
        </span>
      )}
    </span>
  );
};
