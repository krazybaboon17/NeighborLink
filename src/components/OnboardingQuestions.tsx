import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface OnboardingQuestionsProps {
  userId: string;
  onComplete: () => void;
}

const SKILLS = [
  'Lawn Care & Gardening', 'Snow Removal', 'Moving & Heavy Lifting', 'Grocery Shopping',
  'Home Repairs', 'Babysitting', 'Pet Care', 'Cleaning', 'Tech Help', 'Errands',
];

const CURRENT_STATES = [
  { value: 'student', label: 'Student looking for flexible work' },
  { value: 'homeowner', label: 'Homeowner needing help with tasks' },
  { value: 'both', label: 'Both - I post and complete tasks' },
  { value: 'part_time', label: 'Part-time worker seeking extra income' },
  { value: 'retired', label: 'Retired and want to stay active' },
  { value: 'community', label: 'Want to help my community' },
];

export function OnboardingQuestions({ userId, onComplete }: OnboardingQuestionsProps) {
  const [age, setAge] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSubmit = async () => {
    if (!age || !currentState) {
      toast.error('Please answer all required questions');
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      toast.error('Please enter a valid age (13-120)');
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

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Let's get to know you!</CardTitle>
        <CardDescription>A few quick questions to personalize your experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="age" className="text-base font-medium">
            How old are you? <span className="text-destructive">*</span>
          </Label>
          <Input id="age" type="number" placeholder="Enter your age" value={age} onChange={(e) => setAge(e.target.value)} min={13} max={120} className="max-w-32" />
          <p className="text-xs text-muted-foreground">Users under 18 are marked as Young Neighbors with special protections</p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            What best describes you? <span className="text-destructive">*</span>
          </Label>
          <RadioGroup value={currentState} onValueChange={setCurrentState}>
            {CURRENT_STATES.map((state) => (
              <div key={state.value} className="flex items-center space-x-3">
                <RadioGroupItem value={state.value} id={state.value} />
                <Label htmlFor={state.value} className="font-normal cursor-pointer">{state.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-foreground/80">
          💬 Payment is handled off-app — once you accept an offer, go to Messages to coordinate payment directly with the other person.
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">What skills can you offer? (Optional)</Label>
          <p className="text-sm text-muted-foreground">Select skills to get personalized task recommendations</p>
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.map((skill) => (
              <div key={skill} className="flex items-center space-x-2">
                <Checkbox id={skill} checked={selectedSkills.includes(skill)} onCheckedChange={() => handleSkillToggle(skill)} />
                <Label htmlFor={skill} className="text-sm font-normal cursor-pointer">{skill}</Label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={loading || !age || !currentState}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Complete Setup
        </Button>
      </CardContent>
    </Card>
  );
}
