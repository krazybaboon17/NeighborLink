import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YoungNeighborBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function YoungNeighborBadge({ className, size = 'md' }: YoungNeighborBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300",
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        className
      )}
    >
      <Sparkles className={cn("mr-1", size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      Young Neighbor
    </Badge>
  );
}
