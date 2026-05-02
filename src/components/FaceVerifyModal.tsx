import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface FaceVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (estimatedAge: number) => void;
}

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export function FaceVerifyModal({ isOpen, onClose, onSuccess }: FaceVerifyModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusText, setStatusText] = useState('Initializing models...');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectRef = useRef<number>();

  // Keep a running average to stabilize the estimate
  const ageReadings = useRef<number[]>([]);
  const READINGS_NEEDED = 5;

  useEffect(() => {
    if (isOpen) {
      ageReadings.current = [];
      loadModels();
    } else {
      stopVideo();
    }
    return () => stopVideo();
  }, [isOpen]);

  const loadModels = async () => {
    try {
      setStatusText('Loading AI models (this may take a moment)...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      setIsModelLoaded(true);
      startVideo();
    } catch (error) {
      console.error('Error loading models:', error);
      setStatusText('Failed to load models. Check your internet connection.');
      toast.error('Failed to load AI models.');
    }
  };

  const startVideo = async () => {
    try {
      setStatusText('Accessing camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatusText('Please look directly at the camera.');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatusText('Could not access camera. Please allow permissions.');
      toast.error('Camera access denied or unavailable.');
    }
  };

  const stopVideo = () => {
    if (detectRef.current) {
      cancelAnimationFrame(detectRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsModelLoaded(false);
    setIsDetecting(false);
  };

  const detectFace = async () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !isOpen || !canvasRef.current) {
      return;
    }

    try {
      // Draw video frame to small canvas to reduce AI processing overhead
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 224, 224);
        
        // Use TinyFaceDetector with extremely low inputSize for maximum performance
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
        const detections = await faceapi.detectSingleFace(canvasRef.current, options).withAgeAndGender();
        
        if (detections) {
          const roundedAge = Math.round(detections.age);
          ageReadings.current.push(roundedAge);
          
          const readingCount = ageReadings.current.length;
          const avgAge = Math.round(ageReadings.current.reduce((a, b) => a + b, 0) / readingCount);
          
          setStatusText(`Face detected! Estimating age: ~${avgAge} (reading ${readingCount}/${READINGS_NEEDED})`);
          
          // Once we have enough stable readings, finalize
          if (readingCount >= READINGS_NEEDED) {
            stopVideo();
            const isAdult = avgAge >= 18;
            const label = isAdult ? 'Verified Adult' : 'Young Neighbor';
            toast.success(`Verified! Estimated age: ${avgAge} — ${label}`);
            onSuccess(avgAge);
            return; // Stop loop
          }
        } else {
          setStatusText('Looking for a face... Make sure you are well-lit and facing the camera.');
        }
      }
    } catch (error) {
      console.error("Detection error", error);
    }

    // Schedule next frame only AFTER the current one is done (prevents stacking lag)
    detectRef.current = requestAnimationFrame(() => {
      setTimeout(detectFace, 300); // 300ms breather
    });
  };

  const handleVideoPlay = () => {
    if (!isModelLoaded) return;
    setIsDetecting(true);
    detectFace();
  };

  const handleManualClose = () => {
    stopVideo();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleManualClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Explicit X close button */}
        <button
          onClick={handleManualClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Face Age Verification
          </DialogTitle>
          <DialogDescription>
            This is completely optional. It runs securely in your browser — no video is recorded or sent to any server. You can close this at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-sm aspect-[4/3] bg-muted rounded-xl overflow-hidden shadow-inner flex items-center justify-center border">
            {!isModelLoaded && !stream && (
               <div className="flex flex-col items-center text-muted-foreground p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p className="text-sm font-medium">{statusText}</p>
               </div>
            )}
            
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              onPlay={handleVideoPlay}
              className={`w-full h-full object-cover transition-opacity duration-300 ${stream ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Hidden canvas for performance optimized AI scanning */}
            <canvas ref={canvasRef} width={224} height={224} className="hidden" />

            {isDetecting && stream && (
               <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  <div className="w-full h-full border-4 border-primary/40 rounded-xl animate-pulse"></div>
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-1 bg-primary/60"
                    animate={{ y: ['0%', '3000%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{boxShadow: '0 0 12px 2px rgba(var(--primary), 0.6)'}}
                  />
               </div>
            )}
          </div>
          
          <div className="text-center font-medium text-sm p-3 bg-secondary/30 rounded-lg w-full min-h-[48px] flex items-center justify-center">
             {statusText}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Users under 18 will be marked as <strong>Young Neighbors</strong> with parental approval requirements. All ages are welcome.
          </p>

          <div className="w-full flex justify-end">
            <Button variant="secondary" onClick={handleManualClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
