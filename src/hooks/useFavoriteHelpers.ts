import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFavoriteHelpers() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) { setFavoriteIds(new Set()); return; }
    setLoading(true);
    const { data } = await supabase
      .from('favorite_helpers' as any)
      .select('helper_id')
      .eq('user_id', user.id);
    setFavoriteIds(new Set(((data as any) || []).map((r: any) => r.helper_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggle = useCallback(async (helperId: string) => {
    if (!user) { toast.error('Sign in to save trusted helpers'); return; }
    if (helperId === user.id) return;
    const isFav = favoriteIds.has(helperId);
    // optimistic
    setFavoriteIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(helperId) : next.add(helperId);
      return next;
    });
    if (isFav) {
      const { error } = await supabase.from('favorite_helpers' as any)
        .delete().eq('user_id', user.id).eq('helper_id', helperId);
      if (error) { toast.error('Could not remove'); fetchFavorites(); }
      else toast.success('Removed from trusted helpers');
    } else {
      const { error } = await supabase.from('favorite_helpers' as any)
        .insert({ user_id: user.id, helper_id: helperId } as any);
      if (error) { toast.error('Could not save'); fetchFavorites(); }
      else toast.success('Added to trusted helpers');
    }
  }, [user, favoriteIds, fetchFavorites]);

  return { favoriteIds, toggle, loading, refetch: fetchFavorites };
}
