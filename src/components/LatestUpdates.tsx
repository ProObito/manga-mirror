/**
 * Latest Updates Component
 */
import { useLatestUpdates } from '../hooks/useManga';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LatestUpdates() {
  const { updates, loading, error } = useLatestUpdates(20);
  const navigate = useNavigate();

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (loading) return <div className="text-muted-foreground">Loading updates...</div>;
  if (updates.length === 0) return null;

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
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/read/${encodeURIComponent(chapter.url)}`)}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{chapter.manga_title}</h3>
                <p className="text-sm text-muted-foreground">Chapter {chapter.number}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {chapter.site}
                </Badge>
                {chapter.total_images && (
                  <Badge variant="outline">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {chapter.total_images}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
