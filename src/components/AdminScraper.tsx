/**
 * Admin Scraping Control Panel - ADMIN ONLY
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Loader2, CheckCircle, RefreshCw, Database, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const SITES = ['asura', 'comix', 'roliascan', 'vortexscans', 'reaperscans', 'stonescape', 'omegascans', 'allmanga'];

const API_URL = import.meta.env.VITE_API_URL || 'https://townbackend-825d5dfe9e19.herokuapp.com';

interface ScraperStatus {
  status: string;
  total_manga: number;
  total_chapters: number;
  recent_manga_added: number;
  recent_chapters_added: number;
  timestamp: string;
}

export default function AdminScraper() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string>('');
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);

  // ✅ PROTECTION: Only show to admin/owner
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <Card className="border-red-500/50">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">Only admins can access this panel.</p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/scrape-status`);
      const data = await response.json();
      setScraperStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const handleScrapeAll = async () => {
    setLoading({ all: true });
    setStatus('🚀 Starting FULL SITE SCRAPING for ALL 8 sites...');
    
    try {
      const response = await fetch(`${API_URL}/api/admin/scrape-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_images: false })
      });
      
      const data = await response.json();
      setStatus(`✅ ${data.message}\n\n⏳ Scraping started! Stats will update automatically every 30 seconds.\n\n📊 Expected: Thousands of manga across 8 sites\n⏱️ Time: 1-2 hours for complete catalog`);
      
      setTimeout(fetchStatus, 5000);
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading({});
    }
  };

  const handleScrapeSite = async (site: string) => {
    setLoading({ [site]: true });
    setStatus(`🚀 Starting ${site.toUpperCase()} scraping...`);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/scrape-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site })
      });
      
      const data = await response.json();
      setStatus(`✅ ${data.message}\n\n⏳ Scraping ${site}... Stats will update in 15-30 minutes.`);
      
      setTimeout(fetchStatus, 5000);
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Badge */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold">Admin Control Panel</span>
        <Badge variant="destructive">ADMIN ONLY</Badge>
      </div>

      {/* Live Status Dashboard */}
      {scraperStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Manga</span>
              </div>
              <div className="text-2xl font-bold">{scraperStatus.total_manga.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Chapters</span>
              </div>
              <div className="text-2xl font-bold">{scraperStatus.total_chapters.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Last Hour</span>
              </div>
              <div className="text-2xl font-bold">+{scraperStatus.recent_manga_added}</div>
              <div className="text-xs text-muted-foreground">manga added</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <Badge variant={scraperStatus.status === 'active' ? 'default' : 'secondary'}>
                {scraperStatus.status}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Auto-refresh: 30s</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scraper Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Full Catalog Scraping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Message */}
          {status && (
            <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-line font-mono">
              {status}
            </div>
          )}

          {/* Main Scrape Button */}
          <div>
            <Button
              onClick={handleScrapeAll}
              disabled={Object.values(loading).some(Boolean)}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading.all ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Scraping All Sites... Please Wait
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  🚀 START FULL CATALOG SCRAPING (ALL 8 SITES)
                </>
              )}
            </Button>
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-200">
                ⚠️ <strong>WARNING:</strong> This will scrape COMPLETE catalogs from all 8 sites
              </p>
              <ul className="text-xs text-yellow-200/80 mt-2 ml-4 space-y-1">
                <li>• Expected: 5,000-10,000 manga</li>
                <li>• Expected: 100,000-500,000 chapters</li>
                <li>• Time: 1-2 hours continuous scraping</li>
                <li>• Storage: MongoDB across 3 databases</li>
                <li>• Images: Saved as URLs (upload on-demand later)</li>
              </ul>
            </div>
          </div>

          {/* Individual Sites */}
          <div>
            <h3 className="font-semibold mb-3">Individual Site Scraping:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SITES.map(site => (
                <Button
                  key={site}
                  onClick={() => handleScrapeSite(site)}
                  disabled={Object.values(loading).some(Boolean)}
                  variant="outline"
                  size="sm"
                  className="capitalize"
                >
                  {loading[site] ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  {site}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click individual sites for targeted scraping (~15-30 mins each)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

