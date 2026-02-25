import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Sparkles, DollarSign, Wand2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const categories = [
  'Lawn Care', 'Snow Removal', 'Moving Help', 'Grocery Runs',
  'Home Repairs', 'Babysitting', 'Handyman', 'Errands', 'Other'
];

export default function PostTask() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAIDescription = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title first');
      return;
    }
    if (!category) {
      toast.error('Please select a category first');
      return;
    }
    setAiLoading('description');
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: { type: 'generate-description', data: { title, category } }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.result) {
        setDescription(data.result);
        toast.success('AI description generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate description');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIPricing = async () => {
    if (!title.trim() || !category) {
      toast.error('Please enter a title and category first');
      return;
    }
    setAiLoading('pricing');
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          type: 'suggest-pricing',
          data: { title, category, description, location }
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.result) {
        try {
          // Try to parse JSON from the result
          const jsonMatch = data.result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const pricing = JSON.parse(jsonMatch[0]);
            setBudgetMin(String(pricing.min));
            setBudgetMax(String(pricing.max));
            if (pricing.reasoning) {
              toast.success(`AI pricing: ${pricing.reasoning}`);
            } else {
              toast.success('AI pricing suggestion applied!');
            }
          }
        } catch {
          toast.error('Could not parse pricing suggestion');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get pricing suggestion');
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to post a task');
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          location,
          budget_min: parseInt(budgetMin),
          budget_max: parseInt(budgetMax),
          status: 'open'
        });

      if (error) throw error;
      toast.success('Task posted successfully!');
      navigate('/tasks');
    } catch (error: any) {
      console.error('Error posting task:', error);
      toast.error(error.message || 'Error posting task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-transparent py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  Post a New Task
                  <Badge variant="secondary" className="text-xs font-normal gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Describe what you need help with — AI can help write descriptions and suggest pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Mow my lawn this weekend"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-primary hover:text-primary/80"
                        onClick={handleAIDescription}
                        disabled={aiLoading === 'description'}
                      >
                        {aiLoading === 'description' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        AI Generate
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Provide details about the task... or let AI generate it!"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Arlington Heights, IL"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Budget Range</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-primary hover:text-primary/80"
                        onClick={handleAIPricing}
                        disabled={aiLoading === 'pricing'}
                      >
                        {aiLoading === 'pricing' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <DollarSign className="w-3 h-3" />
                        )}
                        AI Suggest Price
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="budgetMin" className="text-xs text-muted-foreground">Min ($)</Label>
                        <Input
                          id="budgetMin"
                          type="number"
                          placeholder="20"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="budgetMax" className="text-xs text-muted-foreground">Max ($)</Label>
                        <Input
                          id="budgetMax"
                          type="number"
                          placeholder="50"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Task
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
