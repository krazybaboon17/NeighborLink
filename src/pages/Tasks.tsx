import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { MapPin, Clock, Search, Locate, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useLocationFilter } from '@/hooks/useLocationFilter';
import { useTaskRecommendations } from '@/hooks/useTaskRecommendations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { recommendations, isLoading: isLoadingRecs, getRecommendations } = useTaskRecommendations();

  const {
    isFiltering,
    userLocation,
    setUserLocation,
    maxMiles,
    setMaxMiles,
    filterTasksByDistance,
    getUserCurrentLocation
  } = useLocationFilter();

  useEffect(() => {
    fetchTasks();
  }, [location.pathname]);

  useEffect(() => {
    applyFilters();
    // Get AI recommendations when tasks load
    if (user && tasks.length > 0) {
      getRecommendations(user.id, tasks);
    }
  }, [tasks, searchTerm, categoryFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        return;
      }

      const userIds = [...new Set(tasksData.map((t: any) => t.user_id))];
      const { data: profilesData } = await supabase
        .from('public_profiles' as any)
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p: any) => [p.id, p.full_name])
      );

      const formattedTasks = tasksData.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        location: task.location,
        budget_min: task.budget_min,
        budget_max: task.budget_max,
        created_at: task.created_at,
        status: task.status,
        profiles: {
          full_name: profilesMap.get(task.user_id) || 'Anonymous'
        }
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    setFilteredTasks(result);
  };

  const handleLocationFilter = async () => {
    if (!userLocation.trim()) {
      toast({
        title: "Location required",
        description: "Please enter your location to filter by distance.",
        variant: "destructive"
      });
      return;
    }

    const filtered = await filterTasksByDistance(filteredTasks) as Task[];
    setFilteredTasks(filtered);

    toast({
      title: "Tasks filtered",
      description: `Showing ${filtered.length} tasks within ${maxMiles} miles.`
    });
  };

  const handleGetLocation = async () => {
    const loc = await getUserCurrentLocation();
    if (loc) {
      setUserLocation(loc);
      toast({
        title: "Location detected",
        description: "Your coordinates have been set. Click 'Filter by Distance' to apply."
      });
    } else {
      toast({
        title: "Location unavailable",
        description: "Could not detect your location. Please enter it manually.",
        variant: "destructive"
      });
    }
  };

  const clearLocationFilter = () => {
    setUserLocation('');
    applyFilters();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-transparent py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Browse Tasks</h1>
              <p className="text-muted-foreground">Find tasks in your area and start earning</p>
            </div>
            <Button variant="hero" size="lg" onClick={() => navigate('/post-task')}>
              Post a Task
            </Button>
          </div>

          {/* AI Recommendations */}
          {user && recommendations.length > 0 && (
            <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recommended for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {recommendations.slice(0, 3).map((rec) => {
                    const task = tasks.find(t => t.id === rec.id);
                    if (!task) return null;
                    return (
                      <Card
                        key={rec.id}
                        className="min-w-[250px] cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <CardContent className="p-4">
                          <Badge variant="secondary" className="mb-2">{task.category}</Badge>
                          <p className="font-medium line-clamp-1">{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}


          {/* Search and Category Filter */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Lawn Care">Lawn Care</SelectItem>
                <SelectItem value="Snow Removal">Snow Removal</SelectItem>
                <SelectItem value="Moving Help">Moving Help</SelectItem>
                <SelectItem value="Grocery Runs">Grocery Runs</SelectItem>
                <SelectItem value="Home Repairs">Home Repairs</SelectItem>
                <SelectItem value="Babysitting">Babysitting</SelectItem>
                <SelectItem value="Handyman">Handyman</SelectItem>
                <SelectItem value="Errands">Errands</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI-Powered Location Filter */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium mb-1.5 block">Your Location</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your city or address..."
                      value={userLocation}
                      onChange={(e) => setUserLocation(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleGetLocation}
                      title="Use my current location"
                    >
                      <Locate className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-full sm:w-36">
                  <label className="text-sm font-medium mb-1.5 block">Max Distance</label>
                  <Select value={maxMiles.toString()} onValueChange={(v) => setMaxMiles(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="15">15 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                      <SelectItem value="0">No limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleLocationFilter}
                    disabled={isFiltering || !userLocation.trim()}
                    className="flex-1 sm:flex-none"
                  >
                    {isFiltering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Filtering...
                      </>
                    ) : (
                      'Filter by Distance'
                    )}
                  </Button>
                  {userLocation && (
                    <Button variant="ghost" onClick={clearLocationFilter}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                AI-powered location filtering helps find tasks near you
              </p>
            </CardContent>
          </Card>

          {filteredTasks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground text-lg">No tasks found</p>
                <Button variant="link" onClick={() => navigate('/post-task')} className="mt-4">
                  Be the first to post a task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{task.category}</Badge>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        ${task.budget_min} - ${task.budget_max}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{task.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {task.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {task.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Posted {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm font-medium">
                      Posted by {task.profiles?.full_name || 'Anonymous'}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View Details & Make Offer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
