import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  tokens: number;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  customLogoUrl: string | null;
  downloadCount: number;
  lastDownloadReset: string | null;
  themePreference: string | null;
}

const MAX_FREE_DOWNLOADS = 20;
const DOWNLOAD_STORAGE_KEY = 'manga_download_data';

interface DownloadData {
  count: number;
  lastReset: string;
}

const getDownloadData = (userId: string): DownloadData => {
  try {
    const stored = localStorage.getItem(`${DOWNLOAD_STORAGE_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { count: 0, lastReset: new Date().toISOString() };
};

const setDownloadData = (userId: string, data: DownloadData) => {
  localStorage.setItem(`${DOWNLOAD_STORAGE_KEY}_${userId}`, JSON.stringify(data));
};

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Get download data from localStorage (until DB migration is applied)
      const downloadData = getDownloadData(user.id);
      const lastReset = new Date(downloadData.lastReset);
      const now = new Date();
      
      // Check if download count should be reset (monthly)
      const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                          now.getFullYear() !== lastReset.getFullYear();

      if (shouldReset) {
        downloadData.count = 0;
        downloadData.lastReset = now.toISOString();
        setDownloadData(user.id, downloadData);
      }

      setProfile({
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        tokens: data.tokens || 0,
        isPremium: false, // Will be enabled after migration
        premiumExpiresAt: null,
        customLogoUrl: null,
        downloadCount: downloadData.count,
        lastDownloadReset: downloadData.lastReset,
        themePreference: data.theme_preference,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Create a minimal profile from auth user
      if (user) {
        const downloadData = getDownloadData(user.id);
        setProfile({
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
          tokens: 0,
          isPremium: false,
          premiumExpiresAt: null,
          customLogoUrl: null,
          downloadCount: downloadData.count,
          lastDownloadReset: downloadData.lastReset,
          themePreference: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.themePreference !== undefined) dbUpdates.theme_preference = updates.themePreference;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: (error as Error).message };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'Not authenticated', url: null };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatarUrl: publicUrl });
      return { error: null, url: publicUrl };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { error: (error as Error).message, url: null };
    }
  };

  const uploadCustomLogo = async (file: File) => {
    if (!user || !profile?.isPremium) {
      return { error: 'Premium required', url: null };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('custom-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('custom-logos')
        .getPublicUrl(fileName);

      // Store in profile state only (no DB column yet)
      setProfile(prev => prev ? { ...prev, customLogoUrl: publicUrl } : null);
      return { error: null, url: publicUrl };
    } catch (error) {
      console.error('Error uploading custom logo:', error);
      return { error: (error as Error).message, url: null };
    }
  };

  const canDownload = () => {
    if (!profile) return false;
    if (profile.isPremium) return true;
    return profile.downloadCount < MAX_FREE_DOWNLOADS;
  };

  const getRemainingDownloads = () => {
    if (!profile) return 0;
    if (profile.isPremium) return Infinity;
    return Math.max(0, MAX_FREE_DOWNLOADS - profile.downloadCount);
  };

  const incrementDownloadCount = async () => {
    if (!user || !profile) return { error: 'Not authenticated' };
    if (profile.isPremium) return { error: null };

    try {
      const newCount = profile.downloadCount + 1;
      
      // Store in localStorage
      const downloadData = getDownloadData(user.id);
      downloadData.count = newCount;
      setDownloadData(user.id, downloadData);

      setProfile(prev => prev ? { ...prev, downloadCount: newCount } : null);
      return { error: null };
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return { error: (error as Error).message };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    uploadCustomLogo,
    canDownload,
    getRemainingDownloads,
    incrementDownloadCount,
    refetch: fetchProfile,
    maxFreeDownloads: MAX_FREE_DOWNLOADS,
  };
};

export default useUserProfile;
