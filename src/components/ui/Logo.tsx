import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const dims = { sm: 28, md: 36, lg: 48 }[size];
  const textClass = { sm: "text-lg", md: "text-xl", lg: "text-2xl" }[size];

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <motion.svg
        width={dims}
        height={dims}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={{ scale: 1.08, rotate: 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {/* Diamond/shield shape */}
        <path
          d="M60 6L108 42V78L60 114L12 78V42L60 6Z"
          fill="url(#shield-gradient)"
          stroke="url(#border-gradient)"
          strokeWidth="2"
        />
        {/* House windows */}
        <rect x="46" y="20" width="8" height="8" rx="1.5" fill="white" opacity="0.9" />
        <rect x="58" y="20" width="8" height="8" rx="1.5" fill="white" opacity="0.9" />
        <rect x="46" y="32" width="8" height="8" rx="1.5" fill="white" opacity="0.9" />
        <rect x="58" y="32" width="8" height="8" rx="1.5" fill="white" opacity="0.7" />
        {/* Landscape wave */}
        <path
          d="M12 70C32 60 50 64 60 64C70 64 88 60 108 70V78L60 114L12 78V70Z"
          fill="url(#wave-gradient)"
          opacity="0.6"
        />
        {/* Handshake */}
        <g transform="translate(30, 58)" opacity="0.95">
          <path
            d="M4 18C4 18 8 8 18 8C22 8 26 10 28 12"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M56 18C56 18 52 8 42 8C38 8 34 10 32 12"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M28 12C30 14 30 18 30 20"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M32 12C30 14 30 18 30 20"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="30" cy="12" r="3" fill="white" opacity="0.8" />
        </g>
        <defs>
          <linearGradient id="shield-gradient" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(145, 55%, 42%)" />
            <stop offset="50%" stopColor="hsl(165, 50%, 45%)" />
            <stop offset="100%" stopColor="hsl(190, 60%, 48%)" />
          </linearGradient>
          <linearGradient id="border-gradient" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(145, 55%, 35%)" />
            <stop offset="100%" stopColor="hsl(190, 60%, 40%)" />
          </linearGradient>
          <linearGradient id="wave-gradient" x1="12" y1="56" x2="108" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(190, 65%, 50%)" />
            <stop offset="100%" stopColor="hsl(200, 70%, 55%)" />
          </linearGradient>
        </defs>
      </motion.svg>
      {showText && (
        <span className={`${textClass} font-bold tracking-tight`}>
          <span className="text-foreground">Task</span>
          <span className="text-primary">It!</span>
        </span>
      )}
    </span>
  );
};
