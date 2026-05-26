import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Hero } from "@/components/Hero";
import { TaskCategories } from "@/components/TaskCategories";
import { FeaturedTasks } from "@/components/FeaturedTasks";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustSafety } from "@/components/TrustSafety";
import { CTASection } from "@/components/CTASection";
import { MailingListSection } from "@/components/MailingListSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="TaskIt! — Local Help in Arlington Heights & Buffalo Grove"
        description="Hyperlocal task marketplace connecting Arlington Heights and Buffalo Grove neighbors for lawn care, errands, moving help, pet care and more."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TaskIt!",
          url: "https://myneighborlink.lovable.app",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://myneighborlink.lovable.app/tasks?q={query}",
            "query-input": "required name=query",
          },
        }}
      />
      <Navbar />
      <main className="pt-20">
        <ScrollReveal>
          <Hero />
        </ScrollReveal>

        <div id="categories">
          <ScrollReveal delay={0.1}>
            <TaskCategories />
          </ScrollReveal>
        </div>

        <div id="how-it-works">
          <ScrollReveal delay={0.1}>
            <HowItWorks />
          </ScrollReveal>
        </div>

        <div id="featured-tasks">
          <ScrollReveal delay={0.1}>
            <FeaturedTasks />
          </ScrollReveal>
        </div>

        <div id="safety">
          <ScrollReveal delay={0.1}>
            <TrustSafety />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1}>
          <CTASection />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <MailingListSection />
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
