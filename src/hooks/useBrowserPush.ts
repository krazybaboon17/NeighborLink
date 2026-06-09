import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Browser-level push using the Notification API.
 * Subscribes to the user's `notifications` table via realtime and shows a
 * desktop notification on each new row, if the user has granted permission.
 * Note: this fires only while a tab is open. True web push (background)
 * requires a service worker + VAPID keys — track as a follow-up.
 */
export function useBrowserPush() {
  const { user } = useAuth();
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied'
  );

  const request = useCallback(async () => {
    if (!supported) { toast.error('Notifications not supported in this browser'); return 'denied' as NotificationPermission; }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === 'granted') toast.success('Notifications enabled');
    else if (p === 'denied') toast.info('Notifications blocked. Enable them in your browser settings.');
    return p;
  }, [supported]);

  useEffect(() => {
    if (!supported || !user || permission !== 'granted') return;
    const channel = supabase
      .channel(`browser-push-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as any;
          try {
            const note = new Notification(n.title || 'Taskfy', {
              body: n.body || '',
              icon: '/favicon.ico',
              tag: n.id,
            });
            note.onclick = () => {
              window.focus();
              if (n.link) window.location.assign(n.link);
              note.close();
            };
          } catch { /* noop */ }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supported, user, permission]);

  return { supported, permission, request };
}
