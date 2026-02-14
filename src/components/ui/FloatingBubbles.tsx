import { motion } from "framer-motion";

const bubbles = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  size: Math.random() * 60 + 20,
  left: Math.random() * 100,
  delay: Math.random() * 5,
  duration: Math.random() * 8 + 10,
}));

export const FloatingBubbles = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-primary/5 border border-primary/10"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            bottom: '-10%',
          }}
          animate={{
            y: [0, -window.innerHeight * 1.3],
            scale: [0, 1, 0.8],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};
