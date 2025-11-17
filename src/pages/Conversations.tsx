import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

type Conversation = {
  task_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string | null;
  last_message: string;
  updated_at: string;
};

export default function Conversations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convos, setConvos] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const grouped: Record<string, Conversation> = {};
      (data || []).forEach((m: any) => {
        const other = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
        const key = `${m.task_id}_${other}`;
        if (!grouped[key]) {
          grouped[key] = {
            task_id: m.task_id,
            other_user_id: other,
            other_user_name: other,
            other_user_avatar: null,
            last_message: m.content,
            updated_at: m.created_at,
          };
        }
      });

      // fetch user info for each other_user
      const entries = Object.values(grouped);
      await Promise.all(entries.map(async (c) => {
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', c.other_user_id).single();
        if (profile) {
          c.other_user_name = profile.full_name || c.other_user_name;
          c.other_user_avatar = profile.avatar_url || null;
        }
      }));

      setConvos(entries);
    } catch (err) {
      console.error('Error fetching conversations', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {convos.length === 0 ? (
              <p className="text-muted-foreground">No conversations yet</p>
            ) : (
              convos.map((c) => (
                <div 
                  key={`${c.task_id}_${c.other_user_id}`} 
                  className="p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => navigate(`/messages?task=${c.task_id}&user=${c.other_user_id}`)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={c.other_user_avatar || ''} />
                      <AvatarFallback>{c.other_user_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{c.other_user_name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.last_message}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
