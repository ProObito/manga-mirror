import { useEffect, useState } from 'react';

interface Chapter {
  num: number;
  url: string;
  size_mb: number;
}

interface Manga {
  id: string;
  title: string;
  source: string;
  chapters: Chapter[];
  total_chapters: number;
  status: string;
}

export function MangaList() {
  const [manga, setManga] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('https://townbackend-825d5dfe9e19.herokuapp.com/api/manga/list');
        const data = await res.json();
        setManga(data.manga || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-white p-8">Loading manga...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-white mb-8">📚 Manga Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manga.map(m => (
          <div key={m.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-2">{m.title}</h2>
            <div className="text-gray-400 text-sm mb-4">
              Source: {m.source} | Chapters: {m.chapters?.length || 0}
            </div>
            
            <div className="space-y-2">
              {m.chapters?.slice(0, 5).map(ch => (
                <a
                  key={ch.num}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-center transition"
                >
                  Chapter {ch.num} ({ch.size_mb} MB)
                </a>
              ))}
              {m.chapters?.length > 5 && (
                <div className="text-gray-500 text-sm text-center">
                  +{m.chapters.length - 5} more chapters
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {manga.length === 0 && (
        <div className="text-gray-400 text-center py-12">
          No manga imported yet. Use the import feature to add manga!
        </div>
      )}
    </div>
  );
}
