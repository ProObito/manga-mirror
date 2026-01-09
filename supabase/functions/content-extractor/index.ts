import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Drive folder IDs for rotation
const DRIVE_FOLDERS = [
  '1SKjd0nDVUglWgj9VmZtcoKrVa2Wnm6BI',
  '1yl3iiFe25lrIHxCbiQzMhLRQEqRkHg6R',
  '1M-TQdfRWNYYGwZU1vzXSUhSnsPO7Qgcm',
  '1mW5VrAmxokRZa4BbonJ4dOYYYHca9L4Q',
  '1j3T-FyPmqW1M9LLD3m1nMz8wWCe0tKVB'
];

// Site priority for deduplication
const SITE_PRIORITY: Record<string, number> = {
  'asura': 1,
  'asuracomic': 1,
  'asurascans': 1,
  'flame': 2,
  'flamescans': 2,
  'roliascan': 3,
  'mangafire': 4,
  'mangadex': 5,
  'webtoons': 6,
};

interface GoogleAuth {
  access_token: string;
  expires_at: number;
}

let cachedAuth: GoogleAuth | null = null;

async function getGoogleAccessToken(): Promise<string> {
  if (cachedAuth && cachedAuth.expires_at > Date.now()) {
    return cachedAuth.access_token;
  }

  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('Google service account not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Import private key and sign
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\n/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureInput = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signatureInput);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;
  
  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error('Token error:', tokenData);
    throw new Error('Failed to get Google access token');
  }
  
  cachedAuth = {
    access_token: tokenData.access_token,
    expires_at: Date.now() + (tokenData.expires_in - 60) * 1000,
  };
  
  return cachedAuth.access_token;
}

async function uploadToDrive(imageUrl: string, fileName: string, folderIndex: number): Promise<string> {
  try {
    const accessToken = await getGoogleAccessToken();
    const folderId = DRIVE_FOLDERS[folderIndex % DRIVE_FOLDERS.length];
    
    // Fetch image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(imageUrl).origin,
      },
    });
    
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`);
      return imageUrl; // Return original URL if fetch fails
    }
    
    const imageBlob = await imageResponse.blob();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Upload to Drive
    const metadata = {
      name: fileName,
      parents: [folderId],
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', imageBlob);
    
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form,
      }
    );
    
    const uploadData = await uploadResponse.json();
    if (!uploadData.id) {
      console.error('Upload error:', uploadData);
      return imageUrl;
    }
    
    // Make file publicly accessible
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
    
    // Return direct link
    return `https://drive.google.com/uc?export=view&id=${uploadData.id}`;
  } catch (error) {
    console.error('Drive upload error:', error);
    return imageUrl;
  }
}

function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSitePriority(site: string): number {
  const siteLower = site.toLowerCase();
  for (const [key, priority] of Object.entries(SITE_PRIORITY)) {
    if (siteLower.includes(key)) return priority;
  }
  return 99;
}

async function fetchFromBackend(backendUrl: string, endpoint: string): Promise<any> {
  const url = `${backendUrl}${endpoint}`;
  console.log(`Fetching: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Backend fetch failed: ${response.status}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { action, backendUrl, source, limit = 50 } = await req.json();
    
    console.log(`Action: ${action}, Backend: ${backendUrl}, Source: ${source}`);
    
    if (action === 'sync-manga') {
      // Fetch manga from backend
      const endpoint = source ? `/manga?site=${source}&limit=${limit}` : `/manga?limit=${limit}`;
      const backendManga = await fetchFromBackend(backendUrl, endpoint);
      
      if (!Array.isArray(backendManga)) {
        return new Response(JSON.stringify({ error: 'Invalid backend response' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Get existing manga
      const { data: existingManga } = await supabase.from('manga').select('id, title, source');
      const existingTitles = new Map<string, { id: string; source: string }>();
      
      existingManga?.forEach(m => {
        existingTitles.set(normalizeTitle(m.title), { id: m.id, source: m.source || '' });
      });
      
      let synced = 0;
      let skipped = 0;
      let updated = 0;
      let folderIndex = 0;
      
      for (const manga of backendManga) {
        const normalizedTitle = normalizeTitle(manga.title);
        const existing = existingTitles.get(normalizedTitle);
        const newPriority = getSitePriority(manga.site || source || '');
        
        if (existing) {
          const existingPriority = getSitePriority(existing.source);
          
          if (newPriority < existingPriority) {
            // Higher priority source, update
            let coverUrl = manga.cover_url || manga.cover;
            if (coverUrl && !coverUrl.includes('drive.google.com')) {
              coverUrl = await uploadToDrive(coverUrl, `${normalizedTitle.replace(/\s/g, '-')}-cover.jpg`, folderIndex++);
            }
            
            await supabase.from('manga').update({
              cover_url: coverUrl,
              source: manga.site || source,
              source_url: manga.url || manga.source_url,
              updated_at: new Date().toISOString(),
            }).eq('id', existing.id);
            
            updated++;
          } else {
            skipped++;
          }
        } else {
          // New manga
          let coverUrl = manga.cover_url || manga.cover;
          if (coverUrl && !coverUrl.includes('drive.google.com')) {
            coverUrl = await uploadToDrive(coverUrl, `${normalizedTitle.replace(/\s/g, '-')}-cover.jpg`, folderIndex++);
          }
          
          const { error } = await supabase.from('manga').insert({
            title: manga.title,
            summary: manga.description || manga.summary,
            cover_url: coverUrl,
            author: manga.author,
            artist: manga.artist,
            genres: manga.genres || [],
            status: manga.status || 'ongoing',
            source: manga.site || source,
            source_url: manga.url || manga.source_url,
            publish_status: 'published',
          });
          
          if (!error) synced++;
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        synced,
        updated,
        skipped,
        total: backendManga.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'sync-chapters') {
      const { mangaId, mangaUrl } = await req.json();
      
      // Fetch chapters from backend
      const chapters = await fetchFromBackend(backendUrl, `/chapters?url=${encodeURIComponent(mangaUrl)}`);
      
      if (!Array.isArray(chapters)) {
        return new Response(JSON.stringify({ error: 'Invalid chapters response' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Get existing chapters
      const { data: existingChapters } = await supabase
        .from('chapters')
        .select('number')
        .eq('manga_id', mangaId);
      
      const existingNumbers = new Set(existingChapters?.map(c => c.number) || []);
      
      let synced = 0;
      let folderIndex = 0;
      
      for (const chapter of chapters) {
        if (existingNumbers.has(chapter.number)) continue;
        
        // Upload images to Drive
        const uploadedImages: string[] = [];
        if (chapter.images && Array.isArray(chapter.images)) {
          for (let i = 0; i < chapter.images.length; i++) {
            const imgUrl = chapter.images[i];
            const fileName = `ch${chapter.number}-page${i + 1}.jpg`;
            const driveUrl = await uploadToDrive(imgUrl, fileName, folderIndex);
            uploadedImages.push(driveUrl);
            folderIndex++;
          }
        }
        
        const { error } = await supabase.from('chapters').insert({
          manga_id: mangaId,
          number: chapter.number,
          title: chapter.title,
          images: uploadedImages.length > 0 ? uploadedImages : chapter.images,
        });
        
        if (!error) synced++;
      }
      
      return new Response(JSON.stringify({
        success: true,
        synced,
        total: chapters.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'test-backend') {
      try {
        const stats = await fetchFromBackend(backendUrl, '/stats');
        const health = await fetchFromBackend(backendUrl, '/health');
        
        return new Response(JSON.stringify({
          success: true,
          status: 'connected',
          stats,
          health,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({
          success: false,
          status: 'disconnected',
          error: error?.message || 'Unknown error',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (action === 'test-drive') {
      try {
        const accessToken = await getGoogleAccessToken();
        
        // Test by listing files in first folder
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${DRIVE_FOLDERS[0]}'+in+parents&fields=files(id,name)`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          }
        );
        
        const data = await response.json();
        
        return new Response(JSON.stringify({
          success: true,
          status: 'connected',
          folders: DRIVE_FOLDERS.length,
          filesInFirstFolder: data.files?.length || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(JSON.stringify({
          success: false,
          status: 'disconnected',
          error: error?.message || 'Unknown error',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
