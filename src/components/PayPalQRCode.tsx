import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, ExternalLink } from 'lucide-react';

interface PayPalQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paypalId: string;
  amount: number;
  helperName: string;
  onPaymentDone: () => void;
}

export function PayPalQRCode({ open, onOpenChange, paypalId, amount, helperName, onPaymentDone }: PayPalQRCodeProps) {
  // PayPal.me link for direct payment
  const paypalLink = paypalId.includes('@')
    ? `https://www.paypal.com/paypalme/${encodeURIComponent(paypalId)}/${amount}`
    : `https://www.paypal.me/${encodeURIComponent(paypalId)}/${amount}`;

  // Use a QR code API to generate the QR code image
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paypalLink)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <QrCode className="h-5 w-5 text-primary" />
            Pay {helperName} via PayPal
          </DialogTitle>
          <DialogDescription className="text-center">
            Scan this QR code with your phone to pay ${amount} to {helperName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="border-4 border-primary/20 rounded-2xl p-3 bg-white">
            <img
              src={qrCodeUrl}
              alt={`PayPal QR code for ${helperName}`}
              className="w-[250px] h-[250px]"
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-primary">${amount}</p>
            <p className="text-sm text-muted-foreground">PayPal: {paypalId}</p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(paypalLink, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in PayPal
          </Button>
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
