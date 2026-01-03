import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ThemeName = 
  | 'dark' 
  | 'light' 
  | 'blue' 
  | 'green' 
  | 'red' 
  | 'yellow' 
  | 'purple' 
  | 'orange' 
  | 'pink' 
  | 'cyan' 
  | 'amoled' 
  | 'sepia';

export const themes: { id: ThemeName; name: string; color: string }[] = [
  { id: 'dark', name: 'Dark', color: '#0a0a0a' },
  { id: 'light', name: 'Light', color: '#fafafa' },
  { id: 'blue', name: 'Blue', color: '#0d1117' },
  { id: 'green', name: 'Green', color: '#0d120d' },
  { id: 'red', name: 'Red', color: '#120d0d' },
  { id: 'yellow', name: 'Yellow', color: '#12110d' },
  { id: 'purple', name: 'Purple', color: '#0f0d12' },
  { id: 'orange', name: 'Orange', color: '#120f0d' },
  { id: 'pink', name: 'Pink', color: '#120d10' },
  { id: 'cyan', name: 'Cyan', color: '#0d1212' },
  { id: 'amoled', name: 'AMOLED Black', color: '#000000' },
  { id: 'sepia', name: 'Sepia', color: '#f5f0e6' },
];

export const useTheme = () => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeName) || 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Load user's theme preference from database
    const loadUserTheme = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', user.id)
        .single();
      
      if (data?.theme_preference) {
        setThemeState(data.theme_preference as ThemeName);
      }
    };

    loadUserTheme();
  }, [user]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    
    // Save to database if logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', user.id);
    }
  };

  return { theme, setTheme, themes };
};

export default useTheme;