import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ZellePaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zelleId: string;
  amount: number;
  helperName: string;
  onPaymentDone: () => void;
}

export function ZellePayment({ open, onOpenChange, zelleId, amount, helperName, onPaymentDone }: ZellePaymentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(zelleId);
      setCopied(true);
      toast.success('Zelle ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
            Pay {helperName} via Zelle
          </DialogTitle>
          <DialogDescription className="text-center">
            Send ${amount} to {helperName} using your banking app's Zelle feature
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-full p-4 bg-muted rounded-xl text-center space-y-2">
            <p className="text-sm text-muted-foreground">Send Zelle payment to:</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-bold text-foreground break-all">{zelleId}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-primary">${amount}</p>
          </div>

          <div className="w-full p-3 bg-accent/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Open your banking app (Chase, Bank of America, Wells Fargo, etc.), go to Zelle, and send ${amount} to the ID above.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onPaymentDone} className="w-full bg-green-600 hover:bg-green-700">
            I've Completed the Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
