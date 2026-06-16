import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  location: string | null;
  quote: string;
  rating: number | null;
}

export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setItems(data);
    })();
  }, []);

  if (!items.length) return null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-2">
          From our neighbors
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Real words from real people in Arlington Heights & Buffalo Grove.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl transition-shadow"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/15" />
              {t.rating && (
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, k) => (
                    <Star key={k} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
              <p className="text-foreground leading-relaxed mb-4">"{t.quote}"</p>
              <div className="text-sm">
                <div className="font-semibold">{t.author_name}</div>
                <div className="text-muted-foreground">
                  {[t.author_role, t.location].filter(Boolean).join(" · ")}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
