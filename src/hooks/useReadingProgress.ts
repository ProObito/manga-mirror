import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  page: number;
  lastRead: string;
}

export const useReadingProgress = (mangaId?: string, chapterId?: string) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current progress
  const fetchProgress = useCallback(async () => {
    if (!user || !mangaId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .order('last_read', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProgress({
          mangaId: data.manga_id,
          chapterId: data.chapter_id,
          page: data.page || 0,
          lastRead: data.last_read || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching reading progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user, mangaId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Update progress
  const updateProgress = useCallback(async (
    newChapterId: string,
    page: number
  ) => {
    if (!user || !mangaId) return;

    try {
      // Check if entry exists
      const { data: existing } = await supabase
        .from('reading_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .maybeSingle();

      const updateData = {
        user_id: user.id,
        manga_id: mangaId,
        chapter_id: newChapterId,
        page,
        last_read: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from('reading_history')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('reading_history')
          .insert(updateData);
      }

      setProgress({
        mangaId,
        chapterId: newChapterId,
        page,
        lastRead: updateData.last_read,
      });
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  }, [user, mangaId]);

  // Get all reading history for user
  const getAllHistory = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select(`
          *,
          manga:manga_id (id, title, cover_url),
          chapter:chapter_id (id, number, title)
        `)
        .eq('user_id', user.id)
        .order('last_read', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reading history:', error);
      return [];
    }
  }, [user]);

  return {
    progress,
    loading,
    updateProgress,
    getAllHistory,
    refetch: fetchProgress,
  };
};

export default useReadingProgress;
