import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaskRecommendation {
  id: string;
  reason: string;
}

export function useTaskRecommendations() {
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getRecommendations = useCallback(async (
    userId: string,
    availableTasks: any[]
  ) => {
    if (availableTasks.length === 0) {
      setRecommendations([]);
      return [];
    }

    setIsLoading(true);

    try {
      // Fetch user's skills from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('skills')
        .eq('id', userId)
        .single();

      // Fetch user's completed task categories
      const { data: completedOffers } = await supabase
        .from('offers')
        .select('task_id')
        .eq('helper_id', userId)
        .eq('status', 'accepted');

      let completedCategories: string[] = [];
      if (completedOffers && completedOffers.length > 0) {
        const taskIds = completedOffers.map(o => o.task_id);
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('category')
          .in('id', taskIds)
          .eq('status', 'completed');

        if (completedTasks) {
          completedCategories = [...new Set(completedTasks.map(t => t.category))] as string[];
        }
      }

      const { data, error } = await supabase.functions.invoke('recommend-tasks', {
        body: {
          userSkills: profile?.skills || [],
          completedCategories,
          availableTasks
        }
      });

      if (error) {
        console.error('Recommendation error:', error);
        return [];
      }

      const recs = data?.recommendations || [];
      setRecommendations(recs);
      return recs;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommendations,
    isLoading,
    getRecommendations
  };
}
