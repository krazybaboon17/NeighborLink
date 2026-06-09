import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavoriteHelpers } from '@/hooks/useFavoriteHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  helperId: string;
  variant?: 'icon' | 'pill';
  className?: string;
}

export function FavoriteButton({ helperId, variant = 'icon', className }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavoriteHelpers();
  if (!user || user.id === helperId) return null;
  const isFav = favoriteIds.has(helperId);

  if (variant === 'pill') {
    return (
      <Button
        type="button"
        variant={isFav ? 'default' : 'outline'}
        size="sm"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(helperId); }}
        className={cn('rounded-full gap-1.5', className)}
      >
        <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
        {isFav ? 'Trusted helper' : 'Save as trusted'}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(helperId); }}
      aria-label={isFav ? 'Remove from trusted helpers' : 'Save as trusted helper'}
      className={cn('rounded-full', className)}
    >
      <Heart className={cn('w-5 h-5', isFav ? 'fill-[#B22234] text-[#B22234]' : 'text-muted-foreground')} />
    </Button>
  );
}
