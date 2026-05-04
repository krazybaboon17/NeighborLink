import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { z } from 'zod';
import { useContentModeration } from '@/hooks/useContentModeration';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const messageSchema = z.object({
  content: z.string().trim().min(1, 'Please type a message').max(2000, 'Message is too long (max 2000 characters)')
});

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { moderateMessage, isChecking } = useContentModeration();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (otherId && user.id === otherId) {
      toast.error("You can't message yourself.");
      navigate('/conversations');
      return;
    }

    if (taskId && otherId) {
      fetchTask();
      fetchOtherUser();
      fetchMessages();
      subscribeToMessages();
    }
  }, [taskId, otherId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name, avatar_url, rating, completed_tasks, verified')
        .eq('id', otherId)
        .single();

      if (error) throw error;
      setOtherUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('task_id', taskId)
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user?.id && newMsg.receiver_id === otherId) ||
            (newMsg.sender_id === otherId && newMsg.receiver_id === user?.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskId || !otherId) return;

    const validation = messageSchema.safeParse({ content: newMessage });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      const mod = await moderateMessage(validation.data.content, false);
      if (!mod.allowed) {
        toast.error(`Message blocked: ${mod.reason || 'violates community guidelines'}`);
        return;
      }
      const { error } = await supabase
        .from('messages')
        .insert({
          task_id: taskId!,
          sender_id: user.id,
          receiver_id: otherId!,
          content: validation.data.content,
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-transparent py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="border-b">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={otherUser?.avatar_url || ''} />
                  <AvatarFallback>{otherUser?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{otherUser?.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{task?.title}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col h-[calc(100%-8rem)] p-0">
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                          }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                          {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}