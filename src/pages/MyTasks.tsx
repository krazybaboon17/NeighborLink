import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Star } from 'lucide-react';

type TaskRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string | null;
  my_offer_status?: string;
};

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posted, setPosted] = useState<TaskRow[]>([]);
  const [postedWithPendingOffers, setPostedWithPendingOffers] = useState<TaskRow[]>([]);
  const [applied, setApplied] = useState<TaskRow[]>([]);
  const [appliedPending, setAppliedPending] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    fetchMyTasks();
    fetchUserRating();
  }, [user]);

  const fetchUserRating = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('rating, completed_tasks')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setUserRating(data?.rating || null);
      setCompletedTasks(data?.completed_tasks || 0);
    } catch (err) {
      console.error('Error fetching user rating:', err);
    }
  };

  const fetchMyTasks = async () => {
    setLoading(true);
    try {

      // tasks posted by the user
      const { data: postedData, error: postErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (postErr) {
        console.error('Error fetching posted tasks:', postErr);
        throw postErr;
      }

      setPosted(postedData as any || []);

      // Posted tasks with pending offers
      const { data: pendingOffersData, error: pendingOffersErr } = await supabase
        .from('offers')
        .select('task_id')
        .eq('status', 'pending')
        .in('task_id', (postedData || []).map((t: any) => t.id));

      if (pendingOffersErr) {
        console.error('Error fetching pending offers:', pendingOffersErr);
      } else {
        const taskIdsWithPendingOffers = [...new Set((pendingOffersData || []).map((o: any) => o.task_id))];
        const postedWithPending = (postedData || []).filter((t: any) => taskIdsWithPendingOffers.includes(t.id));
        setPostedWithPendingOffers(postedWithPending);
      }

      // tasks user has applied for (via offers)
      const { data: offersData, error: offersErr } = await supabase
        .from('offers')
        .select('task_id, status')
        .eq('helper_id', user!.id);

      if (offersErr) {
        console.error('Error fetching offers:', offersErr);
        throw offersErr;
      }

      const taskIds = (offersData || []).map((o: any) => o.task_id);
      const pendingTaskIds = (offersData || []).filter((o: any) => o.status === 'pending').map((o: any) => o.task_id);
      let appliedTasks: any[] = [];
      let appliedPendingTasks: any[] = [];

      if (taskIds.length > 0) {
        const { data: tdata, error: tErr } = await supabase
          .from('tasks')
          .select('*')
          .in('id', taskIds)
          .order('created_at', { ascending: false });

        if (tErr) {
          console.error('Error fetching applied tasks:', tErr);
          throw tErr;
        }

        const offerStatusMap = new Map((offersData || []).map((o: any) => [o.task_id, o.status]));

        appliedTasks = (tdata || []).map((t: any) => ({
          ...t,
          my_offer_status: offerStatusMap.get(t.id)
        }));

        appliedPendingTasks = appliedTasks.filter((t: any) => pendingTaskIds.includes(t.id));
      }

      setApplied(appliedTasks);
      setAppliedPending(appliedPendingTasks);
    } catch (err: any) {
      console.error('Error fetching my tasks:', err);
      // More detailed error message
      const errorMessage = err.message || 'Unknown error occurred';
      console.error('Detailed error:', {
        message: errorMessage,
        code: err.code,
        details: err.details
      });
      toast.error(`Error loading your tasks: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted successfully');
      fetchMyTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Error deleting task');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-transparent pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Tasks</h1>
              {completedTasks > 0 && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">
                    {userRating !== null ? userRating.toFixed(1) : '0.0'}
                  </span>
                  <span>• {completedTasks} tasks completed</span>
                </div>
              )}
            </div>
            <Button onClick={() => navigate('/post-task')}>Post a Task</Button>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Posted Tasks with Pending Applications</h2>
            {loading ? (
              <p>Loading…</p>
            ) : postedWithPendingOffers.length === 0 ? (
              <Card className="py-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">No pending applications on your tasks.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {postedWithPendingOffers.map((t) => (
                  <Card key={t.id} className="card-interactive relative">
                    <div onClick={() => navigate(`/tasks/${t.id}`)}>
                      <CardHeader>
                        <CardTitle>{t.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{t.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">{t.category} • {t.location}</div>
                        <div className="mt-2 font-medium">${t.budget_min} - ${t.budget_max}</div>
                      </CardContent>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => handleDeleteTask(t.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Applications Awaiting Approval</h2>
            {loading ? (
              <p>Loading…</p>
            ) : appliedPending.length === 0 ? (
              <Card className="py-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">No pending applications.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {appliedPending.map((t) => (
                  <Card key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="card-interactive">
                    <CardHeader>
                      <CardTitle>{t.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{t.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{t.category} • {t.location}</div>
                      <div className="mt-2 font-medium">${t.budget_min} - ${t.budget_max}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">All Tasks You Posted</h2>
            {loading ? (
              <p>Loading…</p>
            ) : posted.length === 0 ? (
              <Card className="py-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">You haven't posted any tasks yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {posted.map((t) => (
                  <Card key={t.id} className="card-interactive relative">
                    <div onClick={() => navigate(`/tasks/${t.id}`)}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{t.title}</CardTitle>
                          {t.status === 'assigned' && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              Assigned
                            </Badge>
                          )}
                          {t.status === 'open' && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Open
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">{t.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">{t.category} • {t.location}</div>
                        <div className="mt-2 font-medium">${t.budget_min} - ${t.budget_max}</div>
                      </CardContent>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => handleDeleteTask(t.id, e)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">All Tasks You Applied For</h2>
            {loading ? (
              <p>Loading…</p>
            ) : applied.length === 0 ? (
              <Card className="py-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">You haven't applied for any tasks yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {applied.map((t) => (
                  <Card key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="card-interactive">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{t.title}</CardTitle>
                        {t.my_offer_status === 'accepted' && (
                          <Badge className="bg-green-600 hover:bg-green-700">Accepted</Badge>
                        )}
                        {t.my_offer_status === 'pending' && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {t.my_offer_status === 'rejected' && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">{t.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{t.category} • {t.location}</div>
                      <div className="mt-2 font-medium">${t.budget_min} - ${t.budget_max}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
