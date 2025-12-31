import { useState, useEffect } from 'react';
import { FileCode, RefreshCw, Plus, Loader2, AlertCircle, Play } from 'lucide-react';
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

interface ScraperSource {
  id: string;
  name: string;
  display_name: string;
  endpoint: string | null;
  is_active: boolean;
  last_sync: string | null;
  manga_count: number | null;
}

const ScraperManagement = () => {
  const [scrapers, setScrapers] = useState<ScraperSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOwner } = useAuth();

  useEffect(() => {
    fetchScrapers();
  }, []);

  const fetchScrapers = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScrapers(data || []);
    } catch (error) {
      console.error('Error fetching scrapers:', error);
      toast.error('Failed to fetch scrapers');
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground mt-1">Manage manga sources and scrapers</p>
        </div>
        <Button variant="hero" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Scraper
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Scraper Sources</CardTitle>
          <CardDescription>Configure and manage manga scraping sources</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : scrapers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No scrapers configured</p>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Scraper
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
                    <TableCell className="text-muted-foreground text-sm">
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
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Play className="h-3 w-3" />
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
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Scraper Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Scrapers require backend functions to run. You can manually upload manga via the Manga Management page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScraperManagement;
