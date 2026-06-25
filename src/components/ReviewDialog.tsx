import { useState } from 'react';
import { z } from 'zod';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useContentModeration } from '@/hooks/useContentModeration';

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000, 'Comment is too long (max 1000 chars)').optional(),
});

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  submitting?: boolean;
  onSubmit: (rating: number, comment: string) => Promise<void> | void;
}

export function ReviewDialog({
  open, onOpenChange, title = 'Leave a review', description = 'Help build trust in the community.',
  submitting, onSubmit,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const { moderateText, isChecking } = useContentModeration();

  const handleSubmit = async () => {
    const parsed = reviewSchema.safeParse({ rating, comment: comment || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (comment.trim().length > 0) {
      const check = await moderateText(comment, 'Review comment');
      if (!check.allowed) {
        toast.warning(check.reason || 'Please rephrase your review to keep it respectful.');
        return;
      }
    }
    await onSubmit(rating, comment);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hover ?? rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(null)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star className={`w-9 h-9 transition-colors ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment (optional)</Label>
            <Textarea
              id="review-comment"
              placeholder="How was the experience?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || isChecking}>
            {(submitting || isChecking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
