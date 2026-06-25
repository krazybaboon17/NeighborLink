import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Parallax, ScrollScale, ScrollProgressBar } from "@/components/ui/Parallax";
import { Hero } from "@/components/Hero";
import { TaskCategories } from "@/components/TaskCategories";
import { FeaturedTasks } from "@/components/FeaturedTasks";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustSafety } from "@/components/TrustSafety";
import { CTASection } from "@/components/CTASection";
import { MailingListSection } from "@/components/MailingListSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { StatsCounter } from "@/components/home/StatsCounter";
import { CategoryMarquee } from "@/components/home/CategoryMarquee";
import { Testimonials } from "@/components/home/Testimonials";
import { HowItWorksTimeline } from "@/components/home/HowItWorksTimeline";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Taskify — Local Help in Arlington Heights & Buffalo Grove"
        description="Hyperlocal task marketplace connecting Arlington Heights and Buffalo Grove neighbors for lawn care, errands, moving help, pet care and more."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Taskify",
          url: "https://myneighborlink.lovable.app",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://myneighborlink.lovable.app/tasks?q={query}",
            "query-input": "required name=query",
          },
        }}
      />
      <ScrollProgressBar />
      <Navbar />

      {/* Background parallax blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <Parallax offset={-160} className="absolute top-[10%] -left-32 w-[420px] h-[420px]">
          <div className="w-full h-full rounded-full bg-primary/[0.07] blur-3xl" />
        </Parallax>
        <Parallax offset={200} className="absolute top-[40%] -right-40 w-[500px] h-[500px]">
          <div className="w-full h-full rounded-full bg-accent/[0.08] blur-3xl" />
        </Parallax>
        <Parallax offset={-120} className="absolute top-[80%] left-1/3 w-[360px] h-[360px]">
          <div className="w-full h-full rounded-full bg-primary/[0.05] blur-3xl" />
        </Parallax>
      </div>

      <main className="pt-20">
        <ScrollReveal>
          <Hero />
        </ScrollReveal>

        <div id="categories">
          <ScrollScale>
            <TaskCategories />
          </ScrollScale>
        </div>

        <CategoryMarquee />

        <div id="how-it-works">
          <HowItWorksTimeline />
        </div>

        <StatsCounter />

        <div id="featured-tasks">
          <ScrollScale>
            <FeaturedTasks />
          </ScrollScale>
        </div>

        <Testimonials />

        <div id="safety">
          <ScrollScale>
            <TrustSafety />
          </ScrollScale>
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
