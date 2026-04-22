import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  { emoji: "🏡", title: "Home & Garden", description: "Lawn care, repairs, cleaning", slug: "Lawn Care" },
  { emoji: "🐾", title: "Pet Care", description: "Walking, sitting, grooming", slug: "Pet Care" },
  { emoji: "📦", title: "Moving & Delivery", description: "Heavy lifting & errands", slug: "Moving Help" },
  { emoji: "👨‍👩‍👧", title: "Childcare", description: "Babysitting & after-school", slug: "Babysitting" },
  { emoji: "💻", title: "Tech Help", description: "Setup, troubleshooting, lessons", slug: "Tech Help" },
  { emoji: "🍳", title: "Cooking", description: "Meal prep & baking", slug: "Cooking" },
  { emoji: "🎨", title: "Creative", description: "Photos, design, decorating", slug: "Creative" },
  { emoji: "📚", title: "Lessons", description: "Tutoring & skill sharing", slug: "Lessons" },
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
              onClick={() => navigate(`/tasks?category=${encodeURIComponent(cat.slug)}`)}
              className="group bg-background hover:bg-card text-left rounded-3xl px-8 py-12 border-2 border-transparent hover:border-primary transition-all duration-[400ms] hover:-translate-y-2 hover:shadow-[0_20px_60px_hsl(60_3%_17%/0.1)] flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <div className="text-5xl mb-5 transition-transform duration-300 group-hover:scale-110">
                {cat.emoji}
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
