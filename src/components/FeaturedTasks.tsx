import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface FeaturedTask {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: string;
  profiles?: { full_name: string | null } | null;
}

export const FeaturedTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<FeaturedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, description, category, budget_min, budget_max, location")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) setTasks(data as FeaturedTask[]);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Featured</span>
            <h2 className="text-3xl lg:text-5xl font-bold mt-2 mb-4">Tasks Near You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tasks.length === 0) return null;

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Featured</span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-2 mb-4">Tasks Near You</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real tasks posted by your neighbors — pick one and start helping today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/30"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <Badge variant="secondary" className="mb-3 text-xs">
                  {task.category}
                </Badge>
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{task.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {task.description}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {task.location}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <DollarSign className="w-3.5 h-3.5" />
                    {(() => {
                      const lo = Math.min(task.budget_min, task.budget_max);
                      const hi = Math.max(task.budget_min, task.budget_max);
                      return lo === hi ? `$${lo}` : `$${lo}–$${hi}`;
                    })()}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" onClick={() => navigate("/tasks")}>
            View All Tasks
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
