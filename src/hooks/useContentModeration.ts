import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

export function useContentModeration() {
  const [isChecking, setIsChecking] = useState(false);

  const moderateTask = useCallback(async (
    title: string,
    description: string,
    category: string,
    isYoungNeighbor: boolean
  ): Promise<ModerationResult> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          type: 'moderate-task',
          data: { title, description, category, isYoungNeighbor }
        }
      });

      if (error) {
        console.error('Moderation error:', error);
        // Fail open — allow the task if moderation service is unavailable
        return { allowed: true };
      }

      // Parse the AI response which should be JSON
      const resultText = data?.result || '';
      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            allowed: parsed.allowed === true,
            reason: parsed.reason || undefined,
            severity: parsed.severity || 'low'
          };
        }
      } catch {
        // If we can't parse the response, fail open
        console.warn('Could not parse moderation response:', resultText);
      }

      return { allowed: true };
    } catch (error) {
      console.error('Content moderation error:', error);
      // Fail open on errors
      return { allowed: true };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const moderateMessage = useCallback(async (
    message: string,
    isYoungNeighbor: boolean
  ): Promise<ModerationResult> => {
    // Reuse the same moderation with message as description
    return moderateTask('Offer Message', message, 'message', isYoungNeighbor);
  }, [moderateTask]);

  const moderateText = useCallback(async (
    text: string,
    context: string,
    isYoungNeighbor: boolean = false
  ): Promise<ModerationResult> => {
    const trimmed = (text || '').trim();
    // Skip tiny inputs — nothing meaningful to moderate; keeps it gentle and fast
    if (trimmed.length < 8) return { allowed: true };
    return moderateTask(context, trimmed, context, isYoungNeighbor);
  }, [moderateTask]);

  return {
    isChecking,
    moderateTask,
    moderateMessage,
    moderateText,
  };
}
