import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navbar } from '@/components/Navbar';
import {
  Send, ArrowLeft, Info, MoreVertical, Pencil, Trash2, Reply, X,
  Image as ImageIcon, Search, Check, CheckCheck, Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { z } from 'zod';
import { useContentModeration } from '@/hooks/useContentModeration';
import { cn } from '@/lib/utils';
import { MessageReactions } from '@/components/MessageReactions';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { VoiceNotePlayer } from '@/components/VoiceNotePlayer';
import { FavoriteButton } from '@/components/FavoriteButton';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read?: boolean;
  edited_at?: string | null;
  deleted_at?: string | null;
  reply_to_id?: string | null;
  image_url?: string | null;
  voice_url?: string | null;
  voice_duration_seconds?: number | null;
  _pending?: boolean;
  _failed?: boolean;
}

interface Reaction {
  id: string; message_id: string; user_id: string; emoji: string;
}

interface Profile { id: string; full_name: string; avatar_url: string | null; }

const messageSchema = z.object({
  content: z.string().trim().min(1, 'Please type a message').max(2000, 'Message is too long (max 2000 characters)'),
});

const formatTime = (d: Date) => format(d, 'h:mm a');
const formatDay = (d: Date) => {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
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
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingSentAt = useRef<number>(0);
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
      const cleanup = subscribeAll();
      return cleanup;
    }
  }, [taskId, otherId, user]);

  // Mark received messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unreadIds = messages.filter(m => m.receiver_id === user.id && m.is_read === false).map(m => m.id);
    if (unreadIds.length > 0) {
      supabase.from('messages').update({ is_read: true } as any).in('id', unreadIds).then(() => {
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));
      });
    }
  }, [messages, user]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, otherTyping]);

  // Resolve signed URLs for any new image messages
  useEffect(() => {
    const paths = messages
      .filter(m => m.image_url && !m.deleted_at && !imageUrls[m.image_url])
      .map(m => m.image_url!);
    if (paths.length === 0) return;
    (async () => {
      const next: Record<string, string> = {};
      for (const p of paths) {
        if (p.startsWith('http')) { next[p] = p; continue; }
        const { data } = await supabase.storage.from('chat-images').createSignedUrl(p, 3600);
        if (data?.signedUrl) next[p] = data.signedUrl;
      }
      if (Object.keys(next).length) setImageUrls(prev => ({ ...prev, ...next }));
    })();
  }, [messages]);

  // Resolve signed URLs for voice notes
  useEffect(() => {
    const paths = messages
      .filter(m => m.voice_url && !m.deleted_at && !voiceUrls[m.voice_url])
      .map(m => m.voice_url!);
    if (paths.length === 0) return;
    (async () => {
      const next: Record<string, string> = {};
      for (const p of paths) {
        if (p.startsWith('http')) { next[p] = p; continue; }
        const { data } = await supabase.storage.from('chat-voice').createSignedUrl(p, 3600);
        if (data?.signedUrl) next[p] = data.signedUrl;
      }
      if (Object.keys(next).length) setVoiceUrls(prev => ({ ...prev, ...next }));
    })();
  }, [messages]);

  const fetchReactions = useCallback(async () => {
    if (messages.length === 0) { setReactions([]); return; }
    const ids = messages.map(m => m.id).filter(id => !id.startsWith('temp-'));
    if (ids.length === 0) return;
    const { data } = await supabase.from('message_reactions' as any)
      .select('*').in('message_id', ids);
    setReactions(((data as any) || []) as Reaction[]);
  }, [messages]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  // Subscribe to reaction changes
  useEffect(() => {
    if (!taskId || !user) return;
    const ch = supabase
      .channel(`reactions-${taskId}-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => fetchReactions())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [taskId, user, fetchReactions]);

  const fetchTask = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    setTask(data);
  };

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase.from('public_profiles' as any)
        .select('id, full_name, avatar_url').eq('id', otherId).single();
      if (error) throw error;
      setOtherUser(data as any);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('task_id', taskId)
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });
    if (!error) setMessages((data as any) || []);
  };

  const subscribeAll = () => {
    // postgres_changes for INSERT/UPDATE/DELETE
    const dbChannel = supabase
      .channel(`messages-${taskId}-${otherId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `task_id=eq.${taskId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const m = payload.new as Message;
            const ours = (m.sender_id === user?.id && m.receiver_id === otherId) ||
                         (m.sender_id === otherId && m.receiver_id === user?.id);
            if (!ours) return;
            setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev.filter(x => !x._pending || x.content !== m.content), m]);
          } else if (payload.eventType === 'UPDATE') {
            const m = payload.new as Message;
            setMessages(prev => prev.map(x => x.id === m.id ? { ...x, ...m } : x));
          } else if (payload.eventType === 'DELETE') {
            const m = payload.old as Message;
            setMessages(prev => prev.filter(x => x.id !== m.id));
          }
        })
      .subscribe();

    // Typing indicator via broadcast (deterministic channel name independent of who's "a" vs "b")
    const pair = [user!.id, otherId!].sort().join(':');
    const typingChannel = supabase.channel(`typing-${taskId}-${pair}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload?.userId !== user?.id) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = window.setTimeout(() => setOtherTyping(false), 3500);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, () => setOtherTyping(false))
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  };

  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentAt.current < 1500) return; // throttle
    lastTypingSentAt.current = now;
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user?.id } });
  }, [user]);

  const broadcastStopTyping = () => {
    typingChannelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { userId: user?.id } });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return null; }
    if (!file.type.startsWith('image/')) { toast.error('Only image files'); return null; }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${taskId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-images').upload(path, file, { upsert: false });
    if (error) { toast.error('Upload failed'); return null; }
    return path;
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user || !taskId || !otherId) return;
    setSending(true);
    try {
      const path = await uploadImage(file);
      if (!path) return;
      const { error } = await supabase.from('messages').insert({
        task_id: taskId, sender_id: user.id, receiver_id: otherId,
        content: '', image_url: path, reply_to_id: replyTo?.id ?? null,
      } as any);
      if (error) throw error;
      setReplyTo(null);
    } catch { toast.error('Failed to send image'); }
    finally { setSending(false); }
  };

  const handleVoiceRecorded = async (blob: Blob, durationSec: number) => {
    if (!user || !taskId || !otherId) return;
    const path = `${user.id}/${taskId}/${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage
      .from('chat-voice')
      .upload(path, blob, { upsert: false, contentType: blob.type || 'audio/webm' });
    if (upErr) { toast.error('Voice upload failed'); return; }
    const { error } = await supabase.from('messages').insert({
      task_id: taskId, sender_id: user.id, receiver_id: otherId,
      content: '', voice_url: path, voice_duration_seconds: durationSec,
      reply_to_id: replyTo?.id ?? null,
    } as any);
    if (error) { toast.error('Failed to send voice note'); return; }
    setReplyTo(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskId || !otherId || sending) return;
    const validation = messageSchema.safeParse({ content: newMessage });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

    // Editing existing message
    if (editing) {
      const newContent = validation.data.content;
      const original = editing;
      setMessages(prev => prev.map(m => m.id === original.id ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m));
      setEditing(null); setNewMessage('');
      const { error } = await supabase.from('messages')
        .update({ content: newContent, edited_at: new Date().toISOString() } as any)
        .eq('id', original.id);
      if (error) {
        toast.error('Edit failed');
        setMessages(prev => prev.map(m => m.id === original.id ? original : m));
      }
      return;
    }

    setSending(true);
    broadcastStopTyping();
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId, content: validation.data.content,
      sender_id: user.id, receiver_id: otherId,
      created_at: new Date().toISOString(),
      is_read: false, reply_to_id: replyTo?.id ?? null, _pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    const sentReplyTo = replyTo?.id ?? null;
    setNewMessage(''); setReplyTo(null);

    try {
      const mod = await moderateMessage(validation.data.content, false);
      if (!mod.allowed) {
        toast.error(`Message blocked: ${mod.reason || 'violates community guidelines'}`);
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return;
      }
      const { data, error } = await supabase.from('messages').insert({
        task_id: taskId, sender_id: user.id, receiver_id: otherId,
        content: validation.data.content, reply_to_id: sentReplyTo,
      } as any).select().single();
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === tempId ? { ...(data as any) } : m));
    } catch {
      toast.error('Failed to send');
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _failed: true, _pending: false } : m));
    } finally { setSending(false); }
  };

  const handleDelete = async (m: Message) => {
    const original = m;
    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, deleted_at: new Date().toISOString(), content: '', image_url: null } : x));
    const { error } = await supabase.from('messages')
      .update({ deleted_at: new Date().toISOString(), content: '', image_url: null } as any)
      .eq('id', m.id);
    if (error) {
      toast.error('Delete failed');
      setMessages(prev => prev.map(x => x.id === m.id ? original : x));
    }
  };

  const startEdit = (m: Message) => {
    setEditing(m); setReplyTo(null); setNewMessage(m.content);
  };

  const cancelEdit = () => { setEditing(null); setNewMessage(''); };

  const messagesById = useMemo(() => new Map(messages.map(m => [m.id, m])), [messages]);

  const visibleMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const q = searchTerm.toLowerCase();
    return messages.filter(m => (m.content || '').toLowerCase().includes(q));
  }, [messages, searchTerm]);

  if (loading) {
    return (<><Navbar /><div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div></>);
  }

  return (
    <>
      <Navbar />
      <div className="bg-transparent"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5rem)', paddingBottom: 'env(safe-area-inset-bottom)', minHeight: '100dvh' }}>
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
                    <button onClick={() => navigate(`/tasks/${taskId}`)} className="text-xs text-primary font-medium truncate hover:underline block max-w-full text-left">
                      📌 {task.title}
                    </button>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setSearchOpen(s => !s); if (searchOpen) setSearchTerm(''); }}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {searchOpen && (
                <Input autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search this conversation…" className="mt-2 rounded-full" />
              )}
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              <div className="flex justify-center">
                <div className="max-w-md text-center bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-xs text-foreground/80 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>💬 Payment is handled off-app — use this chat to coordinate and arrange payment{task?.title ? ` for ${task.title}` : ''} directly with the other person.</span>
                </div>
              </div>

              {visibleMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  {searchTerm ? 'No messages match your search.' : 'Say hi to start the conversation!'}
                </div>
              ) : (
                visibleMessages.map((message, i) => {
                  const mine = message.sender_id === user?.id;
                  const prev = visibleMessages[i - 1];
                  const showDay = !prev || !isSameDay(new Date(prev.created_at), new Date(message.created_at));
                  const repliedTo = message.reply_to_id ? messagesById.get(message.reply_to_id) : null;
                  const isDeleted = !!message.deleted_at;

                  return (
                    <div key={message.id}>
                      {showDay && (
                        <div className="flex justify-center my-3">
                          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                            {formatDay(new Date(message.created_at))}
                          </span>
                        </div>
                      )}
                      <div className={cn('flex group items-end gap-1', mine ? 'justify-end' : 'justify-start')}>
                        {mine && !isDeleted && !message._pending && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyTo(message)}><Reply className="w-3.5 h-3.5 mr-2" /> Reply</DropdownMenuItem>
                              {message.content && !message.image_url && (
                                <DropdownMenuItem onClick={() => startEdit(message)}><Pencil className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDelete(message)} className="text-destructive">
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <div className={cn(
                          'max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm',
                          mine ? 'bg-[#B22234] text-white rounded-br-md' : 'bg-muted text-foreground rounded-bl-md',
                          message._pending && 'opacity-60',
                          message._failed && 'border border-destructive',
                          isDeleted && 'italic opacity-70',
                        )}>
                          {repliedTo && !isDeleted && (
                            <div className={cn(
                              'mb-1.5 pl-2 border-l-2 text-[11px] rounded-r-md py-1 pr-2 truncate',
                              mine ? 'border-white/60 bg-white/10 text-white/90' : 'border-primary/60 bg-primary/5 text-foreground/80'
                            )}>
                              <span className="font-semibold block truncate">
                                {repliedTo.sender_id === user?.id ? 'You' : (otherUser?.full_name || 'Neighbor')}
                              </span>
                              <span className="block truncate">{repliedTo.deleted_at ? 'Message deleted' : (repliedTo.content || (repliedTo.image_url ? '📷 Photo' : ''))}</span>
                            </div>
                          )}

                          {isDeleted ? (
                            <p className="text-sm">This message was deleted</p>
                          ) : (
                            <>
                              {message.image_url && (
                                <a href={imageUrls[message.image_url]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={imageUrls[message.image_url] || ''}
                                    alt="Shared"
                                    className="rounded-xl max-w-full max-h-72 object-cover mb-1"
                                    loading="lazy"
                                  />
                                </a>
                              )}
                              {message.voice_url && (
                                <VoiceNotePlayer
                                  src={voiceUrls[message.voice_url]}
                                  durationSec={message.voice_duration_seconds || undefined}
                                  mine={mine}
                                />
                              )}
                              {message.content && (
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              )}
                            </>
                          )}

                          <div className={cn('flex items-center gap-1 mt-1 text-[10px]', mine ? 'text-white/70 justify-end' : 'text-muted-foreground')}>
                            <span>{formatTime(new Date(message.created_at))}</span>
                            {message.edited_at && !isDeleted && <span>· edited</span>}
                            {mine && !message._pending && !isDeleted && (
                              message.is_read
                                ? <CheckCheck className="w-3 h-3" aria-label="Read" />
                                : <Check className="w-3 h-3" aria-label="Sent" />
                            )}
                            {message._pending && <span>· sending…</span>}
                            {message._failed && <span className="text-destructive">· failed</span>}
                          </div>
                        </div>
                        {!mine && !isDeleted && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition"
                            onClick={() => setReplyTo(message)}>
                            <Reply className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {!isDeleted && !message._pending && !message.id.startsWith('temp-') && (
                        <div className={cn('mt-1 px-2', mine ? 'flex justify-end' : 'flex justify-start')}>
                          <MessageReactions
                            messageId={message.id}
                            mine={mine}
                            reactions={reactions.filter(r => r.message_id === message.id)}
                            onChanged={fetchReactions}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {otherTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t bg-background/95 backdrop-blur sticky bottom-0"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              {(replyTo || editing) && (
                <div className="flex items-center justify-between px-3 pt-2 text-xs">
                  <div className="flex-1 min-w-0 pl-2 border-l-2 border-primary">
                    <p className="font-semibold text-primary">
                      {editing ? 'Editing message' : `Replying to ${replyTo!.sender_id === user?.id ? 'yourself' : (otherUser?.full_name || 'Neighbor')}`}
                    </p>
                    <p className="text-muted-foreground truncate">
                      {editing ? editing.content : (replyTo!.content || (replyTo!.image_url ? '📷 Photo' : ''))}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                    onClick={() => { setReplyTo(null); cancelEdit(); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2 p-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                <Button type="button" size="icon" variant="ghost" className="rounded-full shrink-0"
                  onClick={() => fileInputRef.current?.click()} disabled={sending || !!editing} aria-label="Attach image">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); broadcastTyping(); }}
                  onBlur={broadcastStopTyping}
                  placeholder={editing ? 'Edit your message…' : 'Type a message…'}
                  className="flex-1 rounded-full"
                  autoComplete="off"
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0 bg-[#B22234] hover:bg-[#901c2a]"
                  disabled={sending || !newMessage.trim()}>
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
