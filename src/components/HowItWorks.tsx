import { Card } from "@/components/ui/card";
import { FileText, UserCheck, CreditCard, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const steps = [
  {
    icon: FileText,
    title: "Post Your Task",
    description: "Describe what you need — AI helps write descriptions and suggests pricing automatically.",
    step: "1",
    path: "/post-task"
  },
  {
    icon: UserCheck,
    title: "Get Offers",
    description: "Verified local helpers see your task and send competitive offers with their availability.",
    step: "2",
    path: "/tasks"
  },
  {
    icon: CheckCircle,
    title: "Choose & Complete",
    description: "Select a helper based on AI safety scores, reviews, and proximity. Track progress live.",
    step: "3",
    path: "/my-tasks"
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    description: "Payment is held securely until you confirm completion. 100% satisfaction guaranteed.",
    step: "4",
    path: "/my-tasks"
  }
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
};

export const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Simple Process</span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-2 mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting help from your neighbors is simple, safe, and fast.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={index} className="relative" variants={cardVariants}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Card
                    onClick={() => navigate(step.path)}
                    className="p-8 h-full glass-card border-2 cursor-pointer hover:border-primary/30 transition-all group"
                  >
                    <motion.div
                      className="absolute -top-4 -left-4 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shadow-lg"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {step.step}
                    </motion.div>

                    <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-6 mt-4 group-hover:bg-primary/12 transition-colors">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </Card>
                </motion.div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
