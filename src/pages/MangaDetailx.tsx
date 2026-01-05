/**
 * Manga Detail Page with Chapters
 */
import { useParams } from 'react-router-dom';
import { useChapters } from '../hooks/useManga';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function MangaDetail() {
  const { mangaUrl } = useParams<{ mangaUrl: string }>();
  const decodedUrl = mangaUrl ? decodeURIComponent(mangaUrl) : null;
  const { chapters, loading, error } = useChapters(decodedUrl);

  const mangaTitle = chapters[0]?.manga_title || 'Manga Details';
  const site = chapters[0]?.site || '';

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{mangaTitle}</h1>
          <Badge variant="secondary" className="capitalize">{site}</Badge>
        </div>
        {decodedUrl && (
          <a 
            href={decodedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
          >
            View on {site} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading chapters...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div className="grid gap-2">
          <h2 className="text-xl font-semibold mb-4">
            Chapters ({chapters.length})
          </h2>
          
          {chapters.map((chapter) => (
            <Card
              key={chapter._id || chapter.url}
              className="hover:bg-gray-900 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/read/${encodeURIComponent(chapter.url)}`}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{chapter.title}</h3>
                  <p className="text-sm text-gray-400">Chapter {chapter.number}</p>
                </div>
                <div className="flex items-center gap-2">
                  {chapter.total_images && (
                    <Badge variant="outline">{chapter.total_images} pages</Badge>
                  )}
                  {chapter.release_date && (
                    <span className="text-xs text-gray-500">{chapter.release_date}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {chapters.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No chapters available yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
