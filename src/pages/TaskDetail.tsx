import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { MapPin, DollarSign, Clock, Star, MessageCircle, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    rating: number;
    completed_tasks: number;
  };
}

interface Offer {
  id: string;
  price: number;
  message: string;
  status: string;
  created_at: string;
  helper_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    rating: number;
    completed_tasks: number;
  };
}

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchOffers();
    }
  }, [id]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      // Fetch the task row first (avoid joined selects which can fail under RLS)
      const { data: taskOnly, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (taskErr || !taskOnly) {
        console.error('Error fetching task:', taskErr);
        toast.error('Task not found');
        navigate('/tasks');
        return;
      }

      // Fetch profile separately. Profiles table is public per migrations; if it fails,
      // attach a minimal profile placeholder so the UI still renders.
      let profileData = null;
      try {
        const { data: p, error: pErr } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, rating, completed_tasks')
          .eq('id', taskOnly.user_id)
          .single();
        if (!pErr) profileData = p;
      } catch (pErr) {
        console.warn('Profile fetch failed:', pErr);
      }

      setTask({
        ...taskOnly,
        profiles: profileData || { full_name: 'Anonymous', avatar_url: null, rating: 0, completed_tasks: 0 }
      } as any);
    } catch (error: any) {
      console.error('Unexpected error fetching task:', error);
      toast.error(error?.message || 'Task not found');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            rating,
            completed_tasks
          )
        `)
        .eq('task_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data as any || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to make an offer');
      navigate('/auth');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          task_id: id!,
          helper_id: user.id,
          price: parseInt(offerPrice),
          message: offerMessage,
        });

      if (error) throw error;

      toast.success('Offer submitted successfully!');
      setOfferPrice('');
      setOfferMessage('');
      fetchOffers();
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast.error(error.message || 'Error submitting offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVolunteerOffer = async () => {
    if (!user) {
      toast.error('Please sign in to volunteer');
      navigate('/auth');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          task_id: id!,
          helper_id: user.id,
          price: 0,
          message: 'Volunteer (service hours)'
        });

      if (error) throw error;

      toast.success('Volunteer offer submitted!');
      fetchOffers();
    } catch (error: any) {
      console.error('Error submitting volunteer offer:', error);
      toast.error(error.message || 'Error submitting volunteer offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setSubmitting(true);
    try {
      // fetch the offer to inspect price/helper
      const { data: offerData, error: fetchErr } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchErr) throw fetchErr;

      const { error: updateErr } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (updateErr) throw updateErr;

      const { error: taskErr } = await supabase
        .from('tasks')
        .update({ status: 'assigned', selected_offer_id: offerId })
        .eq('id', id);

      if (taskErr) throw taskErr;

      // If this was a volunteer (price === 0), record volunteer hours and increment helper stats
      try {
        if (offerData?.price === 0) {
          // record volunteer hours (default 2 hours)
          await supabase.from('volunteer_hours').insert({
            user_id: offerData.helper_id,
            task_id: id,
            hours: 2,
          });

          // increment completed_tasks for helper
          const { data: profile } = await supabase.from('profiles').select('completed_tasks').eq('id', offerData.helper_id).single();
          const completed = (profile?.completed_tasks || 0) + 1;
          await supabase.from('profiles').update({ completed_tasks: completed }).eq('id', offerData.helper_id);
        }
      } catch (innerErr) {
        console.error('Error recording volunteer hours:', innerErr);
      }

      toast.success('Offer accepted!');
      fetchTask();
      fetchOffers();
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      toast.error(error.message || 'Error accepting offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChat = (helperId: string) => {
    navigate(`/messages?task=${id}&user=${helperId}`);
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

  if (!task) return null;

  const isTaskOwner = user?.id === task.user_id;
  const hasUserOffered = offers.some(offer => offer.helper_id === user?.id);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{task.category}</Badge>
                    <Badge
                      variant="outline"
                      className={task.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl">{task.title}</CardTitle>
                  <CardDescription className="text-base mt-4">
                    {task.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>Posted {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-accent" />
                    <span className="text-xl font-semibold">
                      ${task.budget_min} - ${task.budget_max}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Poster Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Posted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={task.profiles?.avatar_url || ''} />
                        <AvatarFallback>{task.profiles?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{task.profiles?.full_name}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                          {task.profiles?.rating?.toFixed(1) || '0.0'} ({task.profiles?.completed_tasks || 0} tasks)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offers Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Offers ({offers.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {offers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No offers yet</p>
                  ) : (
                    offers.map((offer) => (
                      <div key={offer.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={offer.profiles?.avatar_url || ''} />
                              <AvatarFallback>{offer.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{offer.profiles?.full_name}</p>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                {offer.profiles?.rating?.toFixed(1)} ({offer.profiles?.completed_tasks} tasks)
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-accent">${offer.price}</p>
                            <Badge
                              variant={offer.status === 'accepted' ? 'default' : 'secondary'}
                              className="mt-1"
                            >
                              {offer.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {offer.status}
                            </Badge>
                          </div>
                        </div>
                        {offer.message && (
                          <p className="text-sm text-muted-foreground mt-3">{offer.message}</p>
                        )}
                        <div className="flex gap-2 mt-4">
                          {isTaskOwner && offer.status === 'pending' && task.status === 'open' && (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptOffer(offer.id)}
                              disabled={submitting}
                            >
                              Accept Offer
                            </Button>
                          )}
                          {(isTaskOwner || offer.helper_id === user?.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartChat(offer.helper_id)}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Make Offer */}
            <div className="lg:col-span-1">
              {!isTaskOwner && task.status === 'open' && !hasUserOffered && (
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Make an Offer</CardTitle>
                    <CardDescription>
                      Submit your price and message to the task owner
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitOffer} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Your Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="Enter your price"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          min="0"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Budget range: ${task.budget_min} - ${task.budget_max}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell them why you're the right person for this task..."
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Offer
                      </Button>
                      <Button type="button" className="w-full mt-2" variant="outline" onClick={handleVolunteerOffer} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Volunteer (Free)
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {isTaskOwner && (
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Your Task</CardTitle>
                    <CardDescription>
                      You are the owner of this task
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Review offers from helpers and accept the best one for your task.
                    </p>
                  </CardContent>
                </Card>
              )}

              {hasUserOffered && !isTaskOwner && (
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Offer Submitted</CardTitle>
                    <CardDescription>
                      Your offer has been submitted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      The task owner will review your offer and get back to you.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}