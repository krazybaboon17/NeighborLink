import { motion } from "framer-motion";
import { MapPin, Clock, Navigation, Star, Sparkles } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { formatDistance } from "@/lib/distance";
import { PosterTrustBadge } from "@/components/PosterTrustBadge";

export interface TaskCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  created_at?: string;
  due_date?: string | null;
  status?: string;
  posterName?: string;
  posterVerified?: boolean;
  posterNew?: boolean;
  posterCompletedTasks?: number;
  posterRating?: number | null;
  user_id?: string;
}

interface TaskCardProps {
  task: TaskCardData;
  featured?: boolean;
  /** Highlights the card as a personalized AI recommendation. */
  recommended?: boolean;
  delay?: number;
  applied?: boolean;
  /** Distance from the current user in miles. null when unknown. */
  distanceMiles?: number | null;
}

export const TaskCard = ({
  task,
  featured = false,
  recommended = false,
  delay = 0,
  applied = false,
  distanceMiles = null,
}: TaskCardProps) => {
  const navigate = useNavigate();
  const lo = Math.min(task.budget_min, task.budget_max);
  const hi = Math.max(task.budget_min, task.budget_max);
  const budget = lo === hi ? `$${lo}` : `$${lo}–$${hi}`;

  const timeAgo = task.created_at
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
    : null;

  // Helper to parse metadata from text
  const parseApprovalMetadata = (text: string | null) => {
    if (!text) return { cleanText: '', approval: null };
    const match = text.match(/\[YN_APPROVAL:({.*?})\]/);
    if (match) {
      try {
        const approval = JSON.parse(match[1]);
        const cleanText = text.replace(/\[YN_APPROVAL:({.*?})\]/, '').trim();
        return { cleanText, approval };
      } catch (e) {
        return { cleanText: text, approval: null };
      }
    }
    return { cleanText: text, approval: null };
  };

  const { cleanText, approval } = parseApprovalMetadata(task.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className={`relative h-full ${featured ? "task-card-float" : ""}`}
      style={
        featured
          ? { animation: "float-gentle 6s ease-in-out infinite" }
          : undefined
      }
    >
      {recommended && (
        <>
          {/* Glow halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-[28px] bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 opacity-70 blur-md"
            style={{ animation: "glow-pulse 3.2s ease-in-out infinite" }}
          />
          {/* For You ribbon */}
          <motion.span
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute -top-3 left-5 z-10 inline-flex items-center gap-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-display font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider"
          >
            <Sparkles className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
            For You
          </motion.span>
        </>
      )}
      <button
        type="button"
        onClick={() => navigate(`/tasks/${task.id}`)}
        className={`relative group w-full text-left bg-card rounded-3xl p-7 border-2 transition-all duration-[400ms] hover:-translate-y-2 flex flex-col h-full ${
          recommended
            ? "border-primary/60 hover:border-primary"
            : "border-transparent hover:border-primary"
        }`}
        style={{
          boxShadow: "0 20px 60px hsl(60 3% 17% / 0.08)",
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="bg-background text-foreground text-xs font-body font-medium px-3 py-1.5 rounded-full">
            {task.category}
          </span>
          <div className="flex items-center gap-1.5">
            {applied ? (
              <span className="bg-primary/10 text-primary text-[11px] font-body font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Applied
              </span>
            ) : task.status === "open" ? (
              <span className="bg-accent text-accent-foreground text-[11px] font-body font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Open
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="font-display font-bold text-xl text-foreground leading-tight mb-2 line-clamp-2">
          {task.title}
        </h3>
        <p className="font-body text-sm text-muted-foreground line-clamp-3 mb-5 flex-1">
          {cleanText}
        </p>

        {approval && (
          <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-full self-start">
            <Clock className="w-3.5 h-3.5 text-green-600" />
            <span className="font-body text-[10px] font-bold text-green-700 uppercase tracking-wider">
              Parent Approved
            </span>
          </div>
        )}

        {task.due_date && (
          <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-primary/5 rounded-full self-start">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-body text-xs font-semibold text-primary">
              Needed by {format(new Date(task.due_date), "MMM d 'at' h:mm a")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-muted-foreground/10 gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="font-body text-xs truncate">{task.location}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {distanceMiles !== null && distanceMiles !== undefined && (
              <span
                className="inline-flex items-center gap-1 text-xs font-body font-medium text-accent-foreground bg-accent/40 px-2 py-0.5 rounded-full"
                aria-label={`${formatDistance(distanceMiles)} from you`}
              >
                <Navigation className="w-3 h-3" aria-hidden="true" />
                {formatDistance(distanceMiles)}
              </span>
            )}
            <span className="font-display font-bold text-base text-primary">{budget}</span>
          </div>
        </div>

        {(timeAgo || task.posterName) && (
          <div className="flex items-center justify-between mt-3 text-xs gap-2">
            {task.posterName && (
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="font-body text-muted-foreground truncate">
                  by <span className="font-medium text-foreground">{task.posterName}</span>
                </span>
                <PosterTrustBadge verified={!!task.posterVerified} newUser={!!task.posterNew} />
                {!!task.posterRating && task.posterRating > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {task.posterRating.toFixed(1)}
                    {!!task.posterCompletedTasks && ` · ${task.posterCompletedTasks}`}
                  </span>
                )}
              </div>
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
