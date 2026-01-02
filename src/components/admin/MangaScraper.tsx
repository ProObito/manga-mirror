import { useState } from 'react';
import { Search, Download, Loader2, Globe, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  title: string;
  url: string;
  cover?: string;
}

interface ImportResult {
  message: string;
  manga?: { id: string; title: string };
  chaptersImported?: number;
}

const MangaScraper = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());

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
          source: 'mangadex',
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
          mangaUrl: result.url,
        },
      });

      if (error) throw error;

      const importResult = data as ImportResult;
      
      if (importResult.manga) {
        setImportedUrls(prev => new Set([...prev, result.url]));
        toast.success(
          `${importResult.message}${importResult.chaptersImported ? ` (${importResult.chaptersImported} chapters)` : ''}`
        );
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display tracking-wide">Manga Scraper</h1>
        <p className="text-muted-foreground mt-1">
          Search and import manga from external sources
        </p>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Search MangaDex
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
                      View on MangaDex
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
            <li>• Search for manga by title on MangaDex</li>
            <li>• Click "Import" to add manga to your library</li>
            <li>• Manga details and chapter list are automatically imported</li>
            <li>• Chapter images are loaded on-demand when readers access them</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MangaScraper;
