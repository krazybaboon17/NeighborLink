import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { Send, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { z } from 'zod';
import { useContentModeration } from '@/hooks/useContentModeration';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read?: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const messageSchema = z.object({
  content: z.string().trim().min(1, 'Please type a message').max(2000, 'Message is too long (max 2000 characters)')
});

const formatTimestamp = (d: Date) => {
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
};

export default function Messages() {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('task');
  const otherId = searchParams.get('user');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { moderateMessage } = useContentModeration();

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (otherId && user.id === otherId) {
      toast.error("You can't message yourself.");
      navigate('/conversations');
      return;
    }
    if (taskId && otherId) {
      fetchTask();
      fetchOtherUser();
      fetchMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [taskId, otherId, user]);

  useEffect(() => {
    if (user && messages.length > 0) {
      const unreadIds = messages
        .filter((m: any) => m.receiver_id === user.id && m.is_read === false)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        supabase.from('messages').update({ is_read: true } as any).in('id', unreadIds).then(() => {
          setMessages((prev) => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));
        });
      }
    }
  }, [messages, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchTask = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    setTask(data);
  };

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name, avatar_url')
        .eq('id', otherId)
        .single();
      if (error) throw error;
      setOtherUser(data as any);
    } catch (e) { console.error('Error fetching user:', e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('task_id', taskId)
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });
    if (!error) setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${taskId}-${otherId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `task_id=eq.${taskId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user?.id && newMsg.receiver_id === otherId) ||
            (newMsg.sender_id === otherId && newMsg.receiver_id === user?.id)
          ) {
            setMessages((prev) => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskId || !otherId || sending) return;
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

    setSending(true);
    try {
      const mod = await moderateMessage(validation.data.content, false);
      if (!mod.allowed) {
        toast.error(`Message blocked: ${mod.reason || 'violates community guidelines'}`);
        return;
      }
      const { error } = await supabase.from('messages').insert({
        task_id: taskId, sender_id: user.id, receiver_id: otherId, content: validation.data.content,
      });
      if (error) throw error;
      setNewMessage('');
    } catch { toast.error('Failed to send message'); }
    finally { setSending(false); }
  };

  if (loading) {
    return (<><Navbar /><div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div></>);
  }

  return (
    <>
      <Navbar />
      <div
        className="bg-transparent"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 5rem)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          minHeight: '100dvh',
        }}
      >
        <div className="container mx-auto px-2 sm:px-4 max-w-3xl">
          <Card className="flex flex-col" style={{ height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 6rem)' }}>
            <CardHeader className="border-b py-3 px-3 sm:px-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden -ml-1" onClick={() => navigate('/conversations')}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar>
                  <AvatarImage src={otherUser?.avatar_url || ''} />
                  <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'N'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{otherUser?.full_name || 'Neighbor'}</p>
                  {task?.title && (
                    <button onClick={() => navigate(`/task/${taskId}`)} className="text-xs text-primary font-medium truncate hover:underline block max-w-full text-left">
                      📌 {task.title}
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {/* System message at top of conversation */}
              <div className="flex justify-center">
                <div className="max-w-md text-center bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-xs text-foreground/80 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    💬 Payment is handled off-app — use this chat to coordinate and arrange payment{task?.title ? ` for ${task.title}` : ''} directly with the other person.
                  </span>
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Say hi to start the conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2 shadow-sm ${
                          mine
                            ? 'bg-[#B22234] text-white rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {formatTimestamp(new Date(message.created_at))}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div
              className="border-t p-3 bg-background/95 backdrop-blur sticky bottom-0"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full"
                  autoComplete="off"
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0 bg-[#B22234] hover:bg-[#901c2a]" disabled={sending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
