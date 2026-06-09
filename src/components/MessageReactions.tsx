import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface Reaction { id: string; message_id: string; user_id: string; emoji: string; }

interface Props {
  messageId: string;
  mine: boolean;
  reactions: Reaction[];
  onChanged: () => void;
}

export function MessageReactions({ messageId, mine, reactions, onChanged }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const grouped = reactions.reduce<Record<string, Reaction[]>>((acc, r) => {
    (acc[r.emoji] ||= []).push(r);
    return acc;
  }, {});

  const toggle = useCallback(async (emoji: string) => {
    if (!user) return;
    setOpen(false);
    const existing = reactions.find(r => r.user_id === user.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('message_reactions' as any).delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions' as any).insert({
        message_id: messageId, user_id: user.id, emoji,
      } as any);
    }
    onChanged();
  }, [reactions, user, messageId, onChanged]);

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', mine ? 'justify-end' : 'justify-start')}>
      {Object.entries(grouped).map(([emoji, rs]) => {
        const mineHas = !!user && rs.some(r => r.user_id === user.id);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            className={cn(
              'inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition',
              mineHas ? 'bg-primary/10 border-primary/40' : 'bg-background border-border hover:bg-muted',
            )}
            aria-label={`${emoji} reaction, ${rs.length}`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-medium">{rs.length}</span>
          </button>
        );
      })}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition" aria-label="Add reaction">
            <Smile className="w-3.5 h-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5 flex gap-1" sideOffset={4}>
          {QUICK_EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => toggle(e)}
              className="text-lg hover:scale-125 transition px-1.5 py-0.5 rounded">
              {e}
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
