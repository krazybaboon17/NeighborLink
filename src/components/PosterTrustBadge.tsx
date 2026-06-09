import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  verified: boolean;
  newUser?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

/** Inline trust badge for use on TaskCards / inline near a user name. */
export function PosterTrustBadge({ verified, newUser, size = 'xs', className }: Props) {
  const sz = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const icon = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  if (verified) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 rounded-full font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20', sz, className)}
        title="Verified account"
      >
        <ShieldCheck className={icon} aria-hidden="true" /> Verified
      </span>
    );
  }
  if (newUser) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 rounded-full font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20', sz, className)}
        title="New account — exercise caution"
      >
        <Sparkles className={icon} aria-hidden="true" /> New
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full font-medium bg-muted text-muted-foreground border border-border', sz, className)}
      title="Unverified — exercise caution"
    >
      <ShieldAlert className={icon} aria-hidden="true" /> Unverified
    </span>
  );
}
