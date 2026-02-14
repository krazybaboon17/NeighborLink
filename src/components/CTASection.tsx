import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FloatingBubbles } from "@/components/ui/FloatingBubbles";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
      <FloatingBubbles />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Join Growing Community</span>
          </motion.div>
          
          <h2 className="text-4xl lg:text-5xl font-bold">Ready to Get Started?</h2>
          
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Whether you need help or want to earn money helping others, 
            NeighborLink makes it easy and safe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
              onClick={() => navigate('/post-task')}
            >
              Post Your First Task
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
              onClick={() => navigate('/auth')}
            >
              Start Earning as Helper
            </Button>
          </div>
          
          <motion.div
            className="grid grid-cols-3 gap-8 pt-12 border-t border-primary-foreground/20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { value: "1,000+", label: "Active Helpers" },
              { value: "5,000+", label: "Tasks Completed" },
              { value: "4.9/5", label: "Average Rating" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                onClick={() => navigate('/tasks')}
                className="cursor-pointer"
                whileHover={{ scale: 1.08, y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/80">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
