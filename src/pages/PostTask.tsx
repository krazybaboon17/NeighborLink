import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, DollarSign, Wand2, ShieldAlert, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { DecorativeCircles } from '@/components/ui/DecorativeCircles';
import { useAuth } from '@/contexts/AuthContext';
import { useContentModeration } from '@/hooks/useContentModeration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const categories = [
  'Lawn Care', 'Snow Removal', 'Moving Help', 'Grocery Runs',
  'Home Repairs', 'Babysitting', 'Pet Care', 'Handyman', 'Errands', 'Other'
];

const fieldShellClass =
  "bg-card rounded-2xl px-5 py-4 transition-shadow";
const fieldShellShadow = { boxShadow: '0 10px 40px hsl(60 3% 17% / 0.06)' };

export default function PostTask() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(searchParams.get('title') ?? '');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Young Neighbor state
  const [isYoungNeighbor, setIsYoungNeighbor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [hasParentalApproval, setHasParentalApproval] = useState(false);
  
  // Content moderation
  const { isChecking: isModeratingContent, moderateTask } = useContentModeration();

  // Check Young Neighbor status on mount
  useEffect(() => {
    if (user) {
      checkYoungNeighborStatus();
    }
  }, [user]);

  const checkYoungNeighborStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_young_neighbor')
        .eq('id', user!.id)
        .single();
      
      if (data) {
        setIsYoungNeighbor(data?.is_young_neighbor || false);
      }
    } catch (err) {
      console.error('Error checking Young Neighbor status:', err);
    }
  };

  const handleAIDescription = async () => {
    if (!title.trim()) return toast.error('Please enter a title first');
    if (!category) return toast.error('Please select a category first');
    setAiLoading('description');
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { type: 'generate-description', data: { title, category } },
      });
      if (error) throw error;
      if (data?.result) {
        setDescription(data.result);
        toast.success('AI description generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate description');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIPricing = async () => {
    if (!title.trim() || !category) return toast.error('Enter a title and category first');
    setAiLoading('pricing');
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { type: 'suggest-pricing', data: { title, category, description, location } },
      });
      if (error) throw error;
      if (data?.result) {
        const jsonMatch = data.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const pricing = JSON.parse(jsonMatch[0]);
          setBudgetMin(String(pricing.min));
          setBudgetMax(String(pricing.max));
          toast.success(pricing.reasoning || 'AI pricing suggestion applied!');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get pricing');
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Young Neighbor parental consent
    if (isYoungNeighbor && (!hasParentalApproval || !parentName.trim() || !parentEmail.trim())) {
      toast.error('Parental approval and contact info are required to post.');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error('You must be logged in');
        navigate('/auth');
        return;
      }

      // Anti-spam: limit open tasks and tasks per 24h
      const { count: openCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('status', 'open');
      if ((openCount ?? 0) >= 5) {
        toast.error('You already have 5 open tasks. Please close or fill one before posting more.');
        setLoading(false);
        return;
      }

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: dailyCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .gte('created_at', since);
      if ((dailyCount ?? 0) >= 8) {
        toast.error('Daily limit reached: you can post up to 8 tasks per 24 hours.');
        setLoading(false);
        return;
      }

      // AI Content Moderation
      const moderationResult = await moderateTask(title, description, category, isYoungNeighbor);
      
      if (!moderationResult.allowed) {
        const severityLabel = moderationResult.severity === 'high' 
          ? '🚫 Content Blocked' 
          : '⚠️ Content Flagged';
        toast.error(`${severityLabel}: ${moderationResult.reason || 'This content violates our community guidelines.'}`);
        setLoading(false);
        return;
      }

      // Append parental approval metadata if YN
      let finalDescription = description;
      if (isYoungNeighbor) {
        const approvalData = {
          parentName: parentName.trim(),
          parentEmail: parentEmail.trim(),
          timestamp: new Date().toISOString()
        };
        finalDescription += `\n\n[YN_APPROVAL:${JSON.stringify(approvalData)}]`;
      }

      const { error } = await supabase.from('tasks').insert({
        user_id: currentUser.id,
        title, 
        description: finalDescription, 
        category, 
        location,
        budget_min: parseInt(budgetMin),
        budget_max: parseInt(budgetMax),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'open',
      } as any);
      if (error) throw error;
      toast.success('Task posted!');
      navigate('/tasks');
    } catch (error: any) {
      toast.error(error.message || 'Error posting task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <DecorativeCircles />
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="text-center mb-12">
              <h1 className="editorial-headline text-5xl lg:text-[4rem] mb-4">
                Post a <em className="italic font-light text-primary">task</em>
              </h1>
              <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
                Tell your neighbors what you need help with. We'll match you with someone nearby.
              </p>
              {isYoungNeighbor && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm text-amber-700 dark:text-amber-300">
                  <Users className="w-4 h-4" />
                  Young Neighbor — parental approval required for this task
                </div>
              )}
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Section: The basics */}
              <section>
                <h2 className="font-display font-bold text-2xl mb-5 text-foreground">
                  The basics
                </h2>
                <div className="space-y-4">
                  <div className={fieldShellClass} style={fieldShellShadow}>
                    <label className="font-body text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                      Task title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Mow my lawn this weekend"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full bg-transparent border-0 outline-none font-body text-base placeholder:text-muted-foreground/60"
                    />
                  </div>

                  <div className={fieldShellClass} style={fieldShellShadow}>
                    <label className="font-body text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                      Category
                    </label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger className="border-0 px-0 h-auto py-1 bg-transparent font-body text-base shadow-none focus:ring-0">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Section: Tell the story */}
              <section>
                <div className="flex items-end justify-between mb-5">
                  <h2 className="font-display font-bold text-2xl text-foreground">
                    Tell the story
                  </h2>
                  <button
                    type="button"
                    onClick={handleAIDescription}
                    disabled={aiLoading === 'description'}
                    className="font-body text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aiLoading === 'description' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    Help me write it
                  </button>
                </div>
                <div className={fieldShellClass} style={fieldShellShadow}>
                  <label className="font-body text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what you need, when, and any details that matter…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    required
                    className="w-full bg-transparent border-0 outline-none font-body text-base resize-none placeholder:text-muted-foreground/60"
                  />
                </div>
              </section>

              {/* Section: Where & how much */}
              <section>
                <h2 className="font-display font-bold text-2xl mb-5 text-foreground">
                  Where & how much
                </h2>
                <div className="space-y-4">
                  <div className={fieldShellClass} style={fieldShellShadow}>
                    <label className="font-body text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Arlington Heights, IL"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="w-full bg-transparent border-0 outline-none font-body text-base placeholder:text-muted-foreground/60"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-muted-foreground">Budget range</span>
                    <button
                      type="button"
                      onClick={handleAIPricing}
                      disabled={aiLoading === 'pricing'}
                      className="font-body text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {aiLoading === 'pricing' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <DollarSign className="w-3 h-3" />
                      )}
                      Suggest a price
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={fieldShellClass} style={fieldShellShadow}>
                      <label className="font-body text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                        Min ($)
                      </label>
                      <input
                        type="number"
                        placeholder="20"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        min="0"
                        required
                        className="w-full bg-transparent border-0 outline-none font-body text-base placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <div className={fieldShellClass} style={fieldShellShadow}>
                      <label className="font-body text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                        Max ($)
                      </label>
                      <input
                        type="number"
                        placeholder="50"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        min="0"
                        required
                        className="w-full bg-transparent border-0 outline-none font-body text-base placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Young Neighbor Parental Approval */}
              {isYoungNeighbor && (
                <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <h2 className="font-display font-bold text-base text-foreground">Parental Approval</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Parent Name" value={parentName} onChange={(e) => setParentName(e.target.value)} required className="w-full bg-white/50 border border-amber-500/20 rounded-lg px-3 py-2 text-sm outline-none" />
                    <input type="email" placeholder="Parent Email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required className="w-full bg-white/50 border border-amber-500/20 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={hasParentalApproval} onChange={(e) => setHasParentalApproval(e.target.checked)} className="rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                    I confirm parental approval for this task.
                  </label>
                </section>
              )}

              {/* AI Safety Notice */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl px-4 py-3">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                <span>
                  All task postings are reviewed by AI for community safety. 
                  {isYoungNeighbor && <strong> Stricter safety rules apply for Young Neighbors.</strong>}
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading || isModeratingContent}
                className="w-full h-14 rounded-full text-base font-semibold"
              >
                {(loading || isModeratingContent) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isModeratingContent ? 'Checking content safety...' : 'Post task'}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>


    </>
  );
}
