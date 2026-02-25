import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Clock, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingBubbles } from "@/components/ui/FloatingBubbles";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--hero-gradient)' }}>
      <FloatingBubbles />

      <div className="container mx-auto px-4 py-24 lg:py-36 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-block"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-foreground text-sm font-medium">
                <Zap className="w-4 h-4 text-accent" />
                AI-Powered Community Platform
              </span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Get Things Done
              <motion.span
                className="block gradient-text mt-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                with Neighbors
              </motion.span>
            </h1>
            
            <motion.p
              className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Connect with verified neighbors for lawn care, errands, moving help, and more. 
              Safe, simple, and community-focused — powered by AI matching.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button size="lg" variant="hero" className="text-lg px-8 h-13 glow-pulse" onClick={() => window.location.href = '/tasks'}>
                Find a Helper
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-13" onClick={() => window.location.href = '/auth'}>
                Become a Helper
              </Button>
            </motion.div>
            
            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap gap-8 pt-8 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: Shield, label: "Verified Helpers", sub: "Background checked", color: "bg-primary/8" },
                { icon: Clock, label: "Same-Day Service", sub: "Quick response", color: "bg-accent/8" },
                { icon: Users, label: "Local Community", sub: "Your neighbors", color: "bg-secondary" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Right Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Neighbors helping each other with various tasks in a friendly suburban community"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
            </div>
            
            {/* Floating Stats Card */}
            <motion.div
              className="absolute -bottom-6 -left-6 glass-card p-5 rounded-2xl max-w-xs border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -4 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">AI-Powered</p>
                  <p className="text-xs text-muted-foreground">Smart task matching & pricing</p>
                </div>
              </div>
            </motion.div>

            {/* Second floating card */}
            <motion.div
              className="absolute -top-4 -right-4 glass-card p-4 rounded-2xl border border-border/50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Secure</p>
                  <p className="text-[10px] text-muted-foreground">Verified & Protected</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
