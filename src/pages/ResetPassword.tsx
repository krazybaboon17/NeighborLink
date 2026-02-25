import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, KeyRound, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { FloatingBubbles } from '@/components/ui/FloatingBubbles';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    } else {
      // No recovery token, redirect
      toast.error('Invalid or expired reset link');
      navigate('/auth');
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/tasks'), 2000);
    } catch (error: any) {
      toast.error(error.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      <FloatingBubbles />
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="glass-card border-2">
          <CardHeader className="text-center">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 15 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center glow-pulse">
                {success ? (
                  <CheckCircle className="text-primary-foreground w-7 h-7" />
                ) : (
                  <KeyRound className="text-primary-foreground w-7 h-7" />
                )}
              </div>
            </motion.div>
            <CardTitle className="text-2xl">
              {success ? 'Password Updated!' : 'Set New Password'}
            </CardTitle>
            <CardDescription>
              {success
                ? 'Redirecting you to the app...'
                : 'Enter your new password below'}
            </CardDescription>
          </CardHeader>
          {!success && (
            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
