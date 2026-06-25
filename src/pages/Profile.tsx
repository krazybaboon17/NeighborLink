import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Loader2, Star, Sparkles, Wand2, ShieldCheck, Users, AlertTriangle,
  Camera, CheckCircle2, Pencil, Trophy, Briefcase, Cake,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { YoungNeighborBadge } from '@/components/YoungNeighborBadge';
import { UnverifiedBadge } from '@/components/UnverifiedBadge';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { SKILLS, CURRENT_STATES } from '@/components/OnboardingQuestions';
import { SEO } from '@/components/SEO';
import { useContentModeration } from '@/hooks/useContentModeration';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(100, 'Name is too long (max 100 characters)'),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [isYoungNeighbor, setIsYoungNeighbor] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Editable preferences
  const [age, setAge] = useState<string>('');
  const [currentState, setCurrentState] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, rating, completed_tasks, is_young_neighbor, bio, skills, verified, age, current_state')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      setFullName(data?.full_name || '');
      setAvatarUrl(data?.avatar_url || null);
      setRating(data?.rating || null);
      setCompletedTasks(data?.completed_tasks || 0);
      setIsYoungNeighbor(data?.is_young_neighbor || false);
      setBio(data?.bio || '');
      setSkills(data?.skills || []);
      setIsVerified(data?.verified || false);
      setAge(data?.age ? String(data.age) : '');
      setCurrentState((data as any)?.current_state || '');
    } catch (err: any) {
      console.error('Error loading profile:', err);
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      if (f.size > MAX_FILE_SIZE) { toast.error('File size must be less than 5MB'); return; }
      if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) { toast.error('Only JPEG, PNG, and WebP images are allowed'); return; }
    }
    setAvatarFile(f);
  };

  const handleAIBio = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { type: 'generate-bio', data: { fullName, skills, completedTasks, rating, isYoungNeighbor } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.result) { setBio(data.result); toast.success('AI bio generated!'); }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate bio');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validation = profileSchema.safeParse({ fullName });
    if (!validation.success) { toast.error(validation.error.errors[0].message); return; }

    setSubmitting(true);
    try {
      let publicUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
        if (uploadErr) { toast.error('Failed to upload avatar'); setSubmitting(false); return; }
        const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(filePath);
        publicUrl = urlData?.publicUrl || null;
      }
      const { error } = await supabase.from('profiles').update({
        full_name: validation.data.fullName,
        avatar_url: publicUrl,
        bio,
      } as any).eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated');
      setAvatarFile(null);
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSkill = (s: string) => {
    setSkills((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const savePreferences = async () => {
    const n = parseInt(age);
    if (isNaN(n) || n < 13 || n > 120) { toast.error('Please enter a valid age (13–120)'); return; }
    if (!currentState) { toast.error('Pick what describes you best'); return; }
    setSavingPrefs(true);
    try {
      const { error } = await supabase.from('profiles').update({
        age: n,
        current_state: currentState,
        skills: skills.length ? skills : null,
        is_young_neighbor: n < 18,
      } as any).eq('id', user!.id);
      if (error) throw error;
      setIsYoungNeighbor(n < 18);
      toast.success('Preferences saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    </>
  );

  const currentStateLabel = CURRENT_STATES.find(s => s.value === currentState)?.label;

  return (
    <>
      <SEO
        title="Your profile — Taskify"
        description="Manage your Taskify profile, contact preferences, verification status, and reviews from neighbors you've helped or hired."
        path="/profile"
      />
      <Navbar />
      <div className="min-h-screen bg-transparent pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          {/* Hero header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card border-2 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary/30 via-primary/15 to-accent/20" />
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-background bg-muted flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <label htmlFor="avatar" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform">
                      <Pencil className="w-4 h-4" />
                      <input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                  <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
                    <h1 className="text-2xl font-bold">{fullName || 'Your profile'}</h1>
                    <p className="text-sm text-muted-foreground">{currentStateLabel || 'Tell us a bit about yourself below'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isVerified ? <UnverifiedBadge /> : isYoungNeighbor ? <YoungNeighborBadge /> : (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 py-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Adult
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stat strip */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <Stat icon={<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />} label="Rating" value={rating !== null && rating > 0 ? rating.toFixed(1) : '—'} />
                  <Stat icon={<Trophy className="w-4 h-4 text-primary" />} label="Completed" value={String(completedTasks)} />
                  <Stat icon={<Briefcase className="w-4 h-4 text-primary" />} label="Skills" value={String(skills.length)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Basics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle className="text-xl">Basics</CardTitle>
                <CardDescription>Name, bio, and how others see you.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bio">Bio</Label>
                      <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary/80" onClick={handleAIBio} disabled={aiLoading}>
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        AI Generate
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1"><Sparkles className="w-2 h-2" /></Badge>
                      </Button>
                    </div>
                    <Textarea id="bio" placeholder="Tell neighbors about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                  </div>
                  {avatarFile && (
                    <p className="text-xs text-muted-foreground">New avatar selected — click Save to upload.</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save changes
                    </Button>
                    <Button variant="outline" type="button" onClick={() => navigate('/tasks')}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences (the survey answers, now editable) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle className="text-xl">Your preferences</CardTitle>
                <CardDescription>The answers from your sign-up survey. Update them anytime.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="flex items-center gap-2"><Cake className="w-4 h-4 text-primary" /> Age</Label>
                    <Input id="age" type="number" min={13} max={120} value={age} onChange={(e) => setAge(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Under 18 enables Young Neighbor protections.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCircle2Icon /> What describes you</Label>
                    <div className="grid gap-1.5 max-h-[160px] overflow-auto pr-1">
                      {CURRENT_STATES.map((s) => {
                        const active = currentState === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setCurrentState(s.value)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                          >
                            <span>{s.emoji}</span>
                            <span className="flex-1">{s.label}</span>
                            {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Skills you can offer</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SKILLS.map((s) => {
                      const active = skills.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSkill(s)}
                          className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-all ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                        >
                          <Checkbox checked={active} className="pointer-events-none" />
                          <span className="flex-1">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={savePreferences} disabled={savingPrefs}>
                    {savingPrefs ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Young Neighbor info */}
          {isYoungNeighbor && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Young Neighbor Status</CardTitle>
                      <CardDescription>Extra safety measures for our younger members</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    As a Young Neighbor, you can still post and accept tasks! However, for your safety,
                    <strong> every task requires parental or guardian approval</strong>.
                  </p>
                  <div className="flex items-start gap-3 p-4 bg-background/50 rounded-xl border border-amber-500/10">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      When you post a task or make an offer, you'll be asked to provide your parent's name
                      and email. We'll include this information with your task for transparency and safety.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card/40 p-3 flex flex-col gap-1 items-start">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function UserCircle2Icon() {
  return <Users className="w-4 h-4 text-primary" />;
}
