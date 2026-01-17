import { Card } from "@/components/ui/card";
import { FileText, UserCheck, CreditCard, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    icon: FileText,
    title: "Post Your Task",
    description: "Describe what you need done, set your location and budget. Takes less than 2 minutes.",
    step: "1",
    path: "/post-task"
  },
  {
    icon: UserCheck,
    title: "Get Offers",
    description: "Verified local helpers see your task and send offers with their price and availability.",
    step: "2",
    path: "/tasks"
  },
  {
    icon: CheckCircle,
    title: "Choose & Complete",
    description: "Select a helper based on reviews, proximity, and price. Track progress in real-time.",
    step: "3",
    path: "/my-tasks"
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    description: "Payment is processed safely through the app once you confirm the task is complete.",
    step: "4",
    path: "/my-tasks"
  }
];

export const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting help from your neighbors is simple, safe, and fast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <Card
                  onClick={() => navigate(step.path)}
                  className="p-8 h-full bg-card border-2 card-interactive hover:border-primary/30"
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-6 mt-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/30" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};