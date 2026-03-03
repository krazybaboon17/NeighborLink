import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Homeowner",
    text: "Found an amazing helper for my yard work within an hour. The AI pricing suggestion saved me time negotiating — fair for both sides!",
    rating: 5,
    initials: "SM",
  },
  {
    name: "David K.",
    role: "Student Helper",
    text: "I've earned over $800 helping neighbors this month. The verification process made people trust me instantly. Great for building my service hours too.",
    rating: 5,
    initials: "DK",
  },
  {
    name: "Maria L.",
    role: "Senior Resident",
    text: "As someone who lives alone, the safety features give me real peace of mind. My helper was verified, polite, and finished my grocery run perfectly.",
    rating: 5,
    initials: "ML",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export const Testimonials = () => {
  return (
    <section className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-2 mb-4">Loved by Neighbors</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from people in communities like yours.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={itemVariants}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card className="p-8 glass-card border-2 hover:border-primary/20 transition-all h-full relative">
                  <Quote className="w-8 h-8 text-primary/15 absolute top-6 right-6" />
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {t.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
