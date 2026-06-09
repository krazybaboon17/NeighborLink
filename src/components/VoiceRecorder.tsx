import { useRef, useState, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  onRecorded: (blob: Blob, durationSec: number) => Promise<void> | void;
  disabled?: boolean;
}

const MAX_SECONDS = 60;

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    if (disabled || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (tickRef.current) window.clearInterval(tickRef.current);
        setRecording(false); setSeconds(0);
        if (blob.size < 200) { toast.error('Recording too short'); return; }
        setBusy(true);
        try { await onRecorded(blob, duration); } finally { setBusy(false); }
      };
      mediaRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        const s = Math.round((Date.now() - startedAtRef.current) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS) stop();
      }, 250);
    } catch (e: any) {
      toast.error(e?.name === 'NotAllowedError' ? 'Microphone permission denied' : 'Recording failed');
    }
  }, [disabled, recording, onRecorded, stop]);

  if (busy) {
    return (
      <Button type="button" size="icon" variant="ghost" disabled className="rounded-full shrink-0">
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (recording) {
    return (
      <Button
        type="button" size="sm" variant="destructive"
        onClick={stop}
        className="rounded-full shrink-0 gap-1.5 animate-pulse"
        aria-label="Stop recording"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        {String(Math.floor(seconds / 60)).padStart(1, '0')}:{String(seconds % 60).padStart(2, '0')}
      </Button>
    );
  }

  return (
    <Button
      type="button" size="icon" variant="ghost"
      onClick={start} disabled={disabled}
      className={cn('rounded-full shrink-0')}
      aria-label="Record voice note"
      title="Record voice note (up to 60s)"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
}
