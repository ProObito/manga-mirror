// src/services/mangaBackend.ts
// CodeWords Backend API Integration

const API_BASE = "https://runtime.codewords.ai/run/manga_aggregator_backend_04975b04";
const API_KEY = process.env.NEXT_PUBLIC_CODEWORDS_API_KEY;

export interface MangaMetadata {
  title: string;
  slug: string;
  description?: string;
  cover_image_url: string;
  original_cover_url: string;
  type: string;
  genres: string[];
  themes: string[];
  score?: number;
  followers?: number;
  source_site: string;
  source_url: string;
  scraped_at: string;
}

export interface StorageStats {
  db_id: number;
  total_size_mb: number;
  used_size_mb: number;
  free_size_mb: number;
  usage_percentage: number;
  is_active: boolean;
  manga_count: number;
  status: string;
}

export interface ScrapeResponse {
  status: string;
  manga_scraped: number;
  manga_stored: number;
  active_db: number;
  storage_stats: StorageStats[];
  message: string;
  errors: string[];
}

export interface StorageResponse {
  status: string;
  active_db: number;
  total_manga_count: number;
  storage_stats: StorageStats[];
  alert?: string;
}

export class MangaBackendAPI {
  static async scrapeManga(
    source: string = "all",
    limit: number = 10,
    setupSchedule: boolean = false
  ): Promise<ScrapeResponse> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ source, limit, setup_schedule: setupSchedule }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  static async getStorageStats(): Promise<StorageResponse> {
    const response = await fetch(`${API_BASE}/storage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ include_details: true }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  static async healthCheck() {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  }
}
