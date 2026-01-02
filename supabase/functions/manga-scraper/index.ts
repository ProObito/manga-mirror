import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MangaData {
  title: string;
  alternative_names?: string[];
  cover_url?: string;
  summary?: string;
  genres?: string[];
  author?: string;
  artist?: string;
  status?: string;
  source: string;
  source_url: string;
  chapters?: ChapterData[];
}

interface ChapterData {
  number: number;
  title: string;
  images: string[];
}

// Scraper configurations for different sources
const scrapers: Record<string, {
  baseUrl: string;
  searchUrl: (query: string) => string;
  parseSearch: (html: string) => Array<{ title: string; url: string; cover?: string }>;
  parseDetail: (html: string, url: string) => Partial<MangaData>;
  parseChapters: (html: string) => Array<{ number: number; title: string; url: string }>;
  parseChapterImages: (html: string) => string[];
}> = {
  // MangaDex API-based scraper (official API, no scraping needed)
  mangadex: {
    baseUrl: "https://api.mangadex.org",
    searchUrl: (query) => `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art`,
    parseSearch: (json) => {
      try {
        const data = JSON.parse(json);
        return data.data?.map((manga: any) => {
          const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
          const coverUrl = cover?.attributes?.fileName 
            ? `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`
            : undefined;
          return {
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || "Unknown",
            url: `https://mangadex.org/title/${manga.id}`,
            cover: coverUrl
          };
        }) || [];
      } catch {
        return [];
      }
    },
    parseDetail: (json, url) => {
      try {
        const data = JSON.parse(json);
        const manga = data.data;
        if (!manga) return {};
        
        const cover = manga.relationships?.find((r: any) => r.type === "cover_art");
        const author = manga.relationships?.find((r: any) => r.type === "author");
        const artist = manga.relationships?.find((r: any) => r.type === "artist");
        
        return {
          title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || "Unknown",
          alternative_names: Object.values(manga.attributes.altTitles?.flatMap((t: any) => Object.values(t)) || []) as string[],
          cover_url: cover?.attributes?.fileName 
            ? `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}`
            : undefined,
          summary: manga.attributes.description?.en || Object.values(manga.attributes.description || {})[0] as string,
          genres: manga.attributes.tags?.filter((t: any) => t.type === "tag").map((t: any) => t.attributes.name.en) || [],
          author: author?.attributes?.name,
          artist: artist?.attributes?.name,
          status: manga.attributes.status,
          source: "mangadex",
          source_url: url
        };
      } catch {
        return {};
      }
    },
    parseChapters: (json) => {
      try {
        const data = JSON.parse(json);
        return data.data?.map((ch: any) => ({
          number: parseFloat(ch.attributes.chapter) || 0,
          title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
          url: ch.id
        })).sort((a: any, b: any) => a.number - b.number) || [];
      } catch {
        return [];
      }
    },
    parseChapterImages: (json) => {
      try {
        const data = JSON.parse(json);
        const baseUrl = data.baseUrl;
        const hash = data.chapter.hash;
        return data.chapter.data?.map((page: string) => `${baseUrl}/data/${hash}/${page}`) || [];
      } catch {
        return [];
      }
    }
  }
};

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      if (res.ok) {
        return await res.text();
      }
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error);
    }
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { action, source = "mangadex", query, mangaUrl, mangaId, syncAll } = await req.json();
    
    console.log(`Scraper action: ${action}, source: ${source}`);

    // Search for manga
    if (action === "search") {
      if (!query) {
        return new Response(JSON.stringify({ error: "Query required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const scraper = scrapers[source];
      if (!scraper) {
        return new Response(JSON.stringify({ error: "Unknown source" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const searchUrl = scraper.searchUrl(query);
      const html = await fetchWithRetry(searchUrl);
      const results = scraper.parseSearch(html);

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Import manga from URL
    if (action === "import") {
      if (!mangaUrl && !mangaId) {
        return new Response(JSON.stringify({ error: "mangaUrl or mangaId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // For MangaDex, extract ID from URL or use directly
      let mdId = mangaId;
      if (mangaUrl && mangaUrl.includes("mangadex.org")) {
        const match = mangaUrl.match(/\/title\/([a-f0-9-]+)/);
        mdId = match?.[1];
      }

      if (!mdId) {
        return new Response(JSON.stringify({ error: "Could not extract manga ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from("manga")
        .select("id, title")
        .eq("source_url", `https://mangadex.org/title/${mdId}`)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ 
          message: "Manga already exists", 
          manga: existing 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Fetch manga details
      const detailUrl = `https://api.mangadex.org/manga/${mdId}?includes[]=cover_art&includes[]=author&includes[]=artist`;
      const detailJson = await fetchWithRetry(detailUrl);
      const mangaData = scrapers.mangadex.parseDetail(detailJson, `https://mangadex.org/title/${mdId}`);

      if (!mangaData.title) {
        return new Response(JSON.stringify({ error: "Could not parse manga details" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Insert manga
      const { data: newManga, error: insertError } = await supabase
        .from("manga")
        .insert({
          title: mangaData.title,
          alternative_names: mangaData.alternative_names || [],
          cover_url: mangaData.cover_url,
          summary: mangaData.summary,
          genres: mangaData.genres || [],
          author: mangaData.author,
          artist: mangaData.artist,
          status: mangaData.status || "ongoing",
          source: "mangadex",
          source_url: `https://mangadex.org/title/${mdId}`
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Fetch chapters
      const chaptersUrl = `https://api.mangadex.org/manga/${mdId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`;
      const chaptersJson = await fetchWithRetry(chaptersUrl);
      const chapters = scrapers.mangadex.parseChapters(chaptersJson);

      // Insert chapters (without images for now, they're fetched on-demand)
      const chapterInserts = chapters.slice(0, 100).map(ch => ({
        manga_id: newManga.id,
        number: ch.number,
        title: ch.title,
        images: [] // Images fetched when user reads
      }));

      if (chapterInserts.length > 0) {
        await supabase.from("chapters").insert(chapterInserts);
      }

      return new Response(JSON.stringify({ 
        message: "Manga imported successfully",
        manga: newManga,
        chaptersImported: chapterInserts.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Sync all scrapers
    if (action === "sync") {
      const { data: sources } = await supabase
        .from("scraper_sources")
        .select("*")
        .eq("is_active", true);

      const results = [];
      for (const source of sources || []) {
        // Update last_sync
        await supabase
          .from("scraper_sources")
          .update({ last_sync: new Date().toISOString() })
          .eq("id", source.id);
        
        results.push({ source: source.name, status: "synced" });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // List available sources
    if (action === "sources") {
      return new Response(JSON.stringify({ 
        sources: Object.keys(scrapers).map(key => ({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          available: true
        }))
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Scraper error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
