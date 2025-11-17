import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Join Growing Community</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold">
            Ready to Get Started?
          </h2>
          
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Whether you need help or want to earn money helping others, 
            NeighborLink makes it easy and safe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg bg-white text-primary hover:bg-white/90 font-medium"
              onClick={() => window.location.href = '/post-task'}
            >
              Post Your First Task
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground font-medium"
              onClick={() => window.location.href = '/auth'}
            >
              Start Earning as Helper
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};