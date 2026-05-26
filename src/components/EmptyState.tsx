import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-12 text-center"
      style={{ boxShadow: '0 20px 60px hsl(60 3% 17% / 0.08)' }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
      </motion.div>
      <h3 className="font-display text-2xl mb-2">{title}</h3>
      {description && (
        <p className="font-body text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-full px-6 min-h-[44px]">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
