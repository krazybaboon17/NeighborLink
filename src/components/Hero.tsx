import { Search, ShieldCheck, Star, MapPin, Check, Dog, Sprout, Package, Wrench, Baby, BookOpen, ChevronDown, type LucideIcon } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HelperTag {
  Icon: LucideIcon;
  label: string;
}

interface HelperCard {
  name: string;
  distance: string;
  initials: string;
  gradient: string;
  tags: HelperTag[];
  rating: string;
  reviews: number;
  delay: string;
  position: string;
  rotate: string;
}

const helperCards: HelperCard[] = [
  {
    name: "Sarah M.",
    distance: "0.3 mi away",
    initials: "SM",
    gradient: "from-[hsl(11,56%,68%)] to-[hsl(11,56%,52%)]",
    tags: [{ Icon: Dog, label: "Dog Walking" }, { Icon: Sprout, label: "Gardening" }],
    rating: "4.9",
    reviews: 47,
    delay: "0s",
    position: "top-0 right-0 md:right-8",
    rotate: "-2deg",
  },
  {
    name: "Marcus T.",
    distance: "0.5 mi away",
    initials: "MT",
    gradient: "from-[hsl(105,11%,65%)] to-[hsl(105,11%,48%)]",
    tags: [{ Icon: Package, label: "Moving Help" }, { Icon: Wrench, label: "Handyman" }],
    rating: "5.0",
    reviews: 32,
    delay: "2s",
    position: "top-44 left-0 md:left-4",
    rotate: "1.5deg",
  },
  {
    name: "Priya R.",
    distance: "0.8 mi away",
    initials: "PR",
    gradient: "from-[hsl(38,55%,68%)] to-[hsl(11,56%,60%)]",
    tags: [{ Icon: Baby, label: "Childcare" }, { Icon: BookOpen, label: "Tutoring" }],
    rating: "4.8",
    reviews: 28,
    delay: "4s",
    position: "top-[22rem] right-4 md:right-16",
    rotate: "-1deg",
  },
];

export const Hero = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Floating cards drift up at different speeds as you scroll down.
  const yCard0 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const yCard1 = useTransform(scrollYProgress, [0, 1], [0, -260]);
  const yCard2 = useTransform(scrollYProgress, [0, 1], [0, -340]);
  const cardYs = [yCard0, yCard1, yCard2];
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = `/post-task${query ? `?title=${encodeURIComponent(query)}` : ""}`;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem("postAuthRedirect", target);
      navigate("/auth");
      return;
    }
    navigate(target);
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background pt-12 lg:pt-20 pb-32">
      {/* Decorative circles */}
      <div
        className="pointer-events-none fixed -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary/[0.05] -z-10"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -bottom-24 -left-24 w-[300px] h-[300px] rounded-full bg-accent/[0.06] -z-10"
        aria-hidden
      />

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-start">
          {/* Left Column */}
          <motion.div
            className="space-y-8 lg:pt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: heroTextY, opacity: heroOpacity }}
          >
            <h1 className="editorial-headline text-5xl sm:text-6xl lg:text-[5rem] text-foreground">
              Your <em className="italic font-light text-primary">neighborhood</em>,
              <br />
              your helpers
            </h1>

            <p className="font-body text-lg lg:text-xl text-muted-foreground max-w-[500px] leading-relaxed">
              Real people next door, ready to lend a hand. From dog walks to moving day —
              find trusted neighbors in Arlington Heights & Buffalo Grove.
            </p>

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="bg-card rounded-[20px] p-2 flex items-center gap-2 max-w-xl"
              style={{ boxShadow: "0 20px 60px hsl(60 3% 17% / 0.08)" }}
            >
              <div className="flex items-center flex-1 px-4">
                <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you need help with?"
                  className="w-full bg-transparent border-0 outline-none py-3 text-base font-body placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold px-6 py-3.5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 shrink-0"
              >
                Find Helpers
              </button>
            </form>

            {/* Trust badges */}
            <div className="pt-6 border-t border-muted-foreground/15 max-w-xl">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { icon: ShieldCheck, label: "Background checked" },
                  { icon: Star, label: "Neighbor reviewed" },
                  { icon: MapPin, label: "Local & verified" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center">
                      <b.icon className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="font-body text-sm text-muted-foreground font-medium">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - floating cards */}
          <div className="relative h-[560px] hidden lg:block">
            {helperCards.map((card, i) => (
              <motion.div
                key={card.name}
                className={`absolute ${card.position} w-[300px] bg-card rounded-3xl p-7`}
                style={{
                  boxShadow: "0 20px 60px hsl(60 3% 17% / 0.12)",
                  transform: `rotate(${card.rotate})`,
                  animation: `float-gentle 6s ease-in-out ${card.delay} infinite`,
                  y: cardYs[i],
                }}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-[60px] h-[60px] rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white font-display font-bold text-lg shrink-0`}
                  >
                    {card.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg text-foreground truncate">
                        {card.name}
                      </h3>
                      <span className="inline-flex items-center gap-0.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body">{card.distance}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {card.tags.map((t) => (
                    <span
                      key={t.label}
                      className="bg-background text-foreground text-xs font-body font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                    >
                      <t.Icon className="w-3 h-3" aria-hidden="true" />
                      {t.label}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-muted-foreground/10">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    <span className="font-display font-bold text-sm">{card.rating}</span>
                    <span className="text-xs text-muted-foreground font-body">
                      ({card.reviews})
                    </span>
                  </div>
                  <span className="text-primary font-display font-bold text-sm">
                    Available now
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile single card */}
          <motion.div
            className="lg:hidden bg-card rounded-3xl p-6 mx-auto w-full max-w-sm"
            style={{ boxShadow: "0 20px 60px hsl(60 3% 17% / 0.1)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[hsl(11,56%,68%)] to-[hsl(11,56%,52%)] flex items-center justify-center text-white font-display font-bold">
                SM
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg">Sarah M.</h3>
                  <span className="inline-flex items-center gap-0.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">0.3 mi away</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-background text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <Dog className="w-3 h-3" aria-hidden="true" /> Dog Walking
              </span>
              <span className="bg-background text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <Sprout className="w-3 h-3" aria-hidden="true" /> Gardening
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-muted-foreground/10">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                <span className="font-display font-bold text-sm">4.9</span>
                <span className="text-xs text-muted-foreground">(47)</span>
              </div>
              <span className="text-primary font-display font-bold text-sm">Available now</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground/70"
          style={{ opacity: heroOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5" aria-hidden="true" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
