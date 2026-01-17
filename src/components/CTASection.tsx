import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTASection = () => {
  const navigate = useNavigate();

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
              variant="accent" 
              className="text-lg bg-accent hover:bg-accent/90"
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
          
          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-primary-foreground/20">
            <div 
              onClick={() => navigate('/tasks')}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-3xl font-bold">1,000+</p>
              <p className="text-sm text-primary-foreground/80">Active Helpers</p>
            </div>
            <div 
              onClick={() => navigate('/tasks')}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-3xl font-bold">5,000+</p>
              <p className="text-sm text-primary-foreground/80">Tasks Completed</p>
            </div>
            <div 
              onClick={() => navigate('/tasks')}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-3xl font-bold">4.9/5</p>
              <p className="text-sm text-primary-foreground/80">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};