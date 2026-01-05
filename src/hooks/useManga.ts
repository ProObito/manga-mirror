/**
 * Custom hook for manga data fetching
 */
import { useState, useEffect } from 'react';
import { comicktownAPI, Manga, Chapter } from '../services/api';

export function useManga(site?: string, limit: number = 100) {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchManga() {
      try {
        setLoading(true);
        const data = await comicktownAPI.getManga(site, limit);
        setManga(data.manga);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load manga');
      } finally {
        setLoading(false);
      }
    }

    fetchManga();
  }, [site, limit]);

  return { manga, loading, error };
}

export function useChapters(mangaUrl: string | null) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mangaUrl) {
      setChapters([]);
      return;
    }

    async function fetchChapters() {
      try {
        setLoading(true);
        const data = await comicktownAPI.getChapters(mangaUrl);
        setChapters(data.chapters);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }

    fetchChapters();
  }, [mangaUrl]);

  return { chapters, loading, error };
}

export function useLatestUpdates(limit: number = 20) {
  const [updates, setUpdates] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLatest() {
      try {
        setLoading(true);
        const data = await comicktownAPI.getLatest(limit);
        setUpdates(data.chapters);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load updates');
      } finally {
        setLoading(false);
      }
    }

    fetchLatest();
  }, [limit]);

  return { updates, loading, error };
}

export function useSearch(query: string, site?: string) {
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await comicktownAPI.searchManga(query, site);
        setResults(data.manga);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, site]);

  return { results, loading, error };
}
