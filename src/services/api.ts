/**
 * Comicktown Backend API Service
 * Connects to your Heroku backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://townbackend-825d5dfe9e19.herokuapp.com/';

export interface Manga {
  _id?: string;
  title: string;
  url: string;
  cover_image: string;
  site: string;
  genres: string[];
  status: string;
  created_at?: string;
}

export interface Chapter {
  _id?: string;
  title: string;
  url: string;
  number: string;
  manga_title: string;
  manga_url: string;
  site: string;
  catbox_images?: string[];
  image_urls?: string[];
  total_images?: number;
  release_date?: string;
  created_at?: string;
}

export interface Stats {
  total_manga: number;
  total_chapters: number;
  by_site: Record<string, number>;
  timestamp: string;
}

class ComicktownAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async health(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  // Get all manga
  async getManga(site?: string, limit: number = 100): Promise<{ manga: Manga[]; count: number }> {
    const params = new URLSearchParams();
    if (site) params.append('site', site);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/api/manga?${params}`);
    if (!response.ok) throw new Error('Failed to fetch manga');
    return response.json();
  }

  // Get chapters for a manga
  async getChapters(mangaUrl: string): Promise<{ chapters: Chapter[]; count: number }> {
    const encodedUrl = encodeURIComponent(mangaUrl);
    const response = await fetch(`${this.baseUrl}/api/manga/${encodedUrl}/chapters`);
    if (!response.ok) throw new Error('Failed to fetch chapters');
    return response.json();
  }

  // Search manga
  async searchManga(query: string, site?: string): Promise<{ manga: Manga[]; count: number }> {
    const params = new URLSearchParams({ q: query });
    if (site) params.append('site', site);

    const response = await fetch(`${this.baseUrl}/api/search?${params}`);
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  }

  // Get latest updates
  async getLatest(limit: number = 20): Promise<{ chapters: Chapter[]; count: number }> {
    const response = await fetch(`${this.baseUrl}/api/latest?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch latest');
    return response.json();
  }

  // Get stats
  async getStats(): Promise<Stats> {
    const response = await fetch(`${this.baseUrl}/api/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  // Trigger scraping
  async triggerScrape(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/trigger-scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to trigger scrape');
    return response.json();
  }

  // Sync to Supabase
  async syncToSite(limit: number = 100): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/sync-to-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit })
    });
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
  }
}

export const comicktownAPI = new ComicktownAPI();
export default comicktownAPI;
