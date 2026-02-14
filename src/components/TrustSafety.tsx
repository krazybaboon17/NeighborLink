import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, Star, Lock, Phone, Award } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Shield, title: "Background Checks", description: "All helpers undergo comprehensive background verification before joining the platform.", badge: "Required" },
  { icon: UserCheck, title: "Identity Verification", description: "Government ID verification ensures you know exactly who's helping you.", badge: "Verified" },
  { icon: Star, title: "Ratings & Reviews", description: "Transparent community feedback system helps you choose the best helper.", badge: "Community" },
  { icon: Lock, title: "Secure Payments", description: "Payment held securely until task completion. Your money is protected.", badge: "Protected" },
  { icon: Phone, title: "In-App Chat", description: "Communicate safely without sharing personal phone numbers.", badge: "Private" },
  { icon: Award, title: "Quality Guarantee", description: "If you're not satisfied, we'll make it right. 100% satisfaction guaranteed.", badge: "Guaranteed" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }
};

export const TrustSafety = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2">Your Safety First</Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Built on Trust & Safety</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We take every measure to ensure safe, reliable service from verified neighbors you can trust.
          </p>
        </div>
        
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
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Card className="p-6 glass-card border-2 hover:border-primary/20 transition-colors h-full">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <Badge variant="outline" className="text-xs">{feature.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
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
