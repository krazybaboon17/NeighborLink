import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-6xl font-bold leading-tight">Ready to Get Started?</h2>
          
          <p className="text-xl text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
            Whether you need help or want to earn money helping others, 
            Taskfy makes it easy and safe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl px-8 h-13"
              onClick={() => navigate('/post-task')}
            >
              Post Your First Task
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/25 text-primary-foreground px-8 h-13"
              onClick={() => navigate('/auth')}
            >
              Start Earning as Helper
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
