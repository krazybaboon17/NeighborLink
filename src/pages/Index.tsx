import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TaskCategories } from "@/components/TaskCategories";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustSafety } from "@/components/TrustSafety";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="categories">
          <TaskCategories />
        </div>
        <div id="safety">
          <TrustSafety />
        </div>
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;