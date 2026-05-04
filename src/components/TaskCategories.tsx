import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sprout,
  Snowflake,
  Package,
  ShoppingBag,
  Wrench,
  Baby,
  PawPrint,
  Hammer,
  Footprints,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

interface Category {
  Icon: LucideIcon;
  title: string;
  description: string;
  slug: string;
}

// Slugs MUST match the categories used in PostTask.tsx and Tasks.tsx filter
const categories: Category[] = [
  { Icon: Sprout, title: "Lawn Care", description: "Mowing, raking, gardening", slug: "Lawn Care" },
  { Icon: Snowflake, title: "Snow Removal", description: "Driveways and walkways", slug: "Snow Removal" },
  { Icon: Package, title: "Moving Help", description: "Heavy lifting & loading", slug: "Moving Help" },
  { Icon: ShoppingBag, title: "Grocery Runs", description: "Shopping & delivery", slug: "Grocery Runs" },
  { Icon: Wrench, title: "Home Repairs", description: "Small fixes around the house", slug: "Home Repairs" },
  { Icon: Baby, title: "Babysitting", description: "Trusted, local sitters", slug: "Babysitting" },
  { Icon: PawPrint, title: "Pet Care", description: "Walks, sitting, grooming", slug: "Pet Care" },
  { Icon: Hammer, title: "Handyman", description: "Assembly & general help", slug: "Handyman" },
  { Icon: Footprints, title: "Errands", description: "Pickups, drop-offs, more", slug: "Errands" },
  { Icon: MoreHorizontal, title: "Other", description: "Got something else?", slug: "Other" },
];

export const TaskCategories = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="editorial-headline text-4xl sm:text-5xl lg:text-[3.5rem] mb-5">
            Popular <em className="italic font-light text-primary">services</em>
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Whatever you need a hand with, there's a neighbor nearby who can help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.title}
              type="button"
              onClick={() => navigate(`/tasks?category=${encodeURIComponent(cat.slug)}`)}
              aria-label={`Browse ${cat.title} tasks`}
              className="group bg-background hover:bg-card text-left rounded-3xl px-8 py-12 border-2 border-transparent hover:border-primary transition-all duration-[400ms] hover:-translate-y-2 hover:shadow-[0_20px_60px_hsl(60_3%_17%/0.1)] flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <div className="w-16 h-16 mb-5 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <cat.Icon className="w-8 h-8 text-primary" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">
                {cat.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground">{cat.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};
