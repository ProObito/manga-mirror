import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ThemeName = 
  // Dark themes
  | 'midnight-dark' 
  | 'ocean-dark' 
  | 'forest-dark' 
  | 'crimson-dark' 
  | 'sunset-dark' 
  | 'violet-dark' 
  | 'sakura-dark' 
  | 'aqua-dark' 
  | 'golden-dark' 
  | 'amoled-dark' 
  | 'slate-dark' 
  | 'noir-dark'
  // Light themes
  | 'snow-light' 
  | 'ocean-light' 
  | 'forest-light' 
  | 'rose-light' 
  | 'sunset-light' 
  | 'lavender-light' 
  | 'sakura-light' 
  | 'aqua-light' 
  | 'golden-light' 
  | 'sepia-light' 
  | 'paper-light' 
  | 'mint-light';

export interface Theme {
  id: ThemeName;
  name: string;
  color: string;
  type: 'dark' | 'light';
}

export const darkThemes: Theme[] = [
  { id: 'midnight-dark', name: 'Midnight', color: '#0a0a0a', type: 'dark' },
  { id: 'ocean-dark', name: 'Ocean', color: '#0d1117', type: 'dark' },
  { id: 'forest-dark', name: 'Forest', color: '#0d120d', type: 'dark' },
  { id: 'crimson-dark', name: 'Crimson', color: '#120d0d', type: 'dark' },
  { id: 'sunset-dark', name: 'Sunset', color: '#120f0d', type: 'dark' },
  { id: 'violet-dark', name: 'Violet', color: '#0f0d12', type: 'dark' },
  { id: 'sakura-dark', name: 'Sakura', color: '#120d10', type: 'dark' },
  { id: 'aqua-dark', name: 'Aqua', color: '#0d1212', type: 'dark' },
  { id: 'golden-dark', name: 'Golden', color: '#12110d', type: 'dark' },
  { id: 'amoled-dark', name: 'AMOLED', color: '#000000', type: 'dark' },
  { id: 'slate-dark', name: 'Slate', color: '#141a24', type: 'dark' },
  { id: 'noir-dark', name: 'Noir', color: '#0f0f0f', type: 'dark' },
];

export const lightThemes: Theme[] = [
  { id: 'snow-light', name: 'Snow', color: '#fafafa', type: 'light' },
  { id: 'ocean-light', name: 'Ocean', color: '#f5f9fc', type: 'light' },
  { id: 'forest-light', name: 'Forest', color: '#f5faf5', type: 'light' },
  { id: 'rose-light', name: 'Rose', color: '#fcf5f7', type: 'light' },
  { id: 'sunset-light', name: 'Sunset', color: '#fdf8f5', type: 'light' },
  { id: 'lavender-light', name: 'Lavender', color: '#f9f5fc', type: 'light' },
  { id: 'sakura-light', name: 'Sakura', color: '#fdf5f8', type: 'light' },
  { id: 'aqua-light', name: 'Aqua', color: '#f5fcfc', type: 'light' },
  { id: 'golden-light', name: 'Golden', color: '#fcfaf0', type: 'light' },
  { id: 'sepia-light', name: 'Sepia', color: '#f5f0e6', type: 'light' },
  { id: 'paper-light', name: 'Paper', color: '#f7f5f2', type: 'light' },
  { id: 'mint-light', name: 'Mint', color: '#f2fcf7', type: 'light' },
];

export const themes: Theme[] = [...darkThemes, ...lightThemes];

export const useTheme = () => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeName) || 'midnight-dark';
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

  const currentTheme = themes.find(t => t.id === theme);
  const isDark = currentTheme?.type === 'dark';

  return { theme, setTheme, themes, darkThemes, lightThemes, currentTheme, isDark };
};

export default useTheme;
