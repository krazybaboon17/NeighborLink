import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
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

  const copyZelle = async () => {
    await navigator.clipboard.writeText(zelleId);
    setCopied(true);
    toast.success('Zelle ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay {helperName} via Zelle</DialogTitle>
          <DialogDescription>
            This helper is under 18, so payment is handled directly via Zelle (Stripe Connect requires age 18+).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-accent">${amount}</span></div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Zelle</span>
              <div className="flex items-center gap-2">
                <code className="text-sm">{zelleId}</code>
                <Button size="icon" variant="ghost" onClick={copyZelle}>
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Open your bank's Zelle, send ${amount} to the address above, then click "I've Paid".
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onPaymentDone}>I've Paid</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
