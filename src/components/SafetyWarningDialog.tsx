import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SafetyWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  message: string;
  helperName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SafetyWarningDialog({
  open,
  onOpenChange,
  riskLevel,
  warnings,
  message,
  helperName,
  onConfirm,
  onCancel
}: SafetyWarningDialogProps) {
  const isHighRisk = riskLevel === 'high';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {isHighRisk ? (
              <div className="p-2 rounded-full bg-destructive/10">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            )}
            <AlertDialogTitle className="text-xl">
              {isHighRisk ? 'Safety Warning' : 'Heads Up'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>{message}</p>
            
            {warnings.length > 0 && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <p className="font-medium text-foreground text-sm">Concerns about {helperName}:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {warnings.slice(0, 3).map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-sm">
              {isHighRisk 
                ? "We recommend messaging this helper before accepting their offer."
                : "Consider reviewing their profile or messaging them first."
              }
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isHighRisk ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            Accept Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
