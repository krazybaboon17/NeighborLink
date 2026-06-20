import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Loader2,
  DollarSign,
  Wand2,
  ShieldAlert,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  Pencil,
  Tag,
  FileText,
  MapPin,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { DecorativeCircles } from '@/components/ui/DecorativeCircles';
import { useAuth } from '@/contexts/AuthContext';
import { useContentModeration } from '@/hooks/useContentModeration';
import { SEO } from '@/components/SEO';
import { LocationPicker, type PickedLocation } from '@/components/LocationPicker';
import { approximate } from '@/lib/geo';

const categories = [
  { name: 'Lawn Care', emoji: '🌱' },
  { name: 'Snow Removal', emoji: '❄️' },
  { name: 'Moving Help', emoji: '📦' },
  { name: 'Grocery Runs', emoji: '🛒' },
  { name: 'Home Repairs', emoji: '🔧' },
  { name: 'Babysitting', emoji: '👶' },
  { name: 'Pet Care', emoji: '🐶' },
  { name: 'Handyman', emoji: '🛠️' },
  { name: 'Errands', emoji: '🏃' },
  { name: 'Other', emoji: '✨' },
];

type StepKey = 'title' | 'category' | 'description' | 'location' | 'budget' | 'due' | 'parental' | 'review';

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

  const [isYoungNeighbor, setIsYoungNeighbor] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [hasParentalApproval, setHasParentalApproval] = useState(false);

  const { isChecking: isModeratingContent, moderateTask } = useContentModeration();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (user) checkYoungNeighborStatus();
  }, [user]);

  const checkYoungNeighborStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_young_neighbor')
        .eq('id', user!.id)
        .single();
      if (data) setIsYoungNeighbor(data?.is_young_neighbor || false);
    } catch (err) {
      console.error('Error checking Young Neighbor status:', err);
    }
  };

  const steps = useMemo(() => {
    const base: { key: StepKey; title: string; subtitle: string; icon: any }[] = [
      { key: 'title', title: 'What do you need help with?', subtitle: 'A short, clear title works best.', icon: Pencil },
      { key: 'category', title: 'What kind of task is it?', subtitle: 'Pick the category that fits best.', icon: Tag },
      { key: 'description', title: 'Tell the story', subtitle: 'Share details that will help neighbors decide.', icon: FileText },
      { key: 'location', title: 'Where is this happening?', subtitle: 'Your neighborhood helps us match you nearby.', icon: MapPin },
      { key: 'budget', title: "What's your budget?", subtitle: 'Give a range — payment is coordinated off-app.', icon: DollarSign },
      { key: 'due', title: 'When do you need it done?', subtitle: 'Optional — leave blank if flexible.', icon: CalendarDays },
    ];
    if (isYoungNeighbor) {
      base.push({ key: 'parental', title: 'Parental approval', subtitle: 'Required for Young Neighbors before posting.', icon: Users });
    }
    base.push({ key: 'review', title: "Ready to post?", subtitle: 'Quick look before we share it with neighbors.', icon: Sparkles });
    return base;
  }, [isYoungNeighbor]);

  const step = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

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

  const canAdvance = () => {
    switch (step.key) {
      case 'title': return title.trim().length >= 3;
      case 'category': return !!category;
      case 'description': return description.trim().length >= 10;
      case 'location': return location.trim().length > 0;
      case 'budget': {
        const a = parseInt(budgetMin), b = parseInt(budgetMax);
        return !isNaN(a) && !isNaN(b) && a >= 0 && b >= a;
      }
      case 'due': return true;
      case 'parental': return hasParentalApproval && parentName.trim().length > 0 && parentEmail.trim().length > 0;
      case 'review': return true;
    }
  };

  const advanceError = () => {
    switch (step.key) {
      case 'title': return 'Add a title of at least 3 characters.';
      case 'category': return 'Pick a category to continue.';
      case 'description': return 'Add a few more details (10+ characters).';
      case 'location': return 'Add a location.';
      case 'budget': return 'Enter a valid budget range (max ≥ min).';
      case 'parental': return 'Parent name, email, and approval are required.';
      default: return 'Please complete this step.';
    }
  };

  const next = () => {
    if (!canAdvance()) {
      toast.error(advanceError()!);
      return;
    }
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const jumpTo = (key: StepKey) => {
    const idx = steps.findIndex((s) => s.key === key);
    if (idx >= 0) {
      setDirection(idx > stepIndex ? 1 : -1);
      setStepIndex(idx);
    }
  };

  const handleSubmit = async () => {
    if (isYoungNeighbor && (!hasParentalApproval || !parentName.trim() || !parentEmail.trim())) {
      toast.error('Parental approval and contact info are required to post.');
      jumpTo('parental');
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

      const moderationResult = await moderateTask(title, description, category, isYoungNeighbor);
      if (!moderationResult.allowed) {
        const severityLabel = moderationResult.severity === 'high' ? '🚫 Content Blocked' : '⚠️ Content Flagged';
        toast.error(`${severityLabel}: ${moderationResult.reason || 'This content violates our community guidelines.'}`);
        setLoading(false);
        return;
      }

      let finalDescription = description;
      if (isYoungNeighbor) {
        const approvalData = {
          parentName: parentName.trim(),
          parentEmail: parentEmail.trim(),
          timestamp: new Date().toISOString(),
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

  const Icon = step.icon;
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <>
      <SEO
        title="Post a task — Taskfy"
        description="Tell your neighborhood what you need help with. Post a task on Taskfy in under a minute and get offers from local, verified helpers near you."
        path="/post-task"
      />
      <Navbar />
      <DecorativeCircles />
      <div className="min-h-screen bg-background" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)', paddingBottom: '5rem' }}>
        <div className="container mx-auto px-4 max-w-2xl">
          <header className="text-center mb-8">
            <h1 className="editorial-headline text-4xl lg:text-5xl mb-3">
              Post a <em className="italic font-light text-primary">task</em>
            </h1>
            <p className="font-body text-muted-foreground max-w-md mx-auto">
              A few quick questions and your neighbors will see your task.
            </p>
            {isYoungNeighbor && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-sm text-amber-700 dark:text-amber-300">
                <Users className="w-4 h-4" />
                Young Neighbor — parental approval required
              </div>
            )}
          </header>

          <Card className="w-full glass-card border-2 overflow-hidden">
            <div className="px-6 pt-6 pb-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Step {stepIndex + 1} of {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            <CardContent className="pt-6 pb-8 min-h-[420px]">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={step.key}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <motion.div
                      initial={{ scale: 0.6, rotate: -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
                    >
                      <Icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">{step.subtitle}</p>
                  </div>

                  <div className="pt-2">
                    {step.key === 'title' && (
                      <div className="max-w-md mx-auto space-y-2">
                        <Label htmlFor="title" className="sr-only">Title</Label>
                        <Input
                          id="title"
                          autoFocus
                          placeholder="e.g., Mow my lawn this weekend"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && next()}
                          className="text-center text-lg h-14"
                        />
                      </div>
                    )}

                    {step.key === 'category' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((c) => {
                          const active = category === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => setCategory(c.name)}
                              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 transition-all ${
                                active
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border hover:border-primary/40 hover:bg-accent/40'
                              }`}
                            >
                              <span className="text-2xl">{c.emoji}</span>
                              <span className="text-sm font-medium">{c.name}</span>
                              {active && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {step.key === 'description' && (
                      <div className="space-y-2">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAIDescription}
                            disabled={aiLoading === 'description'}
                            className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {aiLoading === 'description' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            Help me write it
                          </button>
                        </div>
                        <textarea
                          autoFocus
                          placeholder="Describe what you need, when, and any details that matter…"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={6}
                          className="w-full bg-card rounded-xl border-2 border-border focus:border-primary/40 outline-none px-4 py-3 text-base resize-none transition-colors"
                        />
                      </div>
                    )}

                    {step.key === 'location' && (
                      <div className="max-w-md mx-auto">
                        <Input
                          autoFocus
                          placeholder="e.g., Arlington Heights, IL"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && next()}
                          className="text-center text-lg h-14"
                        />
                      </div>
                    )}

                    {step.key === 'budget' && (
                      <div className="space-y-4 max-w-md mx-auto">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAIPricing}
                            disabled={aiLoading === 'pricing'}
                            className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {aiLoading === 'pricing' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <DollarSign className="w-3 h-3" />
                            )}
                            Suggest a price
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Min ($)</Label>
                            <Input
                              type="number"
                              placeholder="20"
                              value={budgetMin}
                              onChange={(e) => setBudgetMin(e.target.value)}
                              min={0}
                              className="h-12 text-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max ($)</Label>
                            <Input
                              type="number"
                              placeholder="50"
                              value={budgetMax}
                              onChange={(e) => setBudgetMax(e.target.value)}
                              min={0}
                              className="h-12 text-lg"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          💬 Payment is coordinated directly with your helper — Taskfy doesn't handle money.
                        </p>
                      </div>
                    )}

                    {step.key === 'due' && (
                      <div className="max-w-xs mx-auto space-y-2">
                        <Label className="text-xs">Due date (optional)</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-12 text-base"
                        />
                        {dueDate && (
                          <button
                            type="button"
                            onClick={() => setDueDate('')}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear date
                          </button>
                        )}
                      </div>
                    )}

                    {step.key === 'parental' && (
                      <div className="space-y-3 max-w-md mx-auto">
                        <Input
                          placeholder="Parent name"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          className="h-12"
                        />
                        <Input
                          type="email"
                          placeholder="Parent email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          className="h-12"
                        />
                        <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer p-3 border-2 rounded-xl hover:border-primary/40 transition-colors">
                          <input
                            type="checkbox"
                            checked={hasParentalApproval}
                            onChange={(e) => setHasParentalApproval(e.target.checked)}
                            className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span>I confirm a parent or guardian has approved this task.</span>
                        </label>
                      </div>
                    )}

                    {step.key === 'review' && (
                      <div className="space-y-3 max-w-md mx-auto">
                        {[
                          { label: 'Title', value: title || '—', key: 'title' as StepKey },
                          { label: 'Category', value: category || '—', key: 'category' as StepKey },
                          { label: 'Description', value: description ? (description.length > 80 ? description.slice(0, 80) + '…' : description) : '—', key: 'description' as StepKey },
                          { label: 'Location', value: location || '—', key: 'location' as StepKey },
                          { label: 'Budget', value: budgetMin && budgetMax ? `$${budgetMin} – $${budgetMax}` : '—', key: 'budget' as StepKey },
                          { label: 'Due date', value: dueDate || 'Flexible', key: 'due' as StepKey },
                        ].map((row) => (
                          <div key={row.label} className="flex items-start justify-between gap-3 rounded-xl border bg-card/50 p-3 text-sm">
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">{row.label}</div>
                              <div className="font-medium truncate">{row.value}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => jumpTo(row.key)}
                              className="text-xs text-primary hover:underline shrink-0"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl px-4 py-3">
                          <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                          <span>
                            All postings are reviewed by AI for community safety.
                            {isYoungNeighbor && <strong> Stricter rules apply for Young Neighbors.</strong>}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20">
              <Button variant="ghost" onClick={back} disabled={stepIndex === 0 || loading}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step.key === 'review' ? (
                <Button onClick={handleSubmit} disabled={loading || isModeratingContent} className="min-w-[160px]">
                  {(loading || isModeratingContent) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isModeratingContent ? 'Checking safety…' : 'Post task'}
                </Button>
              ) : (
                <Button onClick={next} disabled={!canAdvance()} className="min-w-[120px]">
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
