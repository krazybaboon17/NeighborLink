import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Hero } from "@/components/Hero";
import { FeaturedTasks } from "@/components/FeaturedTasks";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustSafety } from "@/components/TrustSafety";
import { CTASection } from "@/components/CTASection";
import { MailingListSection } from "@/components/MailingListSection";
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

        <div id="featured-tasks">
          <ScrollReveal delay={0.2}>
            <FeaturedTasks />
          </ScrollReveal>
        </div>

        <div id="safety">
          <ScrollReveal delay={0.2}>
            <TrustSafety />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.2}>
          <CTASection />
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <MailingListSection />
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
