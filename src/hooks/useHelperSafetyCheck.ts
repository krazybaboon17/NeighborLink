import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SafetyCheckResult {
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  showWarning: boolean;
  message: string;
}

export function useHelperSafetyCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);

  const checkHelperSafety = useCallback(async (
    helperId: string,
    helperProfile: {
      full_name: string | null;
      rating: number | null;
      completed_tasks: number | null;
      verified: boolean | null;
    }
  ): Promise<SafetyCheckResult> => {
    setIsChecking(true);

    try {
      // Fetch helper's reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, comment, created_at')
        .eq('helper_id', helperId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data, error } = await supabase.functions.invoke('check-helper-safety', {
        body: {
          helperProfile,
          reviews: reviews || []
        }
      });

      if (error) {
        console.error('Safety check error:', error);
        return {
          riskLevel: 'low',
          warnings: [],
          showWarning: false,
          message: 'Unable to perform safety check'
        };
      }

      const result = data as SafetyCheckResult;
      setSafetyResult(result);
      return result;
    } catch (error) {
      console.error('Error checking helper safety:', error);
      return {
        riskLevel: 'low',
        warnings: [],
        showWarning: false,
        message: 'Unable to perform safety check'
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setSafetyResult(null);
  }, []);

  return {
    isChecking,
    safetyResult,
    checkHelperSafety,
    clearResult
  };
}
