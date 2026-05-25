import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, Star, MessageCircle, Phone, Award } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Shield, title: "Background Checks", description: "All helpers undergo comprehensive background verification before joining.", badge: "Required" },
  { icon: UserCheck, title: "Identity Verification", description: "Government ID + selfie verification ensures you know exactly who's helping.", badge: "Verified" },
  { icon: Star, title: "AI Safety Scores", description: "AI-powered risk analysis reviews helper profiles and flags concerns automatically.", badge: "AI-Powered" },
  { icon: MessageCircle, title: "Direct Messaging", description: "Coordinate tasks and payment directly with your neighbor — your way, no middleman.", badge: "Flexible" },
  { icon: Phone, title: "In-App Messaging", description: "Communicate safely without sharing personal phone numbers or emails.", badge: "Private" },
  { icon: Award, title: "Community Reviews", description: "Real reviews from real neighbors help you choose with confidence every time.", badge: "Trusted" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

export const TrustSafety = () => {
  return (
    <section className="py-24" style={{ background: 'var(--hero-gradient)' }}>
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs uppercase tracking-wider">Your Safety First</Badge>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">Built on Trust & Safety</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every measure taken to ensure safe, reliable service from verified neighbors.
          </p>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Card className="p-6 glass-card border-2 hover:border-primary/20 transition-all h-full group">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors"
                        whileHover={{ rotate: 8, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{feature.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
