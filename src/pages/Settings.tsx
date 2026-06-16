import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useBrowserPush } from '@/hooks/useBrowserPush';
import { useTheme, ThemeMode } from '@/hooks/useTheme';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Bell, Shield, Palette, User, FileText, LogOut, Trash2, Sun, Moon, Monitor,
  Lock, Mail, MessageSquare, ExternalLink, Loader2, ChevronRight, Heart,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { supported, permission, request } = useBrowserPush();
  const { mode, setMode } = useTheme();
  const [verifiedOnly, setVerifiedOnly] = useLocalStorage('tasks.verifiedOnly', false);
  const [reduceMotion, setReduceMotion] = useLocalStorage('settings.reduceMotion', false);
  const [emailFreq, setEmailFreq] = useLocalStorage<'instant' | 'daily' | 'off'>('settings.emailFreq', 'instant');

  const [preferVerifiedOnlyDb, setPreferVerifiedOnlyDb] = useState(false);
  const [loadingPref, setLoadingPref] = useState(true);
  const [savingPref, setSavingPref] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resettingPw, setResettingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    setResetEmail(user.email || '');
    (async () => {
      try {
        const { data } = await supabase.from('profiles').select('prefer_verified_only').eq('id', user.id).single();
        setPreferVerifiedOnlyDb(!!(data as any)?.prefer_verified_only);
      } finally { setLoadingPref(false); }
    })();
  }, [user]);

  // Apply reduce-motion as a class hook on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  const togglePreferVerified = async (val: boolean) => {
    if (!user) return;
    setSavingPref(true);
    setPreferVerifiedOnlyDb(val);
    try {
      const { error } = await supabase.from('profiles').update({ prefer_verified_only: val } as any).eq('id', user.id);
      if (error) throw error;
      toast.success(val ? 'Now showing verified helpers first' : 'Showing all helpers');
    } catch (err: any) {
      setPreferVerifiedOnlyDb(!val);
      toast.error(err.message || 'Failed to update');
    } finally { setSavingPref(false); }
  };

  const sendPasswordReset = async () => {
    if (!resetEmail) return;
    setResettingPw(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally { setResettingPw(false); }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete profile row — cascades to user content via FKs where set up.
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      toast.success('Profile deleted. Signing you out…');
      await signOut();
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account. Contact support@taskfy.app');
    } finally { setDeleting(false); }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-transparent pt-[calc(env(safe-area-inset-top)+5rem)] pb-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground">Notifications, privacy, appearance, and account.</p>
            </div>
          </motion.div>

          {/* Account */}
          <Section icon={<User className="w-4 h-4" />} title="Account" description="Your sign-in details and password.">
            <Row label="Email" hint="The address you sign in with.">
              <span className="text-sm font-medium">{user?.email}</span>
            </Row>
            <Row label="Password" hint="We'll email you a secure reset link.">
              <Button variant="outline" size="sm" onClick={sendPasswordReset} disabled={resettingPw}>
                {resettingPw ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
                Send reset link
              </Button>
            </Row>
            <Row label="Profile details" hint="Name, bio, avatar, and survey answers.">
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                Open profile <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Row>
          </Section>

          {/* Notifications */}
          <Section icon={<Bell className="w-4 h-4" />} title="Notifications" description="Choose how you hear about new messages and offers.">
            <Row
              label="Browser push notifications"
              hint={
                !supported ? 'Not supported in this browser.' :
                permission === 'granted' ? 'On — you\'ll see a desktop alert when this tab is open.' :
                permission === 'denied' ? 'Blocked. Enable from your browser site settings.' :
                'Off — click Enable to get desktop alerts.'
              }
            >
              <Button
                variant={permission === 'granted' ? 'outline' : 'default'}
                size="sm"
                disabled={!supported || permission === 'denied' || permission === 'granted'}
                onClick={request}
              >
                {permission === 'granted' ? 'Enabled' : 'Enable'}
              </Button>
            </Row>
            <Row label="Email notifications" hint="How often we email you about activity.">
              <div className="flex gap-1">
                {(['instant', 'daily', 'off'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setEmailFreq(opt)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors capitalize ${
                      emailFreq === opt ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >{opt}</button>
                ))}
              </div>
            </Row>
            <Row label="Open inbox" hint="Jump into your conversations.">
              <Button variant="ghost" size="sm" onClick={() => navigate('/conversations')}>
                <MessageSquare className="w-4 h-4 mr-1" /> Messages
              </Button>
            </Row>
          </Section>

          {/* Privacy & Safety */}
          <Section icon={<Shield className="w-4 h-4" />} title="Privacy & Safety" description="Control who you match with and what we share.">
            <Row label="Prefer verified helpers" hint="When on, verified helpers show first on offers and matches.">
              <Switch
                checked={preferVerifiedOnlyDb}
                onCheckedChange={togglePreferVerified}
                disabled={loadingPref || savingPref}
              />
            </Row>
            <Row label="Hide unverified tasks on listings" hint="Filter task listings to verified posters only.">
              <Switch checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
            </Row>
            <Row label="Identity verification" hint="Confirm you're a real person to unlock the Verified badge.">
              <Button variant="outline" size="sm" onClick={() => navigate('/verify')}>
                Verify identity <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Row>
            <Row label="Privacy policy" hint="How we handle your data.">
              <Button asChild variant="ghost" size="sm">
                <Link to="/privacy">Read <ExternalLink className="w-3.5 h-3.5 ml-1" /></Link>
              </Button>
            </Row>
          </Section>

          {/* Appearance */}
          <Section icon={<Palette className="w-4 h-4" />} title="Appearance" description="Light, dark, or match your system.">
            <Row label="Theme" hint="Switch between light, dark, and system.">
              <div className="flex gap-1">
                {([
                  { v: 'light', icon: Sun, label: 'Light' },
                  { v: 'dark', icon: Moon, label: 'Dark' },
                  { v: 'system', icon: Monitor, label: 'System' },
                ] as { v: ThemeMode; icon: any; label: string }[]).map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    onClick={() => setMode(v)}
                    className={`px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors ${
                      mode === v ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Reduce motion" hint="Tone down animations across the app.">
              <Switch checked={reduceMotion} onCheckedChange={(v) => setReduceMotion(!!v)} />
            </Row>
            <Row label="Replay welcome tour" hint="Walk through the app's main features again.">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user) localStorage.removeItem(`taskfy.tour.v1.${user.id}`);
                  window.dispatchEvent(new Event('taskfy:start-tour'));
                  toast.success('Starting the tour…');
                }}
              >
                Start tour
              </Button>
            </Row>
          </Section>


          {/* About & Legal */}
          <Section icon={<FileText className="w-4 h-4" />} title="About & Support" description="Learn more, get help, or reach out.">
            <LinkRow to="/features" label="Features" />
            <LinkRow to="/contact" label="Contact support" />
            <LinkRow to="/terms" label="Terms of Service" />
            <LinkRow to="/privacy" label="Privacy Policy" />
            <Row label="Made with" hint="Built for neighbors in Arlington Heights & Buffalo Grove.">
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="w-3.5 h-3.5 text-[#B22234]" /> Taskfy
              </span>
            </Row>
          </Section>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Trash2 className="w-4 h-4" /> Danger zone
              </CardTitle>
              <CardDescription>Sign out or permanently delete your Taskfy profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes your profile, tasks, offers, and messages from Taskfy.
                        This action can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                        {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-xs text-muted-foreground">
                Need help instead? <Link to="/contact" className="underline">Contact support</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="glass-card border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/60">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function LinkRow({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group">
      <span className="text-sm font-medium group-hover:text-primary transition-colors">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
