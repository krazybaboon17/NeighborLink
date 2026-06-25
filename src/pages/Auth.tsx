import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, MapPin, Users } from 'lucide-react';
import { z } from 'zod';
import { OnboardingQuestions } from '@/components/OnboardingQuestions';
import { lovable } from '@/integrations/lovable';
import { motion } from 'framer-motion';
import { FloatingBubbles } from '@/components/ui/FloatingBubbles';

const signUpSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255),
  password: z.string().min(6, 'Password should be at least 6 characters').max(72, 'Password is too long (max 72 characters)'),
  fullName: z.string().trim().min(2, 'Please enter your full name').max(100, 'Name is too long (max 100 characters)')
});

const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password')
});

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const consumeRedirect = (fallback: string = '/tasks') => {
    const target = sessionStorage.getItem('postAuthRedirect');
    if (target) {
      sessionStorage.removeItem('postAuthRedirect');
      return target;
    }
    return fallback;
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || showOnboarding) return;

      // Retry to give the handle_new_user trigger time to insert the profile row.
      let profile: any = null;
      for (let i = 0; i < 4; i++) {
        const { data } = await supabase
          .from('profiles')
          .select('age, current_state')
          .eq('id', user.id)
          .maybeSingle();
        if (data) { profile = data; break; }
        await new Promise((r) => setTimeout(r, 400));
      }

      const incomplete = !profile || !profile.age || !profile.current_state;
      if (incomplete) {
        setNewUserId(user.id);
        setShowOnboarding(true);
      } else {
        navigate(consumeRedirect());
      }
    };
    checkOnboarding();
  }, [user, navigate, showOnboarding]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!acceptedTerms) {
      toast.error('Please accept the Terms of Service and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    const validation = signUpSchema.safeParse({ email, password, fullName });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      const { data, error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: validation.data.fullName },
        },
      });

      if (error) throw error;

      // If email confirmation is required, the session is null. Tell user to confirm.
      if (!data.session) {
        toast.success('Account created! Please check your email to confirm, then sign in.');
      } else if (data.user) {
        // Auto-confirm enabled — user is signed in. Let the useEffect below
        // handle showing onboarding once the profile row exists, so we don't
        // race with the handle_new_user trigger and force the form to appear twice.
        toast.success('Account created!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in');
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('age, current_state')
          .eq('id', data.user.id)
          .maybeSingle();

        const incomplete = !profile || !profile.age || !profile.current_state;
        if (incomplete) {
          setNewUserId(data.user.id);
          setShowOnboarding(true);
          toast.success('Welcome back! Please complete your profile.');
        } else {
          toast.success('Welcome back!');
          navigate(consumeRedirect());
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error signing in with Google');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Check your email for a password reset link');
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Error sending reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate(consumeRedirect());
  };

  if (showOnboarding && newUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <OnboardingQuestions userId={newUserId} onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      <SEO
        title="Sign in or sign up — Taskify"
        description="Create your free Taskify account to post tasks, send offers, and connect with verified neighbors in Arlington Heights and Buffalo Grove."
        path="/auth"
      />

      {/* Aurora background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-secondary/30 blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[360px] w-[360px] rounded-full bg-accent/20 blur-[120px]" />
      </div>
      <FloatingBubbles />

      <div className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center relative z-10">
        {/* Left: brand pane (desktop) */}
        <motion.aside
          className="hidden lg:flex flex-col gap-8 pr-4"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-border/70 bg-background/70 backdrop-blur-xl px-3 py-2 shadow-lg shadow-primary/5 ring-1 ring-inset ring-white/5">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-background to-secondary/15 border border-border/60">
              <CommunityMark className="h-6 w-6 text-primary" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight pr-1">Taskify</span>
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              Your local marketplace for getting things done
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
              Welcome to the <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">neighborhood</span>.
            </h1>
            <p className="text-muted-foreground text-base max-w-md leading-relaxed">
              Post a task in minutes, get offers from verified neighbors nearby, and pay how you want — all in one trusted, friendly place.
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            {[
              { icon: ShieldCheck, label: 'Verified neighbors & safety-first design' },
              { icon: MapPin, label: 'Built for Arlington Heights & Buffalo Grove' },
              { icon: Users, label: 'Real help from real people you can trust' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-foreground/80">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </motion.aside>

        {/* Right: auth card */}
        <motion.div
          className="w-full max-w-md mx-auto lg:mx-0"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <Card className="glass-card border border-border/60 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-2 lg:hidden">
              <motion.div
                className="flex justify-center mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 15 }}
              >
                <div className="inline-flex items-center gap-2.5 rounded-2xl border border-border/70 bg-background/70 backdrop-blur-xl px-3 py-2 shadow-lg shadow-primary/5 ring-1 ring-inset ring-white/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 via-background to-secondary/15 border border-border/60">
                    <CommunityMark className="h-5 w-5 text-primary" />
                  </span>
                  <span className="font-display text-base font-semibold tracking-tight pr-1">Taskify</span>
                </div>
              </motion.div>
              <CardTitle className="font-display text-2xl tracking-tight">Welcome to Taskify</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1.5 text-xs">
                <Sparkles className="w-3 h-3 text-primary" />
                Your local marketplace for getting things done
              </CardDescription>
            </CardHeader>

            <CardHeader className="hidden lg:block pb-2">
              <CardTitle className="font-display text-2xl tracking-tight">Sign in to Taskify</CardTitle>
              <CardDescription>Welcome back — let's get something done today.</CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              {showForgotPassword ? (
                <motion.form
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a reset link.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-9 h-11"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl" disabled={resetLoading}>
                    {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send reset link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to sign in
                  </Button>
                </motion.form>
              ) : (
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-1 rounded-xl bg-muted/60">
                    <TabsTrigger value="signin" className="rounded-lg data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <motion.form
                      onSubmit={handleSignIn}
                      className="space-y-4"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-11 rounded-xl group" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign in
                        {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                      </Button>
                    </motion.form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <motion.form
                      onSubmit={handleSignUp}
                      className="space-y-4"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full name</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signup-name" type="text" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9 h-11" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signup-password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 h-11" required minLength={6} />
                        </div>
                      </div>
                      <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <span>
                          I agree to Taskify's{' '}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Terms of Service</a>{' '}
                          and{' '}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Privacy Policy</a>.
                        </span>
                      </label>
                      <Button type="submit" className="w-full h-11 rounded-xl group" disabled={loading || !acceptedTerms}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create account
                        {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                      </Button>
                    </motion.form>
                  </TabsContent>
                </Tabs>
              )}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.18em]">
                  <span className="bg-card/80 backdrop-blur px-3 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button variant="outline" type="button" className="w-full h-11 rounded-xl border-border/60 bg-background/60 hover:bg-background backdrop-blur" onClick={handleGoogleSignIn} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-[11px] text-muted-foreground">
                By continuing, you agree to our{' '}
                <a href="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</a> and{' '}
                <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
