// src/hooks/useMangaBackend.ts
// React Hooks for Manga Backend

import { useState, useEffect } from 'react';
import { MangaBackendAPI, ScrapeResponse, StorageResponse } from '@/services/mangaBackend';

export function useMangaScraper() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrape = async (source = "all", limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await MangaBackendAPI.scrapeManga(source, limit);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { scrape, loading, data, error };
}

export function useStorageStats() {
  const [stats, setStats] = useState<StorageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await MangaBackendAPI.getStorageStats();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refresh: fetchStats };
}
