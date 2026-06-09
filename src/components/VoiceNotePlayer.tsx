import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { src: string | undefined; durationSec?: number | null; mine: boolean; }

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function VoiceNotePlayer({ src, durationSec, mine }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(durationSec || 0);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (playing) a.pause(); else a.play();
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <button type="button" onClick={toggle}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition',
          mine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/15 hover:bg-primary/25 text-primary'
        )}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn('h-1 rounded-full overflow-hidden', mine ? 'bg-white/25' : 'bg-primary/15')}>
          <div className={cn('h-full transition-all', mine ? 'bg-white' : 'bg-primary')}
               style={{ width: dur > 0 ? `${Math.min(100, (cur / dur) * 100)}%` : '0%' }} />
        </div>
        <div className={cn('text-[10px] mt-0.5', mine ? 'text-white/80' : 'text-muted-foreground')}>
          {fmt(playing || cur > 0 ? cur : 0)} / {fmt(dur)}
        </div>
      </div>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (isFinite(d) && d > 0) setDur(d); }}
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setCur(0); }}
        />
      )}
    </div>
  );
}
