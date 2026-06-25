import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import { useBrand, BRAND_ACCENT, BRAND_MAIN } from "@/contexts/BrandContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

/**
 * Standalone handshake mark in a bordered, rounded-square badge.
 * Self-contained — works as a navbar logo, favicon, app icon, or
 * stamped onto marketing assets without any surrounding UI context.
 */
export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const dims = { sm: 32, md: 40, lg: 56 }[size];
  const iconSize = { sm: 18, md: 24, lg: 32 }[size];
  const textClass = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];
  const { mainPart, accentPart } = useBrand();

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <motion.span
        className="relative inline-flex items-center justify-center rounded-[28%] overflow-hidden"
        style={{
          width: dims,
          height: dims,
          background: "linear-gradient(135deg, #FBF6EE 0%, #F2E6D2 100%)",
          border: `2px solid ${BRAND_MAIN}`,
          boxShadow: `inset 0 0 0 1px ${BRAND_MAIN}1f`,
        }}
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        role="img"
        aria-label="Taskify logo"
      >
        <Handshake
          size={iconSize}
          color={BRAND_MAIN}
          strokeWidth={2.2}
          aria-hidden="true"
        />
        {/* Accent dot — the community spark at the clasp */}
        <span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{
            width: Math.max(4, Math.round(dims * 0.13)),
            height: Math.max(4, Math.round(dims * 0.13)),
            background: BRAND_ACCENT,
            boxShadow: `0 0 0 1.5px ${BRAND_MAIN}`,
            top: "62%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
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
