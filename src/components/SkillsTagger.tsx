import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SkillsTaggerProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  suggestions?: string[];
  maxSkills?: number;
}

const DEFAULT_SUGGESTIONS = [
  'Gardening', 'Pet Sitting', 'Snow Removal', 'Babysitting', 'Moving Help',
  'Handyman', 'Cleaning', 'Tutoring', 'Tech Help', 'Errands', 'Cooking', 'Dog Walking',
];

export function SkillsTagger({ skills, onChange, suggestions = DEFAULT_SUGGESTIONS, maxSkills = 10 }: SkillsTaggerProps) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const s = raw.trim().slice(0, 30);
    if (!s) return;
    if (skills.length >= maxSkills) return;
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    onChange([...skills, s]);
    setInput('');
  };

  const remove = (s: string) => onChange(skills.filter((x) => x !== s));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      remove(skills[skills.length - 1]);
    }
  };

  const remaining = suggestions.filter((s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 rounded-md border bg-background">
        {skills.map((s) => (
          <Badge key={s} variant="secondary" className="gap-1 py-1 pr-1">
            {s}
            <button
              type="button"
              onClick={() => remove(s)}
              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
              aria-label={`Remove ${s}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={skills.length === 0 ? 'Add a skill and press Enter…' : ''}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-sm"
          maxLength={30}
        />
      </div>
      {input.trim() && (
        <Button type="button" size="sm" variant="outline" onClick={() => add(input)}>
          <Plus className="w-3 h-3 mr-1" /> Add "{input.trim()}"
        </Button>
      )}
      {remaining.length > 0 && skills.length < maxSkills && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center">Suggestions:</span>
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs px-2 py-1 rounded-full border border-dashed hover:bg-primary/5 hover:border-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{skills.length}/{maxSkills} skills</p>
    </div>
  );
}
