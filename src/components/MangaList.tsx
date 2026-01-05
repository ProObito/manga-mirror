/**
 * Manga List Component - Updated to use new backend
 */
import { useState } from 'react';
import { useManga } from '../hooks/useManga';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const SITES = ['asura', 'comix', 'roliascan', 'vortexscans', 'reaperscans', 'stonescape', 'omegascans', 'allmanga'];

export default function MangaList() {
  const [selectedSite, setSelectedSite] = useState<string | undefined>(undefined);
  const { manga, loading, error } = useManga(selectedSite, 50);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Site Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedSite === undefined ? 'default' : 'outline'}
          onClick={() => setSelectedSite(undefined)}
          size="sm"
        >
          All Sites
        </Button>
        {SITES.map(site => (
          <Button
            key={site}
            variant={selectedSite === site ? 'default' : 'outline'}
            onClick={() => setSelectedSite(site)}
            size="sm"
            className="capitalize"
          >
            {site}
          </Button>
        ))}
      </div>

      {/* Manga Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          Array(12).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          manga.map((m) => (
            <Card 
              key={m._id || m.url} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => window.location.href = `/manga/${encodeURIComponent(m.url)}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-gray-900">
                <img
                  src={m.cover_image || '/placeholder.jpg'}
                  alt={m.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  {m.title}
                </h3>
                <Badge variant="secondary" className="text-xs capitalize">
                  {m.site}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && manga.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No manga found
        </div>
      )}
    </div>
  );
}
