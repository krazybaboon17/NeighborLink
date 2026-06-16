import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

function useCountUp(target: number, inView: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.round(target * (0.2 + 0.8 * p))); // ease-ish
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return value;
}

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [stats, setStats] = useState({ tasks: 0, completed: 0, neighbors: 0, hours: 0 });

  useEffect(() => {
    (async () => {
      const [t, c, n, h] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        (supabase as any).from("volunteer_hours").select("hours"),
      ]);
      const hoursTotal = Array.isArray(h.data)
        ? h.data.reduce((s: number, r: any) => s + (Number(r.hours) || 0), 0)
        : 0;
      setStats({
        tasks: t.count || 0,
        completed: c.count || 0,
        neighbors: n.count || 0,
        hours: Math.round(hoursTotal),
      });
    })();
  }, []);

  const v1 = useCountUp(stats.tasks, inView);
  const v2 = useCountUp(stats.completed, inView);
  const v3 = useCountUp(stats.neighbors, inView);
  const v4 = useCountUp(stats.hours, inView);

  const items = [
    { label: "Tasks posted", value: v1 },
    { label: "Tasks completed", value: v2 },
    { label: "Neighbors joined", value: v3 },
    { label: "Volunteer hours", value: v4 },
  ];

  return (
    <section ref={ref} className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center text-3xl md:text-4xl font-bold mb-2"
        >
          Built by neighbors, for neighbors
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12">Real numbers from our pilot communities.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent tabular-nums">
                {it.value.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{it.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
