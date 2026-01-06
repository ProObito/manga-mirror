/**
 * Admin Scraping Control Panel
 * ONLY accessible to admin/owner (protected by Admin.tsx)
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Play, Loader2, CheckCircle, RefreshCw, Database, AlertCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string>('');
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    fetchStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

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
    setStatus('🚀 Starting FULL SITE SCRAPING for ALL 8 sites...\n\nPlease wait, this may take a moment to start...');
    
    try {
      const response = await fetch(`${API_URL}/api/admin/scrape-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_images: false })
      });
      
      const data = await response.json();
      setStatus(`✅ ${data.message}\n\n📊 Scraping Status:\n• Sites: ALL 8 manga sites\n• Expected: 5,000-10,000 manga\n• Expected: 100,000+ chapters\n• Time: 1-2 hours\n\n⏳ Stats auto-refresh every 30 seconds.\n\n🔍 Watch the numbers above increase as scraping progresses!`);
      
      // Start aggressive polling during scraping
      setTimeout(fetchStatus, 5000);
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading({});
    }
  };

  const handleScrapeSite = async (site: string) => {
    setLoading({ [site]: true });
    setStatus(`🚀 Starting ${site.toUpperCase()} scraping...\n\nPlease wait...`);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/scrape-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site })
      });
      
      const data = await response.json();
      setStatus(`✅ ${data.message}\n\n⏳ Scraping ${site}...\n• Expected time: 15-30 minutes\n• Stats will update automatically\n\n🔍 Watch "Recent Manga" counter above!`);
      
      setTimeout(fetchStatus, 5000);
    } catch (error) {
      setStatus('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading({});
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Status Dashboard */}
      {scraperStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">Total Manga</span>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {scraperStatus.total_manga.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Total Chapters</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {scraperStatus.total_chapters.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm text-muted-foreground">Last Hour</span>
              </div>
              <div className="text-3xl font-bold text-green-400">
                +{scraperStatus.recent_manga_added}
              </div>
              <div className="text-xs text-muted-foreground">manga added</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className={`h-4 w-4 text-yellow-400 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <Badge 
                variant={scraperStatus.status === 'active' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {scraperStatus.status === 'active' ? '🟢 ACTIVE' : '⚪ IDLE'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Scraper Control Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Full Catalog Scraping System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Message */}
          {status && (
            <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-line font-mono border border-primary/20">
              {status}
            </div>
          )}

          {/* Main Scrape All Button */}
          <div>
            <Button
              onClick={handleScrapeAll}
              disabled={Object.values(loading).some(Boolean)}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              {loading.all ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Scraping In Progress... (1-2 hours)
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-3" />
                  🚀 START COMPLETE CATALOG SCRAPING (ALL 8 SITES)
                </>
              )}
            </Button>
            
            {/* Warning Box */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-yellow-200">
                    ⚠️ FULL CATALOG SCRAPING WARNING
                  </p>
                  <ul className="text-xs text-yellow-200/90 space-y-1 ml-4">
                    <li>• Scrapes COMPLETE catalogs from all 8 manga sites</li>
                    <li>• Expected: <strong>5,000-10,000 manga</strong></li>
                    <li>• Expected: <strong>100,000-500,000 chapters</strong></li>
                    <li>• Duration: <strong>1-2 hours</strong> continuous scraping</li>
                    <li>• Storage: All 3 MongoDB databases</li>
                    <li>• Images: URLs saved (upload to Catbox/Drive on-demand)</li>
                    <li>• Auto-refresh: Stats update every 30 seconds</li>
                  </ul>
                  <p className="text-xs text-yellow-200/70 mt-2">
                    💡 Watch the stats cards above - numbers will increase as scraping progresses!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Site Scraping */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Individual Site Scraping
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SITES.map(site => (
                <Button
                  key={site}
                  onClick={() => handleScrapeSite(site)}
                  disabled={Object.values(loading).some(Boolean)}
                  variant="outline"
                  size="default"
                  className="capitalize h-12 font-medium"
                >
                  {loading[site] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {site}
                    </>
                  )}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              💡 Click individual sites for faster targeted scraping (~15-30 mins per site)
            </p>
          </div>

          {/* Refresh Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-refresh stats:</span>
              <Badge 
                variant={autoRefresh ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </Badge>
            </div>
            
            <Button
              onClick={fetchStatus}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>

          {/* Instructions */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-sm">📖 How It Works:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Click "START COMPLETE CATALOG" to scrape all 8 sites</li>
              <li>✅ Or click individual site buttons for targeted scraping</li>
              <li>✅ Scraping runs in background on Heroku Python engine</li>
              <li>✅ Stats auto-update every 30 seconds</li>
              <li>✅ Images saved as URLs (Catbox/Drive upload on-demand)</li>
              <li>✅ Metadata syncs to all 3 MongoDB databases</li>
              <li>✅ Check "Recent Manga" to see progress in real-time</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
