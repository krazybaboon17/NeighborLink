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
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={{ scale: 1.08, rotate: 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {/* Rounded square background */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill="url(#doable-gradient)"
        />
        {/* Check mark */}
        <path
          d="M18 33L28 43L46 23"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <defs>
          <linearGradient id="doable-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(210, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(190, 85%, 45%)" />
          </linearGradient>
        </defs>
      </motion.svg>
      {showText && (
        <span className={`${textClass} font-bold tracking-tight`}>
          <span className="text-foreground">Do</span>
          <span className="text-primary">able</span>
        </span>
      )}
    </span>
  );
};
