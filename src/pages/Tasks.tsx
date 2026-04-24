import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { Search, Locate, Loader2, Sparkles, MapPin } from 'lucide-react';
import { useLocationFilter } from '@/hooks/useLocationFilter';
import { useTaskRecommendations } from '@/hooks/useTaskRecommendations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { TaskCard, TaskCardData } from '@/components/TaskCard';
import { DecorativeCircles } from '@/components/ui/DecorativeCircles';
import { motion } from 'framer-motion';

interface Task extends TaskCardData {
  user_id?: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [appliedTaskIds, setAppliedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { recommendations, getRecommendations } = useTaskRecommendations();

  const {
    isFiltering,
    userLocation,
    setUserLocation,
    maxMiles,
    setMaxMiles,
    filterTasksByDistance,
    getUserCurrentLocation,
  } = useLocationFilter();

  useEffect(() => {
    fetchTasks();
  }, [location.pathname, user?.id]);

  useEffect(() => {
    applyFilters();
    if (user && tasks.length > 0) {
      getRecommendations(user.id, tasks);
    }
  }, [tasks, searchTerm, categoryFilter, appliedTaskIds]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Hide tasks posted by the current user
      if (user?.id) {
        query = query.neq('user_id', user.id);
      }

      const { data: tasksData } = await query;

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        setAppliedTaskIds(new Set());
        return;
      }

      const userIds = [...new Set(tasksData.map((t: any) => t.user_id))];
      const { data: profilesData } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p.full_name]));

      const formatted = tasksData.map((task: any) => ({
        ...task,
        posterName: profilesMap.get(task.user_id) || 'Anonymous',
      }));

      setTasks(formatted);

      // Fetch which of these tasks the current user has applied to
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
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    // Show tasks the user hasn't applied to first
    result.sort((a, b) => {
      const aApplied = appliedTaskIds.has(a.id) ? 1 : 0;
      const bApplied = appliedTaskIds.has(b.id) ? 1 : 0;
      return aApplied - bApplied;
    });
    setFilteredTasks(result);
  };

  const handleLocationFilter = async () => {
    if (!userLocation.trim()) {
      toast({ title: 'Location required', description: 'Enter your location first.', variant: 'destructive' });
      return;
    }
    const filtered = (await filterTasksByDistance(filteredTasks)) as Task[];
    setFilteredTasks(filtered);
    toast({ title: 'Tasks filtered', description: `Showing ${filtered.length} within ${maxMiles} mi.` });
  };

  const handleGetLocation = async () => {
    const loc = await getUserCurrentLocation();
    if (loc) {
      setUserLocation(loc);
      toast({ title: 'Location detected' });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
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
              className="rounded-full px-8 h-12 self-start md:self-auto"
            >
              Post a Task
            </Button>
          </motion.div>

          {/* Search bar */}
          <div
            className="bg-card rounded-[20px] p-2 flex flex-col md:flex-row items-stretch gap-2 mb-4"
            style={{ boxShadow: '0 20px 60px hsl(60 3% 17% / 0.08)' }}
          >
            <div className="flex items-center flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground/60 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search tasks…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 outline-none py-3 text-base font-body placeholder:text-muted-foreground/60"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="md:w-56 border-0 bg-background rounded-2xl h-12 font-body">
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
            className="bg-card rounded-[20px] p-4 mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-3"
            style={{ boxShadow: '0 10px 40px hsl(60 3% 17% / 0.05)' }}
          >
            <MapPin className="w-5 h-5 text-primary ml-2 shrink-0 hidden md:block" />
            <input
              type="text"
              placeholder="Your city or address (for distance filter)…"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="flex-1 bg-background rounded-2xl px-4 py-2.5 outline-none font-body text-sm"
            />
            <Button variant="ghost" size="icon" onClick={handleGetLocation} className="rounded-full" title="Use my current location">
              <Locate className="w-4 h-4" />
            </Button>
            <Select value={maxMiles.toString()} onValueChange={(v) => setMaxMiles(Number(v))}>
              <SelectTrigger className="w-32 bg-background border-0 rounded-2xl font-body text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 mi</SelectItem>
                <SelectItem value="10">10 mi</SelectItem>
                <SelectItem value="25">25 mi</SelectItem>
                <SelectItem value="50">50 mi</SelectItem>
                <SelectItem value="0">No limit</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleLocationFilter} disabled={isFiltering || !userLocation.trim()} className="rounded-full">
              {isFiltering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Filter'}
            </Button>
          </div>

          {/* AI Recs */}
          {user && recommendations.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm uppercase tracking-wider text-primary">
                  Recommended for you
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations
                  .filter((rec) => !appliedTaskIds.has(rec.id))
                  .slice(0, 3)
                  .map((rec) => {
                    const task = tasks.find((t) => t.id === rec.id);
                    if (!task) return null;
                    return <TaskCard key={task.id} task={task} featured applied={false} />;
                  })}
              </div>
            </div>
          )}

          {/* Task grid */}
          {filteredTasks.length === 0 ? (
            <div
              className="bg-card rounded-3xl p-12 text-center"
              style={{ boxShadow: '0 20px 60px hsl(60 3% 17% / 0.08)' }}
            >
              <p className="font-display text-2xl mb-3">No tasks yet</p>
              <p className="font-body text-muted-foreground mb-6">Be the first neighbor to post.</p>
              <Button onClick={() => navigate('/post-task')} className="rounded-full px-6">
                Post a task
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredTasks.map((task, i) => (
                <TaskCard key={task.id} task={task} delay={i * 0.04} applied={appliedTaskIds.has(task.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
