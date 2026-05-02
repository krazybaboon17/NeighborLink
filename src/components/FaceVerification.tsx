import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, RefreshCw, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FaceVerificationProps {
  onVerificationComplete: (result: {
    success: boolean;
    estimatedAge?: number;
    isAdult?: boolean;
    confidence?: string;
  }) => void;
  onCancel: () => void;
}

export function FaceVerification({ onVerificationComplete, onCancel }: FaceVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    estimatedAge?: number;
    isAdult?: boolean;
    confidence?: string;
    message?: string;
  } | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera access denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera found. Please connect a camera and try again.');
        } else {
          setCameraError('Failed to access camera. Please try again.');
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Start countdown
    setCountdown(3);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    setProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      ctx.drawImage(video, 0, 0);

      // Convert to base64 - this data is only used for processing and not stored
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // Clear canvas immediately after capturing to ensure no local storage
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Send to AI for age verification
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-age`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64 }),
      });

      // Clear the base64 data from memory
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      setVerificationResult(result);

      if (result.success) {
        toast.success(`Age verification complete! Estimated age: ${result.estimatedAge}`);
      } else {
        toast.error(result.message || 'Could not verify age');
      }

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Verification failed'
      });
      toast.error('Verification failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleConfirm = () => {
    if (verificationResult) {
      stopCamera();
      onVerificationComplete(verificationResult);
    }
  };

  const handleRetry = () => {
    setVerificationResult(null);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="h-5 w-5" />
          Face Age Verification
        </CardTitle>
        <CardDescription>
          We'll use AI to estimate your age from a quick face scan. No images are stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Privacy Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your image is processed in real-time and immediately discarded. We do not save any photos or videos.
          </AlertDescription>
        </Alert>

        {/* Camera View */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Camera className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Click "Start Camera" to begin
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive text-center text-sm">{cameraError}</p>
            </div>
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-6xl font-bold text-white animate-pulse">{countdown}</span>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
              <span className="text-white">Analyzing...</span>
            </div>
          )}
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <Alert className={verificationResult.success ? 'border-primary' : 'border-destructive'}>
            {verificationResult.success ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <AlertDescription>
            {verificationResult.success ? (
                <div className="space-y-1">
                  <p className="font-medium">Verification Successful!</p>
                  <p>Estimated Age: <span className="font-bold">{verificationResult.estimatedAge}</span></p>
                  <p>Status: {verificationResult.isAdult ? (
                    <span className="text-primary font-medium">Adult (18+)</span>
                  ) : (
                    <span className="text-accent-foreground font-medium">Young Neighbor (Under 18)</span>
                  )}</p>
                  <p className="text-xs text-muted-foreground">
                    Confidence: {verificationResult.confidence}
                  </p>
                </div>
              ) : (
                <p>{verificationResult.message || 'Verification failed. Please try again.'}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!cameraActive && !verificationResult && (
            <Button onClick={startCamera} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}

          {cameraActive && !verificationResult && !processing && (
            <Button onClick={captureAndVerify} className="w-full" disabled={processing}>
              Verify My Age
            </Button>
          )}

          {verificationResult && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              {verificationResult.success && (
                <Button onClick={handleConfirm} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm & Continue
                </Button>
              )}
            </div>
          )}

          <Button variant="ghost" onClick={() => { stopCamera(); onCancel(); }}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
