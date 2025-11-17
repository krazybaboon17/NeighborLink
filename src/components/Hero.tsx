import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Clock } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                <Shield className="w-4 h-4" />
                Trusted & Verified Neighbors
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Get Things Done with
              <span className="block text-primary mt-2">Local Helpers</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl">
              Connect with verified neighbors for lawn care, errands, moving help, and more. 
              Safe, simple, and community-focused.
            </p>
            
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="hero" className="text-lg" onClick={() => window.location.href = '/tasks'}>
              Find a Helper
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg" onClick={() => window.location.href = '/auth'}>
              Become a Helper
            </Button>
          </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Background Checked</p>
                  <p className="text-sm text-muted-foreground">Verified helpers</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Same-Day Service</p>
                  <p className="text-sm text-muted-foreground">Quick response</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Local Community</p>
                  <p className="text-sm text-muted-foreground">Your neighbors</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Neighbors helping each other with various tasks in a friendly suburban community"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-xl border border-border max-w-xs">
              <p className="text-3xl font-bold text-primary">10-15%</p>
              <p className="text-sm text-muted-foreground">Commission on completed tasks</p>
              <p className="text-xs text-muted-foreground mt-2">Fair pricing for everyone</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};