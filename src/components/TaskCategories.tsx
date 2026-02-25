import { Card } from "@/components/ui/card";
import { 
  Sprout, Snowflake, Package, ShoppingCart, Home, Baby, Wrench, Car
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  { icon: Sprout, title: "Lawn Care", description: "Mowing, trimming, weeding", color: "bg-emerald-500/8" },
  { icon: Snowflake, title: "Snow Removal", description: "Shoveling, plowing, de-icing", color: "bg-sky-500/8" },
  { icon: Package, title: "Moving Help", description: "Furniture, boxes, loading", color: "bg-orange-500/8" },
  { icon: ShoppingCart, title: "Grocery Runs", description: "Shopping, pickup, delivery", color: "bg-violet-500/8" },
  { icon: Home, title: "Home Repairs", description: "Small fixes, assembly, painting", color: "bg-amber-500/8" },
  { icon: Baby, title: "Babysitting", description: "Childcare, tutoring", color: "bg-pink-500/8" },
  { icon: Wrench, title: "Handyman", description: "Installation, repairs", color: "bg-slate-500/8" },
  { icon: Car, title: "Errands", description: "Pick-ups, deliveries, tasks", color: "bg-indigo-500/8" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }
};

export const TaskCategories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryTitle: string) => {
    navigate(`/tasks?category=${encodeURIComponent(categoryTitle)}`);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Categories</span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-2 mb-4">Browse Task Categories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the right helper for any task. From seasonal work to daily errands.
          </p>
        </motion.div>
        
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
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
                    className="p-5 lg:p-6 cursor-pointer border-2 hover:border-primary/40 glass-card transition-all group"
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-2xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-base lg:text-lg font-semibold mb-1">{category.title}</h3>
                    <p className="text-xs lg:text-sm text-muted-foreground">{category.description}</p>
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
