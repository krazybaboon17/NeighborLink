import { motion } from "framer-motion";

const categories = [
  "🌱 Lawn care", "🛒 Grocery runs", "📦 Moving help", "🐕 Pet sitting",
  "🧹 House cleaning", "🔧 Small repairs", "🍂 Leaf raking", "❄️ Snow shoveling",
  "👶 Babysitting", "📚 Tutoring", "🚗 Carpooling", "🎨 Garage organizing",
  "🌻 Garden help", "🧰 Assembly", "🏠 Pet care", "💻 Tech help",
];

export function CategoryMarquee() {
  const row = [...categories, ...categories];
  return (
    <section className="py-12 overflow-hidden border-y border-border bg-card/30">
      <div className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-6">
        What neighbors are asking for
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <motion.div
          className="flex gap-3 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        >
          {row.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-background border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors"
            >
              {c}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
