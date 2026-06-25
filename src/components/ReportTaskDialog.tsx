import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sanitizeTextMax } from '@/lib/sanitize';
import { useContentModeration } from '@/hooks/useContentModeration';

interface ReportTaskDialogProps {
  taskId: string;
}

export function ReportTaskDialog({ taskId }: ReportTaskDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { moderateText, isChecking } = useContentModeration();

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to report a task');
      navigate('/auth');
      return;
    }
    setLoading(true);
    try {
      const cleanReason = sanitizeTextMax(reason, 1000);
      if (cleanReason && cleanReason.trim().length > 0) {
        const check = await moderateText(cleanReason, 'Task report reason');
        if (!check.allowed) {
          toast.warning(check.reason || 'Please rephrase your report — keep it factual and respectful.');
          setLoading(false);
          return;
        }
      }
      const { error } = await supabase.from('task_reports' as any).insert({
        task_id: taskId,
        reporter_id: user.id,
        reason: cleanReason || null,
      });
      if (error) {
        if (error.code === '23505') {
          toast.info("You've already reported this task. Our team will review it.");
        } else {
          throw error;
        }
      } else {
        toast.success('Report submitted. Thanks for keeping the community safe.');
      }
      setOpen(false);
      setReason('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this task</DialogTitle>
          <DialogDescription>
            Flag this task for admin review if it violates our community guidelines
            (scam, explicit content, harassment, unsafe for minors, etc.).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="report-reason">Reason (optional)</Label>
          <Textarea
            id="report-reason"
            placeholder="Tell us what's wrong with this task…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
