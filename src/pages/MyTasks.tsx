import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
};

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posted, setPosted] = useState<TaskRow[]>([]);
  const [postedWithPendingOffers, setPostedWithPendingOffers] = useState<TaskRow[]>([]);
  const [applied, setApplied] = useState<TaskRow[]>([]);
  const [appliedPending, setAppliedPending] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyTasks();
  }, [user]);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      console.log('Fetching tasks for user:', user?.id);
      
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
      
      console.log('Posted tasks:', postedData);
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

      console.log('Offers data:', offersData);
      const taskIds = (offersData || []).map((o: any) => o.task_id);
      const pendingTaskIds = (offersData || []).filter((o: any) => o.status === 'pending').map((o: any) => o.task_id);
      let appliedTasks: any[] = [];
      let appliedPendingTasks: any[] = [];
      
      if (taskIds.length > 0) {
        console.log('Fetching tasks for offers:', taskIds);
        const { data: tdata, error: tErr } = await supabase
          .from('tasks')
          .select('*')
          .in('id', taskIds)
          .order('created_at', { ascending: false });
        
        if (tErr) {
          console.error('Error fetching applied tasks:', tErr);
          throw tErr;
        }
        
        console.log('Applied tasks:', tdata);
        appliedTasks = tdata || [];
        appliedPendingTasks = (tdata || []).filter((t: any) => pendingTaskIds.includes(t.id));
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">My Tasks</h1>
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
                  <Card key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="cursor-pointer">
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
                  <Card key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="cursor-pointer">
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
                  <Card key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="cursor-pointer">
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
                  <Card key={t.id} onClick={() => navigate(`/tasks/${t.id}`)} className="cursor-pointer">
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
        </div>
      </main>
    </>
  );
}
