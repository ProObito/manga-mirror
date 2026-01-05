import { useEffect, useState } from 'react';

export function MangaLibrary() {
  const [manga, setManga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://townbackend-825d5dfe9e19.herokuapp.com/api/manga/list')
      .then(res => res.json())
      .then(data => {
        setManga(data.manga || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-3xl font-bold animate-pulse">Loading Manga Library...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 text-center mb-4">
          📚 Comicktown Library
        </h1>
        <p className="text-gray-300 text-center mb-12 text-xl">
          {manga.length} Manga • {manga.reduce((sum, m) => sum + (m.chapters?.length || 0), 0)} Chapters Available
        </p>

        {manga.length === 0 && (
          <div className="text-center text-gray-400 text-xl py-20">
            No manga imported yet. Start importing manga to see them here!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {manga.map(m => (
            <div 
              key={m.id} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-purple-500/40 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
                  {m.title}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {m.source}
                  </span>
                  <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-semibold">
                    {m.chapters?.length || 0} Chapters
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-800">
                {m.chapters?.map((ch: any) => (
                  <a
                    key={ch.num}
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-gray-800/60 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-lg transition-all duration-200 group"
                  >
                    <span className="font-bold">Chapter {ch.num}</span>
                    <div className="flex items-center gap-2">
                      {ch.size_mb > 0 && (
                        <span className="text-xs text-gray-400 group-hover:text-white">
                          {ch.size_mb.toFixed(1)} MB
                        </span>
                      )}
                      <span className="text-purple-400 group-hover:text-white">→</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
