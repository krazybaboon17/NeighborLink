import { Card } from "@/components/ui/card";
import { 
  Sprout, Snowflake, Package, ShoppingCart, Home, Baby, Wrench, Car
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  { icon: Sprout, title: "Lawn Care", description: "Mowing, trimming, weeding", gradient: "from-emerald-500/10 to-green-500/5" },
  { icon: Snowflake, title: "Snow Removal", description: "Shoveling, plowing, de-icing", gradient: "from-sky-500/10 to-blue-500/5" },
  { icon: Package, title: "Moving Help", description: "Furniture, boxes, loading", gradient: "from-orange-500/10 to-amber-500/5" },
  { icon: ShoppingCart, title: "Grocery Runs", description: "Shopping, pickup, delivery", gradient: "from-violet-500/10 to-purple-500/5" },
  { icon: Home, title: "Home Repairs", description: "Small fixes, assembly, painting", gradient: "from-amber-500/10 to-yellow-500/5" },
  { icon: Baby, title: "Babysitting", description: "Childcare, tutoring", gradient: "from-pink-500/10 to-rose-500/5" },
  { icon: Wrench, title: "Handyman", description: "Installation, repairs", gradient: "from-slate-500/10 to-gray-500/5" },
  { icon: Car, title: "Errands", description: "Pick-ups, deliveries, tasks", gradient: "from-indigo-500/10 to-blue-500/5" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }
};

export const TaskCategories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryTitle: string) => {
    navigate(`/tasks?category=${encodeURIComponent(categoryTitle)}`);
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Browse Task Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the right helper for any task. From seasonal work to daily errands.
          </p>
        </div>
        
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Card 
                    onClick={() => handleCategoryClick(category.title)}
                    className={`p-6 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br ${category.gradient} glass-card`}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
