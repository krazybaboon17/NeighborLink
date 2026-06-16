import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PenLine, Handshake, MessageCircle, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: PenLine, title: "Post a task", body: "Describe what you need help with. Free, takes a minute." },
  { icon: Handshake, title: "Get offers", body: "Vetted local helpers send you their rate and intro." },
  { icon: MessageCircle, title: "Chat & confirm", body: "Coordinate timing and payment off-app, in Messages." },
  { icon: CheckCircle2, title: "Task complete", body: "Approve completion, leave a review, build the neighborhood." },
];

export function HowItWorksTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.85], ["0%", "100%"]);

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-2">How it works</h2>
        <p className="text-center text-muted-foreground mb-16">
          From posting to completion, the whole flow.
        </p>
        <div ref={ref} className="relative">
          {/* Track */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-border" />
          {/* Animated fill */}
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-6 md:left-1/2 top-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary via-primary to-accent"
          />
          <div className="space-y-12">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const leftSide = i % 2 === 0;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`relative flex items-center ${leftSide ? "md:flex-row" : "md:flex-row-reverse"} gap-6`}
                >
                  {/* Dot */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-lg z-10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {/* Card */}
                  <div className="md:w-1/2 ml-20 md:ml-0 md:px-12">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -3 }}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl transition-shadow"
                    >
                      <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
                        Step {i + 1}
                      </div>
                      <div className="text-xl font-bold mb-1">{s.title}</div>
                      <div className="text-muted-foreground">{s.body}</div>
                    </motion.div>
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
