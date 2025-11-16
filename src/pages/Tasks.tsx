import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { MapPin, DollarSign, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch tasks when component mounts or when navigating to /tasks
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('Fetching tasks...');
      
      // Check authentication status for debugging
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user ? `Authenticated as ${user.id}` : 'Anonymous user');

      // Query tasks first (without join to avoid relationship issues)
      // Note: RLS policy should allow anonymous users to view open tasks
      // We'll filter for 'open' status in JavaScript after fetching
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')  // Only fetch open tasks for browse page
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw tasksError;
      }

      console.log('Tasks fetched (raw):', tasksData);
      console.log('Number of tasks fetched:', tasksData?.length || 0);
      
      // Log status of all fetched tasks for debugging
      if (tasksData && tasksData.length > 0) {
        console.log('Status breakdown:', tasksData.map((t: any) => ({ id: t.id, status: t.status, title: t.title })));
      }

      if (!tasksData || tasksData.length === 0) {
        console.log('No tasks found - RLS may be blocking or no tasks exist');
        setTasks([]);
        return;
      }

      console.log('Open tasks found:', tasksData.length);

      // Fetch profiles separately
      const userIds = [...new Set(tasksData.map((t: any) => t.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      console.log('Profiles fetched:', profilesData);

      // Create a map of user_id to full_name
      const profilesMap = new Map(
        (profilesData || []).map((p: any) => [p.id, p.full_name])
      );

      // Combine tasks with profiles
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
      
      console.log('Final formatted tasks:', formattedTasks);
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
      <div className="min-h-screen bg-muted/30 py-12">
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

          <div className="grid md:grid-cols-2 gap-4 mb-8">
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