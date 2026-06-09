import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Navbar } from '@/components/Navbar';
import { Search, Locate, Loader2, Sparkles, MapPin, Inbox } from 'lucide-react';
import { useLocationFilter } from '@/hooks/useLocationFilter';
import { useTaskRecommendations } from '@/hooks/useTaskRecommendations';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCard, TaskCardData } from '@/components/TaskCard';
import { TaskCardSkeletonGrid } from '@/components/TaskCardSkeleton';
import { DecorativeCircles } from '@/components/ui/DecorativeCircles';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion } from 'framer-motion';

interface Task extends TaskCardData {
  user_id?: string;
}

const PAGE_SIZE = 12;

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appliedTaskIds, setAppliedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const initialCategory = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('category') || 'all';
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [zipInput, setZipInput] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { recommendations, getRecommendations } = useTaskRecommendations();

  // Persisted location prefs (survive across sessions)
  const [savedLocation, setSavedLocation] = useLocalStorage<string>('nl_user_location', '');
  const [savedMaxMiles, setSavedMaxMiles] = useLocalStorage<number>('nl_max_miles', 5);
  const [verifiedOnly, setVerifiedOnly] = useLocalStorage<boolean>('nl_verified_only', false);

  const {
    isFiltering,
    userLocation,
    setUserLocation,
    maxMiles,
    setMaxMiles,
    getUserCurrentLocation,
    distanceFor,
  } = useLocationFilter();

  const debouncedSearch = useDebouncedValue(searchTerm, 200);

  // Restore saved prefs once on mount
  useEffect(() => {
    if (savedLocation) setUserLocation(savedLocation);
    if (savedMaxMiles) setMaxMiles(savedMaxMiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever user changes them
  useEffect(() => {
    setSavedLocation(userLocation);
  }, [userLocation, setSavedLocation]);

  useEffect(() => {
    setSavedMaxMiles(maxMiles);
  }, [maxMiles, setSavedMaxMiles]);

  // Auto-request geolocation on first visit if we don't already have something
  useEffect(() => {
    if (savedLocation || userLocation) return;
    let cancelled = false;
    (async () => {
      const loc = await getUserCurrentLocation();
      if (!cancelled && loc) setUserLocation(loc);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (user && tasks.length > 0) {
      getRecommendations(user.id, tasks);
    }
  }, [tasks, user, getRecommendations]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, categoryFilter, maxMiles, userLocation]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (user?.id) query = query.neq('user_id', user.id);

      const { data: tasksData, error } = await query;
      if (error) throw error;

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        setAppliedTaskIds(new Set());
        return;
      }

      const userIds = [...new Set(tasksData.map((t: any) => t.user_id))];
      const { data: profilesData } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name, verified, completed_tasks, rating, created_at')
        .in('id', userIds);

      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

      const formatted = tasksData.map((task: any) => {
        const p: any = profilesMap.get(task.user_id);
        const posterNew = !!p?.created_at && (Date.now() - new Date(p.created_at).getTime() < SEVEN_DAYS) && !p?.verified;
        return {
          ...task,
          posterName: p?.full_name || 'Anonymous',
          posterVerified: !!p?.verified,
          posterNew,
          posterRating: p?.rating ?? null,
          posterCompletedTasks: p?.completed_tasks ?? 0,
        };
      });
      setTasks(formatted);

      if (user?.id) {
        const { data: offersData } = await supabase
          .from('offers')
          .select('task_id')
          .eq('helper_id', user.id)
          .in('task_id', tasksData.map((t: any) => t.id));
        setAppliedTaskIds(new Set((offersData || []).map((o: any) => o.task_id)));
      } else {
        setAppliedTaskIds(new Set());
      }
    } catch {
      // Soft fail — empty list is the safe state
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Compute filtered + distance-annotated list
  const filteredTasks = useMemo(() => {
    const search = debouncedSearch.trim().toLowerCase();
    let result = tasks
      .filter((task: any) => {
        const matchesSearch =
          !search ||
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search);
        const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
        const matchesVerified = !verifiedOnly || task.posterVerified;
        return matchesSearch && matchesCategory && matchesVerified;
      })
      .map((task) => ({ task, distance: distanceFor(task.location) }));

    // Distance filter (only when we have user coords AND maxMiles > 0)
    if (maxMiles > 0) {
      const anyDistance = result.some((r) => r.distance !== null);
      if (anyDistance) {
        result = result.filter((r) => r.distance === null || r.distance <= maxMiles);
      }
    }

    // Sort: unapplied first, then by distance asc (when known), then newest
    result.sort((a, b) => {
      const aA = appliedTaskIds.has(a.task.id) ? 1 : 0;
      const bA = appliedTaskIds.has(b.task.id) ? 1 : 0;
      if (aA !== bA) return aA - bA;
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });

    return result;
  }, [tasks, debouncedSearch, categoryFilter, maxMiles, appliedTaskIds, distanceFor]);

  const handleGetLocation = async () => {
    const loc = await getUserCurrentLocation();
    if (loc) setUserLocation(loc);
  };

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const z = zipInput.trim();
    if (!/^\d{5}$/.test(z)) return;
    setUserLocation(z);
  };

  // AI recommended (unapplied) tasks first, padded to 3
  const recIds = useMemo(
    () => new Set(recommendations.filter((r) => !appliedTaskIds.has(r.id)).map((r) => r.id)),
    [recommendations, appliedTaskIds],
  );

  const recTasks = useMemo(
    () =>
      recommendations
        .filter((r) => !appliedTaskIds.has(r.id))
        .map((r) => filteredTasks.find((ft) => ft.task.id === r.id))
        .filter(Boolean) as { task: Task; distance: number | null }[],
    [recommendations, appliedTaskIds, filteredTasks],
  );

  const showRecs = !!user && recTasks.length > 0;
  const padded = showRecs
    ? [
        ...recTasks,
        ...filteredTasks.filter((ft) => !recIds.has(ft.task.id) && !appliedTaskIds.has(ft.task.id)),
      ].slice(0, 3)
    : [];
  const paddedIds = new Set(padded.map((p) => p.task.id));
  const remaining = filteredTasks.filter((ft) => !paddedIds.has(ft.task.id));
  const visibleRemaining = remaining.slice(0, visibleCount);

  return (
    <>
      <Helmet>
        <title>Browse Tasks — Taskfy</title>
        <meta name="description" content="Find local tasks in Arlington Heights and Buffalo Grove: pet care, lawn care, moving help, errands and more." />
        <link rel="canonical" href="https://myneighborlink.lovable.app/tasks" />
        <meta property="og:title" content="Browse Tasks — Taskfy" />
        <meta property="og:description" content="Find local tasks in Arlington Heights and Buffalo Grove: pet care, lawn care, moving help, errands and more." />
        <meta property="og:url" content="https://myneighborlink.lovable.app/tasks" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Browse Tasks",
          url: "https://myneighborlink.lovable.app/tasks",
        })}</script>
      </Helmet>
      <Navbar />
      <DecorativeCircles />
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Header */}
          <motion.div
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="editorial-headline text-5xl lg:text-[4.5rem] mb-3">
                Browse <em className="italic font-light text-primary">tasks</em>
              </h1>
              <p className="font-body text-lg text-muted-foreground max-w-xl">
                Find a way to help a neighbor today.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/post-task')}
              className="rounded-full px-8 h-12 self-start md:self-auto min-h-[44px]"
              aria-label="Post a new task"
            >
              Post a Task
            </Button>
          </motion.div>

          {/* Search bar */}
          <div
            className="bg-card rounded-[20px] p-2 flex flex-col md:flex-row items-stretch gap-2 mb-4"
            style={{ boxShadow: '0 20px 60px hsl(60 3% 17% / 0.08)' }}
          >
            <label className="flex items-center flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground/60 mr-3 shrink-0" aria-hidden="true" />
              <span className="sr-only">Search tasks</span>
              <input
                type="search"
                placeholder="Search tasks…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 outline-none py-3 text-base font-body placeholder:text-muted-foreground/60 min-h-[44px]"
              />
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                className="md:w-56 border-0 bg-background rounded-2xl h-12 font-body min-h-[44px]"
                aria-label="Filter by category"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Lawn Care">Lawn Care</SelectItem>
                <SelectItem value="Snow Removal">Snow Removal</SelectItem>
                <SelectItem value="Moving Help">Moving Help</SelectItem>
                <SelectItem value="Grocery Runs">Grocery Runs</SelectItem>
                <SelectItem value="Home Repairs">Home Repairs</SelectItem>
                <SelectItem value="Babysitting">Babysitting</SelectItem>
                <SelectItem value="Pet Care">Pet Care</SelectItem>
                <SelectItem value="Handyman">Handyman</SelectItem>
                <SelectItem value="Errands">Errands</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location filter */}
          <div
            className="bg-card rounded-[20px] p-4 mb-10 space-y-4"
            style={{ boxShadow: '0 10px 40px hsl(60 3% 17% / 0.05)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2 flex-1 bg-background rounded-2xl px-4 min-h-[44px]">
                <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Your address, city, or coordinates"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none py-2.5 font-body text-sm"
                  aria-label="Your location"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGetLocation}
                className="rounded-full min-w-[44px] min-h-[44px]"
                aria-label="Use my current location"
                title="Use my current location"
              >
                <Locate className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            {/* ZIP fallback when location was denied or unset */}
            {!userLocation && (
              <form onSubmit={handleZipSubmit} className="flex gap-2 items-center">
                <label className="flex-1 sr-only" htmlFor="zip-fallback">
                  ZIP code
                </label>
                <input
                  id="zip-fallback"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{5}"
                  maxLength={5}
                  placeholder="Enter ZIP code if location was denied"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-background rounded-2xl px-4 py-2.5 outline-none font-body text-sm min-h-[44px]"
                />
                <Button type="submit" variant="outline" className="rounded-full min-h-[44px]">
                  Use ZIP
                </Button>
              </form>
            )}

            <div className="flex items-center gap-4 px-1">
              <label className="font-body text-sm text-muted-foreground shrink-0" htmlFor="distance-slider">
                Within{' '}
                <span className="font-semibold text-foreground">
                  {maxMiles === 0 ? 'No limit' : `${maxMiles} mi`}
                </span>
              </label>
              <Slider
                id="distance-slider"
                value={[maxMiles === 0 ? 50 : maxMiles]}
                min={1}
                max={50}
                step={1}
                onValueChange={(v) => setMaxMiles(v[0])}
                className="flex-1"
                aria-label="Distance filter in miles"
              />
              <button
                type="button"
                onClick={() => setMaxMiles(0)}
                className="text-xs font-body text-primary hover:underline shrink-0 min-h-[44px] px-2"
              >
                No limit
              </button>
              {isFiltering && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <TaskCardSkeletonGrid count={6} />
          ) : (
            <>
              {showRecs && padded.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="font-display font-bold text-sm uppercase tracking-wider text-primary">
                      Recommended for you
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {padded.map((p, i) => (
                      <TaskCard
                        key={p.task.id}
                        task={p.task}
                        featured={i < recTasks.length}
                        applied={false}
                        distanceMiles={p.distance}
                      />
                    ))}
                  </div>
                </div>
              )}

              {remaining.length === 0 && !showRecs ? (
                <div
                  className="bg-card rounded-3xl p-12 text-center"
                  style={{ boxShadow: '0 20px 60px hsl(60 3% 17% / 0.08)' }}
                >
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <p className="font-display text-2xl mb-3">No helpers found near you yet</p>
                  <p className="font-body text-muted-foreground mb-6">
                    Try widening your distance filter, or be the first to post a task.
                  </p>
                  <Button onClick={() => navigate('/post-task')} className="rounded-full px-6 min-h-[44px]">
                    Post a task
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {visibleRemaining.map((p, i) => (
                      <TaskCard
                        key={p.task.id}
                        task={p.task}
                        delay={i * 0.04}
                        applied={appliedTaskIds.has(p.task.id)}
                        distanceMiles={p.distance}
                      />
                    ))}
                  </div>
                  {remaining.length > visibleCount && (
                    <div className="flex justify-center mt-10">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="rounded-full px-8 min-h-[44px]"
                      >
                        Show more ({remaining.length - visibleCount} left)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
