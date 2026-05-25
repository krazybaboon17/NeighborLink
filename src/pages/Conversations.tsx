import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

type Conversation = {
  task_id: string;
  task_title: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export default function Conversations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload: any) => {
          const m = payload.new || payload.old;
          if (!m) return;
          if (m.sender_id === user.id || m.receiver_id === user.id) {
            fetchConversations();
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const grouped: Record<string, Conversation> = {};
      (data || []).forEach((m: any) => {
        const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const key = `${m.task_id}_${other}`;
        if (!grouped[key]) {
          grouped[key] = {
            task_id: m.task_id,
            task_title: '',
            other_user_id: other,
            other_user_name: 'Neighbor',
            other_user_avatar: null,
            last_message: m.content,
            last_message_at: m.created_at,
            unread_count: 0,
          };
        }
        if (m.receiver_id === user.id && m.is_read === false) {
          grouped[key].unread_count += 1;
        }
      });

      const entries = Object.values(grouped);
      const userIds = [...new Set(entries.map(e => e.other_user_id))];
      const taskIds = [...new Set(entries.map(e => e.task_id))];

      const [{ data: profiles }, { data: tasks }] = await Promise.all([
        supabase.from('public_profiles' as any).select('id, full_name, avatar_url').in('id', userIds),
        supabase.from('tasks').select('id, title').in('id', taskIds),
      ]);

      const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const tmap = new Map((tasks || []).map((t: any) => [t.id, t]));

      entries.forEach((c) => {
        const p: any = pmap.get(c.other_user_id);
        const t: any = tmap.get(c.task_id);
        if (p) { c.other_user_name = p.full_name || c.other_user_name; c.other_user_avatar = p.avatar_url; }
        if (t) c.task_title = t.title;
      });

      entries.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setConvos(entries);
    } catch (err) {
      console.error('Error fetching conversations', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <main
        className="container mx-auto px-4 pb-12"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5.5rem)' }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2 md:p-4">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : convos.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Reply to an offer or message a helper to start chatting.</p>
              </div>
            ) : (
              convos.map((c) => (
                <button
                  key={`${c.task_id}_${c.other_user_id}`}
                  className={`w-full text-left p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    c.unread_count > 0
                      ? 'bg-primary/5 hover:bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                  onClick={() => navigate(`/messages?task=${c.task_id}&user=${c.other_user_id}`)}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={c.other_user_avatar || ''} />
                      <AvatarFallback>{c.other_user_name?.charAt(0) || 'N'}</AvatarFallback>
                    </Avatar>
                    {c.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-[#B22234] text-white text-[10px] font-bold border-2 border-background">
                        {c.unread_count > 99 ? '99+' : c.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`font-semibold truncate ${c.unread_count > 0 ? 'text-foreground' : ''}`}>
                        {c.other_user_name}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                    {c.task_title && (
                      <p className="text-xs text-primary font-medium truncate">📌 {c.task_title}</p>
                    )}
                    <p className={`text-sm truncate ${c.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {c.last_message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
