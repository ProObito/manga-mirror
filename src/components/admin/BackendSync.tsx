/**
 * Backend Sync Component - Syncs Heroku backend to Supabase
 * Priority: Asura > Other sites
 * Prevents duplicate manga
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Upload, Database, CheckCircle, AlertCircle } from 'lucide-react';

const HEROKU_API = 'https://townbackend-825d5dfe9e19.herokuapp.com';

// Site priority order (lower = higher priority)
const SITE_PRIORITY: Record<string, number> = {
  'asura': 1,
  'asuracomic': 1,
  'asuracomics': 1,
  'comix': 2,
  'roliascan': 3,
  'vortexscans': 4,
  'reaperscans': 5,
  'stonescape': 6,
  'omegascans': 7,
  'allmanga': 8,
};

// Demo manga data with real covers
const DEMO_MANGA = [
  {
    title: 'Solo Leveling',
    alternative_names: ['나 혼자만 레벨업', 'Only I Level Up'],
    cover_url: 'https://cdn.comicktown.app/covers/solo-leveling.jpg',
    summary: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jin-Woo, the weakest of all hunters, finds himself in a mysterious dungeon. After a near-death experience, he gains the unique ability to level up endlessly.',
    genres: ['Action', 'Fantasy', 'Adventure'],
    author: 'Chugong',
    artist: 'Jang Sung-Rak',
    status: 'completed',
    released: '2018',
    rating: 4.9,
    rating_count: 125000,
    view_count: 500000,
    source: 'asura',
  },
  {
    title: 'Tower of God',
    alternative_names: ['신의 탑', "Kami no Tou"],
    cover_url: 'https://cdn.comicktown.app/covers/tower-of-god.jpg',
    summary: 'Twenty-Fifth Bam, a young boy who spent his life trapped beneath a mysterious tower, enters it in pursuit of his only friend, Rachel.',
    genres: ['Action', 'Fantasy', 'Mystery'],
    author: 'SIU',
    artist: 'SIU',
    status: 'ongoing',
    released: '2010',
    rating: 4.8,
    rating_count: 98000,
    view_count: 450000,
    source: 'asura',
  },
  {
    title: 'The Beginning After The End',
    alternative_names: ['TBATE'],
    cover_url: 'https://cdn.comicktown.app/covers/tbate.jpg',
    summary: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. Beneath the glamorous exterior lurks the shell of man, devoid of purpose.',
    genres: ['Action', 'Fantasy', 'Isekai'],
    author: 'TurtleMe',
    artist: 'Fuyuki23',
    status: 'ongoing',
    released: '2018',
    rating: 4.85,
    rating_count: 87000,
    view_count: 400000,
    source: 'asura',
  },
  {
    title: 'Omniscient Reader',
    alternative_names: ["Omniscient Reader's Viewpoint", '전지적 독자 시점'],
    cover_url: 'https://cdn.comicktown.app/covers/omniscient-reader.jpg',
    summary: 'Dokja was an average office worker whose sole hobby was reading a web novel. One day, the novel becomes reality, and only he knows how the story ends.',
    genres: ['Action', 'Fantasy', 'Psychological'],
    author: 'Sing Shong',
    artist: 'Sleepy-C',
    status: 'ongoing',
    released: '2020',
    rating: 4.88,
    rating_count: 76000,
    view_count: 380000,
    source: 'asura',
  },
  {
    title: 'Nano Machine',
    alternative_names: ['나노 마신'],
    cover_url: 'https://cdn.comicktown.app/covers/nano-machine.jpg',
    summary: 'After being implanted with a nanomachine by his descendant from the future, a young martial artist gains incredible abilities.',
    genres: ['Action', 'Martial Arts', 'Sci-Fi'],
    author: 'Han Joong-Weol-Ya',
    artist: 'Unknown',
    status: 'ongoing',
    released: '2020',
    rating: 4.7,
    rating_count: 65000,
    view_count: 320000,
    source: 'asura',
  },
  {
    title: 'Return of the Mount Hua Sect',
    alternative_names: ['화산귀환'],
    cover_url: 'https://cdn.comicktown.app/covers/mount-hua.jpg',
    summary: 'The 13th disciple of Mount Hua Sect sealed the Heavenly Demon and returns after 100 years to find his sect in ruins.',
    genres: ['Action', 'Martial Arts', 'Comedy'],
    author: 'Bee-eee',
    artist: 'LICO',
    status: 'ongoing',
    released: '2021',
    rating: 4.82,
    rating_count: 58000,
    view_count: 300000,
    source: 'asura',
  },
];

interface SyncStats {
  totalManga: number;
  totalChapters: number;
  synced: number;
  skipped: number;
  errors: number;
}

export default function BackendSync() {
  const [syncing, setSyncing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);

  // Normalize title for comparison
  const normalizeTitle = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Get site priority
  const getSitePriority = (site: string) => {
    const normalized = site.toLowerCase().replace(/[^a-z]/g, '');
    for (const [key, priority] of Object.entries(SITE_PRIORITY)) {
      if (normalized.includes(key)) return priority;
    }
    return 99;
  };

  // Check backend status
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${HEROKU_API}/api/stats`);
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
        return data;
      }
    } catch (err) {
      console.error('Backend check failed:', err);
    }
    return null;
  };

  // Seed demo manga
  const seedDemoManga = async () => {
    setSeeding(true);
    let seeded = 0;
    let skipped = 0;

    try {
      // Get existing manga titles
      const { data: existingManga } = await supabase.from('manga').select('title');
      const existingTitles = new Set(
        (existingManga || []).map(m => normalizeTitle(m.title))
      );

      for (const manga of DEMO_MANGA) {
        const normalized = normalizeTitle(manga.title);
        
        if (existingTitles.has(normalized)) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from('manga').insert({
          ...manga,
          publish_status: 'published',
        });

        if (error) {
          console.error('Error seeding:', manga.title, error);
        } else {
          seeded++;
          existingTitles.add(normalized);
        }

        setProgress((seeded + skipped) / DEMO_MANGA.length * 100);
      }

      toast.success(`Seeded ${seeded} manga, skipped ${skipped} duplicates`);
    } catch (err) {
      console.error('Seed error:', err);
      toast.error('Seeding failed');
    } finally {
      setSeeding(false);
      setProgress(0);
    }
  };

  // Sync from Heroku backend
  const syncFromBackend = async () => {
    setSyncing(true);
    const syncStats: SyncStats = {
      totalManga: 0,
      totalChapters: 0,
      synced: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // Fetch all manga from Heroku
      const response = await fetch(`${HEROKU_API}/api/manga?limit=500`);
      if (!response.ok) throw new Error('Failed to fetch from backend');
      
      const { manga: backendManga } = await response.json();
      syncStats.totalManga = backendManga.length;

      if (backendManga.length === 0) {
        toast.info('No manga found in backend');
        setSyncing(false);
        return;
      }

      // Get existing manga from Supabase
      const { data: existingManga } = await supabase.from('manga').select('id, title, source');
      const existingMap = new Map<string, { id: string; source: string }>();
      
      (existingManga || []).forEach(m => {
        existingMap.set(normalizeTitle(m.title), { id: m.id, source: m.source || '' });
      });

      // Sort by priority (Asura first)
      const sortedManga = [...backendManga].sort((a, b) => {
        return getSitePriority(a.site) - getSitePriority(b.site);
      });

      // Process each manga
      for (let i = 0; i < sortedManga.length; i++) {
        const manga = sortedManga[i];
        const normalized = normalizeTitle(manga.title);
        const existing = existingMap.get(normalized);

        setProgress((i / sortedManga.length) * 100);

        // Skip if exists and current source has lower priority
        if (existing) {
          const existingPriority = getSitePriority(existing.source);
          const newPriority = getSitePriority(manga.site);
          
          if (newPriority >= existingPriority) {
            syncStats.skipped++;
            continue;
          }

          // Update with higher priority source
          const { error } = await supabase.from('manga').update({
            cover_url: manga.cover_image,
            source: manga.site,
            source_url: manga.url,
            genres: manga.genres || [],
            status: manga.status || 'ongoing',
          }).eq('id', existing.id);

          if (error) {
            syncStats.errors++;
          } else {
            syncStats.synced++;
          }
        } else {
          // Insert new manga
          const { data: inserted, error } = await supabase.from('manga').insert({
            title: manga.title,
            cover_url: manga.cover_image,
            source: manga.site,
            source_url: manga.url,
            genres: manga.genres || [],
            status: manga.status || 'ongoing',
            publish_status: 'published',
          }).select('id').single();

          if (error) {
            console.error('Insert error:', manga.title, error);
            syncStats.errors++;
          } else {
            syncStats.synced++;
            existingMap.set(normalized, { id: inserted.id, source: manga.site });
          }
        }
      }

      setStats(syncStats);
      toast.success(`Synced ${syncStats.synced} manga, skipped ${syncStats.skipped} duplicates`);
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backend Sync
          </CardTitle>
          <CardDescription>
            Sync manga from Heroku backend to Supabase with Asura priority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backend Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Backend Status</p>
              {backendStatus ? (
                <p className="text-sm text-muted-foreground">
                  {backendStatus.total_manga} manga, {backendStatus.total_chapters} chapters
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not checked</p>
              )}
            </div>
            <Button variant="outline" onClick={checkBackendStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check
            </Button>
          </div>

          {/* Progress */}
          {(syncing || seeding) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {syncing ? 'Syncing from backend...' : 'Seeding demo manga...'}
              </p>
              <Progress value={progress} />
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{stats.totalManga}</p>
                <p className="text-xs text-muted-foreground">Total in Backend</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-500">{stats.synced}</p>
                <p className="text-xs text-muted-foreground">Synced</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-500">{stats.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped (Duplicate)</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-500">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          )}

          {/* Priority Info */}
          <div className="p-4 border border-border rounded-lg">
            <p className="font-medium mb-2">Site Priority Order:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SITE_PRIORITY)
                .filter((v, i, a) => a.findIndex(t => t[1] === v[1]) === i)
                .sort((a, b) => a[1] - b[1])
                .map(([site, priority]) => (
                  <Badge key={site} variant={priority === 1 ? 'default' : 'secondary'}>
                    #{priority} {site}
                  </Badge>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Higher priority sources won't be overwritten by lower priority ones
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={seedDemoManga} disabled={seeding || syncing}>
              <Upload className="h-4 w-4 mr-2" />
              {seeding ? 'Seeding...' : 'Seed Demo Manga'}
            </Button>
            
            <Button onClick={syncFromBackend} disabled={syncing || seeding} variant="secondary">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Backend'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}