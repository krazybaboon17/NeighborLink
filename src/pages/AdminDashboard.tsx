import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ShieldX,
  CheckCircle2,
  ListTodo,
  Users,
  DollarSign,
  MapPin,
  Tag,
  TrendingUp,
  ExternalLink,
  Search,
  UserCheck,
  Shield,
  Baby,
  MessageSquare,
  Star,
  Clock,
  Heart,
  Flag,
  Mail,
  CalendarClock,
  Handshake,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { SEO } from '@/components/SEO';
import { AdminTabs } from '@/components/AdminTabs';

type Task = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: 'hsl(210 80% 55%)',
  assigned: 'hsl(45 90% 55%)',
  pending_review: 'hsl(280 70% 60%)',
  completed: 'hsl(140 60% 45%)',
  cancelled: 'hsl(0 0% 60%)',
};

const PIE_COLORS = [
  'hsl(210 80% 55%)',
  'hsl(0 75% 55%)',
  'hsl(140 60% 45%)',
  'hsl(45 90% 55%)',
  'hsl(280 70% 60%)',
  'hsl(180 60% 45%)',
  'hsl(25 85% 55%)',
  'hsl(320 65% 55%)',
  'hsl(90 55% 45%)',
  'hsl(240 60% 60%)',
];

type PlatformStats = Record<string, number>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [platform, setPlatform] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc('check_is_admin');
      setIsAdmin(data === true);
    })();
  }, [user]);

  useEffect(() => {
    if (isAdmin === true) fetchAll();
    else if (isAdmin === false) setLoading(false);
  }, [isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id,title,category,location,status,budget_min,budget_max,created_at,updated_at,user_id')
          .order('created_at', { ascending: false }),
        (supabase as any).rpc('admin_get_platform_stats'),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      setTasks((tasksRes.data as Task[]) || []);
      if (statsRes.error) {
        console.error(statsRes.error);
        toast.error('Failed to load platform stats');
      } else {
        setPlatform((statsRes.data as PlatformStats) || null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard data');
    } finally { setLoading(false); }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed');
    const open = tasks.filter(t => t.status === 'open').length;
    const assigned = tasks.filter(t => t.status === 'assigned').length;
    const inReview = tasks.filter(t => t.status === 'pending_review').length;
    const cancelled = tasks.filter(t => t.status === 'cancelled').length;
    const uniquePosters = new Set(tasks.map(t => t.user_id)).size;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const avgBudget = (() => {
      const vals = completed
        .map(t => {
          const min = t.budget_min ?? 0;
          const max = t.budget_max ?? min;
          return (min + max) / 2;
        })
        .filter(v => v > 0);
      if (vals.length === 0) return 0;
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    })();

    const totalValue = completed.reduce((sum, t) => {
      const min = t.budget_min ?? 0;
      const max = t.budget_max ?? min;
      return sum + (min + max) / 2;
    }, 0);

    return { total, completed: completed.length, open, assigned, inReview, cancelled, uniquePosters, completionRate, avgBudget, totalValue: Math.round(totalValue) };
  }, [tasks]);

  const statusData = useMemo(() => ([
    { name: 'Open', value: stats.open, key: 'open' },
    { name: 'Assigned', value: stats.assigned, key: 'assigned' },
    { name: 'In Review', value: stats.inReview, key: 'pending_review' },
    { name: 'Completed', value: stats.completed, key: 'completed' },
    { name: 'Cancelled', value: stats.cancelled, key: 'cancelled' },
  ].filter(d => d.value > 0)), [stats]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; total: number; completed: number }>();
    for (const t of tasks) {
      const k = t.category || 'Uncategorized';
      const entry = map.get(k) || { name: k, total: 0, completed: 0 };
      entry.total += 1;
      if (t.status === 'completed') entry.completed += 1;
      map.set(k, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tasks]);

  const locationData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks.filter(t => t.status === 'completed')) {
      const k = (t.location || 'Unknown').trim();
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tasks]);

  const trendData = useMemo(() => {
    // last 30 days
    const days: { date: string; label: string; posted: number; completed: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), posted: 0, completed: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const t of tasks) {
      const created = t.created_at.slice(0, 10);
      if (idx.has(created)) days[idx.get(created)!].posted += 1;
      if (t.status === 'completed') {
        const done = t.updated_at.slice(0, 10);
        if (idx.has(done)) days[idx.get(done)!].completed += 1;
      }
    }
    return days;
  }, [tasks]);

  const completedLog = useMemo(() => {
    const list = tasks.filter(t => t.status === 'completed');
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(t =>
          t.title.toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q) ||
          (t.location || '').toLowerCase().includes(q))
      : list;
    return filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [tasks, search]);

  if (isAdmin === null || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-7xl space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </>
    );
  }

  if (isAdmin === false) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center space-y-4">
            <ShieldX className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-muted-foreground">You don't have permission to view this page.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Admin Dashboard — Taskfy" description="Platform analytics and task completion stats." path="/admin/dashboard" />
      <Navbar />
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Live platform statistics across all tasks.</p>
          </div>

          <AdminTabs />

          {/* Task KPIs */}
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2">Tasks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard icon={ListTodo} label="Total tasks" value={stats.total} tint="hsl(210 80% 55%)" />
            <KpiCard icon={CheckCircle2} label="Completed" value={stats.completed} tint="hsl(140 60% 45%)" sub={`${stats.completionRate}% completion rate`} />
            <KpiCard icon={TrendingUp} label="Active" value={stats.open + stats.assigned + stats.inReview} tint="hsl(45 90% 55%)" sub={`${stats.open} open · ${stats.assigned} assigned · ${stats.inReview} review`} />
            <KpiCard icon={Users} label="Unique posters" value={stats.uniquePosters} tint="hsl(280 70% 60%)" />
            <KpiCard icon={DollarSign} label="Avg completed budget" value={`$${stats.avgBudget}`} tint="hsl(25 85% 55%)" />
            <KpiCard icon={DollarSign} label="Est. value moved" value={`$${stats.totalValue.toLocaleString()}`} tint="hsl(140 60% 45%)" sub="Sum of completed task midpoints" />
            <KpiCard icon={Tag} label="Categories used" value={categoryData.length} tint="hsl(320 65% 55%)" />
            <KpiCard icon={MapPin} label="Locations served" value={new Set(tasks.map(t => (t.location || '').trim()).filter(Boolean)).size} tint="hsl(180 60% 45%)" />
          </div>

          {/* People KPIs */}
          {platform && (
            <>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2">People</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <KpiCard icon={Users} label="Users registered" value={platform.users_total} tint="hsl(210 80% 55%)" sub={`+${platform.users_new_7d} this week · +${platform.users_new_30d} this month`} />
                <KpiCard icon={Handshake} label="Helpers" value={platform.users_helpers} tint="hsl(25 85% 55%)" sub={`${platform.unique_helpers_applied} have applied to tasks`} />
                <KpiCard icon={UserCheck} label="Verified users" value={platform.users_verified} tint="hsl(140 60% 45%)" sub={`${platform.users_email_verified} email · ${platform.users_phone_verified} phone`} />
                <KpiCard icon={Baby} label="Young neighbors" value={platform.users_young_neighbors} tint="hsl(320 65% 55%)" sub="Profiles flagged under 18" />
                <KpiCard icon={Shield} label="Admins" value={platform.admins_total} tint="hsl(0 75% 55%)" />
                <KpiCard icon={Users} label="Profiles with bio" value={platform.users_with_bio} tint="hsl(280 70% 60%)" sub={`${platform.users_with_skills} list skills`} />
                <KpiCard icon={Mail} label="Mailing list" value={platform.mailing_subscribers} tint="hsl(45 90% 55%)" />
                <KpiCard icon={Heart} label="Favorited helpers" value={platform.favorites_total} tint="hsl(0 75% 55%)" />
              </div>

              {/* Engagement KPIs */}
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-2">Engagement</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <KpiCard icon={Handshake} label="Applications (offers)" value={platform.offers_total} tint="hsl(25 85% 55%)" sub={`${platform.offers_accepted} accepted · ${platform.offers_pending} pending · ${platform.offers_rejected} rejected`} />
                <KpiCard icon={MessageSquare} label="Messages sent" value={platform.messages_total} tint="hsl(210 80% 55%)" sub={`${platform.messages_7d} in last 7 days · ${platform.conversations} conversations`} />
                <KpiCard icon={Star} label="Reviews" value={platform.reviews_total} tint="hsl(45 90% 55%)" sub={`Avg rating ${platform.reviews_avg_rating}`} />
                <KpiCard icon={Clock} label="Volunteer hours" value={platform.volunteer_hours_total} tint="hsl(140 60% 45%)" sub={`${platform.volunteer_entries} entries · ${platform.volunteers_unique} volunteers`} />
                <KpiCard icon={CalendarClock} label="Time slots proposed" value={platform.time_slots_total} tint="hsl(180 60% 45%)" />
                <KpiCard icon={UserCheck} label="Verifications" value={platform.verifications_pending + platform.verifications_approved + platform.verifications_rejected} tint="hsl(280 70% 60%)" sub={`${platform.verifications_pending} pending · ${platform.verifications_approved} approved · ${platform.verifications_rejected} rejected`} />
                <KpiCard icon={Flag} label="Task reports" value={platform.reports_total} tint="hsl(0 75% 55%)" sub={`${platform.reports_open} open`} />
                <KpiCard icon={Shield} label="Parental consents" value={platform.parental_consents} tint="hsl(140 60% 45%)" sub="Captured for minors" />
              </div>
            </>
          )}

          {/* Trend */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Activity — last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={3} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="posted" name="Posted" stroke="hsl(210 80% 55%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke="hsl(140 60% 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Status breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">Status breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 11 }}>
                        {statusData.map((d, i) => (
                          <Cell key={d.key} fill={STATUS_COLORS[d.key] || PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4" /> Tasks by category</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="total" name="Total" fill="hsl(210 80% 55%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="hsl(140 60% 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Locations */}
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Top locations (completed)</CardTitle></CardHeader>
            <CardContent>
              {locationData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="value" name="Completed" fill="hsl(0 75% 55%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed log — scrollable */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Completed tasks log
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedLog.length} of {stats.completed} shown
                </p>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search title, category, location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px] border-t">
                <div className="divide-y">
                  {completedLog.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No completed tasks {search ? 'match your search.' : 'yet.'}
                    </div>
                  ) : (
                    completedLog.map((t) => (
                      <Link
                        to={`/tasks/${t.id}`}
                        key={t.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{t.title}</span>
                            {t.category && (
                              <Badge variant="secondary" className="text-[10px] font-normal h-5">{t.category}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {t.location && (
                              <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{t.location}</span>
                            )}
                            {(t.budget_min || t.budget_max) && (
                              <span className="inline-flex items-center gap-1"><DollarSign className="w-3 h-3" />{t.budget_min ?? 0}–{t.budget_max ?? t.budget_min ?? 0}</span>
                            )}
                            <span>{new Date(t.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  icon: Icon, label, value, tint, sub,
}: {
  icon: any; label: string; value: number | string; tint: string; sub?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">{label}</div>
            <div className="text-2xl font-bold tracking-tight mt-1">{value}</div>
            {sub && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{sub}</div>}
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${tint.replace('hsl(', 'hsla(').replace(')', ' / 0.15)')}`, color: tint }}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
