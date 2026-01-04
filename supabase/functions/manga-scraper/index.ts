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
}

interface ChapterData {
  number: number;
  title: string;
  url: string;
}

// Helper to extract text between patterns
function extractBetween(html: string, start: string, end: string): string {
  const startIdx = html.indexOf(start);
  if (startIdx === -1) return "";
  const afterStart = html.substring(startIdx + start.length);
  const endIdx = afterStart.indexOf(end);
  if (endIdx === -1) return "";
  return afterStart.substring(0, endIdx).trim();
}

// Metadata sources (for info: title, summary, author, genres, etc.)
const metadataSources: Record<string, {
  name: string;
  displayName: string;
  baseUrl: string;
  searchUrl: (query: string) => string;
  parseSearch: (html: string) => Array<{ title: string; url: string; cover?: string; id?: string }>;
  parseDetail: (html: string, url: string) => Partial<MangaData>;
}> = {
  // MangaDex API-based scraper
  mangadex: {
    name: "mangadex",
    displayName: "MangaDex (Metadata)",
    baseUrl: "https://api.mangadex.org",
    searchUrl: (query) => `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art&includes[]=author&includes[]=artist`,
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
            cover: coverUrl,
            id: manga.id
          };
        }) || [];
      } catch {
        return [];
      }
    },
    parseDetail: (json: string, url: string) => {
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
    }
  },

  // Webtoons scraper for metadata
  webtoons: {
    name: "webtoons",
    displayName: "Webtoons (Metadata)",
    baseUrl: "https://www.webtoons.com",
    searchUrl: (query) => `https://www.webtoons.com/en/search?keyword=${encodeURIComponent(query)}`,
    parseSearch: (html) => {
      const results: Array<{ title: string; url: string; cover?: string }> = [];
      const cardPattern = /<a[^>]*href="([^"]*\/list[^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="[^"]*subj[^"]*"[^>]*>([^<]+)<\/p>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        results.push({
          url: match[1].startsWith("http") ? match[1] : `https://www.webtoons.com${match[1]}`,
          cover: match[2],
          title: match[3].trim()
        });
      }
      return results.slice(0, 20);
    },
    parseDetail: (html: string, url: string) => {
      const title = html.match(/<h1[^>]*class="[^"]*subj[^"]*"[^>]*>([^<]+)<\/h1>/)?.[1]?.trim() ||
                    extractBetween(html, '<title>', '</title>').replace(' | WEBTOON', '').trim();
      const cover = html.match(/og:image"[^>]*content="([^"]+)"/)?.[1];
      const summary = html.match(/<p[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, '').trim();
      const author = html.match(/creator[^>]*>[\s\S]*?>([^<]+)</i)?.[1]?.trim();
      const genreMatches = html.match(/genre[^>]*>([^<]+)</gi) || [];
      const genres = genreMatches.map((g: string) => g.match(/>([^<]+)</)?.[1]?.trim()).filter(Boolean) as string[];

      return {
        title,
        cover_url: cover,
        summary,
        author,
        artist: author,
        genres,
        status: 'ongoing',
        source: "webtoons",
        source_url: url
      };
    }
  },

  // Tapas scraper for metadata
  tapas: {
    name: "tapas",
    displayName: "Tapas (Metadata)",
    baseUrl: "https://tapas.io",
    searchUrl: (query) => `https://tapas.io/search?q=${encodeURIComponent(query)}&t=COMICS`,
    parseSearch: (html) => {
      const results: Array<{ title: string; url: string; cover?: string }> = [];
      const cardPattern = /<a[^>]*href="(\/series\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<p[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/p>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        results.push({
          url: `https://tapas.io${match[1]}`,
          cover: match[2],
          title: match[3].trim()
        });
      }
      return results.slice(0, 20);
    },
    parseDetail: (html: string, url: string) => {
      const title = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
      const cover = html.match(/og:image"[^>]*content="([^"]+)"/)?.[1];
      const summary = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)?.[1];
      const author = html.match(/creator[^>]*>[\s\S]*?>([^<]+)</i)?.[1]?.trim();
      const genreMatches = html.match(/genre\/[^"]*"[^>]*>([^<]+)</gi) || [];
      const genres = genreMatches.map((g: string) => g.match(/>([^<]+)</)?.[1]?.trim()).filter(Boolean) as string[];

      return {
        title,
        cover_url: cover,
        summary,
        author,
        artist: author,
        genres,
        status: 'ongoing',
        source: "tapas",
        source_url: url
      };
    }
  },

  // Manta scraper for metadata  
  manta: {
    name: "manta",
    displayName: "Manta (Metadata)",
    baseUrl: "https://manta.net",
    searchUrl: (query) => `https://manta.net/search?keyword=${encodeURIComponent(query)}`,
    parseSearch: (html) => {
      const results: Array<{ title: string; url: string; cover?: string }> = [];
      const cardPattern = /<a[^>]*href="(\/series\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        results.push({
          url: `https://manta.net${match[1]}`,
          cover: match[2],
          title: match[3].trim()
        });
      }
      return results.slice(0, 20);
    },
    parseDetail: (html: string, url: string) => {
      const title = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim();
      const cover = html.match(/og:image"[^>]*content="([^"]+)"/)?.[1];
      const summary = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)?.[1];
      const author = html.match(/author[^>]*>[\s\S]*?>([^<]+)</i)?.[1]?.trim();
      const artist = html.match(/artist[^>]*>[\s\S]*?>([^<]+)</i)?.[1]?.trim();

      return {
        title,
        cover_url: cover,
        summary,
        author,
        artist: artist || author,
        genres: [],
        status: 'ongoing',
        source: "manta",
        source_url: url
      };
    }
  }
};

// Content sources (for chapters and images)
const contentSources: Record<string, {
  name: string;
  displayName: string;
  baseUrl: string;
  searchUrl: (query: string) => string;
  parseSearch: (html: string) => Array<{ title: string; url: string; cover?: string }>;
  parseChapters: (html: string) => ChapterData[];
  parseChapterImages: (html: string) => string[];
}> = {
  // AsuraComic scraper for content
  asuracomic: {
    name: "asuracomic",
    displayName: "AsuraComic (Content)",
    baseUrl: "https://asuracomic.net",
    searchUrl: (query) => `https://asuracomic.net/series?name=${encodeURIComponent(query)}`,
    parseSearch: (html) => {
      const results: Array<{ title: string; url: string; cover?: string }> = [];
      const cardPattern = /<a[^>]*href="([^"]*\/series\/[^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi;
      let match;
      while ((match = cardPattern.exec(html)) !== null) {
        results.push({
          url: match[1].startsWith("http") ? match[1] : `https://asuracomic.net${match[1]}`,
          cover: match[2],
          title: match[3].trim()
        });
      }
      
      if (results.length === 0) {
        const altPattern = /href="(\/series\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*alt="([^"]+)"/gi;
        while ((match = altPattern.exec(html)) !== null) {
          results.push({
            url: `https://asuracomic.net${match[1]}`,
            cover: match[2],
            title: match[3].trim()
          });
        }
      }
      
      return results.slice(0, 20);
    },
    parseChapters: (html) => {
      const chapters: ChapterData[] = [];
      const chapterPattern = /href="([^"]*chapter[^"]*)"[^>]*>[\s\S]*?Chapter\s*([\d.]+)/gi;
      let match;
      while ((match = chapterPattern.exec(html)) !== null) {
        const num = parseFloat(match[2]) || 0;
        chapters.push({
          number: num,
          title: `Chapter ${num}`,
          url: match[1].startsWith("http") ? match[1] : `https://asuracomic.net${match[1]}`
        });
      }
      return chapters.sort((a, b) => a.number - b.number);
    },
    parseChapterImages: (html) => {
      const images: string[] = [];
      const imgPattern = /<img[^>]*src="([^"]+)"[^>]*(?:class="[^"]*reader[^"]*"|data-index)/gi;
      let match;
      while ((match = imgPattern.exec(html)) !== null) {
        if (!match[1].includes('logo') && !match[1].includes('avatar')) {
          images.push(match[1]);
        }
      }
      
      if (images.length === 0) {
        const jsonPattern = /"url":"([^"]+\.(?:jpg|png|webp)[^"]*)"/gi;
        while ((match = jsonPattern.exec(html)) !== null) {
          images.push(match[1].replace(/\\/g, ''));
        }
      }
      
      return images;
    }
  },

  // RoliaScan scraper for content
  roliascan: {
    name: "roliascan",
    displayName: "RoliaScan (Content)",
    baseUrl: "https://roliascan.com",
    searchUrl: (query) => `https://roliascan.com/?s=${encodeURIComponent(query)}&post_type=wp-manga`,
    parseSearch: (html) => {
      const results: Array<{ title: string; url: string; cover?: string }> = [];
      const cardPattern = /<div[^>]*class="[^"]*post-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
      const imgPattern = /<img[^>]*class="[^"]*img-responsive[^"]*"[^>]*src="([^"]+)"/gi;
      
      let match;
      const urls: string[] = [];
      const titles: string[] = [];
      
      while ((match = cardPattern.exec(html)) !== null) {
        urls.push(match[1]);
        titles.push(match[2].trim());
      }
      
      const covers: string[] = [];
      while ((match = imgPattern.exec(html)) !== null) {
        covers.push(match[1]);
      }
      
      for (let i = 0; i < Math.min(urls.length, 20); i++) {
        results.push({
          url: urls[i],
          title: titles[i],
          cover: covers[i]
        });
      }
      
      return results;
    },
    parseChapters: (html) => {
      const chapters: ChapterData[] = [];
      const chapterPattern = /<li[^>]*class="[^"]*wp-manga-chapter[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
      let match;
      while ((match = chapterPattern.exec(html)) !== null) {
        const chapterText = match[2].trim();
        const numMatch = chapterText.match(/chapter\s*([\d.]+)/i);
        const num = numMatch ? parseFloat(numMatch[1]) : 0;
        chapters.push({
          number: num,
          title: chapterText,
          url: match[1]
        });
      }
      return chapters.sort((a, b) => a.number - b.number);
    },
    parseChapterImages: (html) => {
      const images: string[] = [];
      const imgPattern = /<img[^>]*class="[^"]*wp-manga-chapter-img[^"]*"[^>]*(?:src|data-src)="([^"]+)"/gi;
      let match;
      while ((match = imgPattern.exec(html)) !== null) {
        const src = match[1].trim();
        if (src && !src.includes('logo') && !src.includes('avatar')) {
          images.push(src);
        }
      }
      return images;
    }
  }
};

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Referer": url.split('/').slice(0, 3).join('/')
        }
      });
      if (res.ok) {
        return await res.text();
      }
      console.log(`Fetch failed with status ${res.status}`);
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
    
    const { 
      action, 
      metadataSource = "mangadex", 
      contentSource = "asuracomic",
      query, 
      mangaUrl, 
      mangaId, 
      chapterUrl,
      source // legacy support
    } = await req.json();
    
    console.log(`Scraper action: ${action}, metadataSource: ${metadataSource}, contentSource: ${contentSource}`);

    // Search for manga (metadata search)
    if (action === "search") {
      if (!query) {
        return new Response(JSON.stringify({ error: "Query required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const srcName = source || metadataSource;
      const metaScraper = metadataSources[srcName];
      const contentScraper = contentSources[srcName];
      const scraper = metaScraper || contentScraper;
      
      if (!scraper) {
        return new Response(JSON.stringify({ 
          error: "Unknown source", 
          availableMetadataSources: Object.keys(metadataSources),
          availableContentSources: Object.keys(contentSources)
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const searchUrl = scraper.searchUrl(query);
      console.log(`Searching: ${searchUrl}`);
      const html = await fetchWithRetry(searchUrl);
      const results = scraper.parseSearch(html);
      console.log(`Found ${results.length} results`);

      return new Response(JSON.stringify({ results, source: srcName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Import manga with separate metadata and content sources
    if (action === "import") {
      if (!mangaUrl && !mangaId) {
        return new Response(JSON.stringify({ error: "mangaUrl or mangaId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const metaScraper = metadataSources[source || metadataSource];
      const contentScraper = contentSources[source || contentSource];
      
      // Must have at least metadata source
      if (!metaScraper && !contentScraper) {
        return new Response(JSON.stringify({ error: "No valid source found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      let detailUrl = mangaUrl;
      let mdId = mangaId;

      // For MangaDex, use API
      if ((source || metadataSource) === "mangadex") {
        if (mangaUrl && mangaUrl.includes("mangadex.org")) {
          const match = mangaUrl.match(/\/title\/([a-f0-9-]+)/);
          mdId = match?.[1];
        }
        if (mdId) {
          detailUrl = `https://api.mangadex.org/manga/${mdId}?includes[]=cover_art&includes[]=author&includes[]=artist`;
        }
      }

      if (!detailUrl) {
        return new Response(JSON.stringify({ error: "Could not determine detail URL" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from("manga")
        .select("id, title")
        .eq("source_url", mangaUrl || detailUrl)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ 
          message: "Manga already exists", 
          manga: existing 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Fetch and parse manga details from metadata source
      console.log(`Fetching metadata from: ${detailUrl}`);
      const html = await fetchWithRetry(detailUrl);
      
      let mangaData: Partial<MangaData> = {};
      if (metaScraper) {
        mangaData = metaScraper.parseDetail(html, mangaUrl || detailUrl);
      }

      if (!mangaData.title) {
        return new Response(JSON.stringify({ error: "Could not parse manga details" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Insert manga as DRAFT
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
          source: source || metadataSource,
          source_url: mangaUrl || detailUrl,
          publish_status: "draft"
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      // Parse chapters from MangaDex if available
      let chapters: ChapterData[] = [];
      if ((source || metadataSource) === "mangadex" && mdId) {
        const chaptersUrl = `https://api.mangadex.org/manga/${mdId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`;
        const chaptersJson = await fetchWithRetry(chaptersUrl);
        try {
          const data = JSON.parse(chaptersJson);
          chapters = data.data?.map((ch: any) => ({
            number: parseFloat(ch.attributes.chapter) || 0,
            title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
            url: ch.id
          })).sort((a: ChapterData, b: ChapterData) => a.number - b.number) || [];
        } catch {
          chapters = [];
        }
      }

      // Insert chapters
      const chapterInserts = chapters.slice(0, 200).map(ch => ({
        manga_id: newManga.id,
        number: ch.number,
        title: ch.title,
        images: []
      }));

      if (chapterInserts.length > 0) {
        await supabase.from("chapters").insert(chapterInserts);
      }

      // Add to scraper queue for image fetching later
      await supabase.from("scraper_queue").insert({
        source_name: source || contentSource,
        manga_url: mangaUrl || detailUrl,
        manga_id: newManga.id,
        status: "pending"
      });

      console.log(`Imported manga: ${mangaData.title} with ${chapterInserts.length} chapters`);

      return new Response(JSON.stringify({ 
        message: "Manga imported as draft",
        manga: newManga,
        chaptersImported: chapterInserts.length,
        note: "Manga saved as draft. Approve in admin panel to publish."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Fetch chapter images from content source
    if (action === "fetch-images") {
      if (!chapterUrl) {
        return new Response(JSON.stringify({ error: "chapterUrl required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const srcName = source || contentSource;
      const scraper = contentSources[srcName];
      
      if (!scraper) {
        // Try MangaDex for images
        if (srcName === "mangadex") {
          const atHomeUrl = `https://api.mangadex.org/at-home/server/${chapterUrl}`;
          const json = await fetchWithRetry(atHomeUrl);
          try {
            const data = JSON.parse(json);
            const baseUrl = data.baseUrl;
            const hash = data.chapter.hash;
            const images = data.chapter.data?.map((page: string) => `${baseUrl}/data/${hash}/${page}`) || [];
            return new Response(JSON.stringify({ images }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          } catch {
            return new Response(JSON.stringify({ error: "Failed to parse MangaDex images" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        
        return new Response(JSON.stringify({ error: "Unknown content source" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const html = await fetchWithRetry(chapterUrl);
      const images = scraper.parseChapterImages(html);

      return new Response(JSON.stringify({ images }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Process queue
    if (action === "process-queue") {
      const { data: queueItems } = await supabase
        .from("scraper_queue")
        .select("*")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1);

      if (!queueItems || queueItems.length === 0) {
        return new Response(JSON.stringify({ message: "Queue empty" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const item = queueItems[0];
      
      await supabase
        .from("scraper_queue")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", item.id);

      try {
        await supabase
          .from("scraper_queue")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", item.id);

        return new Response(JSON.stringify({ message: "Processed", item }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        await supabase
          .from("scraper_queue")
          .update({ 
            status: "failed", 
            error_message: error instanceof Error ? error.message : "Unknown error",
            retry_count: (item.retry_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", item.id);

        throw error;
      }
    }

    // List available sources
    if (action === "sources") {
      return new Response(JSON.stringify({ 
        metadataSources: Object.entries(metadataSources).map(([key, value]) => ({
          id: key,
          name: value.displayName,
          baseUrl: value.baseUrl,
          type: "metadata"
        })),
        contentSources: Object.entries(contentSources).map(([key, value]) => ({
          id: key,
          name: value.displayName,
          baseUrl: value.baseUrl,
          type: "content"
        })),
        // Legacy support
        sources: [
          ...Object.entries(metadataSources).map(([key, value]) => ({
            id: key,
            name: value.displayName,
            baseUrl: value.baseUrl,
            available: true
          })),
          ...Object.entries(contentSources).map(([key, value]) => ({
            id: key,
            name: value.displayName,
            baseUrl: value.baseUrl,
            available: true
          }))
        ]
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
