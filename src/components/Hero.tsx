import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 py-24 lg:py-36 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
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
              Safe, simple, and community-focused.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button size="lg" className="text-lg px-8 h-13" onClick={() => window.location.href = '/tasks'}>
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
                { icon: Shield, label: "Verified Helpers", sub: "Background checked" },
                { icon: Clock, label: "Same-Day Service", sub: "Quick response" },
                { icon: Users, label: "Local Community", sub: "Your neighbors" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
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
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img 
                src={heroImage} 
                alt="Neighbors helping each other with various tasks in a friendly suburban community"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
