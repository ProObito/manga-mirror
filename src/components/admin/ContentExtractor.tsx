import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Server, 
  HardDrive, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  XCircle,
  CloudDownload,
  Database,
  Settings
} from 'lucide-react';

interface SyncStats {
  synced: number;
  updated: number;
  skipped: number;
  total: number;
}

interface BackendStatus {
  connected: boolean;
  stats?: {
    manga_count?: number;
    chapter_count?: number;
    sources?: string[];
  };
}

interface DriveStatus {
  connected: boolean;
  folders: number;
  filesInFirstFolder: number;
}

export default function ContentExtractor() {
  const [backendUrl, setBackendUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [selectedSource, setSelectedSource] = useState('all');
  const [limit, setLimit] = useState(50);

  // Load saved backend URL
  useEffect(() => {
    const saved = localStorage.getItem('content_backend_url');
    if (saved) {
      setBackendUrl(saved);
      testBackend(saved);
    }
    testDrive();
  }, []);

  const testBackend = async (url: string) => {
    if (!url) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('content-extractor', {
        body: { action: 'test-backend', backendUrl: url },
      });

      if (error) throw error;

      setBackendStatus({
        connected: data.success,
        stats: data.stats,
      });

      if (data.success) {
        localStorage.setItem('content_backend_url', url);
        toast.success('Backend connected!');
      }
    } catch (error: any) {
      console.error('Backend test error:', error);
      setBackendStatus({ connected: false });
      toast.error('Backend connection failed');
    }
  };

  const testDrive = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('content-extractor', {
        body: { action: 'test-drive' },
      });

      if (error) throw error;

      setDriveStatus({
        connected: data.success,
        folders: data.folders || 0,
        filesInFirstFolder: data.filesInFirstFolder || 0,
      });
    } catch (error: any) {
      console.error('Drive test error:', error);
      setDriveStatus({ connected: false, folders: 0, filesInFirstFolder: 0 });
    }
  };

  const syncManga = async () => {
    if (!backendUrl) {
      toast.error('Please enter backend URL first');
      return;
    }

    setSyncing(true);
    setSyncProgress(10);
    setSyncStats(null);

    try {
      const { data, error } = await supabase.functions.invoke('content-extractor', {
        body: {
          action: 'sync-manga',
          backendUrl,
          source: selectedSource === 'all' ? undefined : selectedSource,
          limit,
        },
      });

      if (error) throw error;

      setSyncProgress(100);
      setSyncStats(data);
      toast.success(`Synced ${data.synced} manga, updated ${data.updated}, skipped ${data.skipped}`);
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const sources = ['all', 'asura', 'flame', 'roliascan', 'mangafire', 'mangadex'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Extractor</h2>
          <p className="text-muted-foreground">
            Connect your backend API and sync content to database with Google Drive storage
          </p>
        </div>
      </div>

      {/* Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5" />
              Backend API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://your-backend.herokuapp.com"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
              />
              <Button onClick={() => testBackend(backendUrl)} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {backendStatus?.connected ? (
                <>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  {backendStatus.stats && (
                    <span className="text-sm text-muted-foreground">
                      {backendStatus.stats.manga_count || 0} manga, {backendStatus.stats.chapter_count || 0} chapters
                    </span>
                  )}
                </>
              ) : backendStatus === null ? (
                <Badge variant="secondary">Not tested</Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5" />
              Google Drive Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={testDrive} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {driveStatus?.connected ? (
                <>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {driveStatus.folders} folders configured
                  </span>
                </>
              ) : driveStatus === null ? (
                <Badge variant="secondary">Not tested</Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudDownload className="h-5 w-5" />
            Sync Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Source Filter</Label>
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => (
                  <Button
                    key={source}
                    variant={selectedSource === source ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSource(source)}
                    className="capitalize"
                  >
                    {source}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Limit</Label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min={1}
                max={500}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={syncManga}
                disabled={syncing || !backendStatus?.connected}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Sync Manga
                  </>
                )}
              </Button>
            </div>
          </div>

          {syncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Extracting and uploading content...
              </p>
            </div>
          )}

          {syncStats && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{syncStats.synced}</div>
                <div className="text-sm text-muted-foreground">New</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{syncStats.updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{syncStats.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{syncStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Site Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            When duplicate manga are found, content from higher priority sources is preferred:
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">#1 Asura</Badge>
            <Badge variant="secondary">#2 Flame</Badge>
            <Badge variant="outline">#3 RoliaScan</Badge>
            <Badge variant="outline">#4 MangaFire</Badge>
            <Badge variant="outline">#5 MangaDex</Badge>
            <Badge variant="outline">#6 Webtoons</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
