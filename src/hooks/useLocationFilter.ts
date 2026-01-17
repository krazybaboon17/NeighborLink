import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useLocationFilter<T extends { id: string; location: string }>() {
  const [isFiltering, setIsFiltering] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [maxMiles, setMaxMiles] = useState<number>(10);

  const filterTasksByDistance = useCallback(async (tasks: T[]): Promise<T[]> => {
    if (!userLocation.trim() || tasks.length === 0) {
      return tasks;
    }

    // If maxMiles is 0 (no limit), return all tasks
    if (maxMiles === 0) {
      return tasks;
    }

    setIsFiltering(true);

    try {
      const { data, error } = await supabase.functions.invoke('filter-tasks-by-distance', {
        body: {
          tasks: tasks.map(t => ({
            id: t.id,
            location: t.location
          })),
          userLocation,
          maxMiles
        }
      });

      if (error) {
        console.error('Filter error:', error);
        return tasks;
      }

      const taskIds: string[] = data?.taskIds || [];
      return tasks.filter(task => taskIds.includes(task.id));
    } catch (error) {
      console.error('Filter error:', error);
      return tasks;
    } finally {
      setIsFiltering(false);
    }
  }, [userLocation, maxMiles]);

  const getUserCurrentLocation = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          resolve(locationString);
        },
        () => {
          resolve('');
        }
      );
    });
  }, []);

  return {
    isFiltering,
    userLocation,
    setUserLocation,
    maxMiles,
    setMaxMiles,
    filterTasksByDistance,
    getUserCurrentLocation
  };
}
