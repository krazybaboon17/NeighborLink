import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingBubbles } from "@/components/ui/FloatingBubbles";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <FloatingBubbles />

      <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-secondary-foreground text-sm font-medium shimmer">
                <Sparkles className="w-4 h-4 text-primary" />
                Trusted & Verified Neighbors
              </span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Get Things Done with
              <motion.span
                className="block text-primary mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Local Helpers
              </motion.span>
            </h1>
            
            <motion.p
              className="text-xl text-muted-foreground max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Connect with verified neighbors for lawn care, errands, moving help, and more. 
              Safe, simple, and community-focused.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button size="lg" variant="hero" className="text-lg glow-pulse" onClick={() => window.location.href = '/tasks'}>
                Find a Helper
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg" onClick={() => window.location.href = '/auth'}>
                Become a Helper
              </Button>
            </motion.div>
            
            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap gap-8 pt-8 border-t border-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: Shield, label: "Background Checked", sub: "Verified helpers", color: "bg-primary/10" },
                { icon: Clock, label: "Same-Day Service", sub: "Quick response", color: "bg-accent/10" },
                { icon: Users, label: "Local Community", sub: "Your neighbors", color: "bg-secondary" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.sub}</p>
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
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Neighbors helping each other with various tasks in a friendly suburban community"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Stats Card */}
            <motion.div
              className="absolute -bottom-6 -left-6 glass-card p-6 rounded-xl max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -4 }}
            >
              <p className="text-3xl font-bold text-primary">10-15%</p>
              <p className="text-sm text-muted-foreground">Commission on completed tasks</p>
              <p className="text-xs text-muted-foreground mt-2">Fair pricing for everyone</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
