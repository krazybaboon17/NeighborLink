import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Hero } from "@/components/Hero";
import { TaskCategories } from "@/components/TaskCategories";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustSafety } from "@/components/TrustSafety";
import { Testimonials } from "@/components/Testimonials";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main>
        <ScrollReveal>
          <Hero />
        </ScrollReveal>

        <div id="how-it-works">
          <ScrollReveal delay={0.2}>
            <HowItWorks />
          </ScrollReveal>
        </div>

        <div id="categories">
          <ScrollReveal delay={0.2}>
            <TaskCategories />
          </ScrollReveal>
        </div>

        <div id="safety">
          <ScrollReveal delay={0.2}>
            <TrustSafety />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.2}>
          <Testimonials />
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <CTASection />
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
