import { useState, useEffect } from 'react';
import { FileCode, RefreshCw, Plus, Loader2, AlertCircle, Play, Zap, Database, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const HEROKU_API = 'https://townbackend-825d5dfe9e19.herokuapp.com';

interface ScraperSource {
  id: string;
  name: string;
  display_name: string;
  endpoint: string | null;
  is_active: boolean;
  last_sync: string | null;
  manga_count: number | null;
}

interface BackendStatus {
  status: string;
  total_manga: number;
  total_chapters: number;
  recent_manga_added: number;
  recent_chapters_added: number;
  timestamp: string;
}

// Default scrapers if none exist
const DEFAULT_SCRAPERS = [
  { name: 'asuracomic', display_name: 'AsuraComic', endpoint: `${HEROKU_API}/api/admin/scrape/asura`, priority: 1 },
  { name: 'roliascan', display_name: 'RoliaScan', endpoint: `${HEROKU_API}/api/admin/scrape/roliascan`, priority: 2 },
  { name: 'mangafire', display_name: 'MangaFire', endpoint: `${HEROKU_API}/api/admin/scrape/mangafire`, priority: 3 },
];

const ScraperManagement = () => {
  const [scrapers, setScrapers] = useState<ScraperSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [scraping, setScraping] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { isOwner } = useAuth();

  useEffect(() => {
    fetchScrapers();
    fetchBackendStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchBackendStatus, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchBackendStatus = async () => {
    try {
      const response = await fetch(`${HEROKU_API}/api/admin/scrape-status`);
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
      }
    } catch (error) {
      console.error('Backend status error:', error);
    }
  };

  const fetchScrapers = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // If no scrapers, seed with defaults
      if (!data || data.length === 0) {
        await seedDefaultScrapers();
      } else {
        setScrapers(data);
      }
    } catch (error) {
      console.error('Error fetching scrapers:', error);
      toast.error('Failed to fetch scrapers');
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultScrapers = async () => {
    try {
      const { error } = await supabase
        .from('scraper_sources')
        .insert(DEFAULT_SCRAPERS.map(s => ({
          name: s.name,
          display_name: s.display_name,
          endpoint: s.endpoint,
          is_active: true,
          manga_count: 0
        })));

      if (error) throw error;
      toast.success('Default scrapers added');
      
      const { data } = await supabase
        .from('scraper_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      setScrapers(data || []);
    } catch (error) {
      console.error('Error seeding scrapers:', error);
    }
  };

  const toggleScraper = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scraper_sources')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Scraper ${isActive ? 'disabled' : 'enabled'}`);
      fetchScrapers();
    } catch (error) {
      console.error('Error toggling scraper:', error);
      toast.error('Failed to toggle scraper');
    }
  };

  const runScraper = async (scraper: ScraperSource) => {
    if (!scraper.endpoint) {
      toast.error('No endpoint configured for this scraper');
      return;
    }

    setScraping(scraper.id);
    toast.info(`Starting ${scraper.display_name} scraper...`);

    try {
      const response = await fetch(scraper.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${scraper.display_name}: ${data.message || 'Scraping started'}`);
        
        // Update last_sync
        await supabase
          .from('scraper_sources')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', scraper.id);
        
        fetchScrapers();
        fetchBackendStatus();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Scraper error:', error);
      toast.error(`Network error - check if backend is running`);
    } finally {
      setScraping(null);
    }
  };

  const runAllScrapers = async () => {
    setScraping('all');
    toast.info('Starting all scrapers...');

    try {
      const response = await fetch(`${HEROKU_API}/api/admin/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'All scrapers started');
        fetchBackendStatus();
      } else {
        // Try individual scrapers
        for (const scraper of scrapers.filter(s => s.is_active && s.endpoint)) {
          await runScraper(scraper);
        }
      }
    } catch (error) {
      console.error('Scrape all error:', error);
      // Fallback to individual scrapers
      for (const scraper of scrapers.filter(s => s.is_active && s.endpoint)) {
        await runScraper(scraper);
      }
    } finally {
      setScraping(null);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only owners can manage scrapers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display tracking-wide flex items-center gap-3">
            <FileCode className="h-8 w-8 text-primary" />
            Scraper Management
          </h1>
          <p className="text-muted-foreground mt-1">Connected to Heroku Backend</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => { fetchBackendStatus(); fetchScrapers(); }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="hero" 
            className="gap-2"
            onClick={runAllScrapers}
            disabled={scraping !== null}
          >
            {scraping === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run All Scrapers
          </Button>
        </div>
      </div>

      {/* Backend Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{backendStatus?.total_manga || 0}</p>
                <p className="text-sm text-muted-foreground">Total Manga</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileCode className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{backendStatus?.total_chapters || 0}</p>
                <p className="text-sm text-muted-foreground">Total Chapters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{backendStatus?.recent_manga_added || 0}</p>
                <p className="text-sm text-muted-foreground">Recent Manga</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <Badge className={backendStatus?.status === 'idle' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}>
                  {backendStatus?.status || 'Unknown'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Backend Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Scraper Sources</CardTitle>
          <CardDescription>
            Priority: AsuraComic → RoliaScan → Others (higher priority sources override duplicates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : scrapers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No scrapers configured</p>
              <Button variant="outline" className="gap-2" onClick={seedDefaultScrapers}>
                <Plus className="h-4 w-4" />
                Add Default Scrapers
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Manga Count</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapers.map((scraper) => (
                  <TableRow key={scraper.id}>
                    <TableCell className="font-medium">{scraper.display_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {scraper.endpoint || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {scraper.is_active ? (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>{scraper.manga_count || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {scraper.last_sync
                        ? new Date(scraper.last_sync).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => runScraper(scraper)}
                          disabled={scraping !== null || !scraper.is_active}
                        >
                          {scraping === scraper.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Run
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleScraper(scraper.id, scraper.is_active)}
                        >
                          {scraper.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Backend Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground">
            <strong>API:</strong> {HEROKU_API}
          </p>
          <p className="text-sm text-muted-foreground">
            Scrapers run on your Heroku backend. Click "Run" to trigger scraping. 
            Data syncs automatically to your database.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Disable' : 'Enable'} Auto-Refresh
            </Button>
            <span className="text-xs text-muted-foreground">
              {autoRefresh ? 'Refreshing every 10s' : 'Auto-refresh disabled'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScraperManagement;
