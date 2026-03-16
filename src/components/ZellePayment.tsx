import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign, Copy, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const PLATFORM_ZELLE_ID = '+13129658116';
const COMMISSION_RATE = 0.10;

interface ZellePaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zelleId: string;
  amount: number;
  helperName: string;
  onPaymentDone: () => void;
}

export function ZellePayment({ open, onOpenChange, zelleId, amount, helperName, onPaymentDone }: ZellePaymentProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [commissionPaid, setCommissionPaid] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState(false);
  const [copiedHelper, setCopiedHelper] = useState(false);

  const commissionAmount = Math.round(amount * COMMISSION_RATE * 100) / 100;

  const handleCopy = async (text: string, type: 'platform' | 'helper') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'platform') {
        setCopiedPlatform(true);
        setTimeout(() => setCopiedPlatform(false), 2000);
      } else {
        setCopiedHelper(true);
        setTimeout(() => setCopiedHelper(false), 2000);
      }
      toast.success('Zelle ID copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCommissionPaid = () => {
    setCommissionPaid(true);
    toast.success('Commission marked as paid! You can now proceed.');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state on close
      setStep(1);
      setCommissionPaid(false);
      setCopiedPlatform(false);
      setCopiedHelper(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
          <div className={`h-8 border-l ${step >= 1 ? 'border-primary' : 'border-muted-foreground/30'}`} />
          <div className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
        </div>

        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
                Step 1: Platform Commission
              </DialogTitle>
              <DialogDescription className="text-center">
                Send the 10% platform fee (${commissionAmount.toFixed(2)}) via Zelle before paying the helper
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-full p-4 bg-muted rounded-xl text-center space-y-2">
                <p className="text-sm text-muted-foreground">Send commission to:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-bold text-foreground break-all">{PLATFORM_ZELLE_ID}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(PLATFORM_ZELLE_ID, 'platform')}>
                    {copiedPlatform ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-2xl font-bold text-primary">${commissionAmount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">10% of ${amount.toFixed(2)} task fee</p>
              </div>

              <div className="w-full p-3 bg-accent/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Open your banking app (Chase, Bank of America, Wells Fargo, etc.), go to Zelle, and send ${commissionAmount.toFixed(2)} to the number above.
                </p>
              </div>

              {!commissionPaid ? (
                <Button onClick={handleCommissionPaid} className="w-full bg-primary hover:bg-primary/90">
                  I've Paid the Commission
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Commission marked as paid</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => setStep(2)}
                disabled={!commissionPaid}
                className="w-full"
              >
                Next: Pay {helperName} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
                Step 2: Pay {helperName}
              </DialogTitle>
              <DialogDescription className="text-center">
                Now send ${amount.toFixed(2)} to {helperName} for the completed task
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-full p-4 bg-muted rounded-xl text-center space-y-2">
                <p className="text-sm text-muted-foreground">Send payment to:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-bold text-foreground break-all">{zelleId}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(zelleId, 'helper')}>
                    {copiedHelper ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-2xl font-bold text-primary">${amount.toFixed(2)}</p>
              </div>

              <div className="w-full p-3 bg-accent/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Open your banking app, go to Zelle, and send ${amount.toFixed(2)} to the ID above.
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-col">
              <Button onClick={onPaymentDone} className="w-full bg-green-600 hover:bg-green-700">
                I've Completed Both Payments
              </Button>
              <Button variant="ghost" onClick={() => setStep(1)} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Commission
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
