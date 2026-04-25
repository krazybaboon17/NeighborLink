import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { parseCoords, haversineMiles, type Coords } from '@/lib/distance';

export function useLocationFilter<T extends { id: string; location: string }>() {
  const [isFiltering, setIsFiltering] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [maxMiles, setMaxMiles] = useState<number>(5);

  const filterTasksByDistance = useCallback(
    async (tasks: T[]): Promise<T[]> => {
      if (!userLocation.trim() || tasks.length === 0) return tasks;
      // 0 = no limit
      if (maxMiles === 0) return tasks;

      // Fast path: if userLocation is "lat, lng", filter client-side via Haversine
      // (no edge function call, no AI tokens, instant).
      const userCoords = parseCoords(userLocation);
      if (userCoords) {
        const filtered = tasks.filter((task) => {
          const taskCoords = parseCoords(task.location);
          if (!taskCoords) return true; // free-text location → don't drop, fall back
          return haversineMiles(userCoords, taskCoords) <= maxMiles;
        });
        // If at least one task had coords, trust the filter. Otherwise fall through to AI.
        const anyCoords = tasks.some((t) => parseCoords(t.location));
        if (anyCoords) return filtered;
      }

      // Slow path: free-text addresses → AI edge function
      setIsFiltering(true);
      try {
        const { data, error } = await supabase.functions.invoke('filter-tasks-by-distance', {
          body: {
            tasks: tasks.map((t) => ({ id: t.id, location: t.location })),
            userLocation,
            maxMiles,
          },
        });
        if (error) {
          // Fail open — show all tasks rather than nothing
          return tasks;
        }
        const taskIds: string[] = data?.taskIds || [];
        return tasks.filter((task) => taskIds.includes(task.id));
      } catch {
        return tasks;
      } finally {
        setIsFiltering(false);
      }
    },
    [userLocation, maxMiles],
  );

  const getUserCurrentLocation = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => resolve(''),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }, []);

  /**
   * Compute distance from the user (in miles) for a single task with
   * known coordinate format. Returns null when either side has no coords.
   */
  const distanceFor = useCallback(
    (taskLocation: string): number | null => {
      const u = parseCoords(userLocation);
      const t = parseCoords(taskLocation);
      if (!u || !t) return null;
      return haversineMiles(u, t);
    },
    [userLocation],
  );

  return {
    isFiltering,
    userLocation,
    setUserLocation,
    maxMiles,
    setMaxMiles,
    filterTasksByDistance,
    getUserCurrentLocation,
    distanceFor,
  };
}

// Re-export so other modules can grab it without a separate import path
export type { Coords };
