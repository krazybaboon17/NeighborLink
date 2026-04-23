import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export interface TaskCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  created_at?: string;
  status?: string;
  posterName?: string;
}

interface TaskCardProps {
  task: TaskCardData;
  featured?: boolean;
  delay?: number;
  applied?: boolean;
}

export const TaskCard = ({ task, featured = false, delay = 0, applied = false }: TaskCardProps) => {
  const navigate = useNavigate();
  const lo = Math.min(task.budget_min, task.budget_max);
  const hi = Math.max(task.budget_min, task.budget_max);
  const budget = lo === hi ? `$${lo}` : `$${lo}–$${hi}`;

  const timeAgo = task.created_at
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={featured ? "task-card-float" : ""}
      style={
        featured
          ? { animation: "float-gentle 6s ease-in-out infinite" }
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => navigate(`/tasks/${task.id}`)}
        className="group w-full text-left bg-card rounded-3xl p-7 border-2 border-transparent hover:border-primary transition-all duration-[400ms] hover:-translate-y-2 flex flex-col h-full"
        style={{
          boxShadow: "0 20px 60px hsl(60 3% 17% / 0.08)",
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="bg-background text-foreground text-xs font-body font-medium px-3 py-1.5 rounded-full">
            {task.category}
          </span>
          <div className="flex items-center gap-1.5">
            {applied && (
              <span className="bg-primary/10 text-primary text-[11px] font-body font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Applied
              </span>
            )}
            {task.status === "open" && (
              <span className="bg-accent text-accent-foreground text-[11px] font-body font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Open
              </span>
            )}
          </div>
        </div>

        <h3 className="font-display font-bold text-xl text-foreground leading-tight mb-2 line-clamp-2">
          {task.title}
        </h3>
        <p className="font-body text-sm text-muted-foreground line-clamp-3 mb-5 flex-1">
          {task.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-muted-foreground/10">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-body text-xs truncate max-w-[120px]">{task.location}</span>
          </div>
          <span className="font-display font-bold text-base text-primary">{budget}</span>
        </div>

        {(timeAgo || task.posterName) && (
          <div className="flex items-center justify-between mt-3 text-xs">
            {task.posterName && (
              <span className="font-body text-muted-foreground truncate">
                by <span className="font-medium text-foreground">{task.posterName}</span>
              </span>
            )}
            {timeAgo && (
              <span className="font-body font-medium text-primary shrink-0">{timeAgo}</span>
            )}
          </div>
        )}
      </button>
    </motion.div>
  );
};
