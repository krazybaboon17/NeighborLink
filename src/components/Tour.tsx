import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Check, SkipForward, MapPin } from 'lucide-react';

type Step = {
  id: string;
  title: string;
  body: string;
  target?: string;          // CSS selector — usually [data-tour="..."]
  route?: { path: string; label: string }; // optional "Take me there"
  placement?: 'auto' | 'center';
};

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to Taskify 👋',
    body: 'A quick 30-second tour of the basics — neighbors helping neighbors, off-app payments, all in one place.',
    placement: 'center',
  },
  {
    id: 'browse',
    title: 'Browse Tasks',
    body: 'See what neighbors need help with. Filter by category, distance, or verified-only posters.',
    target: '[data-tour="nav-browse"]',
    route: { path: '/tasks', label: 'Open Browse Tasks' },
  },
  {
    id: 'post',
    title: 'Post a Task',
    body: 'Need a hand? Post a task in under a minute. Pick a budget range — neighbors will send offers.',
    target: '[data-tour="post-task"]',
    route: { path: '/post-task', label: 'Post your first task' },
  },
  {
    id: 'mytasks',
    title: 'My Tasks',
    body: 'Track tasks you posted and offers you sent. Approve completions and leave reviews here.',
    target: '[data-tour="nav-mytasks"]',
    route: { path: '/my-tasks', label: 'Open My Tasks' },
  },
  {
    id: 'messages',
    title: 'Messages',
    body: 'Coordinate details and payment directly with neighbors. Taskify never touches your money — pay off-app.',
    target: '[data-tour="nav-messages"]',
    route: { path: '/conversations', label: 'Open Messages' },
  },
  {
    id: 'bell',
    title: 'Stay in the loop',
    body: 'New offers, messages, and approvals land here. Enable browser alerts in Settings → Notifications.',
    target: '[data-tour="notification-bell"]',
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    body: 'Edit your bio and skills, verify your identity, or tweak preferences anytime from your avatar menu.',
    target: '[data-tour="profile-menu"]',
  },
  {
    id: 'done',
    title: "You're all set! 🎉",
    body: 'You can replay this tour anytime from Settings → Appearance.',
    placement: 'center',
  },
];

const KEY = (userId: string) => `taskfy.tour.v1.${userId}`;

function useTargetRect(selector?: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!selector) { setRect(null); return; }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    // Try a few times — targets may mount slightly after route render.
    measure();
    const t1 = setTimeout(measure, 80);
    const t2 = setTimeout(measure, 250);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [selector]);

  return rect;
}

export function Tour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start tour for first-time users (backed by DB so it persists across devices).
  useEffect(() => {
    if (!user) return;
    const flag = localStorage.getItem(KEY(user.id));
    if (flag) return; // fast path — already seen on this device

    // Check DB in case this is a new device for a returning user
    supabase
      .from('profiles')
      .select('has_seen_tour')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const seen = !!(data as any)?.has_seen_tour;
        if (seen) {
          localStorage.setItem(KEY(user.id), 'done');
        } else {
          timeoutRef.current = setTimeout(() => setActive(true), 800);
        }
      });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  // Allow external trigger: window.dispatchEvent(new Event('taskfy:start-tour'))
  useEffect(() => {
    const start = () => { setIndex(0); setActive(true); };
    window.addEventListener('taskfy:start-tour', start);
    return () => window.removeEventListener('taskfy:start-tour', start);
  }, []);

  const step = STEPS[index];
  const rect = useTargetRect(active ? step?.target : undefined);

  const finish = (skipped = false) => {
    if (user) {
      localStorage.setItem(KEY(user.id), skipped ? 'skipped' : 'done');
      supabase.from('profiles').update({ has_seen_tour: true } as any).eq('id', user.id);
    }
    setActive(false);
    setIndex(0);
  };

  const next = () => {
    if (index >= STEPS.length - 1) finish(false);
    else setIndex((i) => i + 1);
  };
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // Tooltip position
  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    if (!active) return {};
    if (!rect || step.placement === 'center' || !step.target) {
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    }
    const pad = 12;
    const tipW = 340;
    const tipH = 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer below, else above
    const below = rect.bottom + pad + tipH < vh;
    const top = below ? rect.bottom + pad : Math.max(pad, rect.top - tipH - pad);
    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(pad, Math.min(vw - tipW - pad, left));
    return { top, left, width: tipW };
  }, [rect, step, active]);

  if (!active || !step) return null;

  const SPOT_PAD = 8;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-root"
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Spotlight overlay via SVG mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" aria-hidden>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && step.target && (
                <rect
                  x={Math.max(0, rect.left - SPOT_PAD)}
                  y={Math.max(0, rect.top - SPOT_PAD)}
                  width={rect.width + SPOT_PAD * 2}
                  height={rect.height + SPOT_PAD * 2}
                  rx={12}
                  ry={12}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(8, 12, 24, 0.62)" mask="url(#tour-mask)" />
        </svg>

        {/* Spotlight ring */}
        {rect && step.target && (
          <motion.div
            layout
            className="absolute pointer-events-none rounded-xl ring-2 ring-primary/70"
            style={{
              left: rect.left - SPOT_PAD,
              top: rect.top - SPOT_PAD,
              width: rect.width + SPOT_PAD * 2,
              height: rect.height + SPOT_PAD * 2,
              boxShadow: '0 0 0 9999px rgba(8,12,24,0)',
            }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="absolute z-[101] pointer-events-auto rounded-2xl border-2 border-primary/30 bg-background shadow-2xl p-5 max-w-[92vw]"
          style={tooltipStyle}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
              Tour · {index + 1} of {STEPS.length}
            </span>
            <button
              onClick={() => finish(true)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <SkipForward className="w-3 h-3" /> Skip tour
            </button>
          </div>
          <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.body}</p>

          {step.route && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full justify-center gap-1.5"
              onClick={() => { navigate(step.route!.path); }}
            >
              <MapPin className="w-3.5 h-3.5" /> {step.route.label}
            </Button>
          )}

          <div className="flex items-center justify-between gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={back} disabled={index === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
            <Button size="sm" onClick={next}>
              {index === STEPS.length - 1 ? (
                <>Finish <Check className="w-4 h-4 ml-1" /></>
              ) : (
                <>Got it <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
