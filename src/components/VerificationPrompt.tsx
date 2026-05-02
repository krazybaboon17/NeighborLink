import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldX, Camera, Check } from 'lucide-react';
import { toast } from 'sonner';

// Routes where we don't show the verification prompt
const EXCLUDED_ROUTES = ['/auth', '/verify'];

export function VerificationPrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user || hasChecked) {
        setLoading(false);
        return;
      }

      // Don't show on excluded routes
      if (EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route))) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('verified')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Show prompt if user is not verified
        if (profile && !profile.verified) {
          setShowPrompt(true);
        }

        setHasChecked(true);
      } catch (err) {
        console.error('Error checking verification status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [user, location.pathname, hasChecked]);

  const handleVerifyNow = () => {
    setShowPrompt(false);
    navigate('/verify');
  };

  const handleSkip = async () => {
    // User skips - they remain unverified
    toast.info('You can verify your identity anytime from your profile', {
      icon: <ShieldX className="h-4 w-4" />,
    });
    setShowPrompt(false);
  };

  if (loading || !showPrompt) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Verify Your Identity</DialogTitle>
          <DialogDescription className="text-center">
            Verified users build more trust in our community. Complete a quick face scan to verify your age and identity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Why verify?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" /> Get a verified badge on your profile
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" /> Build trust with task posters
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" /> Access age-appropriate tasks
              </li>
            </ul>
          </div>

          <Button onClick={handleVerifyNow} className="w-full" size="lg">
            <Camera className="mr-2 h-4 w-4" />
            Verify Now
          </Button>

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground"
          >
            Skip for now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can always verify later from your profile settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
