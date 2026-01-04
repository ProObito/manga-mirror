import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AutoScrollSettings {
  enabled: boolean;
  speed: number; // 1-10
  pauseOnManualScroll: boolean;
}

const SPEED_CONFIG = [
  { interval: 100, pixels: 1 },   // 1 - Slowest
  { interval: 80, pixels: 1 },    // 2
  { interval: 60, pixels: 1 },    // 3
  { interval: 50, pixels: 2 },    // 4
  { interval: 50, pixels: 2 },    // 5 - Medium
  { interval: 40, pixels: 2 },    // 6
  { interval: 30, pixels: 3 },    // 7
  { interval: 20, pixels: 3 },    // 8
  { interval: 16, pixels: 3 },    // 9
  { interval: 16, pixels: 4 },    // 10 - Fastest
];

const LOCAL_STORAGE_KEY = 'autoScrollSettings';

export function useAutoScroll() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AutoScrollSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { enabled: false, speed: 5, pauseOnManualScroll: true };
      }
    }
    return { enabled: false, speed: 5, pauseOnManualScroll: true };
  });
  
  const [isPaused, setIsPaused] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTop = useRef(0);
  const manualScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save to database for logged-in users
  useEffect(() => {
    if (user) {
      const saveToDb = async () => {
        // Store in user preferences if needed (using profiles table)
        // For now, localStorage is sufficient
      };
      saveToDb();
    }
  }, [settings, user]);

  const startScrolling = useCallback((container?: HTMLElement | null) => {
    const target = container || document.documentElement;
    const speedConfig = SPEED_CONFIG[settings.speed - 1] || SPEED_CONFIG[4];

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    scrollIntervalRef.current = setInterval(() => {
      if (!isPaused && settings.enabled) {
        const maxScroll = target.scrollHeight - target.clientHeight;
        const currentScroll = target.scrollTop;
        
        if (currentScroll < maxScroll) {
          target.scrollTop += speedConfig.pixels;
        } else {
          // Reached end, stop scrolling
          setSettings(prev => ({ ...prev, enabled: false }));
        }
      }
    }, speedConfig.interval);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [settings.enabled, settings.speed, isPaused]);

  const stopScrolling = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  // Handle manual scroll detection
  const handleManualScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (!settings.pauseOnManualScroll || !settings.enabled) return;

    const target = e.currentTarget;
    const currentScrollTop = target.scrollTop;
    
    // If scroll direction changed or large jump, assume manual scroll
    const diff = Math.abs(currentScrollTop - lastScrollTop.current);
    
    if (diff > 10) {
      setIsPaused(true);
      
      if (manualScrollTimeout.current) {
        clearTimeout(manualScrollTimeout.current);
      }
      
      manualScrollTimeout.current = setTimeout(() => {
        setIsPaused(false);
      }, 2000);
    }
    
    lastScrollTop.current = currentScrollTop;
  }, [settings.pauseOnManualScroll, settings.enabled]);

  // Start/stop scrolling based on enabled state
  useEffect(() => {
    if (settings.enabled) {
      startScrolling();
    } else {
      stopScrolling();
    }

    return () => stopScrolling();
  }, [settings.enabled, settings.speed, startScrolling, stopScrolling]);

  const toggleEnabled = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    setIsPaused(false);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(1, Math.min(10, speed));
    setSettings(prev => ({ ...prev, speed: clampedSpeed }));
  }, []);

  const togglePauseOnManualScroll = useCallback(() => {
    setSettings(prev => ({ ...prev, pauseOnManualScroll: !prev.pauseOnManualScroll }));
  }, []);

  const resumeFromPause = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    settings,
    isPaused,
    toggleEnabled,
    setSpeed,
    togglePauseOnManualScroll,
    resumeFromPause,
    handleManualScroll,
    startScrolling,
    stopScrolling,
  };
}
