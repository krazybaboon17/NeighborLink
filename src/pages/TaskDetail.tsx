import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Navbar } from '@/components/Navbar';
import { MapPin, DollarSign, Clock, Star, MessageCircle, Loader2, CheckCircle, Camera, ImageIcon, ShieldCheck, Users } from 'lucide-react';
import { YoungNeighborBadge } from '@/components/YoungNeighborBadge';
import { UnverifiedBadge } from '@/components/UnverifiedBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import { useHelperSafetyCheck } from '@/hooks/useHelperSafetyCheck';
import { SafetyWarningDialog } from '@/components/SafetyWarningDialog';

import { DecorativeCircles } from '@/components/ui/DecorativeCircles';
import { useContentModeration } from '@/hooks/useContentModeration';
import { ReportTaskDialog } from '@/components/ReportTaskDialog';

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
  due_date: string | null;
  user_id: string;
  selected_offer_id: string | null;
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
    verified?: boolean;
    is_young_neighbor?: boolean;
  };
}

const offerSchema = z.object({
  price: z.number().int().min(1, 'Please enter a price of at least $1').max(10000, 'Price is too high (max $10,000)'),
  message: z.string().trim().max(1000, 'Message is too long (max 1000 characters)').optional()
});

export default function TaskDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string | null>(null);
  const [showCompletionPhotoDialog, setShowCompletionPhotoDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Safety check state
  const { isChecking, safetyResult, checkHelperSafety, clearResult } = useHelperSafetyCheck();
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const [pendingOfferHelper, setPendingOfferHelper] = useState<string>('');
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  // Per-task ToS removed — users accept ToS once at signup. Keep stubs for legacy logic.
  const agreeOffer = true;
  const agreeVolunteer = true;
  const acceptingAgreement: Record<string, boolean> = new Proxy({}, { get: () => true });

  // Young Neighbor & verification state for current user
  const [currentUserIsYoungNeighbor, setCurrentUserIsYoungNeighbor] = useState(false);
  const [currentUserParentalConsent, setCurrentUserParentalConsent] = useState(false);
  const [currentUserVerified, setCurrentUserVerified] = useState(false);
  const [showYNGateDialog, setShowYNGateDialog] = useState(false);
  
  // Content moderation
  const { isChecking: isModeratingContent, moderateMessage } = useContentModeration();

  // Per-task parental approval state for offers
  const [offerParentName, setOfferParentName] = useState('');
  const [offerParentEmail, setOfferParentEmail] = useState('');
  const [offerHasParentalApproval, setOfferHasParentalApproval] = useState(false);

  // Helper to parse metadata from text
  const parseApprovalMetadata = (text: string | null) => {
    if (!text) return { cleanText: '', approval: null };
    const match = text.match(/\[YN_APPROVAL:({.*?})\]/);
    if (match) {
      try {
        const approval = JSON.parse(match[1]);
        const cleanText = text.replace(/\[YN_APPROVAL:({.*?})\]/, '').trim();
        return { cleanText, approval };
      } catch (e) {
        return { cleanText: text, approval: null };
      }
    }
    return { cleanText: text, approval: null };
  };

  useEffect(() => {
    if (id) {
      fetchTask();
      fetchOffers();
    }
  }, [id]);

  // Fetch current user's Young Neighbor / verification status
  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_young_neighbor, verified')
        .eq('id', user!.id)
        .single();
      if (data) {
        setCurrentUserIsYoungNeighbor(data?.is_young_neighbor || false);
        setCurrentUserVerified(data?.verified || false);
      }
    } catch (err) {
      console.error('Error fetching current user profile:', err);
    }
  };


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
          .from('public_profiles' as any)
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
      // Fetch offers without join (profiles base table is restricted)
      const { data: offersData, error } = await supabase
        .from('offers')
        .select('*')
        .eq('task_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!offersData) { setOffers([]); return; }

      // Fetch public profiles for each helper
      const helperIds = [...new Set(offersData.map(o => o.helper_id))];
      const { data: profilesData } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name, avatar_url, rating, completed_tasks, verified')
        .in('id', helperIds);

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      const enrichedOffers = offersData.map(o => ({
        ...o,
        profiles: profileMap.get(o.helper_id) || {
          full_name: 'Anonymous', avatar_url: null, rating: 0, completed_tasks: 0, is_young_neighbor: false, verified: false
        }
      }));

      setOffers(enrichedOffers as any || []);
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
    if (!agreeOffer) {
      toast.error('Please agree to the Terms of Service to send an offer');
      return;
    }

    // Young Neighbor parental consent check
    if (currentUserIsYoungNeighbor && !offerHasParentalApproval) {
      toast.error('Parental approval is required for Young Neighbors to make offers.');
      return;
    }

    if (currentUserIsYoungNeighbor && (!offerParentName.trim() || !offerParentEmail.trim())) {
      toast.error('Please provide parent/guardian contact information.');
      return;
    }

    setSubmitting(true);
    try {
      const priceNum = parseInt(offerPrice);

      const validation = offerSchema.safeParse({
        price: priceNum,
        message: offerMessage || undefined
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setSubmitting(false);
        return;
      }

      // AI Content Moderation on offer message
      if (offerMessage && offerMessage.trim().length > 0) {
        const modResult = await moderateMessage(offerMessage, currentUserIsYoungNeighbor);
        if (!modResult.allowed) {
          toast.error(`Message blocked: ${modResult.reason || 'This message violates our community guidelines.'}`);
          setSubmitting(false);
          return;
        }
      }

      // Append parental approval metadata if YN
      let finalMessage = offerMessage;
      if (currentUserIsYoungNeighbor) {
        const approvalData = {
          parentName: offerParentName.trim(),
          parentEmail: offerParentEmail.trim(),
          timestamp: new Date().toISOString()
        };
        finalMessage += `\n\n[YN_APPROVAL:${JSON.stringify(approvalData)}]`;
      }

      const { error } = await supabase
        .from('offers')
        .insert({
          task_id: id!,
          helper_id: user.id,
          price: validation.data.price,
          message: finalMessage || null,
        });

      if (error) throw error;

      toast.success('Offer submitted successfully!');
      setOfferPrice('');
      setOfferMessage('');
      // setAgreeOffer(false); removed
      setOfferParentName('');
      setOfferParentEmail('');
      setOfferHasParentalApproval(false);
      fetchOffers();
    } catch (error: any) {
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
    if (!agreeVolunteer) {
      toast.error('Please agree to the Terms of Service to volunteer');
      return;
    }

    // Young Neighbor parental consent check
    if (currentUserIsYoungNeighbor && !offerHasParentalApproval) {
      toast.error('Parental approval is required for Young Neighbors to volunteer.');
      return;
    }

    if (currentUserIsYoungNeighbor && (!offerParentName.trim() || !offerParentEmail.trim())) {
      toast.error('Please provide parent/guardian contact information.');
      return;
    }

    setSubmitting(true);
    try {
      // Append parental approval metadata if YN
      let finalMessage = 'Volunteer (service hours)';
      if (currentUserIsYoungNeighbor) {
        const approvalData = {
          parentName: offerParentName.trim(),
          parentEmail: offerParentEmail.trim(),
          timestamp: new Date().toISOString()
        };
        finalMessage += `\n\n[YN_APPROVAL:${JSON.stringify(approvalData)}]`;
      }

      const { error } = await supabase
        .from('offers')
        .insert({
          task_id: id!,
          helper_id: user.id,
          price: 0,
          message: finalMessage
        });

      if (error) throw error;

      toast.success('Volunteer offer submitted!');
      // setAgreeVolunteer(false); removed
      fetchOffers();
    } catch (error: any) {
      console.error('Error submitting volunteer offer:', error);
      toast.error(error.message || 'Error submitting volunteer offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptOfferClick = async (offer: Offer) => {
    if (!acceptingAgreement[offer.id]) {
      toast.error('Please agree to the Terms of Service before accepting this offer');
      return;
    }
    setSubmitting(true);

    // Perform AI safety check
    const result = await checkHelperSafety(offer.helper_id, {
      full_name: offer.profiles?.full_name || null,
      rating: offer.profiles?.rating || null,
      completed_tasks: offer.profiles?.completed_tasks || null,
      verified: offer.profiles?.verified || null
    });

    setSubmitting(false);

    if (result.showWarning) {
      // Show warning dialog
      setPendingOfferId(offer.id);
      setPendingOfferHelper(offer.profiles?.full_name || 'this helper');
      setShowSafetyWarning(true);
    } else {
      // Proceed directly
      await executeAcceptOffer(offer.id);
    }
  };

  const executeAcceptOffer = async (offerId: string) => {
    setSubmitting(true);
    try {
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

      // If this was a volunteer (price === 0), record volunteer hours
      try {
        if (offerData?.price === 0) {
          await supabase.from('volunteer_hours').insert({
            user_id: offerData.helper_id,
            task_id: id,
            hours: 2,
          });

          // completed_tasks is handled by submit_review RPC at task completion
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

  const handleConfirmAccept = async () => {
    setShowSafetyWarning(false);
    if (pendingOfferId) {
      await executeAcceptOffer(pendingOfferId);
      setPendingOfferId(null);
      setPendingOfferHelper('');
      clearResult();
    }
  };

  const handleCancelAccept = () => {
    setShowSafetyWarning(false);
    setPendingOfferId(null);
    setPendingOfferHelper('');
    clearResult();
  };

  const handleStartChat = (helperId: string) => {
    if (user?.id === helperId) {
      toast.error("You can't message yourself.");
      return;
    }
    navigate(`/messages?task=${id}&user=${helperId}`);
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Task deleted successfully');
      navigate('/my-tasks');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(error.message || 'Error deleting task');
    } finally {
      setSubmitting(false);
    }
  };

  // Get accepted offer details
  const getAcceptedOffer = () => {
    if (!task?.selected_offer_id) return null;
    return offers.find(o => o.id === task.selected_offer_id);
  };

  const handlePaymentClick = () => {
    setShowCompletionPhotoDialog(true);
  };

  const handleCompletionPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setCompletionPhoto(file);
    setCompletionPhotoPreview(URL.createObjectURL(file));
  };

  const handleCompletionPhotoSubmit = async () => {
    if (!completionPhoto || !user || !id) {
      toast.error('Please upload or take a photo of the completed task');
      return;
    }


    setUploadingPhoto(true);
    try {
      const fileExt = completionPhoto.name.split('.').pop();
      const filePath = `${user.id}/${id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(filePath, completionPhoto, { upsert: true });

      if (uploadError) throw uploadError;

      await supabase
        .from('tasks')
        .update({ completion_photo_url: filePath } as any)
        .eq('id', id);

      setShowCompletionPhotoDialog(false);
      setIsReviewOpen(true);
    } catch (error: any) {
      console.error('Error uploading completion photo:', error);
      toast.error(error.message || 'Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };



  const handleSubmitReview = async () => {
    if (!task?.selected_offer_id) return;

    setSubmitting(true);
    try {
      // Find the accepted offer to get helper_id
      const acceptedOffer = offers.find(o => o.id === task.selected_offer_id);
      if (!acceptedOffer) throw new Error('No accepted offer found');

      const helperId = acceptedOffer.helper_id;

      // Call the RPC function
      const { error } = await supabase.rpc('submit_review', {
        p_task_id: task.id,
        p_helper_id: helperId,
        p_rating: rating,
        p_comment: reviewComment
      });

      if (error) throw error;

      toast.success('Task completed and review submitted!');
      setIsReviewOpen(false);
      fetchTask();
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error(error.message || 'Error completing task');
    } finally {
      setSubmitting(false);
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

  if (!task) return null;

  const isTaskOwner = user?.id === task.user_id;
  const hasUserOffered = offers.some(offer => offer.helper_id === user?.id);

  return (
    <>
      <Navbar />
      <DecorativeCircles />
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{task.category}</Badge>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={task.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      >
                        {task.status}
                      </Badge>
                      {!isTaskOwner && <ReportTaskDialog taskId={task.id} />}
                    </div>
                  </div>
                  <CardTitle className="text-3xl">{task.title}</CardTitle>
                  <CardDescription className="text-base mt-4 whitespace-pre-wrap">
                    {parseApprovalMetadata(task.description).cleanText}
                  </CardDescription>
                  {parseApprovalMetadata(task.description).approval && (
                    <div className="mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Parental Approval Confirmed</span>
                    </div>
                  )}
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
                  {task.due_date && (
                    <div className="flex items-center text-foreground bg-primary/5 rounded-2xl px-4 py-3">
                      <Clock className="w-5 h-5 mr-2 text-primary" />
                      <span className="font-body">
                        <span className="font-bold text-primary">Needed by:</span>{' '}
                        {format(new Date(task.due_date), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  )}
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
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{task.profiles?.full_name}</p>
                          {(task.profiles as any)?.verified ? (
                            (task.profiles as any)?.is_young_neighbor ? (
                              <YoungNeighborBadge size="sm" />
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <ShieldCheck className="w-3 h-3" />
                              </span>
                            )
                          ) : (
                            <UnverifiedBadge size="sm" />
                          )}
                        </div>
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold">{offer.profiles?.full_name}</p>
                                {offer.profiles?.verified ? (
                                  offer.profiles?.is_young_neighbor ? (
                                    <YoungNeighborBadge size="sm" />
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                      <ShieldCheck className="w-3 h-3" />
                                    </span>
                                  )
                                ) : (
                                  <UnverifiedBadge size="sm" />
                                )}
                              </div>
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
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {parseApprovalMetadata(offer.message).cleanText}
                            </p>
                            {parseApprovalMetadata(offer.message).approval && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/5 border border-green-500/20 rounded-md">
                                <ShieldCheck className="w-3 h-3 text-green-600" />
                                <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Parent Approved</span>
                              </div>
                            )}
                          </div>
                        )}
                        {isTaskOwner && offer.status === 'pending' && task.status === 'open' && (
                          <div className="mt-4 space-y-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptOfferClick(offer)}
                                disabled={submitting || isChecking || !acceptingAgreement[offer.id]}
                              >
                                {isChecking && pendingOfferId === offer.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : null}
                                Accept Offer
                              </Button>
                              {(isTaskOwner || offer.helper_id === user?.id) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartChat(isTaskOwner ? offer.helper_id : task.user_id)}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Message
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        {!(isTaskOwner && offer.status === 'pending' && task.status === 'open') &&
                          (isTaskOwner || offer.helper_id === user?.id) && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartChat(isTaskOwner ? offer.helper_id : task.user_id)}
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Message
                              </Button>
                            </div>
                          )}
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

                      {/* Young Neighbor Parental Approval for Paid Offers */}
                      {currentUserIsYoungNeighbor && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 space-y-2 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-tight">Parental Approval</span>
                          </div>
                          <div className="flex gap-2">
                            <Input placeholder="Parent Name" value={offerParentName} onChange={(e) => setOfferParentName(e.target.value)} className="h-8 text-xs bg-white" />
                            <Input placeholder="Parent Email" value={offerParentEmail} onChange={(e) => setOfferParentEmail(e.target.value)} className="h-8 text-xs bg-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="paid-parent-confirm" checked={offerHasParentalApproval} onCheckedChange={(c) => setOfferHasParentalApproval(c === true)} />
                            <Label htmlFor="paid-parent-confirm" className="text-[10px] text-amber-800 leading-tight cursor-pointer">
                              Parent/guardian has approved this offer.
                            </Label>
                          </div>
                        </div>
                      )}

                      <div className="hidden" />


                      <Button type="submit" className="w-full" disabled={submitting || !agreeOffer || (currentUserIsYoungNeighbor && !offerHasParentalApproval)}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Offer
                      </Button>

                      <div className="hidden" />


                      {currentUserIsYoungNeighbor && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 space-y-2 mb-3 mt-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-tight">Parental Approval</span>
                          </div>
                          <div className="flex gap-2">
                            <Input placeholder="Parent Name" value={offerParentName} onChange={(e) => setOfferParentName(e.target.value)} className="h-8 text-xs bg-white" />
                            <Input placeholder="Parent Email" value={offerParentEmail} onChange={(e) => setOfferParentEmail(e.target.value)} className="h-8 text-xs bg-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="vol-parent-confirm" checked={offerHasParentalApproval} onCheckedChange={(c) => setOfferHasParentalApproval(c === true)} />
                            <Label htmlFor="vol-parent-confirm" className="text-[10px] text-amber-800 leading-tight cursor-pointer">
                              Parent/guardian has approved this offer.
                            </Label>
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        className="w-full mt-2 bg-accent hover:bg-accent/90"
                        onClick={handleVolunteerOffer}
                        disabled={submitting || !agreeVolunteer || (currentUserIsYoungNeighbor && !offerHasParentalApproval)}
                      >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Volunteer (Earn Service Hours)
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
                  <CardContent className="space-y-4">
                    {task.status === 'assigned' ? (
                      (() => {
                        const acceptedOffer = getAcceptedOffer();
                        const isVolunteer = acceptedOffer?.price === 0;
                        return (
                          <>
                            <p className="text-sm text-muted-foreground">
                              The task is assigned. {isVolunteer ? 'Mark it completed when the work is done.' : 'Coordinate payment with the helper in Messages, then mark it completed.'}
                            </p>
                            {acceptedOffer && !isVolunteer && (
                              <div className="flex flex-col gap-2 mb-2">
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <span className="text-sm font-medium">Agreed Price</span>
                                  <span className="text-xl font-bold text-accent">${acceptedOffer.price}</span>
                                </div>
                                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground/80">
                                  💬 Payment is handled off-app — go to Messages to coordinate payment directly with the helper.
                                </div>
                                <Button
                                  className="w-full bg-[#B22234] hover:bg-[#901c2a]"
                                  onClick={() => navigate(`/messages?task=${id}&user=${acceptedOffer.helper_id}`)}
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Open Messages
                                </Button>
                              </div>
                            )}
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700 mt-2"
                              onClick={handlePaymentClick}
                              disabled={submitting}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Completed
                            </Button>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Review offers from helpers and accept the best one for your task.
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteTask}
                          disabled={submitting}
                          className="w-full"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Task'
                          )}
                        </Button>
                      </>
                    )}
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
                      {task.status === 'assigned'
                        ? "The owner will pay you once the task has been completed."
                        : "The task owner will review your offer and get back to you."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task & Rate Helper</DialogTitle>
            <DialogDescription>
              Please rate your experience with the helper. This helps build trust in the community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review">Comment</Label>
              <Textarea
                id="review"
                placeholder="How was the work?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Safety Warning Dialog */}
      {safetyResult && (
        <SafetyWarningDialog
          open={showSafetyWarning}
          onOpenChange={setShowSafetyWarning}
          riskLevel={safetyResult.riskLevel}
          warnings={safetyResult.warnings}
          message={safetyResult.message}
          helperName={pendingOfferHelper}
          onConfirm={handleConfirmAccept}
          onCancel={handleCancelAccept}
        />
      )}



      {/* Completion Photo Dialog */}
      <Dialog open={showCompletionPhotoDialog} onOpenChange={(open) => {
        setShowCompletionPhotoDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Completion Photo
            </DialogTitle>
            <DialogDescription>
              Take a photo or upload one showing the completed task as proof.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {completionPhotoPreview ? (
              <div className="relative">
                <img
                  src={completionPhotoPreview}
                  alt="Completion preview"
                  className="w-full h-64 object-cover rounded-lg border border-border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => {
                    setCompletionPhoto(null);
                    setCompletionPhotoPreview(null);
                  }}
                >
                  Change Photo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Take Photo (camera capture) */}
                <label className="flex items-center justify-center gap-2 w-full h-14 border-2 border-dashed border-primary/40 rounded-lg cursor-pointer hover:border-primary/70 hover:bg-primary/5 transition-colors">
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Take a Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCompletionPhotoSelected}
                  />
                </label>

                {/* Upload from gallery */}
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">Upload from Gallery</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCompletionPhotoSelected}
                  />
                </label>
              </div>
            )}


          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionPhotoDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCompletionPhotoSubmit}
              disabled={!completionPhoto || uploadingPhoto}
            >
              {uploadingPhoto && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}