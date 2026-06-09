import { useEffect, useState } from 'react';
import { Bell, BellRing, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrowserPush } from '@/hooks/useBrowserPush';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    const list = (data as any as Notification[]) || [];
    setItems(list);
    setUnread(list.filter((n) => !n.is_read).length);
  };

  useEffect(() => {
    if (!user) { setItems([]); setUnread(0); return; }
    fetch();
    const ch = supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    fetch();
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from('notifications' as any).update({ is_read: true }).eq('id', n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const { supported: pushSupported, permission: pushPermission, request: requestPush } = useBrowserPush();

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#B22234] text-white text-[10px] font-bold border-2 border-background">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        {pushSupported && pushPermission !== 'granted' && (
          <button
            onClick={requestPush}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-primary/5 hover:bg-primary/10 border-b text-left"
          >
            <BellRing className="w-3.5 h-3.5 text-primary" />
            <span className="flex-1">
              {pushPermission === 'denied'
                ? 'Push notifications blocked — enable in browser settings'
                : 'Enable push notifications'}
            </span>
            {pushPermission !== 'denied' && (
              <span className="text-primary font-semibold">Turn on</span>
            )}
          </button>
        )}
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#B22234] mt-1.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
