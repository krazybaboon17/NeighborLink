import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, Star, Lock, Phone, Award } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Background Checks",
    description: "All helpers undergo comprehensive background verification before joining the platform.",
    badge: "Required"
  },
  {
    icon: UserCheck,
    title: "Identity Verification",
    description: "Government ID verification ensures you know exactly who's helping you.",
    badge: "Verified"
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description: "Transparent community feedback system helps you choose the best helper.",
    badge: "Community"
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Payment held securely until task completion. Your money is protected.",
    badge: "Protected"
  },
  {
    icon: Phone,
    title: "In-App Chat",
    description: "Communicate safely without sharing personal phone numbers.",
    badge: "Private"
  },
  {
    icon: Award,
    title: "Quality Guarantee",
    description: "If you're not satisfied, we'll make it right. 100% satisfaction guaranteed.",
    badge: "Guaranteed"
  }
];

export const TrustSafety = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2">
            Your Safety First
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Built on Trust & Safety
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We take every measure to ensure safe, reliable service from verified neighbors you can trust.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 bg-card hover:shadow-lg transition-all border-2">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};