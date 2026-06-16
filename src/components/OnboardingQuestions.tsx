import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Cake,
  UserCircle2,
  Sparkles,
  PartyPopper,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingQuestionsProps {
  userId: string;
  onComplete: () => void;
}

export const SKILLS = [
  'Lawn Care & Gardening', 'Snow Removal', 'Moving & Heavy Lifting', 'Grocery Shopping',
  'Home Repairs', 'Babysitting', 'Pet Care', 'Cleaning', 'Tech Help', 'Errands',
];

export const CURRENT_STATES = [
  { value: 'student', label: 'Student looking for flexible work', emoji: '🎓' },
  { value: 'homeowner', label: 'Homeowner needing help with tasks', emoji: '🏡' },
  { value: 'both', label: 'Both — I post and complete tasks', emoji: '🤝' },
  { value: 'part_time', label: 'Part-time worker seeking extra income', emoji: '💼' },
  { value: 'retired', label: 'Retired and want to stay active', emoji: '🌿' },
  { value: 'community', label: 'Want to help my community', emoji: '❤️' },
];

type StepKey = 'age' | 'state' | 'skills' | 'review';

const STEPS: { key: StepKey; title: string; subtitle: string; icon: any }[] = [
  { key: 'age', title: "Let's get to know you", subtitle: 'First — how old are you?', icon: Cake },
  { key: 'state', title: 'What brings you here?', subtitle: 'Pick the one that fits you best.', icon: UserCircle2 },
  { key: 'skills', title: 'What can you do?', subtitle: 'Choose any skills you can offer neighbors. Skip if unsure.', icon: Sparkles },
  { key: 'review', title: "You're all set!", subtitle: 'Quick look before we save.', icon: PartyPopper },
];

export function OnboardingQuestions({ userId, onComplete }: OnboardingQuestionsProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [age, setAge] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const canAdvance = () => {
    if (step.key === 'age') {
      const n = parseInt(age);
      return !isNaN(n) && n >= 13 && n <= 120;
    }
    if (step.key === 'state') return !!currentState;
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      if (step.key === 'age') toast.error('Please enter a valid age (13–120)');
      if (step.key === 'state') toast.error('Please pick an option to continue');
      return;
    }
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const back = () => {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleSubmit = async () => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      toast.error('Please enter a valid age');
      setStepIndex(0);
      return;
    }
    setLoading(true);
    try {
      const isYoungNeighbor = ageNum < 18;
      const { error } = await supabase
        .from('profiles')
        .update({
          age: ageNum,
          current_state: currentState,
          skills: selectedSkills.length > 0 ? selectedSkills : null,
          is_young_neighbor: isYoungNeighbor,
        } as any)
        .eq('id', userId);
      if (error) throw error;
      toast.success(isYoungNeighbor ? 'Welcome, Young Neighbor!' : 'Profile setup complete!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
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
    <Card className="w-full max-w-lg mx-auto glass-card border-2 overflow-hidden">
      <div className="px-6 pt-6 pb-2 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {stepIndex + 1} of {STEPS.length}</span>
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
              {step.key === 'age' && (
                <div className="max-w-[180px] mx-auto space-y-2">
                  <Label htmlFor="age" className="sr-only">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    autoFocus
                    placeholder="18"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                    min={13}
                    max={120}
                    className="text-center text-3xl font-semibold h-16"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Users under 18 get Young Neighbor protections.
                  </p>
                </div>
              )}

              {step.key === 'state' && (
                <div className="grid gap-2">
                  {CURRENT_STATES.map((s) => {
                    const active = currentState === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setCurrentState(s.value)}
                        className={`group flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/40 hover:bg-accent/40'
                        }`}
                      >
                        <span className="text-2xl">{s.emoji}</span>
                        <span className="flex-1 text-sm font-medium">{s.label}</span>
                        {active && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {step.key === 'skills' && (
                <div className="grid grid-cols-2 gap-2">
                  {SKILLS.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all ${
                          active
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Checkbox checked={active} className="pointer-events-none" />
                        <span className="flex-1">{skill}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step.key === 'review' && (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-card/50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-medium">{age || '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">Role</span><span className="font-medium text-right">{CURRENT_STATES.find(s => s.value === currentState)?.label || '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">Skills</span><span className="font-medium text-right">{selectedSkills.length ? `${selectedSkills.length} selected` : 'None'}</span></div>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-foreground/80">
                    💬 Payment is handled off-app — once you accept an offer, head to Messages to coordinate directly.
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
          <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px]">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Finish
          </Button>
        ) : (
          <Button onClick={next} disabled={!canAdvance()} className="min-w-[120px]">
            {step.key === 'skills' ? 'Continue' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </Card>
  );
}
