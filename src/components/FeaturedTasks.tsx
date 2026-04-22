import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TaskCard, TaskCardData } from "@/components/TaskCard";

export const FeaturedTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, description, category, budget_min, budget_max, location, created_at, status, user_id")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);

      if (data && data.length) {
        const userIds = [...new Set(data.map((t: any) => t.user_id))];
        const { data: profiles } = await supabase
          .from("public_profiles" as any)
          .select("id, full_name")
          .in("id", userIds);
        const map = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
        setTasks(
          data.map((t: any) => ({
            ...t,
            posterName: map.get(t.user_id) || "Anonymous",
          }))
        );
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  if (loading || tasks.length === 0) return null;

  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="editorial-headline text-4xl sm:text-5xl lg:text-[3.5rem] mb-5">
            Tasks <em className="italic font-light text-primary">near you</em>
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Real tasks posted by your neighbors — pick one and start helping today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tasks.slice(0, 6).map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              delay={i * 0.05}
              featured={i < 2}
            />
          ))}
        </div>

        <div className="text-center mt-14">
          <Button
            size="lg"
            onClick={() => navigate("/tasks")}
            className="rounded-full px-8 h-12"
          >
            View all tasks
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
