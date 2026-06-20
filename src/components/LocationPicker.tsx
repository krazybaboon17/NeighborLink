import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Check, X } from 'lucide-react';
import { searchAddress, shortLabel, type NominatimResult } from '@/lib/geo';

export type PickedLocation = {
  address: string;        // precise street address (private)
  label: string;          // public "City, State" label
  lat: number;
  lng: number;
};

interface Props {
  value: PickedLocation | null;
  onChange: (v: PickedLocation | null) => void;
}

export function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.address ?? '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value) return; // don't search while a selection is locked in
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const r = await searchAddress(q, ctrl.signal);
        setResults(r);
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [query, value]);

  const select = (r: NominatimResult) => {
    const picked: PickedLocation = {
      address: r.display_name,
      label: shortLabel(r),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
    onChange(picked);
    setQuery(picked.address);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="max-w-md mx-auto relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          autoFocus
          placeholder="Start typing your street address…"
          value={query}
          onChange={(e) => {
            if (value) onChange(null);
            setQuery(e.target.value);
          }}
          onFocus={() => results.length && setOpen(true)}
          className="pl-9 pr-10 h-14 text-base"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        ) : value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear address"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      {open && !value && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-popover border rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lon}`}
              type="button"
              onClick={() => select(r)}
              className="w-full text-left px-4 py-3 hover:bg-accent border-b last:border-b-0 text-sm"
            >
              <div className="font-medium truncate">{shortLabel(r)}</div>
              <div className="text-xs text-muted-foreground truncate">{r.display_name}</div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border bg-secondary/30 p-3 text-sm">
          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium">{value.label}</div>
            <div className="text-xs text-muted-foreground truncate">{value.address}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Helpers will only see a general circle on the map until you accept their offer.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
