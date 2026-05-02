import { Badge } from '@/components/ui/badge';
import { ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnverifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function UnverifiedBadge({ className, size = 'md' }: UnverifiedBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        className
      )}
    >
      <ShieldX className={cn("mr-1", size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      Unverified
    </Badge>
  );
}
