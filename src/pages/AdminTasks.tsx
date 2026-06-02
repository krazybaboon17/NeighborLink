import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';

type TaskRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  created_at: string;
  user_id: string;
  budget_min: number;
  budget_max: number;
  owner_name?: string;
};

export default function AdminTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc('check_is_admin');
      setIsAdmin(data === true);
    })();
  }, [user]);

  useEffect(() => {
    if (isAdmin === true) fetchTasks();
    else if (isAdmin === false) setLoading(false);
  }, [isAdmin]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = data || [];
      const ownerIds = [...new Set(rows.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles').select('id, full_name').in('id', ownerIds);
      const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      setTasks(rows.map(r => ({ ...r, owner_name: nameMap.get(r.user_id) || '—' })));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tasks');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.rpc('admin_delete_task', { p_task_id: id });
      if (error) throw error;
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete task');
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen"><Navbar />
        <main className="container mx-auto px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5rem)' }}>
          <p className="text-muted-foreground">Checking authorization…</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen"><Navbar />
        <main className="container mx-auto px-4 text-center space-y-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
          <ShieldX className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Admins only.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO title="Admin · Tasks moderation — Taskfy" description="Moderate all platform tasks." path="/admin/tasks" />
      <Navbar />
      <main className="container mx-auto px-4 pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5rem)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-primary" /> Tasks moderation</h1>
            <p className="text-sm text-muted-foreground">Review and delete any task on Taskfy.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/admin/verifications">Verifications</Link></Button>
            <Button variant="outline" onClick={fetchTasks}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground">No tasks found.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {tasks.map(t => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{t.title}</CardTitle>
                    <Badge variant={t.status === 'open' ? 'default' : 'secondary'}>{t.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span>By: <span className="text-foreground font-medium">{t.owner_name}</span></span>
                    <span>{t.category}</span>
                    <span>{t.location}</span>
                    <span>${t.budget_min}–${t.budget_max}</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/tasks/${t.id}`}><ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open</Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes "{t.title}" and all its offers. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
