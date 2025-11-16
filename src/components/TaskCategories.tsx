import { Card } from "@/components/ui/card";
import { 
  Sprout, 
  Snowflake, 
  Package, 
  ShoppingCart, 
  Home, 
  Baby,
  Wrench,
  Car
} from "lucide-react";

const categories = [
  {
    icon: Sprout,
    title: "Lawn Care",
    description: "Mowing, trimming, weeding",
    color: "text-green-600 bg-green-50"
  },
  {
    icon: Snowflake,
    title: "Snow Removal",
    description: "Shoveling, plowing, de-icing",
    color: "text-blue-600 bg-blue-50"
  },
  {
    icon: Package,
    title: "Moving Help",
    description: "Furniture, boxes, loading",
    color: "text-orange-600 bg-orange-50"
  },
  {
    icon: ShoppingCart,
    title: "Grocery Runs",
    description: "Shopping, pickup, delivery",
    color: "text-purple-600 bg-purple-50"
  },
  {
    icon: Home,
    title: "Home Repairs",
    description: "Small fixes, assembly, painting",
    color: "text-amber-600 bg-amber-50"
  },
  {
    icon: Baby,
    title: "Babysitting",
    description: "Childcare, tutoring",
    color: "text-pink-600 bg-pink-50"
  },
  {
    icon: Wrench,
    title: "Handyman",
    description: "Installation, repairs",
    color: "text-slate-600 bg-slate-50"
  },
  {
    icon: Car,
    title: "Errands",
    description: "Pick-ups, deliveries, tasks",
    color: "text-indigo-600 bg-indigo-50"
  }
];

export const TaskCategories = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Browse Task Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the right helper for any task. From seasonal work to daily errands.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 bg-card"
              >
                <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};