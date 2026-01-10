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

      // Check if download count should be reset (monthly)
      const lastReset = data.last_download_reset ? new Date(data.last_download_reset) : null;
      const now = new Date();
      const shouldReset = !lastReset || 
        (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear());

      if (shouldReset && !data.is_premium) {
        // Reset download count for new month
        await supabase
          .from('profiles')
          .update({ 
            download_count: 0, 
            last_download_reset: now.toISOString() 
          })
          .eq('id', user.id);
      }

      setProfile({
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        tokens: data.tokens || 0,
        isPremium: data.is_premium || false,
        premiumExpiresAt: data.premium_expires_at,
        customLogoUrl: data.custom_logo_url,
        downloadCount: shouldReset ? 0 : (data.download_count || 0),
        lastDownloadReset: data.last_download_reset,
        themePreference: data.theme_preference,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      if (updates.customLogoUrl !== undefined) dbUpdates.custom_logo_url = updates.customLogoUrl;
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

      await updateProfile({ customLogoUrl: publicUrl });
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
      
      const { error } = await supabase
        .from('profiles')
        .update({ download_count: newCount })
        .eq('id', user.id);

      if (error) throw error;

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
