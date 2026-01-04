import { useState, useEffect } from 'react';
import { Search, Download, Loader2, Globe, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  title: string;
  url: string;
  cover?: string;
  id?: string;
}

interface ImportResult {
  message: string;
  manga?: { id: string; title: string };
  chaptersImported?: number;
  note?: string;
}

interface ScraperSource {
  id: string;
  name: string;
  baseUrl: string;
  available?: boolean;
  type?: 'metadata' | 'content';
}

interface QueueItem {
  id: string;
  source_name: string;
  manga_url: string;
  status: string;
  error_message?: string;
  created_at: string;
}

const MangaScraper = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<ScraperSource[]>([]);
  const [activeSource, setActiveSource] = useState('mangadex');
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => {
    fetchSources();
    fetchQueue();
  }, []);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manga-scraper', {
        body: { action: 'sources' }
      });
      if (data) {
        // Combine metadata and content sources
        const allSources = [
          ...(data.metadataSources || []),
          ...(data.contentSources || []),
          ...(data.sources || [])
        ];
        // Remove duplicates by id
        const uniqueSources = allSources.filter((source, index, self) =>
          index === self.findIndex((s) => s.id === source.id)
        );
        setSources(uniqueSources);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  };

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data, error } = await supabase
        .from('scraper_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setQueueItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a search query');
      return;
    }

    setSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('manga-scraper', {
        body: {
          action: 'search',
          source: activeSource,
          query: searchQuery.trim(),
        },
      });

      if (error) throw error;

      if (data.results) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          toast.info('No results found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search. Try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (result: SearchResult) => {
    setImporting(result.url);

    try {
      const { data, error } = await supabase.functions.invoke('manga-scraper', {
        body: {
          action: 'import',
          source: activeSource,
          mangaUrl: result.url,
          mangaId: result.id,
        },
      });

      if (error) throw error;

      const importResult = data as ImportResult;
      
      if (importResult.manga) {
        setImportedUrls(prev => new Set([...prev, result.url]));
        toast.success(
          `${importResult.message}${importResult.chaptersImported ? ` (${importResult.chaptersImported} chapters)` : ''}`,
          { description: importResult.note }
        );
        fetchQueue();
      } else {
        toast.info(importResult.message);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import manga');
    } finally {
      setImporting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display tracking-wide">Manga Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Search and import manga from external sources (saved as draft)
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Search & Import</TabsTrigger>
          <TabsTrigger value="queue">Queue ({queueItems.filter(q => q.status === 'pending').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Source Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Select Source
              </CardTitle>
              <CardDescription>Choose which source to search from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Metadata Sources (for info):</p>
                <div className="flex flex-wrap gap-2">
                  {sources.filter(s => s.type === 'metadata' || ['mangadex', 'webtoons', 'tapas', 'manta'].includes(s.id)).map((source) => (
                    <Button
                      key={source.id}
                      variant={activeSource === source.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveSource(source.id);
                        setSearchResults([]);
                      }}
                    >
                      {source.name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-2">Content Sources (for chapters):</p>
                <div className="flex flex-wrap gap-2">
                  {sources.filter(s => s.type === 'content' || ['asuracomic', 'roliascan'].includes(s.id)).map((source) => (
                    <Button
                      key={source.id}
                      variant={activeSource === source.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveSource(source.id);
                        setSearchResults([]);
                      }}
                    >
                      {source.name}
                    </Button>
                  ))}
                </div>
                {sources.length === 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={activeSource === 'mangadex' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSource('mangadex')}
                    >
                      MangaDex (Metadata)
                    </Button>
                    <Button
                      variant={activeSource === 'webtoons' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSource('webtoons')}
                    >
                      Webtoons (Metadata)
                    </Button>
                    <Button
                      variant={activeSource === 'tapas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSource('tapas')}
                    >
                      Tapas (Metadata)
                    </Button>
                    <Button
                      variant={activeSource === 'asuracomic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSource('asuracomic')}
                    >
                      AsuraComic (Content)
                    </Button>
                    <Button
                      variant={activeSource === 'roliascan' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveSource('roliascan')}
                    >
                      RoliaScan (Content)
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search {sources.find(s => s.id === activeSource)?.name || activeSource}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for manga..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      {result.cover ? (
                        <img
                          src={result.cover}
                          alt={result.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                          <Globe className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{result.title}</h3>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          View source
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Button
                        size="sm"
                        variant={importedUrls.has(result.url) ? 'outline' : 'default'}
                        onClick={() => handleImport(result)}
                        disabled={importing === result.url || importedUrls.has(result.url)}
                      >
                        {importing === result.url ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : importedUrls.has(result.url) ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Imported
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Searching...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">How it works</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Search for manga by title on various sources</li>
                <li>• Click "Import" to add manga to your library as <strong>draft</strong></li>
                <li>• All imported manga requires admin approval before publishing</li>
                <li>• Use MangaDex for metadata (best quality data)</li>
                <li>• Use AsuraComic/RoliaScan for manhwa with chapter images</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Import Queue</CardTitle>
                <CardDescription>Track import progress and status</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loadingQueue}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingQueue ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {queueItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No items in queue</p>
              ) : (
                <div className="space-y-3">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.manga_url}</p>
                        <p className="text-xs text-muted-foreground">
                          Source: {item.source_name} • {new Date(item.created_at).toLocaleString()}
                        </p>
                        {item.error_message && (
                          <p className="text-xs text-destructive mt-1">{item.error_message}</p>
                        )}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MangaScraper;