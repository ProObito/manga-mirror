/**
 * Latest Updates Component
 */
import { useLatestUpdates } from '../hooks/useManga';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

export default function LatestUpdates() {
  const { updates, loading, error } = useLatestUpdates(20);

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (loading) return <div className="text-gray-500">Loading updates...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Clock className="h-6 w-6" />
        Latest Updates
      </h2>

      <div className="grid gap-3">
        {updates.map((chapter) => (
          <Card 
            key={chapter._id || chapter.url}
            className="hover:bg-gray-900 transition-colors cursor-pointer"
            onClick={() => window.location.href = `/read/${encodeURIComponent(chapter.url)}`}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{chapter.manga_title}</h3>
                <p className="text-sm text-gray-400">Chapter {chapter.number}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {chapter.site}
                </Badge>
                {chapter.total_images && (
                  <Badge variant="outline">{chapter.total_images} pages</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
